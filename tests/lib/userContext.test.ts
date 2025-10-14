/**
 * Tests for lib/userContext.ts
 *
 * User context management (hardcoded for single-user app)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// We need to test the actual implementation
describe('UserContext', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('getCurrentUserId (server-side)', () => {
    it('should return hardcoded user ID', async () => {
      const { getCurrentUserId } = await import('@/lib/userContext');
      const userId = getCurrentUserId();

      expect(userId).toBe('ayansh');
    });
  });

  describe('Client-side functions', () => {
    // Skip if not in browser environment
    if (typeof window === 'undefined') {
      it.skip('skipping client-side tests in server environment', () => {});
      return;
    }

    it('should get client user ID from localStorage', async () => {
      localStorage.setItem('userId', 'test-user');

      const { getClientUserId } = await import('@/lib/userContext');
      const userId = getClientUserId();

      expect(userId).toBe('test-user');
    });

    it('should set client user ID in localStorage', async () => {
      const { setClientUserId, getClientUserId } = await import('@/lib/userContext');

      setClientUserId('new-user');

      expect(getClientUserId()).toBe('new-user');
      expect(localStorage.getItem('userId')).toBe('new-user');
    });

    it('should return default user ID if not set', async () => {
      localStorage.removeItem('userId');

      const { getClientUserId } = await import('@/lib/userContext');
      const userId = getClientUserId();

      expect(userId).toBe('ayansh'); // Default fallback
    });
  });
});
