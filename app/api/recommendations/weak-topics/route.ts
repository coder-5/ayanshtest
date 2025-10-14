import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler, successResponse } from '@/lib/error-handler';
import { getCurrentUserId } from '@/lib/userContext';

interface WeakTopic {
  topic: string;
  accuracy: number;
  totalAttempts: number;
  correctAttempts: number;
  lastPracticed: Date | null;
  needsPractice: boolean;
  weaknessScore: number;
  recommendedQuestions: number;
  reason: string;
}

export const GET = withErrorHandler(async () => {
  const userId = getCurrentUserId();

  // Get all topic performance data
  const topicPerformance = await prisma.topicPerformance.findMany({
    where: {
      userId,
    },
    orderBy: {
      lastPracticed: 'desc',
    },
  });

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Identify weak topics
  const weakTopics: WeakTopic[] = [];

  for (const topic of topicPerformance) {
    const isWeak = topic.needsPractice || topic.accuracy < 70;

    if (!isWeak) continue;

    // Calculate weakness score: prioritize frequently-attempted weak topics
    // Formula: (1 - accuracy/100) * totalAttempts
    // Higher score = more important to practice
    const accuracyFactor = 1 - topic.accuracy / 100;
    const weaknessScore = accuracyFactor * topic.totalAttempts;

    // Determine reason
    let reason = '';
    const daysSinceLastPractice = topic.lastPracticed
      ? Math.floor((now.getTime() - topic.lastPracticed.getTime()) / (1000 * 60 * 60 * 24))
      : Infinity;

    if (topic.accuracy < 50) {
      reason = `Low accuracy (${topic.accuracy.toFixed(0)}%) - needs significant improvement`;
    } else if (topic.accuracy < 70) {
      reason = `Below target accuracy (${topic.accuracy.toFixed(0)}%)`;
    } else if (!topic.lastPracticed || daysSinceLastPractice >= 7) {
      reason = topic.lastPracticed
        ? `Not practiced in ${daysSinceLastPractice} days`
        : 'Never practiced';
    } else {
      reason = 'Marked as needs practice';
    }

    // Recommend 10 questions per topic
    const recommendedQuestions = 10;

    weakTopics.push({
      topic: topic.topic,
      accuracy: topic.accuracy,
      totalAttempts: topic.totalAttempts,
      correctAttempts: topic.correctAttempts,
      lastPracticed: topic.lastPracticed,
      needsPractice: topic.needsPractice,
      weaknessScore,
      recommendedQuestions,
      reason,
    });
  }

  // Sort by weakness score (descending) - highest priority first
  weakTopics.sort((a, b) => b.weaknessScore - a.weaknessScore);

  // Take top 5
  const topWeakTopics = weakTopics.slice(0, 5);

  // Calculate summary statistics
  const summary = {
    totalWeakTopics: weakTopics.length,
    topicsReturned: topWeakTopics.length,
    totalRecommendedQuestions: topWeakTopics.reduce(
      (sum, topic) => sum + topic.recommendedQuestions,
      0
    ),
    criticalTopics: weakTopics.filter((t) => t.accuracy < 50).length,
    needsReviewTopics: weakTopics.filter(
      (t) =>
        !t.lastPracticed || (now.getTime() - t.lastPracticed.getTime()) / (1000 * 60 * 60 * 24) >= 7
    ).length,
  };

  return successResponse({
    weakTopics: topWeakTopics,
    summary,
  });
});
