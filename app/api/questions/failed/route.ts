import { prisma } from '@/lib/prisma';
import { USER_ID } from '@/lib/constants';
import { withErrorHandler, successResponse } from '@/lib/error-handler';

/**
 * GET /api/questions/failed
 * Returns questions where user has failed attempts
 * Optimized with database aggregations
 */
export const GET = withErrorHandler(async (request: Request) => {
  const userId = USER_ID;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  // Use raw SQL for efficient aggregation
  // This avoids N+1 queries and does all calculations in the database
  const failedQuestionsRaw = await prisma.$queryRaw<
    Array<{
      questionId: string;
      totalAttempts: bigint;
      wrongAttempts: bigint;
      correctAttempts: bigint;
      lastAttemptedAt: Date;
    }>
  >`
    SELECT
      "questionId",
      COUNT(*) as "totalAttempts",
      COUNT(*) FILTER (WHERE "isCorrect" = false) as "wrongAttempts",
      COUNT(*) FILTER (WHERE "isCorrect" = true) as "correctAttempts",
      MAX("attemptedAt") as "lastAttemptedAt"
    FROM user_attempts
    WHERE
      "userId" = ${userId}
      AND "deletedAt" IS NULL
      AND "questionId" IN (
        SELECT DISTINCT "questionId"
        FROM user_attempts
        WHERE "userId" = ${userId}
          AND "isCorrect" = false
          AND "deletedAt" IS NULL
      )
    GROUP BY "questionId"
    HAVING COUNT(*) FILTER (WHERE "isCorrect" = false) >= 1
    ORDER BY
      COUNT(*) FILTER (WHERE "isCorrect" = false) DESC,
      MAX("attemptedAt") DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  // Convert bigint to number for JSON serialization
  const questionStats = failedQuestionsRaw.map((row) => ({
    questionId: row.questionId,
    totalAttempts: Number(row.totalAttempts),
    wrongAttempts: Number(row.wrongAttempts),
    correctAttempts: Number(row.correctAttempts),
    lastAttemptedAt: row.lastAttemptedAt,
    neverCorrect: Number(row.correctAttempts) === 0,
    priority:
      Number(row.correctAttempts) === 0
        ? Number(row.wrongAttempts) * 2 // Double priority if never correct
        : Number(row.wrongAttempts),
  }));

  // Fetch full question details for the filtered set only
  const questionIds = questionStats.map((s) => s.questionId);

  const questions = await prisma.question.findMany({
    where: {
      id: { in: questionIds },
      deletedAt: null,
    },
    include: {
      options: {
        orderBy: { optionLetter: 'asc' },
      },
      solution: {
        select: {
          id: true,
          solutionText: true,
          approach: true,
          keyInsights: true,
          videoUrl: true,
        },
      },
    },
  });

  // Merge question data with stats
  const questionsWithStats = questions.map((q) => {
    const stats = questionStats.find((s) => s.questionId === q.id);
    return {
      ...q,
      stats,
    };
  });

  // Sort by priority (already sorted by database, but re-sort to match stats order)
  questionsWithStats.sort((a, b) => (b.stats?.priority || 0) - (a.stats?.priority || 0));

  // Get total count for pagination
  const totalCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(DISTINCT "questionId") as count
    FROM user_attempts
    WHERE "userId" = ${userId}
      AND "isCorrect" = false
      AND "deletedAt" IS NULL
  `;

  const total = totalCount?.[0]?.count ? Number(totalCount[0].count) : 0;

  return successResponse({
    questions: questionsWithStats,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
    summary: {
      totalFailed: total,
      neverCorrect: questionStats.filter((q) => q.neverCorrect).length,
      highPriority: questionStats.filter((q) => q.wrongAttempts >= 3).length,
    },
  });
});
