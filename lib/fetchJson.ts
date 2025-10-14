/**
 * Safe fetch utility that handles JSON parsing with proper error handling
 * Prevents "Unexpected token '<'" errors when API returns HTML error pages
 */

export class FetchError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

/**
 * Fetches a URL and parses the JSON response with proper error handling
 * @param url - The URL to fetch
 * @param options - Fetch options (headers, method, body, etc.)
 * @returns Parsed JSON response
 * @throws {FetchError} If the response is not ok (status >= 400)
 * @throws {Error} If JSON parsing fails
 */
export async function fetchJson<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  // Check if response is ok (status 200-299)
  if (!response.ok) {
    throw new FetchError(
      `HTTP error! status: ${response.status}`,
      response.status,
      response.statusText
    );
  }

  // Parse JSON
  try {
    const data = await response.json();
    return data as T;
  } catch (error) {
    throw new Error(
      `Failed to parse JSON response from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Safe version of fetchJson that returns null on error instead of throwing
 * Useful for non-critical fetches where you want to handle errors silently
 */
export async function fetchJsonSafe<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T | null> {
  try {
    return await fetchJson<T>(url, options);
  } catch (error) {
    console.error(`fetchJsonSafe error for ${url}:`, error);
    return null;
  }
}
