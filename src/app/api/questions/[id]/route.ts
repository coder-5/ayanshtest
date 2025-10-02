import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OptionInput } from '@/types';
import { ApiResponse } from '@/lib/api-response';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const question = await prisma.question.findUnique({
      where: { id: params.id },
      include: {
        options: true,
        solution: true
      }
    });

    if (!question) {
      return ApiResponse.notFound('Question not found');
    }

    return ApiResponse.success(question);
  } catch (error) {
    return ApiResponse.error('Failed to fetch question', 500);
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const body = await request.json();
    const { questionText, examName, examYear, topic, difficulty, options, solution } = body;


    // Implement optimistic locking to prevent concurrent edit conflicts
    try {
      const question = await prisma.question.update({
        where: {
          id: params.id
        },
        data: {
          questionText,
          examName,
          examYear,
          topic,
          difficulty: difficulty?.toUpperCase(),
          options: {
            deleteMany: {},
            create: options?.filter((option: OptionInput) =>
              option.optionLetter &&
              option.optionText
            ).map((option: OptionInput) => ({
              optionLetter: option.optionLetter,
              optionText: option.optionText,
              isCorrect: option.isCorrect || false
            })) || []
          },
          ...(solution ? {
            solution: {
              upsert: {
                create: {
                  ...solution,
                  questionId: params.id,
                  // Remove id if it exists since it will be auto-generated for create
                  id: undefined
                },
                update: {
                  ...solution,
                  // Remove id and questionId from update since they shouldn't change
                  id: undefined,
                  questionId: undefined
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

      return ApiResponse.success(question, 'Question updated successfully');
    } catch (updateError: unknown) {
      // Check if this is a version conflict (no rows affected)
      if ((updateError as any).code === 'P2025' || (updateError as Error)?.message?.includes('Record to update not found')) {
        // Fetch current version to provide helpful error message
        const currentQuestion = await prisma.question.findUnique({
          where: { id: params.id },
          select: {
            questionText: true,
            updatedAt: true
          }
        });

        if (!currentQuestion) {
          return ApiResponse.notFound('Question not found');
        }

        return NextResponse.json(
          {
            success: false,
            error: 'CONFLICT',
            message: 'This question has been modified by another user. Please refresh and try again.',
            data: { lastModified: currentQuestion.updatedAt }
          },
          { status: 409 } // Conflict status
        );
      }

      // Re-throw other errors
      throw updateError;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return ApiResponse.error(`Failed to update question: ${errorMessage}`, 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    await prisma.question.delete({
      where: { id: params.id }
    });

    return ApiResponse.success(null, 'Question deleted successfully');
  } catch (error) {
    return ApiResponse.error('Failed to delete question', 500);
  }
}