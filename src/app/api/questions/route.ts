import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/middleware/apiWrapper';
import { createQuestionSchema } from '@/schemas/validation';
import { safeUrlParam, safeUrlParamPositiveNumber, createSafeWhere } from '@/utils/nullSafety';
import { safeJsonParse } from '@/middleware/apiWrapper';

async function getQuestionsHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Safe parameter extraction with proper validation
  const competition = safeUrlParam(searchParams, 'competition');
  const topic = safeUrlParam(searchParams, 'topic');
  const difficulty = safeUrlParam(searchParams, 'difficulty');
  const random = searchParams.get('random') === 'true';

  // Use safe validation for page (min: 1, max: 10000) and limit (min: 1, max: 100)
  const page = safeUrlParamPositiveNumber(searchParams, 'page', 1, 1, 10000);
  const limit = safeUrlParamPositiveNumber(searchParams, 'limit', 20, 1, 100);
  const skip = (page - 1) * limit;

  // Create safe where clause - only include non-empty filters
  const where = createSafeWhere({
    examName: competition !== 'all' ? competition : undefined,
    topic: topic !== 'all' ? topic : undefined,
    difficulty: difficulty !== 'all' ? difficulty : undefined,
  });

  // Build orderBy clause based on random parameter
  const orderBy = random
    ? [{ id: 'asc' as const }] // Simple ordering for random shuffle
    : [
        // Prioritize questions that have options
        { options: { _count: 'desc' as const } },
        { createdAt: 'desc' as const }
      ];

  let questions;
  const total = await prisma.question.count({ where });

  if (random) {
    // For random questions, get all matching questions first, then shuffle and slice
    const allQuestions = await prisma.question.findMany({
      where,
      include: {
        options: true,
        solution: true
      },
      orderBy: { id: 'asc' }
    });

    // Shuffle the questions using Fisher-Yates algorithm
    const shuffled = [...allQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Apply pagination to shuffled results
    questions = shuffled.slice(skip, skip + limit);
  } else {
    // Regular paginated query
    questions = await prisma.question.findMany({
      where,
      include: {
        options: true,
        solution: true
      },
      orderBy,
      skip,
      take: limit
    });
  }

  return NextResponse.json({
    success: true,
    data: questions,
    pagination: {
      page: page,
      limit: limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}

async function createQuestionHandler(request: NextRequest) {
  const body = await safeJsonParse(request);
  const validatedData = createQuestionSchema.parse(body);

  const questionData: any = {
    questionText: validatedData.question.questionText,
    examName: validatedData.question.examName,
    examYear: validatedData.question.examYear,
    questionNumber: validatedData.question.questionNumber || '1',
    difficulty: validatedData.question.difficulty || 'medium',
    topic: validatedData.question.topic || 'Mixed',
    subtopic: validatedData.question.subtopic || 'Problem Solving',
    hasImage: validatedData.question.hasImage || false,
    imageUrl: validatedData.question.imageUrl || null,
    timeLimit: validatedData.question.timeLimit || null,
    options: {
      create: validatedData.options
    }
  };

  if (validatedData.solution) {
    questionData.solution = {
      create: validatedData.solution
    };
  }

  const question = await prisma.question.create({
    data: questionData,
    include: {
      options: true,
      solution: true
    }
  });

  return NextResponse.json({
    success: true,
    data: question,
    message: 'Question created successfully'
  }, { status: 201 });
}

// Wrap handlers with error handling
export const GET = withErrorHandling(getQuestionsHandler);
export const POST = withErrorHandling(createQuestionHandler);