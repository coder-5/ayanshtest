import { NextRequest, NextResponse } from 'next/server';
import { ProgressService } from '@/services/progressService';
import { AchievementService } from '@/services/achievementService';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/middleware/apiWrapper';
import { safeUrlParam } from '@/utils/nullSafety';

async function getProgressHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = safeUrlParam(searchParams, 'userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId parameter is required to access progress data' },
      { status: 400 }
    );
  }

  const stats = await ProgressService.getProgressStats(userId);

  return NextResponse.json({
    success: true,
    data: stats
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = 'default-user', questionId, isCorrect, timeSpent, userAnswer, excludeFromScoring = false } = body;

    if (!questionId || isCorrect === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const progress = await ProgressService.saveProgress({
      questionId,
      isCorrect,
      timeSpent: timeSpent || 0,
      userAnswer,
      userId,
      excludeFromScoring
    });

    // Check for new achievements after saving progress
    try {
      const newAchievements = await AchievementService.checkAndAwardAchievements(userId);
      return NextResponse.json({
        ...progress,
        newAchievements
      }, { status: 201 });
    } catch (achievementError) {
      console.error('Error checking achievements:', achievementError);
      // Still return the progress even if achievements fail
      return NextResponse.json(progress, { status: 201 });
    }
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