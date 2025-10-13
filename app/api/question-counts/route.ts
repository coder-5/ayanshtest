import { prisma } from '@/lib/prisma';
import { cache, CacheKeys, CacheTTL } from '@/lib/cache';
import { withErrorHandler, successResponse } from '@/lib/error-handler';

/**
 * GET /api/question-counts
 * Returns aggregate counts of questions by various dimensions
 * Useful for dashboards, analytics, and filtering UIs
 */
export const GET = withErrorHandler(async () => {
  // Cache counts since they change infrequently
  const counts = await cache.getOrFetch(
    'question_counts',
    async () => {
      // Total questions
      const total = await prisma.question.count({
        where: { deletedAt: null },
      });

      // Count by exam
      const byExam = await prisma.question.groupBy({
        by: ['examName'],
        where: {
          deletedAt: null,
          examName: { not: null },
        },
        _count: true,
      });

      // Count by difficulty
      const byDifficulty = await prisma.question.groupBy({
        by: ['difficulty'],
        where: { deletedAt: null },
        _count: true,
      });

      // Count by topic
      const byTopic = await prisma.question.groupBy({
        by: ['topic'],
        where: {
          deletedAt: null,
          topic: { not: null },
        },
        _count: true,
      });

      // Count by exam and year
      const byExamYear = await prisma.question.groupBy({
        by: ['examName', 'examYear'],
        where: {
          deletedAt: null,
          examName: { not: null },
          examYear: { not: null },
        },
        _count: true,
        orderBy: [{ examName: 'asc' }, { examYear: 'desc' }],
      });

      // Questions with diagrams
      const withDiagrams = await prisma.question.count({
        where: {
          deletedAt: null,
          hasImage: true,
        },
      });

      // Questions with video solutions
      const withVideos = await prisma.question.count({
        where: {
          deletedAt: null,
          solution: {
            videoUrl: { not: null },
          },
        },
      });

      // Questions reported as having issues
      const withIssues = await prisma.question.count({
        where: {
          deletedAt: null,
          errorReports: {
            some: {
              status: {
                in: ['PENDING', 'INVESTIGATING', 'CONFIRMED'],
              },
            },
          },
        },
      });

      return {
        total,
        byExam: byExam.map((item) => ({
          examName: item.examName,
          count: item._count,
        })),
        byDifficulty: byDifficulty.map((item) => ({
          difficulty: item.difficulty,
          count: item._count,
        })),
        byTopic: byTopic.map((item) => ({
          topic: item.topic,
          count: item._count,
        })),
        byExamYear: byExamYear.map((item) => ({
          examName: item.examName,
          examYear: item.examYear,
          count: item._count,
        })),
        withDiagrams,
        withVideos,
        withIssues,
      };
    },
    CacheTTL.questions // 5 minutes
  );

  return successResponse(counts);
});
