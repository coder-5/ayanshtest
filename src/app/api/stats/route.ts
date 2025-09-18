import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-user';

    const [
      totalQuestions,
      totalProgress,
      correctAnswers,
      recentProgress,
      topicStats,
      competitionStats
    ] = await Promise.all([
      prisma.question.count(),
      prisma.userAttempt.count({ where: { userId } }),
      prisma.userAttempt.count({ where: { userId, isCorrect: true } }),
      prisma.userAttempt.findMany({
        where: { userId },
        orderBy: { attemptedAt: 'desc' },
        take: 10,
        include: { question: true }
      }),
      prisma.userAttempt.groupBy({
        by: ['questionId'],
        where: { userId },
        _count: { _all: true },
        _sum: { timeSpent: true }
      }),
      prisma.userAttempt.groupBy({
        by: ['questionId'],
        where: { userId },
        _count: { _all: true }
      })
    ]);

    const accuracy = totalProgress > 0 ? (correctAnswers / totalProgress) * 100 : 0;

    const streak = await calculateStreak(userId);

    const weeklyProgress = await getWeeklyProgress(userId);

    return NextResponse.json({
      totalQuestions,
      totalProgress,
      correctAnswers,
      accuracy: Math.round(accuracy * 100) / 100,
      streak,
      recentProgress,
      weeklyProgress,
      topicStats: await enrichTopicStats(topicStats),
      competitionStats: await enrichCompetitionStats(competitionStats)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

async function calculateStreak(userId: string): Promise<number> {
  const progress = await prisma.userAttempt.findMany({
    where: { userId },
    orderBy: { attemptedAt: 'desc' },
    select: { attemptedAt: true }
  });

  if (progress.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const progressDates = progress.map(p => {
    const date = new Date(p.attemptedAt);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  });

  const uniqueDates = Array.from(new Set(progressDates)).sort((a, b) => b - a);

  for (const dateTime of uniqueDates) {
    if (dateTime === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (dateTime === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

async function getWeeklyProgress(userId: string) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const progress = await prisma.userAttempt.findMany({
    where: {
      userId,
      attemptedAt: { gte: weekAgo }
    },
    orderBy: { attemptedAt: 'asc' }
  });

  const dailyProgress = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    date.setHours(0, 0, 0, 0);

    const dayProgress = progress.filter(p => {
      const progressDate = new Date(p.attemptedAt);
      progressDate.setHours(0, 0, 0, 0);
      return progressDate.getTime() === date.getTime();
    });

    return {
      date: date.toISOString().split('T')[0],
      count: dayProgress.length,
      correct: dayProgress.filter(p => p.isCorrect).length
    };
  });

  return dailyProgress;
}

async function enrichTopicStats(topicStats: any[]) {
  const questionIds = topicStats.map(s => s.questionId);
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, topic: true }
  });

  const topicMap = new Map(questions.map(q => [q.id, q.topic]));

  const topics: { [key: string]: { total: number, timeSpent: number } } = {};

  topicStats.forEach(stat => {
    const topic = topicMap.get(stat.questionId) || 'Unknown';
    if (!topics[topic]) {
      topics[topic] = { total: 0, timeSpent: 0 };
    }
    topics[topic].total += stat._count._all;
    topics[topic].timeSpent += stat._sum.timeSpent || 0;
  });

  return topics;
}

async function enrichCompetitionStats(competitionStats: any[]) {
  const questionIds = competitionStats.map(s => s.questionId);
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, examName: true }
  });

  const competitionMap = new Map(questions.map(q => [q.id, q.examName]));

  const competitions: { [key: string]: number } = {};

  competitionStats.forEach(stat => {
    const competition = competitionMap.get(stat.questionId) || 'Unknown';
    competitions[competition] = (competitions[competition] || 0) + stat._count._all;
  });

  return competitions;
}