/**
 * Simple In-Memory Cache with TTL
 *
 * Used for caching static data (questions, topics, achievements)
 * to improve performance for frequently accessed data.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<unknown>>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached data with TTL (in seconds)
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * Invalidate specific key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all keys matching pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get or fetch data (with caching)
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    // Try to get from cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const data = await fetcher();
    this.set(key, data, ttlSeconds);
    return data;
  }

  /**
   * Get cache stats (for debugging)
   */
  getStats() {
    let expired = 0;
    let active = 0;

    for (const entry of this.cache.values()) {
      if (Date.now() > entry.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
    };
  }
}

// Singleton instance
export const cache = new SimpleCache();

/**
 * Cache keys for different data types
 */
export const CacheKeys = {
  // Questions cache
  questions: (filters: string) => `questions:${filters}`,
  questionById: (id: string) => `question:${id}`,
  questionCount: (filters: string) => `question_count:${filters}`,

  // Topics cache
  topics: 'topics:all',

  // Achievements cache
  achievements: 'achievements:all',
  achievementById: (id: string) => `achievement:${id}`,

  // Exam data cache
  examYears: (examType: string) => `exam_years:${examType}`,
};

/**
 * Cache TTL values (in seconds)
 */
export const CacheTTL = {
  questions: 300, // 5 minutes (questions change frequently during imports)
  topics: 600, // 10 minutes (topics are fairly static)
  achievements: 3600, // 1 hour (achievements rarely change)
  exams: 600, // 10 minutes
};
