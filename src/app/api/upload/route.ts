import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { processDocxFile } from "@/lib/document-processor";
import { ApiResponse } from '@/lib/api-response';
import { rateLimiters, withRateLimit } from '@/lib/rate-limiter';
import { withErrorHandling } from '@/lib/error-handler';

async function uploadHandler(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const examName = formData.get('examName') as string;
    const examYear = formData.get('examYear') as string;
    const description = formData.get('description') as string;

    if (!file) {
      return ApiResponse.validationError('No file provided');
    }

    if (!examName?.trim()) {
      return ApiResponse.validationError('Exam name is required');
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return ApiResponse.validationError('File size exceeds 10MB limit');
    }

    // Additional memory protection - limit to 5MB for processing
    const processingLimit = 5 * 1024 * 1024; // 5MB
    if (file.size > processingLimit) {
      return ApiResponse.validationError('File too large for processing. Please use files smaller than 5MB.');
    }

    // Get file content with error handling
    let buffer: ArrayBuffer;
    try {
      buffer = await file.arrayBuffer();
    } catch (error) {
      return ApiResponse.serverError('Failed to read file. File may be corrupted.');
    }

    let questions;

    // Process based on file type with error boundaries
    try {
      if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Use the improved DOCX processor
        questions = await processDocxFile(buffer, examName, examYear, description);
      } else {
        // Fallback to basic text processing for other file types
        const content = Buffer.from(buffer).toString('utf-8');
        questions = await parseQuestions(content, examName, examYear, description);
      }
    } catch (processingError) {
      return ApiResponse.serverError(
        `Failed to process ${file.type} file. Please ensure the file is not corrupted and contains valid question data.`
      );
    }

    if (questions.length === 0) {
      return ApiResponse.validationError('No questions found in the document. Please ensure the document contains numbered questions.');
    }

    // Save questions to database using upsert to handle duplicates
    let savedQuestions;
    try {
      // Use database transaction to ensure atomicity
      savedQuestions = await prisma.$transaction(async (tx) => {
        const results = [];

        for (const question of questions) {
          try {
            // First upsert the question - clean all text fields
            const savedQuestion = await tx.question.upsert({
              where: {
                examName_examYear_questionNumber: {
                  examName: cleanTextForDatabase(question.examName),
                  examYear: question.examYear,
                  questionNumber: cleanTextForDatabase(question.questionNumber || '1')
                }
              },
              update: {
                questionText: cleanTextForDatabase(question.questionText),
                topic: cleanTextForDatabase(question.topic),
                subtopic: (question as any).subtopic ? cleanTextForDatabase((question as any).subtopic) : null,
                difficulty: question.difficulty as any,
                hasImage: typeof (question as any).hasImage === 'boolean' ? (question as any).hasImage : false,
                imageUrl: (question as any).imageUrl ? cleanTextForDatabase((question as any).imageUrl) : null,
                timeLimit: (question as any).timeLimit || null,
                updatedAt: new Date()
              },
              create: {
                questionText: cleanTextForDatabase(question.questionText),
                examName: cleanTextForDatabase(question.examName),
                examYear: question.examYear,
                questionNumber: cleanTextForDatabase(question.questionNumber || '1'),
                topic: cleanTextForDatabase(question.topic),
                subtopic: (question as any).subtopic ? cleanTextForDatabase((question as any).subtopic) : null,
                difficulty: question.difficulty as any,
                hasImage: typeof (question as any).hasImage === 'boolean' ? (question as any).hasImage : false,
                imageUrl: (question as any).imageUrl ? cleanTextForDatabase((question as any).imageUrl) : null,
                timeLimit: (question as any).timeLimit || null
              }
            });

            // Then save answer choices if they exist (within same transaction)
            if ((question as any).answerChoices && Array.isArray((question as any).answerChoices)) {
              // Delete existing options first
              await tx.option.deleteMany({
                where: { questionId: savedQuestion.id }
              });

              // Validate option data before creating
              const validChoices = (question as any).answerChoices.filter((choice: any) =>
                choice.letter && choice.text && typeof choice.letter === 'string' && typeof choice.text === 'string'
              );

              if (validChoices.length > 0) {
                // Create new options in batch for better performance - clean all text fields
                await tx.option.createMany({
                  data: validChoices.map((choice: any) => ({
                    questionId: savedQuestion.id,
                    optionLetter: cleanTextForDatabase(choice.letter),
                    optionText: cleanTextForDatabase(choice.text),
                    isCorrect: Boolean(choice.isCorrect)
                  }))
                });
              }
            }

            results.push(savedQuestion);
          } catch (questionError: any) {
            console.error(`Failed to save question ${question.questionNumber}:`, questionError);
            // Throw error to rollback transaction
            throw new Error(`Failed to save question ${question.questionNumber}: ${questionError.message}`);
          }
        }

        return results;
      }, {
        maxWait: 10000, // Maximum time to wait for transaction to start (10s)
        timeout: 30000, // Maximum time for transaction to complete (30s)
      });
    } catch (dbError: any) {
      console.error('Database transaction error:', dbError);

      // Provide specific error messages for different failure types
      if (dbError.message?.includes('Transaction failed')) {
        return ApiResponse.serverError(
          'Upload transaction failed. All changes have been rolled back. Please try again.'
        );
      } else if (dbError.message?.includes('timeout')) {
        return ApiResponse.serverError(
          'Upload timeout. The operation took too long. Please try with fewer questions or check your connection.'
        );
      } else if (dbError.message?.includes('Unique constraint')) {
        return ApiResponse.serverError(
          'Some questions already exist. Please check for duplicates or use different question numbers.'
        );
      } else {
        return ApiResponse.serverError(
          `Failed to save questions to database: ${dbError.message || 'Unknown error'}. Please try again.`
        );
      }
    }

    const uploadData = {
      questionsAdded: savedQuestions.length,
      topics: Array.from(new Set(questions.map(q => q.topic))),
      difficulties: Array.from(new Set(questions.map(q => q.difficulty)))
    };

    return ApiResponse.successWithStatus(
      uploadData,
      201,
      `Successfully processed ${savedQuestions.length} questions from ${file.name}`
    );

  } catch (error) {
    return ApiResponse.serverError('Failed to process document. Please try again.');
  }
}

async function parseQuestions(content: string, examName: string, examYear: string, description: string) {
  // Simple parser for demonstration - looks for numbered questions
  const questions = [];

  // Split content into lines and find question patterns
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  let currentQuestion = '';
  let questionNumber = 1;
  let isInQuestion = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for question patterns like "1.", "Question 1:", "Problem 1:", etc.
    const questionMatch = line.match(/^(\d+)\.?\s*(.+)/) ||
                         line.match(/^(?:Question|Problem)\s+(\d+):?\s*(.+)/i);

    if (questionMatch) {
      // Save previous question if we have one
      if (currentQuestion.trim() && isInQuestion) {
        questions.push(createQuestionObject(currentQuestion, examName, examYear, description, questionNumber - 1));
      }

      // Start new question
      questionNumber = parseInt(questionMatch[1]);
      currentQuestion = questionMatch[2] || '';
      isInQuestion = true;
    } else if (isInQuestion) {
      // Continue building current question
      currentQuestion += ' ' + line;
    }

    // Stop at answers section
    if (line.toLowerCase().includes('answer') && line.toLowerCase().includes('key')) {
      break;
    }
  }

  // Add the last question
  if (currentQuestion.trim() && isInQuestion) {
    questions.push(createQuestionObject(currentQuestion, examName, examYear, description, questionNumber));
  }

  return questions;
}

function cleanTextForDatabase(text: string): string {
  if (!text) return '';

  // Convert to string and handle potential null/undefined values
  const safeText = String(text);

  // Remove null bytes and other problematic characters, but preserve normal text
  return safeText
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters except \t, \n, \r
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

function createQuestionObject(questionText: string, examName: string, examYear: string, _description: string, questionNumber: number) {
  // Clean up the question text
  const cleanText = cleanTextForDatabase(questionText);

  // Determine difficulty based on exam type and question number
  let difficulty = 'MEDIUM';
  if (examName.toLowerCase().includes('amc 8') && questionNumber <= 10) {
    difficulty = 'EASY';
  } else if (questionNumber <= 5) {
    difficulty = 'EASY';
  } else if (questionNumber >= 20) {
    difficulty = 'HARD';
  }

  // Determine topic based on question content
  let topic = 'General Math';
  const lowerText = cleanText.toLowerCase();

  if (lowerText.includes('triangle') || lowerText.includes('angle') || lowerText.includes('polygon')) {
    topic = 'Geometry';
  } else if (lowerText.includes('probability') || lowerText.includes('chance')) {
    topic = 'Probability';
  } else if (lowerText.includes('function') || lowerText.includes('equation')) {
    topic = 'Algebra';
  } else if (lowerText.includes('prime') || lowerText.includes('factor') || lowerText.includes('divisible')) {
    topic = 'Number Theory';
  } else if (lowerText.includes('permutation') || lowerText.includes('combination') || lowerText.includes('arrange')) {
    topic = 'Combinatorics';
  }

  return {
    questionText: cleanText,
    examName: examName,
    examYear: examYear ? parseInt(examYear) : new Date().getFullYear(),
    questionNumber: questionNumber.toString(),
    topic: topic,
    difficulty: difficulty,
    timeLimit: getTimeLimit(examName),
  };
}

function getTimeLimit(examName: string): number {
  // Default time limits based on exam type
  const examLower = examName.toLowerCase();

  if (examLower.includes('amc 8')) return 3;
  if (examLower.includes('amc 10') || examLower.includes('amc 12')) return 4;
  if (examLower.includes('aime')) return 9;
  if (examLower.includes('mathcounts')) return 2;
  if (examLower.includes('kangaroo')) return 3;

  return 5; // Default 5 minutes
}

// Export with rate limiting and error handling
export const POST = withRateLimit(rateLimiters.upload, withErrorHandling(uploadHandler));