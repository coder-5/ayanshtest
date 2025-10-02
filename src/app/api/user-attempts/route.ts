import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling } from '@/lib/error-handler'
// User authentication removed - using hardcoded user for now
import { paginationSchema } from '@/schemas/validation'
import { rateLimiters, withRateLimit } from '@/lib/rate-limiter'

// GET /api/user-attempts - Get recent user attempts
async function getUserAttemptsHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Get user (always Ayansh in standalone mode)
  // Using default user since auth is removed
  const user = { id: 'ayansh', name: 'Ayansh' }

  // Validate pagination parameters with defaults
  const paginationResult = paginationSchema.safeParse({
    limit: searchParams.get('limit') || undefined, // Let schema provide default
    sort: searchParams.get('sort') || undefined   // Let schema provide default
  })

  if (!paginationResult.success) {
    return NextResponse.json({ error: 'Invalid parameters', details: paginationResult.error }, { status: 400 })
  }

  const { limit, sort } = paginationResult.data

  const attempts = await prisma.userAttempt.findMany({
    where: { userId: user.id },
    orderBy: { attemptedAt: sort === 'desc' ? 'desc' : 'asc' },
    take: limit,
    include: {
      question: {
        select: {
          examName: true,
          topic: true
        }
      }
    }
  })

  return NextResponse.json({
    attempts: attempts.map(attempt => ({
      id: attempt.id,
      isCorrect: attempt.isCorrect,
      attemptedAt: attempt.attemptedAt.toISOString(),
      question: {
        examName: attempt.question?.examName || 'Unknown',
        topic: attempt.question?.topic || 'Unknown'
      }
    }))
  })
}

// DELETE /api/user-attempts - Clear user attempts for Ayansh
async function deleteUserAttemptsHandler(_request: NextRequest) {
  // Get user (always Ayansh in standalone mode)
  // Using default user since auth is removed
  const user = { id: 'ayansh', name: 'Ayansh' }

  // Only delete attempts for Ayansh
  const deleteResult = await prisma.userAttempt.deleteMany({
    where: {
      userId: user.id
    }
  })

  return NextResponse.json({
    message: `${deleteResult.count} user attempts cleared for user ${user.id}`,
    deletedCount: deleteResult.count,
    userId: user.id
  })
}

export const GET = withRateLimit(rateLimiters.api, withErrorHandling(getUserAttemptsHandler))
export const DELETE = withRateLimit(rateLimiters.api, withErrorHandling(deleteUserAttemptsHandler))