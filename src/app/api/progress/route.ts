import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-user';
    const competition = searchParams.get('competition');
    const topic = searchParams.get('topic');

    const where: any = { userId };

    if (competition) {
      where.question = { competition };
    }

    if (topic) {
      where.question = { ...where.question, topic };
    }

    const progress = await prisma.userAttempt.findMany({
      where,
      include: {
        question: {
          include: {
            options: true,
            solution: true
          }
        }
      },
      orderBy: { attemptedAt: 'desc' }
    });

    const stats = {
      totalQuestions: progress.length,
      correctAnswers: progress.filter(p => p.isCorrect).length,
      accuracy: progress.length > 0 ? (progress.filter(p => p.isCorrect).length / progress.length) * 100 : 0,
      averageTime: progress.length > 0 ? progress.reduce((sum, p) => sum + (p.timeSpent || 0), 0) / progress.length : 0
    };

    return NextResponse.json({ progress, stats });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = 'default-user', questionId, isCorrect, timeSpent, userAnswer } = body;

    if (!questionId || isCorrect === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const progress = await prisma.userAttempt.create({
      data: {
        userId,
        questionId,
        isCorrect,
        timeSpent: timeSpent || 0,
        selectedAnswer: userAnswer
      },
      include: {
        question: {
          include: {
            options: true,
            solution: true
          }
        }
      }
    });

    return NextResponse.json(progress, { status: 201 });
  } catch (error) {
    console.error('Error creating progress:', error);
    return NextResponse.json(
      { error: 'Failed to create progress' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const attemptId = searchParams.get('attemptId');
    const userId = searchParams.get('userId') || 'default-user';

    if (!attemptId) {
      return NextResponse.json(
        { error: 'Attempt ID is required' },
        { status: 400 }
      );
    }

    // Verify that the attempt belongs to the user before deleting
    const attempt = await prisma.userAttempt.findFirst({
      where: {
        id: attemptId,
        userId: userId
      }
    });

    if (!attempt) {
      return NextResponse.json(
        { error: 'Attempt not found or unauthorized' },
        { status: 404 }
      );
    }

    await prisma.userAttempt.delete({
      where: {
        id: attemptId
      }
    });

    return NextResponse.json(
      { message: 'Activity deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    );
  }
}