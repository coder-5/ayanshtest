import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ErrorReportSchema = z.object({
  questionId: z.string(),
  userId: z.string().optional(),
  reportType: z.enum([
    'WRONG_ANSWER',
    'INCORRECT_SOLUTION',
    'UNCLEAR_QUESTION',
    'MISSING_DIAGRAM',
    'BROKEN_IMAGE',
    'TYPO',
    'INAPPROPRIATE_DIFFICULTY',
    'DUPLICATE_QUESTION',
    'COPYRIGHT_ISSUE'
  ]),
  description: z.string().min(10),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  evidence: z.string().optional(),
  suggestedFix: z.string().optional(),
  confidence: z.number().min(1).max(10)
});

const ErrorUpdateSchema = z.object({
  status: z.enum(['PENDING', 'INVESTIGATING', 'CONFIRMED', 'FIXED', 'REJECTED']).optional(),
  reviewedBy: z.string().optional(),
  reviewNotes: z.string().optional(),
  resolution: z.string().optional()
});

// GET /api/errors - Get error reports with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const questionId = searchParams.get('questionId');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const reportType = searchParams.get('reportType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const action = searchParams.get('action');

    // Handle stats request
    if (action === 'stats') {
      const [
        totalReports,
        pendingReports,
        criticalReports,
        reportsByType,
        reportsBySeverity,
        recentReports
      ] = await Promise.all([
        prisma.errorReport.count(),
        prisma.errorReport.count({ where: { status: 'PENDING' } }),
        prisma.errorReport.count({ where: { severity: 'CRITICAL' } }),
        prisma.errorReport.groupBy({
          by: ['reportType'],
          _count: true,
          orderBy: { _count: { reportType: 'desc' } }
        }),
        prisma.errorReport.groupBy({
          by: ['severity'],
          _count: true,
          orderBy: { _count: { severity: 'desc' } }
        }),
        prisma.errorReport.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            question: {
              select: {
                questionText: true,
                examName: true,
                topic: true
              }
            }
          }
        })
      ]);

      return NextResponse.json({
        summary: {
          total: totalReports,
          pending: pendingReports,
          critical: criticalReports
        },
        breakdown: {
          byType: reportsByType,
          bySeverity: reportsBySeverity
        },
        recent: recentReports
      });
    }

    // Handle regular error reports query
    const where: any = {};

    if (questionId) where.questionId = questionId;
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (reportType) where.reportType = reportType;

    const [errorReports, total] = await Promise.all([
      prisma.errorReport.findMany({
        where,
        include: {
          question: {
            select: {
              id: true,
              questionText: true,
              examName: true,
              examYear: true,
              topic: true,
              difficulty: true
            }
          },
          user: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.errorReport.count({ where })
    ]);

    return NextResponse.json({
      errorReports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching error reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch error reports' },
      { status: 500 }
    );
  }
}

// POST /api/errors - Submit new error report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ErrorReportSchema.parse(body);

    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id: validatedData.questionId }
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Check if user exists (if userId provided)
    if (validatedData.userId) {
      const user = await prisma.user.findUnique({
        where: { id: validatedData.userId }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
    }

    const errorReport = await prisma.errorReport.create({
      data: {
        questionId: validatedData.questionId,
        reportType: validatedData.reportType,
        description: validatedData.description,
        severity: validatedData.severity,
        confidence: validatedData.confidence,
        userId: validatedData.userId || null,
        evidence: validatedData.evidence || null,
        suggestedFix: validatedData.suggestedFix || null
      },
      include: {
        question: {
          select: {
            questionText: true,
            examName: true,
            examYear: true,
            topic: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json(errorReport, { status: 201 });

  } catch (error) {
    console.error('Error creating error report:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create error report' },
      { status: 500 }
    );
  }
}

// PUT /api/errors - Update error report (for admin/review)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Error report ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = ErrorUpdateSchema.parse(body);

    // Add resolved timestamp if status is being set to FIXED or REJECTED
    const updateData: any = { ...validatedData };
    if (validatedData.status === 'FIXED' || validatedData.status === 'REJECTED') {
      updateData.resolvedAt = new Date();
    }

    const errorReport = await prisma.errorReport.update({
      where: { id },
      data: updateData,
      include: {
        question: {
          select: {
            questionText: true,
            examName: true,
            examYear: true,
            topic: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json(errorReport);

  } catch (error) {
    console.error('Error updating error report:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update error report' },
      { status: 500 }
    );
  }
}