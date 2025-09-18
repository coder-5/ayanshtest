import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// DELETE /api/user-attempts - Clear all user attempts (refresh recent activity)
export async function DELETE(request: NextRequest) {
  try {
    await prisma.userAttempt.deleteMany({})

    return NextResponse.json({ message: 'All user attempts cleared successfully' })
  } catch (error) {
    console.error('Error clearing user attempts:', error)
    return NextResponse.json(
      { error: 'Failed to clear user attempts' },
      { status: 500 }
    )
  }
}