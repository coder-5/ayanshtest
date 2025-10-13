import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
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

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Error updating practice session:', error);
    return NextResponse.json({ error: 'Failed to update practice session' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
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
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error fetching practice session:', error);
    return NextResponse.json({ error: 'Failed to fetch practice session' }, { status: 500 });
  }
}
