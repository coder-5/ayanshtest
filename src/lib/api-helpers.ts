import { NextRequest } from 'next/server';
import { safeUrlParam, safeUrlParamPositiveNumber } from '@/utils/nullSafety';
import { PaginationParams } from './api-response';

// Extract common pagination parameters from request
export function extractPaginationParams(request: NextRequest): PaginationParams {
  const { searchParams } = new URL(request.url);

  const page = safeUrlParamPositiveNumber(searchParams, 'page', 1, 1, 10000);
  const limit = safeUrlParamPositiveNumber(searchParams, 'limit', 20, 1, 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// Common Prisma include patterns
export const commonIncludes = {
  question: {
    options: true,
    solution: true
  },
  questionWithTags: {
    options: true,
    solution: true,
    tags: {
      include: {
        tag: true
      }
    }
  },
  questionWithUserData: {
    options: true,
    solution: true,
    attempts: true,
    userDiagrams: true
  },
  userAttemptWithQuestion: {
    question: {
      include: {
        options: true,
        solution: true
      }
    },
    session: true
  }
};

// Common where clause builders
export function buildQuestionFilter(searchParams: URLSearchParams): {
  examName?: string;
  topic?: string;
  difficulty?: string;
} {
  const competition = safeUrlParam(searchParams, 'competition');
  const topic = safeUrlParam(searchParams, 'topic');
  const difficulty = safeUrlParam(searchParams, 'difficulty');

  const where: {
    examName?: string;
    topic?: string;
    difficulty?: string;
  } = {};

  if (competition && competition !== 'all') {
    where.examName = competition;
  }

  if (topic && topic !== 'all') {
    where.topic = topic;
  }

  if (difficulty && difficulty !== 'all') {
    where.difficulty = difficulty;
  }

  return where;
}

// Common validation function
export function validateRequiredFields(data: Record<string, unknown>, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (!data[field] && data[field] !== 0 && data[field] !== false) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}