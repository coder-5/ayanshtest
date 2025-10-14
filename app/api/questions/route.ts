import { NextResponse } from 'next/server';
import { QuestionService } from '@/lib/services/questionService';
import { questionCreateSchema, questionFiltersSchema, validatePayloadSize } from '@/lib/validation';
import { z } from 'zod';
import { withErrorHandler, successResponse } from '@/lib/error-handler';
import { cache } from '@/lib/cache';

// Query parameters schema with pagination - Max 1000 records per request
const getQuerySchema = questionFiltersSchema.extend({
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const parsed = val ? parseInt(val) : 50;
      return Math.min(Math.max(1, parsed), 1000); // Limit between 1 and 1000
    }),
  offset: z
    .string()
    .optional()
    .transform((val) => {
      const parsed = val ? parseInt(val) : 0;
      return Math.max(0, parsed); // No negative offsets
    }),
});

export const GET = withErrorHandler(async (request: Request) => {
  const { searchParams } = new URL(request.url);

  // Convert searchParams to object for validation
  const rawParams = Object.fromEntries(searchParams.entries());

  // Validate query parameters
  const validationResult = getQuerySchema.safeParse(rawParams);
  if (!validationResult.success) {
    return successResponse(
      { error: 'Invalid query parameters', details: validationResult.error.format() },
      400
    );
  }

  const { examName, topic, difficulty, examYear, search, limit, offset } = validationResult.data;

  const result = await QuestionService.getAll({
    examName,
    topic,
    difficulty,
    examYear,
    search,
    limit,
    offset,
  });

  return NextResponse.json(result);
});

export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();

  // Validate payload size to prevent DoS attacks (max 1MB)
  try {
    validatePayloadSize(body, 1024);
  } catch (sizeError) {
    return NextResponse.json(
      { error: (sizeError as Error).message },
      { status: 413 } // 413 Payload Too Large
    );
  }

  // Validate input using CREATE schema (strict validation for new questions)
  const validationResult = questionCreateSchema.safeParse(body);
  if (!validationResult.success) {
    return successResponse(
      { error: 'Invalid input', details: validationResult.error.format() },
      400
    );
  }

  const question = await QuestionService.create(validationResult.data);

  // Invalidate caches after creating question
  cache.invalidatePattern('questions:');
  cache.invalidate('question_counts');
  cache.invalidate('topics:all');
  cache.invalidatePattern('exams:');

  return successResponse({ question }, 201);
});
