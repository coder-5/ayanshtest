import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/error-handler';
import { createQuestionSchema } from '@/schemas/validation';
import { safeUrlParam, createSafeWhere } from '@/utils/nullSafety';
import { safeJsonParse } from '@/middleware/apiWrapper';
import { extractPaginationParams, commonIncludes } from '@/lib/api-helpers';
import { ApiResponse } from '@/lib/api-response';
import { rateLimiters, withRateLimit } from '@/lib/rate-limiter';
import { apiCache } from '@/lib/cache';
import { PopulatedQuestion } from '@/types';

async function getQuestionsHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Safe parameter extraction with proper validation
  const competition = safeUrlParam(searchParams, 'competition');
  const topic = safeUrlParam(searchParams, 'topic');
  const difficulty = safeUrlParam(searchParams, 'difficulty');
  const random = searchParams.get('random') === 'true';

  // Create cache key from parameters (exclude random for consistent caching)
  const cacheKey = `questions:${competition || 'all'}:${topic || 'all'}:${difficulty || 'all'}:${searchParams.get('limit') || '10'}:${searchParams.get('offset') || '0'}`;

  // Check cache first (skip for random requests)
  if (!random) {
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return ApiResponse.success(cached);
    }
  }

  // Use common pagination helper
  const pagination = extractPaginationParams(request);

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

  let questions: PopulatedQuestion[] = [];
  const total = await prisma.question.count({ where });

  if (random) {
    // Improved random question selection approach
    const totalCount = await prisma.question.count({ where });

    if (totalCount === 0) {
      questions = [];
    } else if (totalCount <= pagination.limit * 2) {
      // For smaller datasets, get all questions and shuffle in memory (more efficient)
      const allQuestions = await prisma.question.findMany({
        where,
        include: commonIncludes.question,
      });

      // Fisher-Yates shuffle algorithm for truly random selection
      for (let i = allQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
      }

      questions = allQuestions.slice(0, pagination.limit);
    } else {
      // For larger datasets, use multiple random offsets to get more diverse results
      // This avoids the performance issues with single large random offsets
      const questionsPerBatch = Math.ceil(pagination.limit / 3);
      const batches = [];

      for (let i = 0; i < 3; i++) {
        const maxOffset = Math.max(0, totalCount - questionsPerBatch);
        const randomOffset = Math.floor(Math.random() * (maxOffset + 1));

        const batch = await prisma.question.findMany({
          where,
          include: commonIncludes.question,
          skip: randomOffset,
          take: questionsPerBatch
        });

        batches.push(...batch);
      }

      // Remove duplicates and shuffle the combined results
      const uniqueQuestions = batches.filter((question, index, self) =>
        index === self.findIndex((q) => q.id === question.id)
      );

      // Shuffle the combined results
      for (let i = uniqueQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [uniqueQuestions[i], uniqueQuestions[j]] = [uniqueQuestions[j], uniqueQuestions[i]];
      }

      questions = uniqueQuestions.slice(0, pagination.limit);
    }
  } else {
    // Regular paginated query
    questions = await prisma.question.findMany({
      where,
      include: commonIncludes.question,
      orderBy,
      skip: pagination.skip,
      take: pagination.limit
    });
  }

  // Cache results for non-random queries (5 minute cache)
  if (!random) {
    const result = { questions, pagination, total };
    apiCache.set(cacheKey, result, 5 * 60 * 1000); // 5 minutes
    return ApiResponse.paginated(questions, pagination, total);
  }

  return ApiResponse.paginated(questions, pagination, total);
}

async function createQuestionHandler(request: NextRequest) {
  const body = await safeJsonParse(request);
  const validatedData = createQuestionSchema.parse(body);

  const questionData: any = {
    questionText: validatedData.question.questionText,
    examName: validatedData.question.examName,
    examYear: validatedData.question.examYear,
    questionNumber: validatedData.question.questionNumber || '1',
    difficulty: validatedData.question.difficulty || 'MEDIUM',
    topic: validatedData.question.topic || 'Mixed',
    subtopic: validatedData.question.subtopic || 'Problem Solving',
    hasImage: validatedData.question.hasImage || false,
    imageUrl: validatedData.question.imageUrl || null,
    timeLimit: validatedData.question.timeLimit || null,
  };

  // Only create options if they exist and are not empty
  if (validatedData.options && validatedData.options.length > 0) {
    questionData.options = {
      create: validatedData.options
    };
  }

  if (validatedData.solution) {
    questionData.solution = {
      create: validatedData.solution
    };
  }

  const question = await prisma.question.create({
    data: questionData,
    include: commonIncludes.question
  });

  return ApiResponse.successWithStatus(question, 201, 'Question created successfully');
}

// Wrap handlers with error handling and rate limiting
export const GET = withRateLimit(rateLimiters.questions, withErrorHandling(getQuestionsHandler));
export const POST = withRateLimit(rateLimiters.questions, withErrorHandling(createQuestionHandler));