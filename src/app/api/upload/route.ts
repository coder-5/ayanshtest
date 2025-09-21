import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { processDocxFile } from "@/lib/document-processor";
import { ApiResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
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
      console.error('Error reading file:', error);
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
      console.error('File processing error:', processingError);
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
      savedQuestions = await Promise.all(
        questions.map(question =>
          prisma.question.upsert({
            where: {
              examName_examYear_questionNumber: {
                examName: question.examName,
                examYear: question.examYear,
                questionNumber: question.questionNumber || '1'
              }
            },
            update: {
              questionText: question.questionText,
              topic: question.topic,
              subtopic: (question as any).subtopic || null,
              difficulty: question.difficulty,
              hasImage: (question as any).hasImage || false,
              imageUrl: (question as any).imageUrl || null,
              timeLimit: (question as any).timeLimit || null,
              updatedAt: new Date()
            },
            create: question
          })
        )
      );
    } catch (dbError) {
      console.error('Database error while saving questions:', dbError);
      return ApiResponse.serverError(
        'Failed to save questions to database. Please try again or contact support if the issue persists.'
      );
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
    console.error('Upload error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'Unknown error');
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

function createQuestionObject(questionText: string, examName: string, examYear: string, _description: string, questionNumber: number) {
  // Clean up the question text
  const cleanText = questionText.trim();

  // Determine difficulty based on exam type and question number
  let difficulty = 'medium';
  if (examName.toLowerCase().includes('amc 8') && questionNumber <= 10) {
    difficulty = 'easy';
  } else if (questionNumber <= 5) {
    difficulty = 'easy';
  } else if (questionNumber >= 20) {
    difficulty = 'hard';
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