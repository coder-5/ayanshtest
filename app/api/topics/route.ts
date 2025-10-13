import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimitMiddleware } from '@/lib/rateLimit';

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

export async function GET() {
  // Rate limit: 100 requests per minute for read operations
  const rateLimitResponse = rateLimitMiddleware('topics-get', {
    maxRequests: 100,
    windowSeconds: 60,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
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

    const topics = questions.map((item) => ({
      name: item.topic || 'Other',
      icon: topicIcons[item.topic || 'default'] || topicIcons.default,
      count: item._count,
    }));

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
  }
}
