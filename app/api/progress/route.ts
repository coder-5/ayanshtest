import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/userContext';
import { withErrorHandler, successResponse } from '@/lib/error-handler';

export const GET = withErrorHandler(async () => {
  const userId = getCurrentUserId();

  // Get total attempts and accuracy
  const attempts = await prisma.userAttempt.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    select: {
      isCorrect: true,
      attemptedAt: true,
      timeSpent: true,
    },
  });

  const totalQuestions = attempts.length;
  const correctAnswers = attempts.filter((a) => a.isCorrect).length;
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const timeSpent = Math.round(attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / 3600); // Convert to hours

  // Get streak days from latest daily progress record
  const latestProgress = await prisma.dailyProgress.findFirst({
    where: { userId },
    orderBy: { date: 'desc' },
  });

  const streakDays = latestProgress?.streakDays || 0;

  // Get topic performance
  const topicAttempts = await prisma.userAttempt.findMany({
    where: {
      userId,
      deletedAt: null,
      question: {
        topic: {
          not: null,
        },
      },
    },
    include: {
      question: {
        select: {
          topic: true,
        },
      },
    },
  });

  const topicStats = topicAttempts.reduce(
    (acc, attempt) => {
      const topic = attempt.question?.topic || 'Unknown';
      if (!acc[topic]) {
        acc[topic] = { total: 0, correct: 0 };
      }
      acc[topic].total++;
      if (attempt.isCorrect) {
        acc[topic].correct++;
      }
      return acc;
    },
    {} as Record<string, { total: number; correct: number }>
  );

  const topicPerformance = Object.entries(topicStats).map(([topic, stats]) => ({
    topic,
    total: stats.total,
    correct: stats.correct,
    accuracy: Math.round((stats.correct / stats.total) * 100),
  }));

  // Get recent activity
  const recentActivity = await prisma.userAttempt.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    take: 10,
    orderBy: {
      attemptedAt: 'desc',
    },
    include: {
      question: {
        select: {
          id: true,
          questionText: true,
          topic: true,
          difficulty: true,
        },
      },
    },
  });

  const formattedActivity = recentActivity.map((activity) => ({
    id: activity.id,
    questionText: activity.question?.questionText || 'Question not found',
    topic: activity.question?.topic || 'Unknown',
    difficulty: activity.question?.difficulty || 'MEDIUM',
    isCorrect: activity.isCorrect,
    attemptedAt: activity.attemptedAt.toISOString(),
  }));

  return successResponse({
    stats: {
      totalQuestions,
      accuracy,
      streakDays,
      timeSpent,
    },
    topicPerformance,
    recentActivity: formattedActivity,
  });
});
