import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/middleware/apiWrapper';

async function getTopicPerformanceHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'default-user';
  const strengthLevel = searchParams.get('strengthLevel'); // weak, moderate, strong

  const where: any = { userId };
  if (strengthLevel) {
    where.strengthLevel = strengthLevel;
  }

  const topicPerformance = await prisma.topicPerformance.findMany({
    where,
    orderBy: [
      { accuracy: 'asc' }, // Show weakest topics first
      { totalAttempts: 'desc' }
    ]
  });

  return NextResponse.json(topicPerformance);
}

async function updateTopicPerformanceHandler(request: NextRequest) {
  const body = await request.json();
  const { userId = 'default-user', topicName, isCorrect, timeSpent } = body;

  // Get existing performance or create new
  const existing = await prisma.topicPerformance.findUnique({
    where: {
      userId_topicName: {
        userId,
        topicName
      }
    }
  });

  let newTotalAttempts = 1;
  let newCorrectAttempts = isCorrect ? 1 : 0;
  let newAverageTime = timeSpent;

  if (existing) {
    newTotalAttempts = existing.totalAttempts + 1;
    newCorrectAttempts = existing.correctAttempts + (isCorrect ? 1 : 0);
    newAverageTime = ((existing.averageTime * existing.totalAttempts) + timeSpent) / newTotalAttempts;
  }

  const newAccuracy = (newCorrectAttempts / newTotalAttempts) * 100;

  // Determine strength level
  let strengthLevel = 'moderate';
  if (newAccuracy < 60) strengthLevel = 'weak';
  else if (newAccuracy > 80) strengthLevel = 'strong';

  const topicPerformance = await prisma.topicPerformance.upsert({
    where: {
      userId_topicName: {
        userId,
        topicName
      }
    },
    update: {
      totalAttempts: newTotalAttempts,
      correctAttempts: newCorrectAttempts,
      accuracy: newAccuracy,
      averageTime: newAverageTime,
      lastPracticed: new Date(),
      strengthLevel
    },
    create: {
      userId,
      topicName,
      totalAttempts: newTotalAttempts,
      correctAttempts: newCorrectAttempts,
      accuracy: newAccuracy,
      averageTime: newAverageTime,
      lastPracticed: new Date(),
      strengthLevel
    }
  });

  return NextResponse.json(topicPerformance);
}

export const GET = withErrorHandling(getTopicPerformanceHandler);
export const POST = withErrorHandling(updateTopicPerformanceHandler);