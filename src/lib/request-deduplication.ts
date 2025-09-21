// Request deduplication to prevent multiple identical API calls
interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest>();
  private readonly timeout = 5000; // 5 seconds timeout

  async dedupe<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if we already have a pending request for this key
    const existing = this.pendingRequests.get(key);

    if (existing) {
      // Check if the request hasn't timed out
      if (Date.now() - existing.timestamp < this.timeout) {
        console.log(`Request deduplication: using existing request for ${key}`);
        return existing.promise;
      } else {
        // Remove expired request
        this.pendingRequests.delete(key);
      }
    }

    // Create new request
    console.log(`Request deduplication: creating new request for ${key}`);
    const promise = requestFn();

    // Store the pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    });

    // Clean up after completion (both success and failure)
    promise
      .finally(() => {
        this.pendingRequests.delete(key);
      });

    return promise;
  }

  // Generate a key for API requests
  static generateKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  // Clear all pending requests (useful for cleanup)
  clear(): void {
    this.pendingRequests.clear();
  }

  // Get current pending request count
  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}

// Export singleton instance
export const requestDeduplicator = new RequestDeduplicator();

// Enhanced fetch function with deduplication
export async function deduplicatedFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const key = RequestDeduplicator.generateKey(url, options);

  return requestDeduplicator.dedupe(key, async () => {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  });
}

// Hook for React components
export function useDeduplicatedFetch() {
  return deduplicatedFetch;
}