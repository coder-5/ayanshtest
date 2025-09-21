import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { qualityValidationService } from '@/services/qualityValidationService';

// const QualityRequestSchema = z.object({
//   action: z.enum(['validate', 'metrics', 'dashboard', 'report']),
//   questionId: z.string().optional(),
//   questionIds: z.array(z.string()).optional(),
//   startDate: z.string().optional(),
//   endDate: z.string().optional(),
//   examType: z.string().optional(),
//   topic: z.string().optional()
// });

// GET /api/quality - Get quality metrics and reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'dashboard';
    const questionId = searchParams.get('questionId');
    const examType = searchParams.get('examType');
    const topic = searchParams.get('topic');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    switch (action) {
      case 'dashboard':
        return await handleDashboardRequest();

      case 'metrics':
        if (questionId) {
          return await handleMetricsRequest(questionId);
        } else {
          return await handleBulkMetricsRequest({ examType, topic, startDate, endDate });
        }

      case 'report':
        return await handleQualityReport({ examType, topic, startDate, endDate });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error handling quality request:', error);
    return NextResponse.json(
      { error: 'Failed to process quality request' },
      { status: 500 }
    );
  }
}

// POST /api/quality - Validate question or submit quality review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, questionId, questionIds } = body;

    switch (action) {
      case 'validate':
        if (questionId) {
          return await handleValidateQuestion(questionId);
        } else if (questionIds) {
          return await handleBulkValidateQuestions(questionIds);
        } else {
          return NextResponse.json(
            { error: 'questionId or questionIds required for validation' },
            { status: 400 }
          );
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error processing quality validation:', error);
    return NextResponse.json(
      { error: 'Failed to process quality validation' },
      { status: 500 }
    );
  }
}

// Dashboard data handler
async function handleDashboardRequest() {
  const [
    totalQuestions,
    questionsWithSolutions,
    errorReports,
    recentValidations,
    qualityDistribution,
    topicQuality
  ] = await Promise.all([
    // Total questions count
    prisma.question.count(),

    // Questions with solutions
    prisma.question.count({
      where: { solution: { isNot: null } }
    }),

    // Error reports summary
    prisma.errorReport.groupBy({
      by: ['status'],
      _count: true
    }),

    // Recent validation activity (mock data for now)
    prisma.question.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        questionText: true,
        examName: true,
        topic: true,
        difficulty: true,
        updatedAt: true
      }
    }),

    // Quality score distribution by difficulty
    prisma.question.groupBy({
      by: ['difficulty'],
      _count: true
    }),

    // Quality by topic
    prisma.question.groupBy({
      by: ['topic'],
      _count: true,
      orderBy: { _count: { topic: 'desc' } },
      take: 10
    })
  ]);

  // Calculate quality metrics
  const solutionCoverage = totalQuestions > 0
    ? questionsWithSolutions / totalQuestions
    : 0;

  const errorReportsSummary = errorReports.reduce((acc, report) => {
    acc[report.status] = report._count;
    return acc;
  }, {} as Record<string, number>);

  return NextResponse.json({
    summary: {
      totalQuestions,
      questionsWithSolutions,
      solutionCoverage,
      pendingReviews: errorReportsSummary.PENDING || 0,
      criticalIssues: errorReportsSummary.CRITICAL || 0
    },
    qualityDistribution,
    topicQuality,
    recentActivity: recentValidations,
    errorReports: errorReportsSummary
  });
}

// Individual question metrics handler
async function handleMetricsRequest(questionId: string) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      options: true,
      solution: true,
      attempts: true,
      errorReports: true
    }
  });

  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  // Calculate quality metrics
  const qualityMetrics = await qualityValidationService.calculateQualityMetrics(questionId);

  // Calculate additional metrics
  const totalAttempts = question.attempts.length;
  const correctAttempts = question.attempts.filter(a => a.isCorrect).length;
  const accuracyRate = totalAttempts > 0 ? correctAttempts / totalAttempts : 0;

  const averageTime = totalAttempts > 0
    ? question.attempts.reduce((sum, a) => sum + a.timeSpent, 0) / totalAttempts
    : 0;

  const errorReportCount = question.errorReports.length;
  const criticalErrors = question.errorReports.filter(r => r.severity === 'CRITICAL').length;

  return NextResponse.json({
    questionId,
    qualityMetrics,
    usage: {
      totalAttempts,
      correctAttempts,
      accuracyRate,
      averageTime: Math.round(averageTime)
    },
    issues: {
      errorReportCount,
      criticalErrors,
      recentReports: question.errorReports
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5)
    }
  });
}

// Bulk metrics handler
async function handleBulkMetricsRequest(filters: any) {
  const where: any = {};

  if (filters.examType) where.examName = filters.examType;
  if (filters.topic) where.topic = { contains: filters.topic, mode: 'insensitive' };
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }

  const questions = await prisma.question.findMany({
    where,
    include: {
      solution: true,
      attempts: true,
      errorReports: true,
      _count: {
        select: {
          attempts: true,
          errorReports: true
        }
      }
    },
    take: 100 // Limit for performance
  });

  // Calculate aggregate metrics
  const metrics = {
    totalQuestions: questions.length,
    withSolutions: questions.filter(q => q.solution).length,
    averageAccuracy: 0,
    averageTime: 0,
    errorReportRate: 0,
    qualityScores: {
      high: 0,
      medium: 0,
      low: 0
    }
  };

  if (questions.length > 0) {
    // Calculate averages
    let totalAccuracy = 0;
    let totalTime = 0;
    let questionsWithAttempts = 0;

    for (const question of questions) {
      if (question.attempts.length > 0) {
        const correct = question.attempts.filter(a => a.isCorrect).length;
        const accuracy = correct / question.attempts.length;
        const avgTime = question.attempts.reduce((sum, a) => sum + a.timeSpent, 0) / question.attempts.length;

        totalAccuracy += accuracy;
        totalTime += avgTime;
        questionsWithAttempts++;
      }
    }

    metrics.averageAccuracy = questionsWithAttempts > 0 ? totalAccuracy / questionsWithAttempts : 0;
    metrics.averageTime = questionsWithAttempts > 0 ? totalTime / questionsWithAttempts : 0;
    metrics.errorReportRate = questions.reduce((sum, q) => sum + q.errorReports.length, 0) / questions.length;
  }

  return NextResponse.json(metrics);
}

// Quality report handler
async function handleQualityReport(filters: any) {
  const where: any = {};

  if (filters.examType) where.examName = filters.examType;
  if (filters.topic) where.topic = { contains: filters.topic, mode: 'insensitive' };

  const [
    questionStats,
    errorReportStats,
    topProblems,
    qualityTrends
  ] = await Promise.all([
    // Question statistics
    prisma.question.groupBy({
      by: ['difficulty', 'examName'],
      where,
      _count: true,
      _avg: {
        // We'll need to add a qualityScore field to the schema for this
      }
    }),

    // Error report statistics
    prisma.errorReport.groupBy({
      by: ['reportType', 'severity'],
      where: filters.examType ? {
        question: { examName: filters.examType }
      } : {},
      _count: true
    }),

    // Top problem areas
    prisma.errorReport.groupBy({
      by: ['reportType'],
      where: filters.examType ? {
        question: { examName: filters.examType }
      } : {},
      _count: true,
      orderBy: { _count: { reportType: 'desc' } },
      take: 10
    }),

    // Quality trends (monthly)
    prisma.question.groupBy({
      by: ['examName'],
      where: {
        ...where,
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
        }
      },
      _count: true
    })
  ]);

  return NextResponse.json({
    questionStats,
    errorReportStats,
    topProblems,
    qualityTrends,
    generatedAt: new Date().toISOString()
  });
}

// Question validation handler
async function handleValidateQuestion(questionId: string) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      options: true,
      solution: true
    }
  });

  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  const validation = await qualityValidationService.validateQuestion(question);

  return NextResponse.json({
    questionId,
    validation,
    validatedAt: new Date().toISOString()
  });
}

// Bulk validation handler
async function handleBulkValidateQuestions(questionIds: string[]) {
  if (questionIds.length > 50) {
    return NextResponse.json(
      { error: 'Cannot validate more than 50 questions at once' },
      { status: 400 }
    );
  }

  const validations = await qualityValidationService.bulkValidateQuestions(questionIds);

  return NextResponse.json({
    validations: Object.fromEntries(validations),
    validatedAt: new Date().toISOString(),
    totalValidated: validations.size
  });
}