import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// DELETE /api/user-attempts/[id] - Delete specific user attempt
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.userAttempt.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'User attempt deleted successfully' })
  } catch (error) {
    console.error('Error deleting user attempt:', error)
    return NextResponse.json(
      { error: 'Failed to delete user attempt' },
      { status: 500 }
    )
  }
}