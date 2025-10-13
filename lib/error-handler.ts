/**
 * Centralized Error Handler
 *
 * Provides consistent error handling and responses across all API routes
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Handle API errors and return consistent NextResponse
 */
export function handleApiError(error: unknown): NextResponse {
  // Log error for debugging
  console.error('API Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: error.format(),
      },
      { status: 400 }
    );
  }

  // Custom API errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return NextResponse.json(
          {
            error: 'Duplicate entry',
            details: `A record with this ${error.meta?.target} already exists`,
          },
          { status: 409 }
        );
      case 'P2025': // Record not found
        return NextResponse.json(
          {
            error: 'Record not found',
            details: error.meta?.cause,
          },
          { status: 404 }
        );
      case 'P2003': // Foreign key constraint violation
        return NextResponse.json(
          {
            error: 'Invalid reference',
            details: 'Referenced record does not exist',
          },
          { status: 400 }
        );
      default:
        return NextResponse.json(
          {
            error: 'Database error',
            details: error.message,
          },
          { status: 500 }
        );
    }
  }

  // Generic errors
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }

  // Unknown errors
  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
    },
    { status: 500 }
  );
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Create standardized success response
 */
export function successResponse(data: unknown, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Create standardized error response
 */
export function errorResponse(
  message: string,
  statusCode: number = 500,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      details,
    },
    { status: statusCode }
  );
}
