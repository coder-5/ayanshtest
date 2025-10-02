import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ProgressService } from '@/services/progressService';
import { safeUserIdFromParams } from '@/utils/nullSafety';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = safeUserIdFromParams(searchParams);

    const [
      totalQuestions,
      progressStats,
      recentProgress,
      attemptStats
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
      })
    ]);

    const weeklyProgress = await getWeeklyProgress(userId);

    const statsData = {
      totalQuestions,
      totalProgress: progressStats.totalAttempts,
      correctAnswers: progressStats.correctAnswers,
      accuracy: Math.round(progressStats.accuracy * 100) / 100,
      streak: progressStats.streakData.currentStreak,
      recentProgress,
      weeklyProgress,
      topicStats: await enrichTopicStats(attemptStats),
      competitionStats: await enrichCompetitionStats(attemptStats)
    };

    return NextResponse.json({
      success: true,
      data: statsData
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch stats'
    }, { status: 500 });
  }
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

async function enrichTopicStats(topicStats: Array<{questionId: string; _count: {_all: number}; _sum: {timeSpent: number | null}}>) {
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

async function enrichCompetitionStats(competitionStats: Array<{questionId: string; _count: {_all: number}}>) {
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