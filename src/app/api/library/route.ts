import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100'); // Fetch more for client-side filtering
    const search = searchParams.get('search') || '';
    const competition = searchParams.get('competition') || '';
    const topic = searchParams.get('topic') || '';
    const difficulty = searchParams.get('difficulty') || '';

    // Build where clause for filtering
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { questionText: { contains: search, mode: 'insensitive' } },
        { topic: { contains: search, mode: 'insensitive' } },
        { examName: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (competition && competition !== 'all') {
      whereClause.examName = {
        equals: competition,
        mode: 'insensitive'
      };
    }

    if (topic && topic !== 'all') {
      whereClause.topic = {
        equals: topic,
        mode: 'insensitive'
      };
    }

    if (difficulty && difficulty !== 'all') {
      whereClause.difficulty = {
        equals: difficulty,
        mode: 'insensitive'
      };
    }

    const [totalQuestions, competitionStats, topicList, allQuestions] = await Promise.all([
      prisma.question.count(),
      prisma.question.groupBy({
        by: ['examName'],
        _count: {
          examName: true
        },
        orderBy: {
          _count: {
            examName: 'desc'
          }
        }
      }),
      prisma.question.findMany({
        select: {
          topic: true
        },
        distinct: ['topic'],
        orderBy: {
          topic: 'asc'
        }
      }),
      prisma.question.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          solution: {
            select: {
              id: true,
              solutionText: true
            }
          },
          attempts: {
            select: {
              isCorrect: true
            }
          }
        }
      })
    ]);

    // Get all unique competition names
    const competitionNames = await prisma.question.findMany({
      select: {
        examName: true
      },
      distinct: ['examName'],
      orderBy: {
        examName: 'asc'
      }
    });

    const response = {
      totalQuestions,
      competitionStats,
      competitionNames: competitionNames.map(c => c.examName),
      topicList: topicList.map(t => t.topic),
      recentQuestions: allQuestions
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching library data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch library data',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}