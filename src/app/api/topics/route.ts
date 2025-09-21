import { prisma } from '@/lib/prisma';
import { ApiResponse } from '@/lib/api-response';
import { apiCache } from '@/lib/cache';

export async function GET() {
  try {
    const cacheKey = 'topics:all';

    // Try to get from cache first
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const topics = await prisma.question.groupBy({
      by: ['topic'],
      _count: {
        topic: true
      },
      orderBy: {
        _count: {
          topic: 'desc'
        }
      }
    });

    const topicsWithCounts = topics.map(topic => ({
      topic: topic.topic,
      count: topic._count.topic
    }));

    const response = ApiResponse.success(topicsWithCounts);

    // Cache for 10 minutes (topics don't change frequently)
    apiCache.set(cacheKey, JSON.parse(response.body!), 10 * 60 * 1000);

    return response;
  } catch (error) {
    console.error('Failed to get topics:', error);
    return ApiResponse.serverError('Failed to get topics');
  }
}