import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/exams - Fetch all exams
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // First, update any exams that should have their status changed
    const now = new Date()
    await prisma.examSchedule.updateMany({
      where: {
        examDate: { lt: now },
        status: 'upcoming'
      },
      data: {
        status: 'missed'
      }
    })

    const where = status ? { status } : {}

    const exams = await prisma.examSchedule.findMany({
      where,
      orderBy: {
        examDate: 'asc'
      }
    })

    // Return raw data preserving nulls for proper state handling
    const transformedExams = exams.map(exam => ({
      ...exam,
      // Preserve nulls for meaningful state distinction
      duration: exam.duration,
      notes: exam.notes,
      registrationId: exam.registrationId,
      registeredAt: exam.registeredAt,
      score: exam.score,
      maxScore: exam.maxScore,
      percentile: exam.percentile,
      availableFromDate: exam.availableFromDate,
      availableToDate: exam.availableToDate,
      examUrl: exam.examUrl,
      loginId: exam.loginId,
      loginPassword: exam.loginPassword
    }))

    return NextResponse.json(transformedExams)
  } catch (error) {
    console.error('Error fetching exams:', error)
    return NextResponse.json(
      [],
      { status: 500 }
    )
  }
}

// POST /api/exams - Create new exam
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      examName,
      examDate,
      location,
      duration,
      notes,
      registeredAt,
      registrationId,
      availableFromDate,
      availableToDate,
      examUrl,
      loginId,
      loginPassword
    } = body

    // Validate required fields
    if (!examName || !examDate || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: examName, examDate, location' },
        { status: 400 }
      )
    }

    // Determine status based on exam date
    const examDateObj = new Date(examDate)
    const now = new Date()
    const status = examDateObj < now ? 'missed' : 'upcoming'

    const exam = await prisma.examSchedule.create({
      data: {
        examName,
        examDate: examDateObj,
        location,
        duration: duration || 0,
        notes: notes || '',
        registeredAt: registeredAt ? new Date(registeredAt) : new Date(),
        registrationId: registrationId || '',
        availableFromDate: availableFromDate ? new Date(availableFromDate) : examDateObj,
        availableToDate: availableToDate ? new Date(availableToDate) : examDateObj,
        examUrl: examUrl || '',
        loginId: loginId || '',
        loginPassword: loginPassword || '',
        score: 0,
        maxScore: 0,
        percentile: 0,
        status
      }
    })

    // Transform response to eliminate null values
    const transformedExam = {
      ...exam,
      duration: exam.duration || 0,
      notes: exam.notes || '',
      registrationId: exam.registrationId || '',
      score: exam.score || 0,
      maxScore: exam.maxScore || 0,
      percentile: exam.percentile || 0,
      availableFromDate: exam.availableFromDate || exam.examDate,
      availableToDate: exam.availableToDate || exam.examDate,
      examUrl: exam.examUrl || '',
      loginId: exam.loginId || '',
      loginPassword: exam.loginPassword || ''
    }

    return NextResponse.json(transformedExam, { status: 201 })
  } catch (error) {
    console.error('Error creating exam:', error)
    return NextResponse.json(
      { error: 'Failed to create exam' },
      { status: 500 }
    )
  }
}