// Simple in-memory cache for API responses
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes default
  private readonly maxSize = 1000; // Maximum cache entries to prevent memory issues

  set(key: string, data: any, ttl?: number): void {
    // Implement LRU eviction when cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };
    this.cache.set(key, entry);
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Generate cache key from request parameters
  static generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${prefix}:${sortedParams}`;
  }
}

// Export singleton instance
export const apiCache = new SimpleCache();

// Cleanup expired entries every 10 minutes
if (typeof window === 'undefined') { // Only run on server
  setInterval(() => {
    apiCache.cleanup();
  }, 10 * 60 * 1000);
}

// Cache decorator for API handlers
export function withCache(
  handler: Function,
  cacheKey: string,
  ttl?: number
) {
  return async (...args: any[]) => {
    // Try to get from cache first
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Execute handler and cache result
    const result = await handler(...args);
    apiCache.set(cacheKey, result, ttl);
    return result;
  };
}