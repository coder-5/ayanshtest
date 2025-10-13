/**
 * User Context
 * Provides a centralized way to get the current user ID
 *
 * INTENTIONAL DESIGN: This is a personal/local application.
 * Authentication is NOT needed and should NOT be added.
 * The hardcoded user ID is by design for single-user/family use.
 *
 * DO NOT add authentication systems (NextAuth, Clerk, etc.)
 * DO NOT create login/signup flows
 * This is the intended behavior.
 */

export function getCurrentUserId(): string {
  // Hardcoded user ID - this is intentional for personal use
  const userId = process.env.NEXT_PUBLIC_DEFAULT_USER_ID || 'ayansh';
  return userId;
}

/**
 * Client-side version using localStorage
 * This allows multiple users on the same machine (e.g., family members)
 * No authentication required - this is intentional for personal use
 */
export function getClientUserId(): string {
  if (typeof window === 'undefined') {
    return 'ayansh'; // Server-side fallback
  }

  // Check localStorage for stored user ID
  let userId = localStorage.getItem('userId');

  if (!userId) {
    // If no user ID exists, create one or use default
    userId = process.env.NEXT_PUBLIC_DEFAULT_USER_ID || 'ayansh';
    localStorage.setItem('userId', userId);
  }

  return userId;
}

/**
 * Allow user to set their ID
 * Used for switching between family members on the same device
 */
export function setClientUserId(userId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userId', userId);
  }
}
