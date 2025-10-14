import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler, successResponse } from '@/lib/error-handler';

export const PUT = withErrorHandler(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const body = await request.json();
    const { totalQuestions, correctAnswers, totalTime, achievedScore } = body;

    const session = await prisma.practiceSession.update({
      where: { id },
      data: {
        completedAt: new Date(),
        ...(totalQuestions !== undefined && { totalQuestions }),
        ...(correctAnswers !== undefined && { correctAnswers }),
        ...(totalTime !== undefined && { totalTime }),
        ...(achievedScore !== undefined && { achievedScore }),
      },
    });

    return successResponse({ success: true, session });
  }
);

export const GET = withErrorHandler(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    const session = await prisma.practiceSession.findUnique({
      where: { id },
      include: {
        attempts: {
          include: {
            question: {
              select: {
                questionText: true,
                topic: true,
                difficulty: true,
              },
            },
          },
          orderBy: {
            attemptedAt: 'asc',
          },
        },
      },
    });

    if (!session) {
      return successResponse({ error: 'Session not found' }, 404);
    }

    return successResponse({ session });
  }
);
