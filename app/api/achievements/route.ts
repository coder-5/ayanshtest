import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/userContext';
import { rateLimitMiddleware } from '@/lib/rateLimit';

export async function GET() {
  // Rate limit: 100 requests per minute for read operations
  const rateLimitResponse = rateLimitMiddleware('achievements-get', {
    maxRequests: 100,
    windowSeconds: 60,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const userId = getCurrentUserId();

    // Get all achievements
    const allAchievements = await prisma.achievement.findMany({
      orderBy: [{ tier: 'asc' }, { points: 'desc' }],
    });

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

    // Get user statistics for progress tracking
    const allAttempts = await prisma.userAttempt.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      select: {
        isCorrect: true,
      },
    });

    const totalQuestions = allAttempts.length;
    const correctAnswers = allAttempts.filter((a) => a.isCorrect).length;

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

    return NextResponse.json({
      achievements: achievementsWithProgress,
      totalPoints: userAchievements.reduce((sum, ua) => sum + (ua.achievement.points || 0), 0),
      earnedCount: userAchievements.length,
      totalCount: allAchievements.length,
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}
