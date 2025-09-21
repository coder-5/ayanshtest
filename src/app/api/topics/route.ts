import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
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

    return NextResponse.json(topicsWithCounts);
  } catch (error) {
    console.error('Failed to get topics:', error);
    return NextResponse.json(
      { error: 'Failed to get topics' },
      { status: 500 }
    );
  }
}