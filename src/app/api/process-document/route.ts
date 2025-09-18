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

    // Parse the document
    const parser = new DocumentParser();
    const parsedQuestions = await parser.parseDocument(file, competition);

    if (parsedQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found in the document' },
        { status: 400 }
      );
    }

    // Save questions to database
    const savedQuestions: any[] = [];
    for (const question of parsedQuestions) {
      // Build question data
      const questionData: any = {
        questionText: question.text,
        examName: question.competition || 'Unknown',
        examYear: question.year || new Date().getFullYear(),
        questionNumber: `Q${savedQuestions.length + 1}`,
        topic: question.topic || 'general',
        difficulty: question.difficulty || 'medium'
      };

      // Add options if they exist
      if (question.options && question.options.length > 0) {
        questionData.options = {
          create: question.options.map((option, index) => {
            const label = String.fromCharCode(65 + index); // A, B, C, D, E
            const isCorrect = question.correctAnswer === label;
            return {
              optionText: option,
              optionLetter: label,
              isCorrect
            };
          })
        };
      }

      // Add solution if available
      if (question.explanation || question.correctAnswer) {
        questionData.solution = {
          create: {
            solutionText: question.explanation || `Answer: ${question.correctAnswer}`,
            approach: question.explanation ? 'Step-by-step' : 'Direct answer',
            difficulty: question.difficulty || 'medium'
          }
        };
      }

      const savedQuestion = await prisma.question.create({
        data: questionData,
        include: {
          options: true,
          solution: true
        }
      });

      savedQuestions.push(savedQuestion);
    }

    return NextResponse.json({
      message: 'Document processed successfully',
      questionsCount: savedQuestions.length,
      questions: savedQuestions,
      fileName: file.name,
      fileSize: file.size,
      competition
    });

  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json(
      { error: `Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}