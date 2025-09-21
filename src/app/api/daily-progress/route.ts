import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/middleware/apiWrapper';

async function getDailyProgressHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'default-user';
  const days = parseInt(searchParams.get('days') || '30');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const dailyProgress = await prisma.dailyProgress.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { date: 'desc' }
  });

  return NextResponse.json(dailyProgress);
}

async function createDailyProgressHandler(request: NextRequest) {
  const body = await request.json();
  const {
    userId = 'default-user',
    date,
    questionsAttempted,
    correctAnswers,
    totalTimeSpent,
    topicsStudied,
    difficultiesStudied
  } = body;

  const averageAccuracy = questionsAttempted > 0 ? (correctAnswers / questionsAttempted) * 100 : 0;
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);

  const dailyProgress = await prisma.dailyProgress.upsert({
    where: {
      userId_date: {
        userId,
        date: today
      }
    },
    update: {
      questionsAttempted,
      correctAnswers,
      totalTimeSpent,
      averageAccuracy,
      topicsStudied,
      difficultiesStudied,
      isStreakDay: questionsAttempted > 0
    },
    create: {
      userId,
      date: today,
      questionsAttempted,
      correctAnswers,
      totalTimeSpent,
      averageAccuracy,
      topicsStudied,
      difficultiesStudied,
      isStreakDay: questionsAttempted > 0
    }
  });

  return NextResponse.json(dailyProgress);
}

export const GET = withErrorHandling(getDailyProgressHandler);
export const POST = withErrorHandling(createDailyProgressHandler);