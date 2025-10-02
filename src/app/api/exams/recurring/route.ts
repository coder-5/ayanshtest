import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/exams/recurring - Create multiple recurring exams
export async function POST(request: NextRequest) {
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
      availableFromDate,
      availableToDate,
      examUrl,
      loginId,
      loginPassword,
      recurrenceType,
      recurrenceCount
    } = body

    // Validate required fields
    if (!examName || !examDate || !location || !recurrenceType || !recurrenceCount) {
      return NextResponse.json(
        { error: 'Missing required fields: examName, examDate, location, recurrenceType, recurrenceCount' },
        { status: 400 }
      )
    }

    // Validate recurrence parameters
    if (!['weekly', 'monthly'].includes(recurrenceType)) {
      return NextResponse.json(
        { error: 'Invalid recurrenceType. Must be "weekly" or "monthly"' },
        { status: 400 }
      )
    }

    if (recurrenceCount < 2 || recurrenceCount > 12) {
      return NextResponse.json(
        { error: 'recurrenceCount must be between 2 and 12' },
        { status: 400 }
      )
    }

    const createdExams = []
    const baseDate = new Date(examDate)
    const baseAvailableFrom = availableFromDate ? new Date(availableFromDate) : baseDate
    const baseAvailableTo = availableToDate ? new Date(availableToDate) : baseDate

    // Create multiple exams based on recurrence
    for (let i = 0; i < recurrenceCount; i++) {
      const currentExamDate = new Date(baseDate)
      const currentAvailableFrom = new Date(baseAvailableFrom)
      const currentAvailableTo = new Date(baseAvailableTo)

      // Calculate the date for this occurrence
      if (recurrenceType === 'weekly') {
        currentExamDate.setDate(baseDate.getDate() + (i * 7))
        currentAvailableFrom.setDate(baseAvailableFrom.getDate() + (i * 7))
        currentAvailableTo.setDate(baseAvailableTo.getDate() + (i * 7))
      } else if (recurrenceType === 'monthly') {
        currentExamDate.setMonth(baseDate.getMonth() + i)
        currentAvailableFrom.setMonth(baseAvailableFrom.getMonth() + i)
        currentAvailableTo.setMonth(baseAvailableTo.getMonth() + i)
      }

      // Create exam name with occurrence number
      const examNameWithOccurrence = `${examName} ${i === 0 ? '' : `(${i + 1})`}`.trim()

      const exam = await prisma.examSchedule.create({
        data: {
          examName: examNameWithOccurrence,
          examDate: currentExamDate,
          location,
          duration: duration || 0,
          status: status || 'upcoming',
          notes: notes || '',
          registeredAt: registeredAt ? new Date(registeredAt) : new Date(),
          registrationId: registrationId || '',
          availableFromDate: currentAvailableFrom,
          availableToDate: currentAvailableTo,
          examUrl: examUrl || '',
          loginId: loginId || '',
          loginPassword: loginPassword || '',
          score: 0,
          maxScore: 0,
          percentile: 0
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

      createdExams.push(transformedExam)
    }

    return NextResponse.json({
      message: `Successfully created ${recurrenceCount} recurring exams`,
      exams: createdExams,
      count: createdExams.length
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create recurring exams' },
      { status: 500 }
    )
  }
}