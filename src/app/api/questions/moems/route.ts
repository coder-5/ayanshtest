import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const limit = searchParams.get('limit');

    let whereClause: any = {
      examName: 'MOEMS'
    };

    if (year) {
      whereClause.examYear = parseInt(year);
    }

    const questions = await prisma.question.findMany({
      where: whereClause,
      orderBy: [
        { examYear: 'desc' },
        { questionNumber: 'asc' }
      ],
      take: limit ? parseInt(limit) : undefined
    });

    // Transform data to ensure no nulls
    const transformedQuestions = questions.map(question => ({
      id: question.id,
      questionText: question.questionText || '',
      examName: question.examName || 'MOEMS',
      examYear: question.examYear || 2023,
      questionNumber: question.questionNumber || '1',
      difficulty: question.difficulty || 'Intermediate',
      topic: question.topic || 'Mixed',
      subtopic: question.subtopic || 'Problem Solving',
      hasImage: question.hasImage || false,
      imageUrl: question.imageUrl || '',
      timeLimit: question.timeLimit || null
    }));

    return NextResponse.json(transformedQuestions);
  } catch (error) {
    console.error('Error fetching MOEMS questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('id');

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    await prisma.question.delete({
      where: {
        id: questionId
      }
    });

    return NextResponse.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, questionText, difficulty, topic, subtopic, hasImage, imageUrl } = body;

    if (!id) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    const updatedQuestion = await prisma.question.update({
      where: {
        id: id
      },
      data: {
        questionText: questionText || '',
        difficulty: difficulty || 'Intermediate',
        topic: topic || 'Mixed',
        subtopic: subtopic || 'Problem Solving',
        hasImage: hasImage || false,
        imageUrl: hasImage ? (imageUrl || '') : null
      }
    });

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}