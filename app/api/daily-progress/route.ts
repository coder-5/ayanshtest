import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/userContext';
import { withErrorHandler, successResponse } from '@/lib/error-handler';

export const GET = withErrorHandler(async (request: Request) => {
  const userId = getCurrentUserId();
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const dailyProgress = await prisma.dailyProgress.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  // Get current streak
  const latestProgress = await prisma.dailyProgress.findFirst({
    where: { userId },
    orderBy: { date: 'desc' },
  });

  const currentStreak = latestProgress?.streakDays || 0;

  // Calculate overall stats
  const totalQuestionsAttempted = dailyProgress.reduce((sum, p) => sum + p.questionsAttempted, 0);
  const totalCorrectAnswers = dailyProgress.reduce((sum, p) => sum + p.correctAnswers, 0);
  const totalTimeSpent = dailyProgress.reduce((sum, p) => sum + p.totalTimeSpent, 0);
  const averageAccuracy =
    totalQuestionsAttempted > 0 ? (totalCorrectAnswers / totalQuestionsAttempted) * 100 : 0;

  return successResponse({
    dailyProgress,
    stats: {
      currentStreak,
      totalQuestionsAttempted,
      totalCorrectAnswers,
      totalTimeSpent,
      averageAccuracy: Math.round(averageAccuracy * 10) / 10,
      activeDays: dailyProgress.length,
    },
  });
});

export const POST = withErrorHandler(async () => {
  const userId = getCurrentUserId();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get today's attempts
  const todayStart = new Date(today);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const attempts = await prisma.userAttempt.findMany({
    where: {
      userId,
      attemptedAt: {
        gte: todayStart,
        lte: todayEnd,
      },
      deletedAt: null,
    },
    include: {
      question: {
        select: {
          topic: true,
        },
      },
    },
  });

  const questionsAttempted = attempts.length;
  const correctAnswers = attempts.filter((a) => a.isCorrect).length;
  const totalTimeSpent = attempts.reduce((sum, a) => sum + a.timeSpent, 0);
  const averageAccuracy = questionsAttempted > 0 ? (correctAnswers / questionsAttempted) * 100 : 0;

  // Get unique topics studied
  const topicsSet = new Set(attempts.map((a) => a.question.topic));
  const topicsStudied = Array.from(topicsSet).join(', ');

  // Calculate streak
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayProgress = await prisma.dailyProgress.findFirst({
    where: {
      userId,
      date: yesterday,
    },
  });

  const streakDays = yesterdayProgress?.isStreakDay ? yesterdayProgress.streakDays + 1 : 1;
  const isStreakDay = questionsAttempted > 0;

  // Upsert daily progress
  const progress = await prisma.dailyProgress.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    update: {
      questionsAttempted,
      correctAnswers,
      totalTimeSpent,
      averageAccuracy,
      topicsStudied,
      streakDays,
      isStreakDay,
      updatedAt: new Date(),
    },
    create: {
      id: crypto.randomUUID(),
      userId,
      date: today,
      questionsAttempted,
      correctAnswers,
      totalTimeSpent,
      averageAccuracy,
      topicsStudied,
      streakDays,
      isStreakDay,
    },
  });

  return successResponse({ success: true, progress });
});
