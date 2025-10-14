/**
 * Request Mock Factory
 *
 * Utilities for creating Next.js Request mocks in API tests
 */

/**
 * Create a mock GET request with query parameters
 */
export function createGetRequest(url: string, searchParams: Record<string, string> = {}) {
  const urlObj = new URL(url, 'http://localhost');

  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  return new Request(urlObj.toString(), {
    method: 'GET',
  });
}

/**
 * Create a mock POST request with JSON body
 */
export function createPostRequest(url: string, body: unknown) {
  return new Request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

/**
 * Create a mock PUT request with JSON body
 */
export function createPutRequest(url: string, body: unknown) {
  return new Request(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

/**
 * Create a mock PATCH request with JSON body
 */
export function createPatchRequest(url: string, body: unknown) {
  return new Request(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

/**
 * Create a mock DELETE request
 */
export function createDeleteRequest(url: string) {
  return new Request(url, {
    method: 'DELETE',
  });
}

/**
 * Extract JSON from NextResponse
 */
export async function extractJson<T>(response: Response): Promise<T> {
  return await response.json();
}

/**
 * Helper to test response status and JSON in one go
 */
export async function expectResponse<T>(response: Response, expectedStatus: number): Promise<T> {
  expect(response.status).toBe(expectedStatus);
  return await extractJson<T>(response);
}
