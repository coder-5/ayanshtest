import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiResponse } from '@/lib/api-response';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    const validationErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    const validationMessage = `Validation failed: ${validationErrors.map(e => `${e.field}: ${e.message}`).join(', ')}`;
    return ApiResponse.validationError(validationMessage);
  }

  // Custom application errors
  if (error instanceof AppError) {
    return ApiResponse.error(error.message, error.statusCode);
  }

  // Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    return handlePrismaError(error as any);
  }

  // Generic server error
  const errorMessage = error instanceof Error ? error.message : 'Internal server error';
  return ApiResponse.serverError(errorMessage);
}

function handlePrismaError(error: any): NextResponse {
  switch (error.code) {
    case 'P2002':
      return ApiResponse.validationError('A record with this information already exists.');

    case 'P2025':
      return ApiResponse.notFound('Record not found.');

    case 'P2003':
      return ApiResponse.validationError('Related record not found.');

    default:
      console.error('Unhandled Prisma error:', error);
      return ApiResponse.serverError('Database operation failed.');
  }
}