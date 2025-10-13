import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler, successResponse } from '@/lib/error-handler';
import { getCurrentUserId } from '@/lib/userContext';
import {
  determineStrengthLevel,
  needsPractice as calculateNeedsPractice,
} from '@/lib/config/thresholds';

export const GET = withErrorHandler(async (request: Request) => {
    const userId = getCurrentUserId();

    // Pagination parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '100')), 500);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'));

    // Get total count
    const totalCount = await prisma.topicPerformance.count({
      where: { userId },
    });

    // Get topic performance records with pagination
    const topicPerformance = await prisma.topicPerformance.findMany({
      where: { userId },
      skip: offset,
      take: limit,
      orderBy: [{ needsPractice: 'desc' }, { accuracy: 'asc' }],
    });

    return NextResponse.json({
      topicPerformance,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });});

export const POST = withErrorHandler(async () => {
    const userId = getCurrentUserId();

    // Get all user attempts grouped by topic
    const attempts = await prisma.userAttempt.findMany({
      where: {
        userId,
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

    // Group by topic and calculate statistics
    const topicMap = new Map<
      string,
      {
        totalAttempts: number;
        correctAttempts: number;
        totalTime: number;
        lastPracticed: Date;
      }
    >();

    attempts.forEach((attempt) => {
      const topic = attempt.question.topic;
      if (!topic) return; // Skip if topic is null

      const existing = topicMap.get(topic) || {
        totalAttempts: 0,
        correctAttempts: 0,
        totalTime: 0,
        lastPracticed: new Date(0),
      };

      topicMap.set(topic, {
        totalAttempts: existing.totalAttempts + 1,
        correctAttempts: existing.correctAttempts + (attempt.isCorrect ? 1 : 0),
        totalTime: existing.totalTime + attempt.timeSpent,
        lastPracticed:
          attempt.attemptedAt > existing.lastPracticed
            ? attempt.attemptedAt
            : existing.lastPracticed,
      });
    });

    // Update or create topic performance records
    const updates = [];
    for (const [topic, stats] of topicMap.entries()) {
      const accuracy =
        stats.totalAttempts > 0 ? (stats.correctAttempts / stats.totalAttempts) * 100 : 0;

      const averageTime =
        stats.totalAttempts > 0 ? Math.round(stats.totalTime / stats.totalAttempts) : 0;

      // Use configurable thresholds from lib/config/thresholds.ts
      const strengthLevel = determineStrengthLevel(stats.totalAttempts, accuracy);
      const needsPractice = calculateNeedsPractice(accuracy, stats.lastPracticed);

      const update = prisma.topicPerformance.upsert({
        where: {
          userId_topic: {
            userId,
            topic,
          },
        },
        update: {
          totalAttempts: stats.totalAttempts,
          correctAttempts: stats.correctAttempts,
          accuracy,
          averageTime,
          lastPracticed: stats.lastPracticed,
          strengthLevel,
          needsPractice,
          updatedAt: new Date(),
        },
        create: {
          id: `tp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          topic,
          totalAttempts: stats.totalAttempts,
          correctAttempts: stats.correctAttempts,
          accuracy,
          averageTime,
          lastPracticed: stats.lastPracticed,
          strengthLevel,
          needsPractice,
        },
      });

      updates.push(update);
    }

    await Promise.all(updates);

    return successResponse({
      success: true,
      topicsUpdated: topicMap.size,
    });});
