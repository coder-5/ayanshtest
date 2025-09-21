import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/exams/[id] - Get specific exam
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const exam = await prisma.examSchedule.findUnique({
      where: { id: params.id }
    })

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      )
    }

    // Transform data to eliminate null values with proper defaults
    const transformedExam = {
      ...exam,
      duration: exam.duration || 0,
      notes: exam.notes || '',
      registrationId: exam.registrationId || '',
      registeredAt: exam.registeredAt || exam.createdAt,
      score: exam.score || 0,
      maxScore: exam.maxScore || 0,
      percentile: exam.percentile || 0,
      availableFromDate: exam.availableFromDate || exam.examDate,
      availableToDate: exam.availableToDate || exam.examDate,
      examUrl: exam.examUrl || '',
      loginId: exam.loginId || '',
      loginPassword: exam.loginPassword || ''
    }

    return NextResponse.json(transformedExam)
  } catch (error) {
    console.error('Error fetching exam:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exam' },
      { status: 500 }
    )
  }
}

// PUT /api/exams/[id] - Update exam
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const {
      examName,
      examDate,
      location,
      duration,
      status,
      notes,
      registeredAt,
      registrationId,
      score,
      maxScore,
      percentile,
      availableFromDate,
      availableToDate,
      examUrl,
      loginId,
      loginPassword
    } = body

    const exam = await prisma.examSchedule.update({
      where: { id: params.id },
      data: {
        ...(examName && { examName }),
        ...(examDate && { examDate: new Date(examDate) }),
        ...(location && { location }),
        ...(duration !== undefined && { duration: duration || 0 }),
        ...(status && { status }),
        ...(notes !== undefined && { notes: notes || '' }),
        ...(registeredAt !== undefined && {
          registeredAt: registeredAt ? new Date(registeredAt) : new Date()
        }),
        ...(registrationId !== undefined && { registrationId: registrationId || '' }),
        ...(score !== undefined && { score: score || 0 }),
        ...(maxScore !== undefined && { maxScore: maxScore || 0 }),
        ...(percentile !== undefined && { percentile: percentile || 0 }),
        ...(availableFromDate !== undefined && {
          availableFromDate: availableFromDate ? new Date(availableFromDate) : new Date(examDate)
        }),
        ...(availableToDate !== undefined && {
          availableToDate: availableToDate ? new Date(availableToDate) : new Date(examDate)
        }),
        ...(examUrl !== undefined && { examUrl: examUrl || '' }),
        ...(loginId !== undefined && { loginId: loginId || '' }),
        ...(loginPassword !== undefined && { loginPassword: loginPassword || '' })
      }
    })

    // Transform response to eliminate null values
    const transformedExam = {
      ...exam,
      duration: exam.duration || 0,
      notes: exam.notes || '',
      registrationId: exam.registrationId || '',
      registeredAt: exam.registeredAt || exam.createdAt,
      score: exam.score || 0,
      maxScore: exam.maxScore || 0,
      percentile: exam.percentile || 0,
      availableFromDate: exam.availableFromDate || exam.examDate,
      availableToDate: exam.availableToDate || exam.examDate,
      examUrl: exam.examUrl || '',
      loginId: exam.loginId || '',
      loginPassword: exam.loginPassword || ''
    }

    return NextResponse.json(transformedExam)
  } catch (error) {
    console.error('Error updating exam:', error)
    return NextResponse.json(
      { error: 'Failed to update exam' },
      { status: 500 }
    )
  }
}

// DELETE /api/exams/[id] - Delete exam
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`DELETE /api/exams/${params.id} - Starting deletion process`)

  try {
    // Validate the ID parameter
    if (!params.id || typeof params.id !== 'string' || params.id.trim() === '') {
      console.error('DELETE /api/exams - Invalid ID parameter:', params.id)
      return NextResponse.json(
        { error: 'Invalid exam ID provided' },
        { status: 400 }
      )
    }

    // First check if the exam exists
    console.log(`DELETE /api/exams/${params.id} - Checking if exam exists`)
    const existingExam = await prisma.examSchedule.findUnique({
      where: { id: params.id }
    })

    if (!existingExam) {
      console.error(`DELETE /api/exams/${params.id} - Exam not found`)
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      )
    }

    console.log(`DELETE /api/exams/${params.id} - Exam found, proceeding with deletion`)
    await prisma.examSchedule.delete({
      where: { id: params.id }
    })

    console.log(`DELETE /api/exams/${params.id} - Exam deleted successfully`)
    return NextResponse.json({ message: 'Exam deleted successfully' })
  } catch (error) {
    console.error(`DELETE /api/exams/${params.id} - Error:`, error)

    // More specific error handling
    if (error instanceof Error) {
      console.error(`DELETE /api/exams/${params.id} - Error message:`, error.message)
      console.error(`DELETE /api/exams/${params.id} - Error stack:`, error.stack)

      return NextResponse.json(
        { error: `Failed to delete exam: ${error.message}` },
        { status: 500 }
      )
    }

    console.error(`DELETE /api/exams/${params.id} - Unknown error type:`, typeof error)
    return NextResponse.json(
      { error: 'Failed to delete exam: Unknown error' },
      { status: 500 }
    )
  }
}