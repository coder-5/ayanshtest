import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ProgressService } from '@/services/progressService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-user';

    const [
      totalQuestions,
      progressStats,
      recentProgress,
      topicStats,
      competitionStats
    ] = await Promise.all([
      prisma.question.count(),
      ProgressService.getProgressStats(userId),
      prisma.userAttempt.findMany({
        where: { userId, excludeFromScoring: false },
        orderBy: { attemptedAt: 'desc' },
        take: 10,
        include: { question: true }
      }),
      prisma.userAttempt.groupBy({
        by: ['questionId'],
        where: { userId, excludeFromScoring: false },
        _count: { _all: true },
        _sum: { timeSpent: true }
      }),
      prisma.userAttempt.groupBy({
        by: ['questionId'],
        where: { userId, excludeFromScoring: false },
        _count: { _all: true }
      })
    ]);

    const weeklyProgress = await getWeeklyProgress(userId);

    return NextResponse.json({
      totalQuestions,
      totalProgress: progressStats.totalAttempts,
      correctAnswers: progressStats.correctAnswers,
      accuracy: Math.round(progressStats.accuracy * 100) / 100,
      streak: progressStats.streakData.currentStreak,
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
    where: { userId, excludeFromScoring: false },
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
      excludeFromScoring: false,
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