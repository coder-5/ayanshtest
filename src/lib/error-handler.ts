import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { logger, generateRequestId } from './logger'

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}

export interface APIError {
  code: ErrorCode
  message: string
  details?: string | object
  statusCode: number
}

export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly details?: string | object | undefined

  constructor(code: ErrorCode, message: string, statusCode: number = 500, details?: string | object) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.isOperational = true
    this.details = details

    Error.captureStackTrace(this, this.constructor)
  }
}

// Pre-defined error creators
export const errors = {
  validation: (message: string, details?: string | object) =>
    new AppError(ErrorCode.VALIDATION_ERROR, message, 400, details),

  unauthorized: (message: string = 'Authentication required') =>
    new AppError(ErrorCode.AUTHENTICATION_REQUIRED, message, 401),

  forbidden: (message: string = 'Insufficient permissions') =>
    new AppError(ErrorCode.AUTHORIZATION_FAILED, message, 403),

  notFound: (resource: string = 'Resource') =>
    new AppError(ErrorCode.RESOURCE_NOT_FOUND, `${resource} not found`, 404),

  conflict: (message: string) =>
    new AppError(ErrorCode.RESOURCE_CONFLICT, message, 409),

  rateLimit: (message: string = 'Too many requests') =>
    new AppError(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429),

  database: (message: string, details?: string | object) =>
    new AppError(ErrorCode.DATABASE_ERROR, message, 500, details),

  fileUpload: (message: string) =>
    new AppError(ErrorCode.FILE_UPLOAD_ERROR, message, 400),

  internal: (message: string = 'Internal server error', details?: string | object) =>
    new AppError(ErrorCode.INTERNAL_SERVER_ERROR, message, 500, details)
}

// Error handler middleware
export function handleAPIError(error: unknown, context?: string, userId?: string): NextResponse {
  const requestId = generateRequestId();

  // Handle known application errors
  if (error instanceof AppError) {
    logger.error(
      `Application error: ${error.message}`,
      context || 'API',
      {
        code: error.code,
        details: error.details,
        stack: error.stack
      },
      { userId, requestId }
    );

    return NextResponse.json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId
      }
    }, { status: error.statusCode })
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const details = error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message
    }));

    // Create a more descriptive main message
    const fieldCount = details.length;
    const firstField = details[0]?.path || 'unknown field';
    const mainMessage = fieldCount === 1
      ? `Validation failed for field '${firstField}': ${details[0]?.message}`
      : `Validation failed for ${fieldCount} fields: ${details.map(d => d.path).join(', ')}`;

    logger.validation('Validation failed', { errors: details, userId, requestId });

    return NextResponse.json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: mainMessage,
        details,
        requestId
      }
    }, { status: 400 })
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    logger.databaseError('Prisma operation failed', error, error.meta?.target as string);

    switch (error.code) {
      case 'P2002':
        return NextResponse.json({
          success: false,
          error: {
            code: ErrorCode.RESOURCE_CONFLICT,
            message: 'Resource already exists',
            details: error.meta,
            requestId
          }
        }, { status: 409 })

      case 'P2025':
        return NextResponse.json({
          success: false,
          error: {
            code: ErrorCode.RESOURCE_NOT_FOUND,
            message: 'Resource not found',
            details: error.meta,
            requestId
          }
        }, { status: 404 })

      default:
        return NextResponse.json({
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Database operation failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            requestId
          }
        }, { status: 500 })
    }
  }

  // Handle Prisma client initialization errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    logger.databaseError('Database connection failed', error);

    return NextResponse.json({
      success: false,
      error: {
        code: ErrorCode.DATABASE_ERROR,
        message: 'Database connection failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        requestId
      }
    }, { status: 503 })
  }

  // Handle unknown errors
  const isError = error instanceof Error;
  logger.error(
    'Unexpected error occurred',
    context || 'API',
    isError ? { message: error.message, stack: error.stack } : error,
    { userId, requestId }
  );

  return NextResponse.json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? (isError ? error.message : String(error)) : undefined,
      requestId
    }
  }, { status: 500 })
}


// Async error wrapper for API routes
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleAPIError(error)
    }
  }
}

// Client-side error handler
export class ClientError extends Error {
  public readonly statusCode: number
  public readonly code: string

  constructor(message: string, statusCode: number, code: string) {
    super(message)
    this.statusCode = statusCode
    this.code = code
  }
}

export async function handleClientResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ClientError(
      errorData.error?.message || 'Request failed',
      response.status,
      errorData.error?.code || 'UNKNOWN_ERROR'
    )
  }

  return await response.json()
}

// Standardized error handler for client-side components
export function standardErrorHandler(error: unknown, context: string = 'Component'): string {
  console.error(`[${context}] Error occurred:`, error);

  if (error instanceof ClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

// Safe async operation wrapper for client components
export function safeAsync<T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  errorHandler?: (error: unknown) => void
) {
  return async (...args: T): Promise<R | null> => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      if (errorHandler) {
        errorHandler(error);
      } else {
        console.error('Async operation failed:', error);
      }
      return null;
    }
  };
}