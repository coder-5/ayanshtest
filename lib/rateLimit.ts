/**
 * Simple in-memory rate limiter for single-user application
 * Prevents accidental DoS from bugs or rapid clicking
 *
 * For multi-user production apps, use @upstash/ratelimit with Redis
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  },
  5 * 60 * 1000
);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   * @default 100
   */
  maxRequests?: number;

  /**
   * Time window in seconds
   * @default 60
   */
  windowSeconds?: number;
}

/**
 * Check if request should be rate limited
 * @param identifier Unique identifier (e.g., endpoint path)
 * @param config Rate limit configuration
 * @returns { limited: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = {}
): { limited: boolean; remaining: number; resetTime: number } {
  const maxRequests = config.maxRequests || 100;
  const windowSeconds = config.windowSeconds || 60;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let entry = rateLimitStore.get(identifier);

  // Create new entry if doesn't exist or expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(identifier, entry);

    return {
      limited: false,
      remaining: maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > maxRequests) {
    return {
      limited: true,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    limited: false,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limit middleware for API routes
 * @param identifier Unique identifier (use request path)
 * @param config Rate limit configuration
 * @returns Response if limited, null if allowed
 */
export function rateLimitMiddleware(
  identifier: string,
  config: RateLimitConfig = {}
): Response | null {
  const result = checkRateLimit(identifier, config);

  if (result.limited) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': (config.maxRequests || 100).toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetTime.toString(),
        },
      }
    );
  }

  return null;
}
