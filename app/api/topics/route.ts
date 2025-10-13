import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cache, CacheKeys, CacheTTL } from '@/lib/cache';
import { withErrorHandler, successResponse } from '@/lib/error-handler';

const topicIcons: Record<string, string> = {
  Algebra: '📐',
  Geometry: '📏',
  'Number Theory': '🔢',
  Counting: '🧮',
  Probability: '🎲',
  Combinatorics: '🔀',
  Logic: '🧠',
  default: '📚',
};

export const GET = withErrorHandler(async () => {
  // Try to get from cache first
  const topics = await cache.getOrFetch(
    CacheKeys.topics,
    async () => {
      // Get all non-deleted questions grouped by topic
      const questions = await prisma.question.groupBy({
        by: ['topic'],
        where: {
          deletedAt: null,
          topic: {
            not: null,
          },
        },
        _count: true,
      });

      return questions.map((item) => ({
        name: item.topic || 'Other',
        icon: topicIcons[item.topic || 'default'] || topicIcons.default,
        count: item._count,
      }));
    },
    CacheTTL.topics
  );

  return successResponse({ topics });
});
