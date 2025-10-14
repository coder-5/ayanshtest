import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/userContext';
import { cache, CacheKeys, CacheTTL } from '@/lib/cache';
import { withErrorHandler, successResponse } from '@/lib/error-handler';

export const GET = withErrorHandler(async () => {
  const userId = getCurrentUserId();

  // Cache achievements list (rarely changes)
  const allAchievements = await cache.getOrFetch(
    CacheKeys.achievements,
    async () => {
      return prisma.achievement.findMany({
        orderBy: [{ tier: 'asc' }, { points: 'desc' }],
      });
    },
    CacheTTL.achievements
  );

  // Get user's earned achievements
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: {
      achievement: true,
    },
    orderBy: {
      earnedAt: 'desc',
    },
  });

  // Get user statistics for progress tracking (using aggregation for performance)
  const [totalQuestions, correctAnswers] = await Promise.all([
    prisma.userAttempt.count({
      where: {
        userId,
        deletedAt: null,
      },
    }),
    prisma.userAttempt.count({
      where: {
        userId,
        deletedAt: null,
        isCorrect: true,
      },
    }),
  ]);

  // Get streak information
  const latestProgress = await prisma.dailyProgress.findFirst({
    where: { userId },
    orderBy: { date: 'desc' },
  });

  const currentStreak = latestProgress?.streakDays || 0;

  // Calculate achievement progress
  const achievementsWithProgress = allAchievements.map((achievement) => {
    const earned = userAchievements.find((ua) => ua.achievementId === achievement.id);

    let progress = 0;
    if (!earned) {
      // Calculate progress based on criteria
      const criteria = achievement.criteria as { type: string; target: number };

      switch (criteria.type) {
        case 'total_questions':
          progress = Math.min(100, Math.round((totalQuestions / criteria.target) * 100));
          break;
        case 'correct_answers':
          progress = Math.min(100, Math.round((correctAnswers / criteria.target) * 100));
          break;
        case 'streak_days':
          progress = Math.min(100, Math.round((currentStreak / criteria.target) * 100));
          break;
        default:
          progress = 0;
      }
    }

    return {
      ...achievement,
      earned: !!earned,
      earnedAt: earned?.earnedAt,
      progress: earned ? 100 : progress,
    };
  });

  return successResponse({
    achievements: achievementsWithProgress,
    totalPoints: userAchievements.reduce((sum, ua) => sum + (ua.achievement.points || 0), 0),
    earnedCount: userAchievements.length,
    totalCount: allAchievements.length,
  });
});
