import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getExamName } from '@/constants/examTypes';
import { transformQuestion, transformQuestions } from '@/utils/questionTransforms';

export async function GET(
  request: NextRequest,
  { params }: { params: { examType: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const limit = searchParams.get('limit');
    const { examType } = params;

    // Validate exam type
    if (!examType?.trim()) {
      return NextResponse.json({ error: 'Invalid exam type' }, { status: 400 });
    }

    let whereClause: any = {};

    // Handle exam type filtering
    whereClause.examName = getExamName(examType);

    // Handle year filtering
    if (year) {
      whereClause.examYear = parseInt(year);
    }

    const queryOptions: any = {
      where: whereClause,
      orderBy: [
        { examYear: 'desc' },
        { questionNumber: 'asc' }
      ],
      include: {
        options: true,
        solution: true
      }
    };

    if (limit) {
      queryOptions.take = parseInt(limit);
    }

    const questions = await prisma.question.findMany(queryOptions);

    // Transform data to ensure no nulls and consistent format
    const transformedQuestions = transformQuestions(questions);

    return NextResponse.json(transformedQuestions);
  } catch (error) {
    console.error(`Error fetching ${params.examType} questions:`, error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params: _params }: { params: { examType: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('id');

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    await prisma.question.delete({
      where: { id: questionId }
    });

    return NextResponse.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params: _params }: { params: { examType: string } }
) {
  try {
    const body = await request.json();
    const { id, questionText, difficulty, topic, subtopic, hasImage, imageUrl } = body;

    if (!id) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        questionText: questionText,
        difficulty: difficulty || 'medium',
        topic: topic || 'Mixed',
        subtopic: subtopic || 'Problem Solving',
        hasImage: hasImage || false,
        imageUrl: hasImage ? (imageUrl || '') : null
      },
      include: {
        options: true,
        solution: true
      }
    });

    // Transform the result to match expected format
    const transformedQuestion = transformQuestion(updatedQuestion);

    return NextResponse.json(transformedQuestion);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}