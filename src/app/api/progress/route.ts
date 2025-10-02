import { NextRequest, NextResponse } from 'next/server';
import { ProgressService } from '@/services/progressService';
import { AchievementService } from '@/services/achievementService';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/error-handler';
// User authentication removed - using hardcoded user for now
import { apiCache } from '@/lib/cache';
import { userAttemptSchema, idSchema } from '@/schemas/validation';
import { rateLimiters, withRateLimit } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';

async function getProgressHandler(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  // Using default user since auth is removed
  const user = { id: 'ayansh', name: 'Ayansh' };

  logger.apiRequest('GET', '/api/progress', user.id);

  // Validate timeRange parameter
  const timeRangeParam = searchParams.get('timeRange');
  const timeRange = timeRangeParam && /^(7|30|90)$/.test(timeRangeParam) ? timeRangeParam : '30';

  // Generate cache key
  const cacheKey = `progress:${user.id}:${timeRange}`;

  // Clear cache if requested (for debugging)
  const forceRefresh = searchParams.get('force') === 'true';
  if (forceRefresh) {
    apiCache.delete(cacheKey);
    logger.debug(`Forced cache clear for key: ${cacheKey}`, 'CACHE', undefined, { userId: user.id });
  }

  // Try to get from cache first
  const cached = apiCache.get(cacheKey);
  if (cached && !forceRefresh) {
    logger.debug(`Returning cached data for key: ${cacheKey}`, 'CACHE', undefined, { userId: user.id });
    logger.apiResponse('GET', '/api/progress', 200, Date.now() - startTime, user.id);
    return NextResponse.json(cached);
  }

  const stats = await ProgressService.getProgressStats(user.id);

  const response = {
    success: true,
    data: stats
  };

  // Cache for 2 minutes (progress data changes frequently)
  apiCache.set(cacheKey, response, 2 * 60 * 1000);
  logger.debug(`Cached progress data for key: ${cacheKey}`, 'CACHE', undefined, { userId: user.id });

  logger.apiResponse('GET', '/api/progress', 200, Date.now() - startTime, user.id);
  return NextResponse.json(response);
}

export const GET = withRateLimit(rateLimiters.practice, withErrorHandling(getProgressHandler));

async function createProgressHandler(request: NextRequest) {
  try {
    const body = await request.json();
    // Using default user since auth is removed
  const user = { id: 'ayansh', name: 'Ayansh' };

    // Validate user attempt data using Zod schema
    const attemptResult = userAttemptSchema.safeParse(body);
    if (!attemptResult.success) {
      return NextResponse.json(
        { error: 'Invalid attempt data', details: attemptResult.error },
        { status: 400 }
      );
    }

    const { questionId, timeSpent, excludeFromScoring, selectedAnswer } = attemptResult.data;

    // Additional validation for isCorrect (should be computed server-side)
    const isCorrect = body.isCorrect;
    if (typeof isCorrect !== 'boolean') {
      return NextResponse.json(
        { error: 'isCorrect must be a boolean' },
        { status: 400 }
      );
    }

    const progress = await ProgressService.saveProgress({
      questionId,
      isCorrect,
      timeSpent,
      userAnswer: selectedAnswer || '',
      userId: user.id,
      excludeFromScoring
    });

    // Invalidate progress cache when new data is saved
    const cacheKeys = [`progress:${user.id}:30`, `progress:${user.id}:7`, `progress:${user.id}:90`];
    cacheKeys.forEach(key => {
      apiCache.delete(key);
    });

    // Check for new achievements after saving progress
    try {
      const newAchievements = await AchievementService.checkAndAwardAchievements(user.id);
      return NextResponse.json({
        ...progress,
        newAchievements
      }, { status: 201 });
    } catch (achievementError) {
      // Still return the progress even if achievements fail
      return NextResponse.json(progress, { status: 201 });
    }
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Question not found', message: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create progress' },
      { status: 500 }
    );
  }
}

async function updateProgressHandler(request: NextRequest) {
  try {
    const body = await request.json();
    // Using default user since auth is removed
  const user = { id: 'ayansh', name: 'Ayansh' };

    // Validate required fields
    const questionId = idSchema.parse(body.questionId);
    const excludeFromScoring = typeof body.excludeFromScoring === 'boolean' ? body.excludeFromScoring : undefined;

    if (!questionId || excludeFromScoring === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: questionId and excludeFromScoring' },
        { status: 400 }
      );
    }


    // Update the most recent attempt for this question
    const updatedAttempt = await prisma.userAttempt.updateMany({
      where: {
        userId: user.id,
        questionId
      },
      data: {
        excludeFromScoring
      }
    });

    if (updatedAttempt.count === 0) {
      return NextResponse.json(
        { error: 'No attempts found for this question' },
        { status: 404 }
      );
    }

    // Invalidate progress cache when data is updated
    const cacheKeys = [`progress:${user.id}:30`, `progress:${user.id}:7`, `progress:${user.id}:1`];
    cacheKeys.forEach(key => apiCache.delete(key));

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedAttempt.count} attempt(s)`,
      excludeFromScoring
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update exclude status' },
      { status: 500 }
    );
  }
}

async function deleteProgressHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Using default user since auth is removed
  const user = { id: 'ayansh', name: 'Ayansh' };

    // Validate attemptId parameter
    const attemptId = idSchema.parse(searchParams.get('attemptId'));

    // Verify that the attempt belongs to Ayansh before deleting
    const attempt = await prisma.userAttempt.findFirst({
      where: {
        id: attemptId,
        userId: user.id
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
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    );
  }
}

// Export handlers with rate limiting
export const POST = withRateLimit(rateLimiters.practice, withErrorHandling(createProgressHandler));
export const PUT = withRateLimit(rateLimiters.practice, withErrorHandling(updateProgressHandler));
export const DELETE = withRateLimit(rateLimiters.api, withErrorHandling(deleteProgressHandler));