import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ERROR_MESSAGES, HTTP_STATUS } from '@/constants';
import { ApiResponse } from '@/types';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    const validationErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return NextResponse.json<ApiResponse>({
      success: false,
      error: ERROR_MESSAGES.VALIDATION,
      message: 'Validation failed',
      data: validationErrors,
    }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  // Custom application errors
  if (error instanceof AppError) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message,
    }, { status: error.statusCode });
  }

  // Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    return handlePrismaError(error as any);
  }

  // Generic server error
  return NextResponse.json<ApiResponse>({
    success: false,
    error: ERROR_MESSAGES.SERVER_ERROR,
  }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
}

function handlePrismaError(error: any): NextResponse<ApiResponse> {
  switch (error.code) {
    case 'P2002':
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'A record with this information already exists.',
      }, { status: HTTP_STATUS.BAD_REQUEST });

    case 'P2025':
      return NextResponse.json<ApiResponse>({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND,
      }, { status: HTTP_STATUS.NOT_FOUND });

    case 'P2003':
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Related record not found.',
      }, { status: HTTP_STATUS.BAD_REQUEST });

    default:
      console.error('Unhandled Prisma error:', error);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR,
      }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
}