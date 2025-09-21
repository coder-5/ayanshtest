import { NextRequest, NextResponse } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      questionId,
      userId = 'ayansh',
      reportType,
      description,
      severity,
      evidence = '',
      suggestedFix = '',
      confidence = 5
    } = body;

    console.log('Error report request:', { questionId, reportType, severity });

    // Validate required fields
    if (!questionId || !reportType || !description || !severity) {
      return NextResponse.json(
        { error: 'Missing required fields: questionId, reportType, description, severity' },
        { status: 400 }
      );
    }

    // Validate questionId format (should be a valid string)
    if (typeof questionId !== 'string' || questionId.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid questionId format' },
        { status: 400 }
      );
    }

    // Validate severity levels
    const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: 'Invalid severity level. Must be CRITICAL, HIGH, MEDIUM, or LOW' },
        { status: 400 }
      );
    }

    // Validate that the question exists with retry logic
    const questionExists = await withRetry(async () => {
      return await prisma.question.findUnique({
        where: { id: questionId.trim() },
        select: { id: true }
      });
    });

    if (!questionExists) {
      console.log('Question not found:', questionId);
      return NextResponse.json(
        { error: 'Question not found. Cannot create error report for non-existent question.' },
        { status: 404 }
      );
    }

    // Create the error report with retry logic
    const errorReport = await withRetry(async () => {
      return await prisma.errorReport.create({
        data: {
          questionId: questionId.trim(),
          userId,
          reportType,
          description,
          severity,
          evidence,
          suggestedFix,
          confidence,
          status: 'PENDING', // Default status
          createdAt: new Date()
        }
      });
    });

    return NextResponse.json({
      success: true,
      reportId: errorReport.id,
      message: 'Error report submitted successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating error report:', error);
    return NextResponse.json(
      { error: 'Failed to submit error report' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let whereClause: any = {};

    if (questionId) {
      whereClause.questionId = questionId;
    }
    if (userId) {
      whereClause.userId = userId;
    }
    if (status) {
      whereClause.status = status;
    }

    const errorReports = await prisma.errorReport.findMany({
      where: whereClause,
      include: {
        question: {
          select: {
            questionText: true,
            topic: true,
            examName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to recent 50 reports
    });

    return NextResponse.json({
      success: true,
      reports: errorReports
    });

  } catch (error) {
    console.error('Error fetching error reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch error reports' },
      { status: 500 }
    );
  }
}