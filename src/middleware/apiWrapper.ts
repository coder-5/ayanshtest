import { NextRequest } from 'next/server';
import { handleApiError } from '@/utils/errorHandler';

// Enhanced API wrapper for consistent error handling
export function withErrorHandling(handler: Function) {
  return async (req: NextRequest, context?: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// Safe JSON parsing with error handling
export async function safeJsonParse(req: NextRequest): Promise<any> {
  try {
    const body = await req.json();
    return body;
  } catch (error) {
    throw new Error('Invalid JSON format in request body');
  }
}

// Enhanced validation wrapper with JSON error handling
export function withValidation(schema: any, handler: Function) {
  return async (req: NextRequest, context?: any) => {
    try {
      const body = await safeJsonParse(req);
      const validatedData = schema.parse(body);

      // Pass validated data to handler
      return await handler(req, context, validatedData);
    } catch (error) {
      return handleApiError(error);
    }
  };
}