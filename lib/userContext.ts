/**
 * User Context
 * Provides a centralized way to get the current user ID
 *
 * For now, this uses a default user ID stored in environment variables.
 * TODO: Replace with proper authentication (NextAuth.js, Clerk, etc.)
 */

export function getCurrentUserId(): string {
  // Check for environment variable first
  const userId = process.env.NEXT_PUBLIC_DEFAULT_USER_ID || 'ayansh';

  // TODO: Replace with actual authentication
  // Example with NextAuth:
  // const session = await getServerSession();
  // return session?.user?.id || null;

  return userId;
}

/**
 * Client-side version using localStorage for now
 * This allows multiple users on the same machine
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
 * Allow user to set their ID (temporary solution until auth is implemented)
 */
export function setClientUserId(userId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userId', userId);
  }
}
