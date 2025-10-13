import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/userContext';
import { errorReportSchema } from '@/lib/validation';
import { withErrorHandler, successResponse } from '@/lib/error-handler';

/**
 * GET /api/error-reports
 * Get all error reports with optional filtering
 */
export const GET = withErrorHandler(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const severity = searchParams.get('severity');
  const questionId = searchParams.get('questionId');

  const where: {
    status?: string;
    severity?: string;
    questionId?: string;
  } = {};

  if (status) where.status = status;
  if (severity) where.severity = severity;
  if (questionId) where.questionId = questionId;

  const reports = await prisma.errorReport.findMany({
    where,
    include: {
      question: {
        select: {
          id: true,
          questionText: true,
          examName: true,
          examYear: true,
          questionNumber: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [
      { severity: 'desc' }, // CRITICAL first
      { createdAt: 'desc' }, // Newest first
    ],
  });

  // Group by status for summary
  const summary = {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'PENDING').length,
    investigating: reports.filter((r) => r.status === 'INVESTIGATING').length,
    confirmed: reports.filter((r) => r.status === 'CONFIRMED').length,
    fixed: reports.filter((r) => r.status === 'FIXED').length,
    dismissed: reports.filter((r) => r.status === 'DISMISSED').length,
  };

  return successResponse({ reports, summary });
});

/**
 * POST /api/error-reports
 * Create a new error report for a question
 */
export const POST = withErrorHandler(async (request: Request) => {
  const userId = getCurrentUserId();
  const body = await request.json();

  // Validate request body
  const validated = errorReportSchema.parse(body);

  // Verify question exists
  const question = await prisma.question.findUnique({
    where: { id: validated.questionId, deletedAt: null },
  });

  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  // Create error report
  const report = await prisma.errorReport.create({
    data: {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      questionId: validated.questionId,
      userId,
      reportType: validated.reportType,
      description: validated.description,
      severity: validated.severity || 'MEDIUM',
      evidence: validated.evidence || null,
      confidence: validated.confidence || 50,
      status: 'PENDING',
    },
    include: {
      question: {
        select: {
          questionText: true,
          examName: true,
          examYear: true,
        },
      },
    },
  });

  return successResponse({ success: true, report }, 201);
});
