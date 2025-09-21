import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling } from '@/middleware/apiWrapper'

// DELETE /api/user-attempts - Clear user attempts for specific user only (updated)
async function deleteUserAttemptsHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Require userId parameter - no default fallback for destructive operations
  const rawUserId = searchParams.get('userId')
  const userId = rawUserId?.trim() || null


  // Check for missing or invalid userId
  if (!userId || userId === 'all' || userId === '*') {
    return NextResponse.json(
      { error: `Invalid or missing userId parameter. Received: "${userId}". Cannot delete all user data.` },
      { status: 400 }
    )
  }

  // Additional safety check - prevent deletion of multiple users
  if (userId.includes(',') || userId.includes(';') || userId.includes('|')) {
    return NextResponse.json(
      { error: 'Invalid userId format. Only single user deletion allowed.' },
      { status: 400 }
    )
  }

  // Only delete attempts for the specific user
  const deleteResult = await prisma.userAttempt.deleteMany({
    where: {
      userId: userId
    }
  })
  return NextResponse.json({
    message: `${deleteResult.count} user attempts cleared for user: ${userId}`,
    deletedCount: deleteResult.count,
    userId: userId
  })
}

export const DELETE = withErrorHandling(deleteUserAttemptsHandler)