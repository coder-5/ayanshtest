import { NextResponse } from 'next/server';

export interface StandardApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedApiResponse<T> extends StandardApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ApiResponse {
  /**
   * Create a successful API response
   */
  static success<T>(data: T, message?: string, pagination?: StandardApiResponse['pagination']): NextResponse {
    const response: StandardApiResponse<T> = {
      success: true,
      data,
    };

    if (message) response.message = message;
    if (pagination) response.pagination = pagination;

    return NextResponse.json(response);
  }

  /**
   * Create a successful API response with status code
   */
  static successWithStatus<T>(
    data: T,
    status: number,
    message?: string,
    pagination?: StandardApiResponse['pagination']
  ): NextResponse {
    const response: StandardApiResponse<T> = {
      success: true,
      data,
    };

    if (message) response.message = message;
    if (pagination) response.pagination = pagination;

    return NextResponse.json(response, { status });
  }

  /**
   * Create an error API response
   */
  static error(message: string, status: number = 500): NextResponse {
    const response: StandardApiResponse = {
      success: false,
      error: message,
    };

    return NextResponse.json(response, { status });
  }

  /**
   * Create a validation error response
   */
  static validationError(message: string): NextResponse {
    return this.error(message, 400);
  }

  /**
   * Create a not found error response
   */
  static notFound(message: string = 'Resource not found'): NextResponse {
    return this.error(message, 404);
  }

  /**
   * Create an unauthorized error response
   */
  static unauthorized(message: string = 'Unauthorized'): NextResponse {
    return this.error(message, 401);
  }

  /**
   * Create an internal server error response
   */
  static serverError(message: string = 'Internal server error'): NextResponse {
    return this.error(message, 500);
  }

  /**
   * Create a rate limit error response
   */
  static rateLimit(message: string = 'Too many requests'): NextResponse {
    return this.error(message, 429);
  }

  /**
   * Create a paginated response
   */
  static paginated<T>(
    data: T[],
    pagination: PaginationParams,
    total: number
  ): NextResponse {
    const response: PaginatedApiResponse<T> = {
      success: true,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit)
      }
    };
    return NextResponse.json(response);
  }
}