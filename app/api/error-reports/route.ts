import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/userContext';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import { errorReportSchema } from '@/lib/validations';
import { z } from 'zod';

export async function GET(request: Request) {
  // Rate limit: 100 requests per minute for read operations
  const rateLimitResponse = rateLimitMiddleware('error-reports-get', {
    maxRequests: 100,
    windowSeconds: 60,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const questionId = searchParams.get('questionId');

    // Pagination parameters
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '50')), 500);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'));

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }
    if (questionId) {
      where.questionId = questionId;
    }

    // Get total count for pagination metadata
    const totalCount = await prisma.errorReport.count({
      where: where as never,
    });

    const reports = await prisma.errorReport.findMany({
      where: where as never,
      skip: offset,
      take: limit,
      include: {
        question: {
          select: {
            id: true,
            questionText: true,
            correctAnswer: true,
            examName: true,
            examYear: true,
            topic: true,
            options: {
              select: {
                id: true,
                optionLetter: true,
                optionText: true,
                isCorrect: true,
              },
              orderBy: {
                optionLetter: 'asc',
              },
            },
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      reports,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch error reports' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Rate limit: 10 requests per minute for error reports (prevent spam)
  const rateLimitResponse = rateLimitMiddleware('error-reports-post', {
    maxRequests: 10,
    windowSeconds: 60,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const userId = getCurrentUserId();
    const body = await request.json();

    // Validate request body
    const validated = errorReportSchema.parse(body);

    // Check for duplicate reports in last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const existingReport = await prisma.errorReport.findFirst({
      where: {
        questionId: validated.questionId,
        userId,
        reportType: validated.reportType,
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    if (existingReport) {
      return NextResponse.json(
        {
          error: 'You have already reported a similar issue for this question in the last 24 hours',
        },
        { status: 409 } // Conflict status
      );
    }

    const report = await prisma.errorReport.create({
      data: {
        id: crypto.randomUUID(),
        questionId: validated.questionId,
        userId,
        reportType: validated.reportType,
        description: validated.description,
        severity: validated.severity,
        evidence: validated.evidence,
        confidence: validated.confidence,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to create error report' }, { status: 500 });
  }
}
