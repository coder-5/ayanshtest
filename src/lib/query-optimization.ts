import { prisma } from './prisma';

// Optimized question queries with proper indexing and caching
export const optimizedQueries = {
  // Get questions with minimal data for list views
  getQuestionsList: (filters: {
    examName?: string;
    topic?: string;
    difficulty?: string;
    page?: number;
    limit?: number;
  }) => {
    const { page = 1, limit = 20, ...where } = filters;
    const skip = (page - 1) * limit;

    return prisma.question.findMany({
      where: Object.fromEntries(
        Object.entries(where).filter(([, value]) => value && value !== 'all')
      ),
      select: {
        id: true,
        questionText: true,
        examName: true,
        examYear: true,
        topic: true,
        difficulty: true,
        questionNumber: true,
        hasImage: true,
        imageUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  },

  // Get full question details for practice sessions
  getQuestionDetails: (id: string) => {
    return prisma.question.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { optionLetter: 'asc' }
        },
        solution: true,
      },
    });
  },

  // Get questions count for pagination
  getQuestionsCount: (filters: {
    examName?: string;
    topic?: string;
    difficulty?: string;
  }) => {
    return prisma.question.count({
      where: Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value && value !== 'all')
      ),
    });
  },

  // Get topic statistics efficiently
  getTopicStats: () => {
    return prisma.question.groupBy({
      by: ['topic'],
      _count: {
        topic: true,
      },
      orderBy: {
        _count: {
          topic: 'desc',
        },
      },
    });
  },

  // Get practice session questions with optimized loading
  getPracticeQuestions: (filters: {
    examName?: string;
    topic?: string;
    difficulty?: string;
    limit?: number;
  }) => {
    const { limit = 10, ...where } = filters;

    return prisma.question.findMany({
      where: Object.fromEntries(
        Object.entries(where).filter(([, value]) => value && value !== 'all')
      ),
      include: {
        options: {
          select: {
            id: true,
            optionLetter: true,
            optionText: true,
            isCorrect: true,
          },
          orderBy: { optionLetter: 'asc' }
        },
        solution: {
          select: {
            id: true,
            solutionText: true,
            approach: true,
            keyInsights: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};

// Cache configuration for frequently accessed data
export const cacheConfig = {
  topicStats: { ttl: 300 }, // 5 minutes
  examTypes: { ttl: 600 }, // 10 minutes
  questionCounts: { ttl: 180 }, // 3 minutes
};