import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const competition = searchParams.get('competition');
    const topic = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (competition && competition !== 'all') {
      where.examName = competition;
    }

    if (topic && topic !== 'all') {
      where.topic = topic;
    }

    if (difficulty && difficulty !== 'all') {
      where.difficulty = difficulty;
    }

    if (search) {
      where.OR = [
        { questionText: { contains: search, mode: 'insensitive' } },
        { topic: { contains: search, mode: 'insensitive' } },
        { examName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          options: true,
          solution: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.question.count({ where })
    ]);

    return NextResponse.json({
      questions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, competition, topic, difficulty, type, options, solutions } = body;

    if (!text || !competition || !topic || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const question = await prisma.question.create({
      data: {
        questionText: text,
        examName: competition,
        examYear: new Date().getFullYear(),
        topic,
        difficulty: difficulty || 'medium',
        options: {
          create: options || []
        },
        ...(solutions && solutions.length > 0 ? {
          solution: {
            create: solutions[0]
          }
        } : {})
      },
      include: {
        options: true,
        solution: true
      }
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}