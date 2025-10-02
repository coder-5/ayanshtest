import { prisma } from "@/lib/prisma";
import { ApiResponse } from '@/lib/api-response';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');

    if (questionId) {
      // Get solution for specific question
      const solution = await prisma.solution.findUnique({
        where: { questionId },
        include: {
          question: {
            select: {
              questionText: true,
              examName: true,
              examYear: true,
              questionNumber: true,
              topic: true,
              difficulty: true
            }
          }
        }
      });

      return ApiResponse.success(solution, solution ? 'Solution found' : 'No solution found');
    } else {
      // Get all solutions
      const solutions = await prisma.solution.findMany({
        include: {
          question: {
            select: {
              questionText: true,
              examName: true,
              examYear: true,
              questionNumber: true,
              topic: true,
              difficulty: true
            }
          }
        },
        orderBy: [
          { question: { examName: 'asc' } },
          { question: { examYear: 'desc' } },
          { question: { questionNumber: 'asc' } }
        ]
      });

      return ApiResponse.success(solutions);
    }
  } catch (error) {
    console.error('Error fetching solutions:', error);
    return ApiResponse.serverError('Failed to fetch solutions');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      questionId,
      solutionText,
      approach,
      difficulty,
      timeEstimate,
      keyInsights,
      commonMistakes,
      alternativeApproaches
    } = body;

    // Validate required fields
    if (!questionId || !solutionText) {
      return ApiResponse.validationError('Question ID and solution text are required');
    }

    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return ApiResponse.notFound('Question not found');
    }

    // Create or update solution
    const solution = await prisma.solution.upsert({
      where: { questionId },
      update: {
        solutionText,
        approach,
        difficulty,
        timeEstimate: timeEstimate ? parseInt(timeEstimate) : null,
        keyInsights,
        commonMistakes,
        alternativeApproaches,
        updatedAt: new Date()
      },
      create: {
        questionId,
        solutionText,
        approach,
        difficulty: difficulty || 'MEDIUM',
        timeEstimate: timeEstimate ? parseInt(timeEstimate) : null,
        keyInsights,
        commonMistakes,
        alternativeApproaches
      },
      include: {
        question: {
          select: {
            questionText: true,
            examName: true,
            examYear: true,
            questionNumber: true,
            topic: true
          }
        }
      }
    });

    return ApiResponse.success(solution, 'Solution saved successfully');
  } catch (error) {
    console.error('Error saving solution:', error);
    return ApiResponse.serverError('Failed to save solution');
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');

    if (!questionId) {
      return ApiResponse.validationError('Question ID is required');
    }

    const solution = await prisma.solution.findUnique({
      where: { questionId }
    });

    if (!solution) {
      return ApiResponse.notFound('Solution not found');
    }

    await prisma.solution.delete({
      where: { questionId }
    });

    return ApiResponse.success(null, 'Solution deleted successfully');
  } catch (error) {
    console.error('Error deleting solution:', error);
    return ApiResponse.serverError('Failed to delete solution');
  }
}