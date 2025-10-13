import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/userContext';

function getWeekStartDate(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function getWeekEndDate(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d;
}

export async function GET(request: Request) {
  try {
    const userId = getCurrentUserId();
    const { searchParams } = new URL(request.url);
    const weeks = parseInt(searchParams.get('weeks') || '12');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    const weeklyAnalysis = await prisma.weeklyAnalysis.findMany({
      where: {
        userId,
        weekStartDate: {
          gte: startDate,
        },
      },
      orderBy: {
        weekStartDate: 'desc',
      },
    });

    return NextResponse.json({ weeklyAnalysis });
  } catch (error) {
    console.error('Error fetching weekly analysis:', error);
    return NextResponse.json({ error: 'Failed to fetch weekly analysis' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const userId = getCurrentUserId();
    const today = new Date();
    const weekStart = getWeekStartDate(today);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = getWeekEndDate(weekStart);
    weekEnd.setHours(23, 59, 59, 999);

    // Get all attempts for this week
    const attempts = await prisma.userAttempt.findMany({
      where: {
        userId,
        attemptedAt: {
          gte: weekStart,
          lte: weekEnd,
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

    const totalQuestions = attempts.length;
    const correctAnswers = attempts.filter((a) => a.isCorrect).length;
    const averageAccuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const totalTimeSpent = attempts.reduce((sum, a) => sum + a.timeSpent, 0);

    // Get unique topics
    const topicsSet = new Set(attempts.map((a) => a.question.topic).filter((t) => t));
    const topicsStudied = Array.from(topicsSet).join(', ');

    // Calculate topic performance for this week
    const topicPerformance = new Map<string, { correct: number; total: number }>();
    attempts.forEach((attempt) => {
      const topic = attempt.question.topic;
      if (!topic) return;

      const existing = topicPerformance.get(topic) || { correct: 0, total: 0 };
      topicPerformance.set(topic, {
        correct: existing.correct + (attempt.isCorrect ? 1 : 0),
        total: existing.total + 1,
      });
    });

    // Identify weak and strong topics
    const weakTopics: string[] = [];
    const strongTopics: string[] = [];

    topicPerformance.forEach((perf, topic) => {
      const accuracy = (perf.correct / perf.total) * 100;
      if (perf.total >= 3) {
        // Only consider topics with at least 3 attempts
        if (accuracy < 60) {
          weakTopics.push(topic);
        } else if (accuracy >= 80) {
          strongTopics.push(topic);
        }
      }
    });

    // Get previous week to calculate improvement
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekEnd);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);

    const prevWeekAnalysis = await prisma.weeklyAnalysis.findFirst({
      where: {
        userId,
        weekStartDate: prevWeekStart,
      },
    });

    const improvementRate = prevWeekAnalysis
      ? averageAccuracy - prevWeekAnalysis.averageAccuracy
      : 0;

    // Get longest streak from daily progress
    const dailyProgress = await prisma.dailyProgress.findMany({
      where: {
        userId,
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      orderBy: {
        streakDays: 'desc',
      },
      take: 1,
    });

    const longestStreak = dailyProgress[0]?.streakDays || 0;

    // Upsert weekly analysis
    const analysis = await prisma.weeklyAnalysis.upsert({
      where: {
        userId_weekStartDate: {
          userId,
          weekStartDate: weekStart,
        },
      },
      update: {
        weekEndDate: weekEnd,
        totalQuestions,
        correctAnswers,
        averageAccuracy,
        totalTimeSpent,
        topicsStudied,
        weakTopics: weakTopics.join(', ') || null,
        strongTopics: strongTopics.join(', ') || null,
        improvementRate,
        longestStreak,
      },
      create: {
        id: `wa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        totalQuestions,
        correctAnswers,
        averageAccuracy,
        totalTimeSpent,
        topicsStudied,
        weakTopics: weakTopics.join(', ') || null,
        strongTopics: strongTopics.join(', ') || null,
        improvementRate,
        longestStreak,
      },
    });

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('Error updating weekly analysis:', error);
    return NextResponse.json({ error: 'Failed to update weekly analysis' }, { status: 500 });
  }
}
