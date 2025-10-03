import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number    // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string    // Custom error message
  keyGenerator?: (request: NextRequest) => string // Custom key generator
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (in production, use Redis or database)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

function getClientKey(request: NextRequest, customKeyGenerator?: (request: NextRequest) => string): string {
  if (customKeyGenerator) {
    return customKeyGenerator(request)
  }

  // Try to get real IP address from headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0]?.trim() || realIp || '127.0.0.1'

  return `${ip}:${request.nextUrl.pathname}`
}

export function createRateLimiter(config: RateLimitConfig) {
  return function rateLimiter(request: NextRequest): NextResponse | null {
    const key = getClientKey(request, config.keyGenerator)
    const now = Date.now()
  
    // Get or create rate limit entry
    let entry = rateLimitStore.get(key)

    if (!entry || entry.resetTime < now) {
      // Create new window
      entry = {
        count: 1,
        resetTime: now + config.windowMs
      }
      rateLimitStore.set(key, entry)
      return null // Allow request
    }

    // Increment counter
    entry.count++

    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      const resetTimeSeconds = Math.ceil((entry.resetTime - now) / 1000)

      return NextResponse.json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: config.message || 'Too many requests',
          details: {
            limit: config.maxRequests,
            windowMs: config.windowMs,
            resetTime: resetTimeSeconds
          }
        }
      }, {
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString(),
          'Retry-After': resetTimeSeconds.toString()
        }
      })
    }

    return null // Allow request
  }
}

// Pre-configured rate limiters with increased capacity
export const rateLimiters = {
  // General API rate limiter (increased capacity)
  api: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000, // Increased from 100 to 1000
    message: 'Too many API requests'
  }),

  // Authentication rate limiter (removed since auth is disabled)
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // Increased for testing
    message: 'Rate limit exceeded'
  }),

  // File upload rate limiter (more generous)
  upload: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50, // Increased from 10 to 50
    message: 'Too many file uploads'
  }),

  // Question requests (much higher for practice sessions)
  questions: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200, // Increased from 20 to 200
    message: 'Too many question requests'
  }),

  // Practice session rate limiter
  practice: createRateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 50,
    message: 'Too many practice requests'
  })
}

// Middleware wrapper for rate limiting
export function withRateLimit(rateLimiter: ReturnType<typeof createRateLimiter>, handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const rateLimitResponse = rateLimiter(request)

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    return handler(request, ...args)
  }
}

// User-specific rate limiter (requires authentication)
export function createUserRateLimiter(config: RateLimitConfig) {
  return createRateLimiter({
    ...config,
    keyGenerator: (request: NextRequest) => {
      const userId = request.headers.get('x-user-id') || getClientKey(request)
      return `user:${userId}:${request.nextUrl.pathname}`
    }
  })
}

// Advanced rate limiting with different tiers
export const tieredRateLimiters = {
  // Free tier users
  free: createUserRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100,
    message: 'Free tier rate limit exceeded'
  }),

  // Premium users
  premium: createUserRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000,
    message: 'Premium tier rate limit exceeded'
  })
}

// Rate limiter based on user role
export function getRateLimiterForUser(request: NextRequest) {
  const userRole = request.headers.get('x-user-role')

  switch (userRole) {
    case 'admin':
      return null // No rate limiting for admins
    case 'teacher':
      return tieredRateLimiters.premium
    case 'student':
    default:
      return tieredRateLimiters.free
  }
}

// Simple check rate limit function for inline usage
export function checkRateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const key = identifier
  const entry = rateLimitStore.get(key)

  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (entry.count >= maxRequests) {
    return false
  }

  entry.count++
  return true
}

export default rateLimiters