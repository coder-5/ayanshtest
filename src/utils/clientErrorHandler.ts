import { ERROR_MESSAGES } from '@/constants';

export interface ApiError {
  message: string;
  status: number;
  details?: any;
}

export class ClientError extends Error {
  public status: number;
  public details?: any;

  constructor(message: string, status: number = 500, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = 'ClientError';
  }
}

export async function handleApiResponse(response: Response): Promise<any> {
  if (!response.ok) {
    let errorMessage = ERROR_MESSAGES.SERVER_ERROR;
    let errorDetails;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
      errorDetails = errorData.details || errorData.data;
    } catch {
      // Failed to parse error response, use default message
    }

    throw new ClientError(errorMessage, response.status, errorDetails);
  }

  try {
    return await response.json();
  } catch (error) {
    console.error('Failed to parse response JSON:', error);
    throw new ClientError('Invalid response format', 500);
  }
}

export function handleClientError(error: unknown): string {
  console.error('Client Error:', error);

  if (error instanceof ClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.name === 'TypeError') {
      return ERROR_MESSAGES.NETWORK;
    }
    return error.message;
  }

  return ERROR_MESSAGES.GENERAL;
}

export function showErrorToast(message: string): void {
  // For now, use alert. In the future, this could be replaced with a proper toast library
  alert(`Error: ${message}`);
}

export function showSuccessToast(message: string): void {
  // For now, use alert. In the future, this could be replaced with a proper toast library
  alert(`Success: ${message}`);
}

// Generic API fetch wrapper with consistent error handling
export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<any> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    return await handleApiResponse(response);
  } catch (error) {
    const errorMessage = handleClientError(error);
    throw new ClientError(errorMessage);
  }
}