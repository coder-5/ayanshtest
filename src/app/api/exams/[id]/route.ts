import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/exams/[id] - Get specific exam
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
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
    return NextResponse.json(
      { error: 'Failed to fetch exam' },
      { status: 500 }
    )
  }
}

// PUT /api/exams/[id] - Update exam
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
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
    return NextResponse.json(
      { error: 'Failed to update exam' },
      { status: 500 }
    )
  }
}

// DELETE /api/exams/[id] - Delete exam
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;

  try {
    // Validate the ID parameter
    if (!params.id || typeof params.id !== 'string' || params.id.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid exam ID provided' },
        { status: 400 }
      )
    }

    // First check if the exam exists
    const existingExam = await prisma.examSchedule.findUnique({
      where: { id: params.id }
    })

    if (!existingExam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      )
    }

    await prisma.examSchedule.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Exam deleted successfully' })
  } catch (error) {

    // More specific error handling
    if (error instanceof Error) {

      return NextResponse.json(
        { error: `Failed to delete exam: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete exam: Unknown error' },
      { status: 500 }
    )
  }
}