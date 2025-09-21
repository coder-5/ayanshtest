import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, safeJsonParse } from '@/middleware/apiWrapper';
import { practiceSessionSchema } from '@/schemas/validation';
import { safeUrlParam, safeUrlParamPositiveNumber } from '@/utils/nullSafety';

async function getPracticeSessionsHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Require userId - no default fallback for user data access
  const userId = safeUrlParam(searchParams, 'userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId parameter is required' },
      { status: 400 }
    );
  }

  // Validate limit parameter with safe bounds
  const limit = safeUrlParamPositiveNumber(searchParams, 'limit', 10, 1, 100);

  const sessions = await prisma.practiceSession.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
    take: limit,
    include: {
      attempts: {
        select: {
          id: true,
          isCorrect: true,
          timeSpent: true,
        }
      }
    }
  });

  return NextResponse.json({
    success: true,
    data: sessions,
    count: sessions.length
  });
}

async function createPracticeSessionHandler(request: NextRequest) {
  const body = await safeJsonParse(request);

  // Validate the request body against schema
  const validationResult = practiceSessionSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      {
        error: 'Invalid practice session data',
        details: validationResult.error.issues
      },
      { status: 400 }
    );
  }

  const { sessionType, totalQuestions, focusTopics } = validationResult.data;

  // Require userId to be provided in request body or query params
  const { searchParams } = new URL(request.url);
  const userId: string = body.userId || safeUrlParam(searchParams, 'userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required to create a practice session' },
      { status: 400 }
    );
  }

  // Additional business logic validation
  if (totalQuestions > 50) {
    return NextResponse.json(
      { error: 'Maximum 50 questions allowed per session' },
      { status: 400 }
    );
  }

  const session = await prisma.practiceSession.create({
    data: {
      userId,
      sessionType,
      totalQuestions,
      focusTopics: focusTopics || null,
      startedAt: new Date(),
    }
  });

  return NextResponse.json({
    success: true,
    data: session,
    message: 'Practice session created successfully'
  }, { status: 201 });
}

export const GET = withErrorHandling(getPracticeSessionsHandler);
export const POST = withErrorHandling(createPracticeSessionHandler);