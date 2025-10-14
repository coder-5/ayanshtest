/**
 * User Context Mocks
 *
 * Utilities for mocking user authentication in tests
 */

import { vi } from 'vitest';

/**
 * Mock getCurrentUserId to return a specific user ID
 */
export function mockCurrentUser(userId: string = 'test-user-id') {
  vi.mock('@/lib/userContext', () => ({
    getCurrentUserId: vi.fn(() => userId),
    getClientUserId: vi.fn(() => userId),
    setClientUserId: vi.fn(),
  }));
}

/**
 * Mock user context to simulate no user (unauthenticated)
 */
export function mockNoUser() {
  vi.mock('@/lib/userContext', () => ({
    getCurrentUserId: vi.fn(() => {
      throw new Error('No user logged in');
    }),
    getClientUserId: vi.fn(() => null),
    setClientUserId: vi.fn(),
  }));
}

/**
 * Reset user context mocks
 */
export function resetUserMocks() {
  vi.resetModules();
}
