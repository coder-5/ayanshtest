import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getExamName, isValidExamType } from '@/constants/examTypes';
import { transformQuestion, transformQuestions } from '@/utils/questionTransforms';
import { ApiResponse } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ examType: string }> }
) {
  const params = await context.params;
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const limit = searchParams.get('limit');
    const { examType } = params;

    // Validate exam type
    if (!examType?.trim() || !isValidExamType(examType)) {
      return ApiResponse.validationError('Invalid exam type');
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

    return ApiResponse.success(transformedQuestions);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch questions');
  }
}

export async function DELETE(
  request: NextRequest,
  _context: { params: Promise<{ examType: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('id');

    if (!questionId) {
      return ApiResponse.validationError('Question ID is required');
    }

    await prisma.question.delete({
      where: { id: questionId }
    });

    return ApiResponse.success({ message: 'Question deleted successfully' });
  } catch (error) {
    return ApiResponse.serverError('Failed to delete question');
  }
}

export async function PUT(
  request: NextRequest,
  _context: { params: Promise<{ examType: string }> }
) {
  try {
    const body = await request.json();
    const { id, questionText, difficulty, topic, subtopic, hasImage, imageUrl } = body;

    if (!id) {
      return ApiResponse.validationError('Question ID is required');
    }

    // Validate boolean type for hasImage
    const validHasImage = typeof hasImage === 'boolean' ? hasImage : false;

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        questionText: questionText,
        difficulty: difficulty || 'MEDIUM',
        topic: topic || 'Mixed',
        subtopic: subtopic || 'Problem Solving',
        hasImage: validHasImage,
        imageUrl: validHasImage ? (imageUrl || '') : null
      },
      include: {
        options: true,
        solution: true
      }
    });

    // Transform the result to match expected format
    const transformedQuestion = transformQuestion(updatedQuestion);

    return ApiResponse.success(transformedQuestion);
  } catch (error) {
    return ApiResponse.serverError('Failed to update question');
  }
}