import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { USER_ID } from '@/lib/constants';
import { cache, CacheKeys, CacheTTL } from '@/lib/cache';
import { withErrorHandler, successResponse } from '@/lib/error-handler';

export const GET = withErrorHandler(async () => {
  const userId = USER_ID;

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
      try {
        // Parse criteria if it's a string, otherwise use as-is
        let criteria = achievement.criteria;
        if (typeof criteria === 'string') {
          criteria = JSON.parse(criteria);
        }

        // Type guard to ensure criteria is an object
        if (criteria && typeof criteria === 'object') {
          const crit = criteria as Record<string, any>;

          // Handle different criteria types based on what fields are present
          if ('streakDays' in crit) {
            // Streak achievement
            progress = Math.min(100, Math.round((currentStreak / crit.streakDays) * 100));
          } else if ('correctAnswers' in crit) {
            // Correct answers achievement
            progress = Math.min(100, Math.round((correctAnswers / crit.correctAnswers) * 100));
          } else if ('totalQuestions' in crit) {
            // Questions achievement
            progress = Math.min(100, Math.round((totalQuestions / crit.totalQuestions) * 100));
          } else if ('consecutiveCorrect' in crit) {
            // Consecutive correct achievement - we can't track this with current data
            progress = 0;
          } else if ('accuracy' in crit && 'minQuestions' in crit) {
            // Accuracy achievement
            const currentAccuracy =
              totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
            const meetsAccuracy = currentAccuracy >= crit.accuracy;
            const meetsMinQuestions = totalQuestions >= crit.minQuestions;
            progress =
              meetsAccuracy && meetsMinQuestions
                ? 100
                : Math.min(100, Math.round((totalQuestions / crit.minQuestions) * 50));
          } else if ('questionsUnderTime' in crit) {
            // Speed achievement - we can't track this with current data
            progress = 0;
          } else if ('topic' in crit) {
            // Topic mastery - would need topic-specific query
            progress = 0;
          }
        }
      } catch (error) {
        console.error('Failed to parse achievement criteria:', achievement.id, error);
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
