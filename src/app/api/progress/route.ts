import { NextRequest, NextResponse } from 'next/server';
import { ProgressService } from '@/services/progressService';
import { AchievementService } from '@/services/achievementService';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/middleware/apiWrapper';
import { safeUserIdFromParams } from '@/utils/nullSafety';
import { apiCache } from '@/lib/cache';

async function getProgressHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = safeUserIdFromParams(searchParams, 'ayansh');
  const timeRange = searchParams.get('timeRange') || '30';

  // Generate cache key
  const cacheKey = `progress:${userId}:${timeRange}`;

  // Try to get from cache first
  const cached = apiCache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const stats = await ProgressService.getProgressStats(userId);

  const response = {
    success: true,
    data: stats
  };

  // Cache for 2 minutes (progress data changes frequently)
  apiCache.set(cacheKey, response, 2 * 60 * 1000);

  return NextResponse.json(response);
}

export const GET = withErrorHandling(getProgressHandler);

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

    // Invalidate progress cache when new data is saved
    const cacheKeys = [`progress:${userId}:30`, `progress:${userId}:7`, `progress:${userId}:1`];
    cacheKeys.forEach(key => apiCache.delete(key));

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
    const userId = safeUserIdFromParams(searchParams);

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