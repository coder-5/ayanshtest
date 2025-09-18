import { NextRequest, NextResponse } from 'next/server';
import { DocumentParser } from '@/lib/document-parser';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const competition = data.get('competition') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!competition) {
      return NextResponse.json(
        { error: 'Competition type is required' },
        { status: 400 }
      );
    }

    // Parse the solutions document
    const parser = new DocumentParser();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text based on file type
    let text = '';
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ arrayBuffer });
      text = result.value;
    } else if (file.type === 'application/pdf') {
      const pdfParse = await import('pdf-parse');
      const data = await pdfParse.default(buffer);
      text = data.text;
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type for solutions' },
        { status: 400 }
      );
    }

    // Parse solutions from text
    const solutions = await parseSolutions(text, competition);

    // Update existing questions with solutions
    const updatedQuestions = [];
    for (const solution of solutions) {
      try {
        // Find existing question by competition and question number/text
        const existingQuestion = await findMatchingQuestion(solution, competition);

        if (existingQuestion) {
          // Update the question with solution
          const updatedQuestion = await prisma.question.update({
            where: { id: existingQuestion.id },
            data: {
              ...(solution.explanation || solution.answer ? {
                solution: {
                  upsert: {
                    create: {
                      solutionText: solution.explanation || `Answer: ${solution.answer}`,
                      approach: solution.explanation ? 'Step-by-step' : 'Direct answer',
                      difficulty: 'medium'
                    },
                    update: {
                      solutionText: solution.explanation || `Answer: ${solution.answer}`,
                      approach: solution.explanation ? 'Step-by-step' : 'Direct answer'
                    }
                  }
                }
              } : {})
            },
            include: {
              options: true,
              solution: true
            }
          });

          updatedQuestions.push(updatedQuestion);
        }
      } catch (error) {
        console.error(`Error updating question ${solution.questionNumber}:`, error);
      }
    }

    return NextResponse.json({
      message: 'Solutions processed successfully',
      updatedCount: updatedQuestions.length,
      solutionsFound: solutions.length,
      updatedQuestions,
      fileName: file.name,
      competition
    });

  } catch (error) {
    console.error('Error processing solutions:', error);
    return NextResponse.json(
      { error: `Failed to process solutions: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

interface Solution {
  questionNumber: number;
  answer: string;
  explanation?: string;
}

async function parseSolutions(text: string, competition: string): Promise<Solution[]> {
  const solutions: Solution[] = [];

  if (competition.toLowerCase().includes('amc')) {
    // AMC solutions: 1. A, 2. B, etc.
    const solutionPattern = /(\d+)\.\s*([A-E])(?:\s*(.*))?/g;
    let match;

    while ((match = solutionPattern.exec(text)) !== null) {
      solutions.push({
        questionNumber: parseInt(match[1]),
        answer: match[2],
        explanation: match[3]?.trim() || undefined
      });
    }
  } else if (competition.toLowerCase().includes('moems')) {
    // MOEMS solutions: 1. 15, 2. 3.5, etc.
    const solutionPattern = /(\d+)\.\s*(\d+(?:\.\d+)?|\d+\/\d+)(?:\s*(.*))?/g;
    let match;

    while ((match = solutionPattern.exec(text)) !== null) {
      solutions.push({
        questionNumber: parseInt(match[1]),
        answer: match[2],
        explanation: match[3]?.trim() || undefined
      });
    }
  }

  return solutions;
}

async function findMatchingQuestion(solution: Solution, competition: string) {
  // Try to find by competition and order (assuming questions are in sequence)
  const questions = await prisma.question.findMany({
    where: { examName: competition },
    orderBy: { createdAt: 'asc' },
    include: { options: true, solution: true }
  });

  // Return the question at the solution's position (1-indexed)
  return questions[solution.questionNumber - 1] || null;
}