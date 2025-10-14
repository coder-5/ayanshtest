/**
 * Tests for lib/cache.ts
 *
 * Critical infrastructure - in-memory caching system
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// We need to test the actual cache implementation, so don't mock it
import { cache, CacheKeys, CacheTTL } from '@/lib/cache';

describe('SimpleCache', () => {
  beforeEach(() => {
    cache.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('set and get', () => {
    it('should store and retrieve data', () => {
      cache.set('test-key', { value: 42 });
      const result = cache.get<{ value: number }>('test-key');

      expect(result).toEqual({ value: 42 });
    });

    it('should return null for non-existent key', () => {
      const result = cache.get('non-existent');

      expect(result).toBeNull();
    });

    it('should handle different data types', () => {
      cache.set('string', 'hello');
      cache.set('number', 123);
      cache.set('boolean', true);
      cache.set('array', [1, 2, 3]);
      cache.set('object', { a: 1, b: 2 });

      expect(cache.get('string')).toBe('hello');
      expect(cache.get('number')).toBe(123);
      expect(cache.get('boolean')).toBe(true);
      expect(cache.get('array')).toEqual([1, 2, 3]);
      expect(cache.get('object')).toEqual({ a: 1, b: 2 });
    });

    it('should overwrite existing key', () => {
      cache.set('key', 'value1');
      cache.set('key', 'value2');

      expect(cache.get('key')).toBe('value2');
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should respect default TTL of 300 seconds', () => {
      cache.set('test', 'data');

      // After 299 seconds - still valid
      vi.advanceTimersByTime(299 * 1000);
      expect(cache.get('test')).toBe('data');

      // After 301 seconds - expired
      vi.advanceTimersByTime(2 * 1000);
      expect(cache.get('test')).toBeNull();
    });

    it('should respect custom TTL', () => {
      cache.set('test', 'data', 60); // 60 seconds TTL

      vi.advanceTimersByTime(59 * 1000);
      expect(cache.get('test')).toBe('data');

      vi.advanceTimersByTime(2 * 1000);
      expect(cache.get('test')).toBeNull();
    });

    it('should handle very short TTL', () => {
      cache.set('test', 'data', 1); // 1 second TTL

      expect(cache.get('test')).toBe('data');

      vi.advanceTimersByTime(1001);
      expect(cache.get('test')).toBeNull();
    });

    it('should handle long TTL', () => {
      cache.set('test', 'data', 3600); // 1 hour

      vi.advanceTimersByTime(3599 * 1000);
      expect(cache.get('test')).toBe('data');

      vi.advanceTimersByTime(2 * 1000);
      expect(cache.get('test')).toBeNull();
    });
  });

  describe('invalidate', () => {
    it('should remove specific key', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.invalidate('key1');

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });

    it('should handle invalidating non-existent key', () => {
      expect(() => cache.invalidate('non-existent')).not.toThrow();
    });
  });

  describe('invalidatePattern', () => {
    it('should remove all keys matching pattern', () => {
      cache.set('questions:all', 'data1');
      cache.set('questions:algebra', 'data2');
      cache.set('questions:geometry', 'data3');
      cache.set('topics:all', 'data4');

      cache.invalidatePattern('questions:');

      expect(cache.get('questions:all')).toBeNull();
      expect(cache.get('questions:algebra')).toBeNull();
      expect(cache.get('questions:geometry')).toBeNull();
      expect(cache.get('topics:all')).toBe('data4');
    });

    it('should handle regex pattern', () => {
      cache.set('user:1', 'data1');
      cache.set('user:2', 'data2');
      cache.set('user:10', 'data3');
      cache.set('admin:1', 'data4');

      cache.invalidatePattern('^user:\\d+$');

      expect(cache.get('user:1')).toBeNull();
      expect(cache.get('user:2')).toBeNull();
      expect(cache.get('user:10')).toBeNull();
      expect(cache.get('admin:1')).toBe('data4');
    });

    it('should handle pattern matching no keys', () => {
      cache.set('key1', 'value1');

      expect(() => cache.invalidatePattern('nonexistent:')).not.toThrow();
      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('clear', () => {
    it('should remove all cache entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
    });

    it('should allow adding new entries after clear', () => {
      cache.set('old', 'data');
      cache.clear();
      cache.set('new', 'data');

      expect(cache.get('new')).toBe('data');
    });
  });

  describe('getOrFetch', () => {
    it('should return cached value if present', async () => {
      cache.set('test', 'cached-value');

      const fetcher = vi.fn().mockResolvedValue('fetched-value');
      const result = await cache.getOrFetch('test', fetcher);

      expect(result).toBe('cached-value');
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should fetch and cache if not present', async () => {
      const fetcher = vi.fn().mockResolvedValue('fetched-value');
      const result = await cache.getOrFetch('test', fetcher);

      expect(result).toBe('fetched-value');
      expect(fetcher).toHaveBeenCalled();
      expect(cache.get('test')).toBe('fetched-value');
    });

    it('should fetch if cached value expired', async () => {
      cache.set('test', 'old-value', 1); // 1 second TTL

      vi.advanceTimersByTime(2000); // Expire the cache

      const fetcher = vi.fn().mockResolvedValue('new-value');
      const result = await cache.getOrFetch('test', fetcher);

      expect(result).toBe('new-value');
      expect(fetcher).toHaveBeenCalled();
    });

    it('should use custom TTL for fetched data', async () => {
      const fetcher = vi.fn().mockResolvedValue('fetched-value');

      await cache.getOrFetch('test', fetcher, 60); // 60 seconds TTL

      vi.advanceTimersByTime(59 * 1000);
      expect(cache.get('test')).toBe('fetched-value');

      vi.advanceTimersByTime(2 * 1000);
      expect(cache.get('test')).toBeNull();
    });

    it('should handle fetcher errors', async () => {
      const fetcher = vi.fn().mockRejectedValue(new Error('Fetch failed'));

      await expect(cache.getOrFetch('test', fetcher)).rejects.toThrow('Fetch failed');
    });

    it('should handle async fetchers', async () => {
      const fetcher = vi.fn().mockResolvedValue('async-value');

      const result = await cache.getOrFetch('test', fetcher);

      expect(result).toBe('async-value');
      expect(fetcher).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      cache.set('active1', 'data', 3600);
      cache.set('active2', 'data', 3600);
      cache.set('expired', 'data', 1);

      vi.advanceTimersByTime(2000); // Expire one entry

      const stats = cache.getStats();

      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.expired).toBe(1);
    });

    it('should return zeros for empty cache', () => {
      const stats = cache.getStats();

      expect(stats.total).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.expired).toBe(0);
    });
  });
});

describe('CacheKeys helper', () => {
  it('should generate questions cache key', () => {
    const key = CacheKeys.questions('algebra-easy');

    expect(key).toBe('questions:algebra-easy');
  });

  it('should generate questionById cache key', () => {
    const key = CacheKeys.questionById('q-123');

    expect(key).toBe('question:q-123');
  });

  it('should generate questionCount cache key', () => {
    const key = CacheKeys.questionCount('amc8-2023');

    expect(key).toBe('question_count:amc8-2023');
  });

  it('should have static topics key', () => {
    expect(CacheKeys.topics).toBe('topics:all');
  });

  it('should generate achievement cache keys', () => {
    expect(CacheKeys.achievements).toBe('achievements:all');
    expect(CacheKeys.achievementById('ach-1')).toBe('achievement:ach-1');
  });

  it('should generate exam cache keys', () => {
    expect(CacheKeys.exams('amc8')).toBe('exams:amc8');
    expect(CacheKeys.examYears('AMC8')).toBe('exam_years:AMC8');
  });
});

describe('CacheTTL constants', () => {
  it('should have reasonable TTL values', () => {
    expect(CacheTTL.questions).toBe(300); // 5 minutes
    expect(CacheTTL.topics).toBe(600); // 10 minutes
    expect(CacheTTL.achievements).toBe(3600); // 1 hour
    expect(CacheTTL.exams).toBe(600); // 10 minutes
  });
});
