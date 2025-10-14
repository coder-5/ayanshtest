/**
 * Tests for lib/error-handler.ts
 *
 * Critical infrastructure - error handling and responses
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ApiError,
  handleApiError,
  withErrorHandler,
  successResponse,
  errorResponse,
} from '@/lib/error-handler';
import { ZodError, z } from 'zod';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

describe('ApiError class', () => {
  it('should create ApiError with status code and message', () => {
    const error = new ApiError(404, 'Resource not found');

    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Resource not found');
    expect(error.name).toBe('ApiError');
  });

  it('should accept optional details', () => {
    const error = new ApiError(400, 'Validation failed', { field: 'email' });

    expect(error.details).toEqual({ field: 'email' });
  });
});

describe('handleApiError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should handle ZodError with 400 status', async () => {
    const schema = z.object({
      email: z.string().email(),
    });

    try {
      schema.parse({ email: 'invalid' });
    } catch (zodError) {
      const response = handleApiError(zodError);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    }
  });

  it('should handle ApiError with custom status code', async () => {
    const apiError = new ApiError(403, 'Forbidden access', { resource: 'admin' });

    const response = handleApiError(apiError);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden access');
    expect(data.details).toEqual({ resource: 'admin' });
  });

  it('should handle Prisma P2002 (unique constraint) with 409 status', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.0.0',
      meta: { target: ['email'] },
    });

    const response = handleApiError(prismaError);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('Duplicate entry');
    expect(data.details).toContain('email');
  });

  it('should handle Prisma P2025 (record not found) with 404 status', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '5.0.0',
      meta: { cause: 'Record to delete does not exist' },
    });

    const response = handleApiError(prismaError);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Record not found');
  });

  it('should handle Prisma P2003 (foreign key constraint) with 400 status', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
      code: 'P2003',
      clientVersion: '5.0.0',
    });

    const response = handleApiError(prismaError);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid reference');
    expect(data.details).toContain('does not exist');
  });

  it('should handle unknown Prisma errors with 500 status', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unknown error', {
      code: 'P9999',
      clientVersion: '5.0.0',
    });

    const response = handleApiError(prismaError);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Database error');
  });

  it('should handle generic Error with 500 status', async () => {
    const error = new Error('Something went wrong');

    const response = handleApiError(error);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Something went wrong');
  });

  it('should handle unknown errors with 500 status', async () => {
    const response = handleApiError('random string error');
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('An unexpected error occurred');
  });

  it('should log all errors to console', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');
    const error = new Error('Test error');

    handleApiError(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith('API Error:', error);
  });
});

describe('withErrorHandler', () => {
  it('should return handler result on success', async () => {
    const mockHandler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));

    const wrappedHandler = withErrorHandler(mockHandler);
    const response = await wrappedHandler('arg1', 'arg2');
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(mockHandler).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should catch and handle errors', async () => {
    const mockHandler = vi.fn().mockRejectedValue(new Error('Handler failed'));

    const wrappedHandler = withErrorHandler(mockHandler);
    const response = await wrappedHandler();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Handler failed');
  });

  it('should handle ZodError in wrapped handler', async () => {
    const schema = z.object({ name: z.string() });
    const mockHandler = vi.fn().mockImplementation(() => {
      schema.parse({ name: 123 }); // This will throw ZodError
    });

    const wrappedHandler = withErrorHandler(mockHandler);
    const response = await wrappedHandler();
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('should handle ApiError in wrapped handler', async () => {
    const mockHandler = vi.fn().mockRejectedValue(new ApiError(404, 'Question not found'));

    const wrappedHandler = withErrorHandler(mockHandler);
    const response = await wrappedHandler();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Question not found');
  });

  it('should preserve handler arguments', async () => {
    const mockHandler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));

    const wrappedHandler = withErrorHandler(mockHandler);
    await wrappedHandler('req', 'ctx', 'extra');

    expect(mockHandler).toHaveBeenCalledWith('req', 'ctx', 'extra');
  });
});

describe('successResponse', () => {
  it('should create response with 200 status by default', async () => {
    const response = successResponse({ message: 'Success' });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Success');
  });

  it('should accept custom status code', async () => {
    const response = successResponse({ id: '123' }, 201);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe('123');
  });

  it('should handle array data', async () => {
    const response = successResponse([1, 2, 3]);
    const data = await response.json();

    expect(data).toEqual([1, 2, 3]);
  });

  it('should handle null data', async () => {
    const response = successResponse(null);
    const data = await response.json();

    expect(data).toBeNull();
  });
});

describe('errorResponse', () => {
  it('should create error response with 500 status by default', async () => {
    const response = errorResponse('Something failed');
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Something failed');
  });

  it('should accept custom status code', async () => {
    const response = errorResponse('Not found', 404);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Not found');
  });

  it('should include optional details', async () => {
    const response = errorResponse('Validation failed', 400, { field: 'email' });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
    expect(data.details).toEqual({ field: 'email' });
  });

  it('should handle array details', async () => {
    const response = errorResponse('Multiple errors', 400, ['error1', 'error2']);
    const data = await response.json();

    expect(data.details).toEqual(['error1', 'error2']);
  });
});
