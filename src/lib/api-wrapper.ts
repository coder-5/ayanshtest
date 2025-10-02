import { NextRequest, NextResponse } from 'next/server';
import { handleAPIError } from './error-handler';
import { ApiResponse } from './api-response';
import { checkRateLimit } from './rate-limiter';

export interface APIHandlerContext {
  req: NextRequest;
  params?: Record<string, string> | undefined;
  userId?: string | undefined;
}

export type APIHandler<T = any> = (context: APIHandlerContext) => Promise<NextResponse | T>;

export interface APIHandlerOptions {
  requireAuth?: boolean;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  cors?: boolean;
  validateParams?: (params: any) => boolean;
}

function getCorsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export function createAPIHandler(
  handler: APIHandler,
  options: APIHandlerOptions = {}
) {
  return async (req: NextRequest, context?: { params?: Record<string, string> }) => {
    try {
      // Handle CORS preflight
      if (req.method === 'OPTIONS' && options.cors) {
        return new NextResponse(null, { status: 200, headers: getCorsHeaders() });
      }

      // Rate limiting
      if (options.rateLimit) {
        const identifier = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const allowed = checkRateLimit(identifier, options.rateLimit.requests, options.rateLimit.windowMs);
        if (!allowed) {
          return ApiResponse.rateLimit('Too many requests');
        }
      }

      // Parameter validation
      if (options.validateParams && context?.params) {
        if (!options.validateParams(context.params)) {
          return ApiResponse.validationError('Invalid parameters');
        }
      }

      // Authentication check (simplified - in real app, verify JWT token)
      let userId: string | undefined;
      if (options.requireAuth) {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
          return ApiResponse.unauthorized('Authorization header required');
        }
        // In a real app, you'd verify the token here
        userId = 'ayansh'; // Default user for this app
      }

      // Execute the handler
      const handlerContext: APIHandlerContext = {
        req,
        params: context?.params,
        userId,
      };

      const result = await handler(handlerContext);

      // If handler returns NextResponse, use it directly
      if (result instanceof NextResponse) {
        if (options.cors) {
          const headers = new Headers(result.headers);
          Object.entries(getCorsHeaders()).forEach(([key, value]) => {
            headers.set(key, value);
          });
          return new NextResponse(result.body, {
            status: result.status,
            statusText: result.statusText,
            headers,
          });
        }
        return result;
      }

      // Otherwise, wrap in success response
      const response = ApiResponse.success(result);
      if (options.cors) {
        Object.entries(getCorsHeaders()).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }
      return response;

    } catch (error) {
      return handleAPIError(error, `${req.method} ${req.nextUrl.pathname}`);
    }
  };
}

// Specific method handlers for common patterns
export const GET = (handler: APIHandler, options?: APIHandlerOptions) =>
  createAPIHandler(handler, { ...options, cors: true });

export const POST = (handler: APIHandler, options?: APIHandlerOptions) =>
  createAPIHandler(handler, { ...options, cors: true });

export const PUT = (handler: APIHandler, options?: APIHandlerOptions) =>
  createAPIHandler(handler, { ...options, cors: true });

export const DELETE = (handler: APIHandler, options?: APIHandlerOptions) =>
  createAPIHandler(handler, { ...options, cors: true });

// Helper for parsing JSON body safely
export async function parseJSONBody<T = any>(req: NextRequest): Promise<T | null> {
  try {
    const text = await req.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// Helper for parsing form data
export async function parseFormData(req: NextRequest): Promise<FormData> {
  return await req.formData();
}

// Helper for extracting search params
export function getSearchParams(req: NextRequest): URLSearchParams {
  return req.nextUrl.searchParams;
}

export default createAPIHandler;