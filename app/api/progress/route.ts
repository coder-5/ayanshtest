import { prisma } from '@/lib/prisma';
import { USER_ID } from '@/lib/constants';
import { withErrorHandler, successResponse } from '@/lib/error-handler';

export const GET = withErrorHandler(async () => {
  const userId = USER_ID;

  // Get overall statistics
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

  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  // Get current streak from latest daily progress
  const latestProgress = await prisma.dailyProgress.findFirst({
    where: { userId },
    orderBy: { date: 'desc' },
  });

  const currentStreak = latestProgress?.streakDays || 0;

  // Get daily progress for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyProgress = await prisma.dailyProgress.findMany({
    where: {
      userId,
      date: {
        gte: thirtyDaysAgo,
      },
    },
    orderBy: {
      date: 'desc',
    },
  });

  // Get topic performance from topicPerformance table
  const topicPerformance = await prisma.topicPerformance.findMany({
    where: { userId },
    select: {
      topic: true,
      totalAttempts: true,
      correctAttempts: true,
      accuracy: true,
      lastPracticed: true,
      needsPractice: true,
    },
  });

  // Get recent sessions (last 10)
  const recentSessions = await prisma.practiceSession.findMany({
    where: { userId },
    orderBy: {
      startedAt: 'desc',
    },
    take: 10,
    select: {
      id: true,
      sessionType: true,
      startedAt: true,
      completedAt: true,
      totalQuestions: true,
      correctAnswers: true,
    },
  });

  // Get recent activity (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentAttempts = await prisma.userAttempt.findMany({
    where: {
      userId,
      deletedAt: null,
      attemptedAt: {
        gte: sevenDaysAgo,
      },
    },
    select: {
      isCorrect: true,
    },
  });

  const recentActivity = {
    questionsAttempted: recentAttempts.length,
    correctAnswers: recentAttempts.filter((a) => a.isCorrect).length,
  };

  return successResponse({
    overall: {
      totalQuestions,
      correctAnswers,
      accuracy,
      currentStreak,
    },
    dailyProgress,
    topicPerformance,
    recentSessions,
    recentActivity,
  });
});
