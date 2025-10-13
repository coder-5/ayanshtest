import { prisma } from '@/lib/prisma';
import { cache, CacheKeys, CacheTTL } from '@/lib/cache';
import { withErrorHandler, successResponse } from '@/lib/error-handler';

/**
 * GET /api/questions/exams
 * Returns unique exam names and years (for dropdown/filter population)
 * Much more efficient than fetching full questions
 */
export const GET = withErrorHandler(async () => {
  const exams = await cache.getOrFetch(
    CacheKeys.exams('all'),
    async () => {
      // Get unique exam names with year ranges
      const examData = await prisma.question.groupBy({
        by: ['examName', 'examYear'],
        where: {
          deletedAt: null,
          examName: { not: null },
          examYear: { not: null },
        },
        _count: {
          id: true,
        },
        orderBy: [{ examName: 'asc' }, { examYear: 'desc' }],
      });

      // Group by exam name with year ranges
      const examMap = new Map<
        string,
        {
          examName: string;
          years: Array<{ year: number; count: number }>;
          totalQuestions: number;
          minYear: number;
          maxYear: number;
        }
      >();

      examData.forEach((item) => {
        const examName = item.examName!;
        const year = item.examYear!;
        const count = item._count.id;

        if (!examMap.has(examName)) {
          examMap.set(examName, {
            examName,
            years: [],
            totalQuestions: 0,
            minYear: year,
            maxYear: year,
          });
        }

        const exam = examMap.get(examName)!;
        exam.years.push({ year, count });
        exam.totalQuestions += count;
        exam.minYear = Math.min(exam.minYear, year);
        exam.maxYear = Math.max(exam.maxYear, year);
      });

      return {
        exams: Array.from(examMap.values()),
        flatList: examData.map((item) => ({
          examName: item.examName,
          examYear: item.examYear,
          count: item._count.id,
        })),
      };
    },
    CacheTTL.exams // 10 minutes
  );

  return successResponse(exams);
});
