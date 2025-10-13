import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import type { QuestionCreate, QuestionUpdate } from '@/lib/validation';
import {
  sanitizeQuestionText,
  sanitizeOptionText,
  sanitizeSolutionText,
  sanitizeIdentifier,
} from '@/lib/sanitizer';

export interface QuestionFilters {
  topic?: string;
  examName?: string;
  examYear?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  search?: string;
  limit?: number;
  offset?: number;
}

export class QuestionService {
  /**
   * Get a question by ID with all relations
   */
  static async getById(id: string) {
    return prisma.question.findUnique({
      where: { id, deletedAt: null },
      include: {
        options: {
          orderBy: { optionLetter: 'asc' },
        },
        solution: true,
      },
    });
  }

  /**
   * Get paginated questions with filters
   */
  static async getAll(filters: QuestionFilters = {}) {
    const { topic, examName, examYear, difficulty, search, limit = 50, offset = 0 } = filters;

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (topic) where.topic = topic;
    if (examName) where.examName = examName;
    if (examYear) where.examYear = parseInt(examYear);
    if (difficulty) where.difficulty = difficulty;
    if (search) {
      where.questionText = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Filter to only return questions WITH answers
    // This prevents serving the 95 questions without answers
    where.OR = [
      // MOEMS: has correctAnswer field (not null AND not empty)
      {
        examName: 'MOEMS Division E',
        AND: [{ correctAnswer: { not: null } }, { correctAnswer: { not: '' } }],
      },
      // AMC8: has at least one correct option
      {
        examName: 'AMC8',
        options: {
          some: { isCorrect: true },
        },
      },
      // Other exams with correctAnswer (not null AND not empty)
      {
        examName: { notIn: ['AMC8', 'MOEMS Division E'] },
        AND: [{ correctAnswer: { not: null } }, { correctAnswer: { not: '' } }],
      },
    ];

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          options: {
            orderBy: { optionLetter: 'asc' },
          },
          solution: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.question.count({ where }),
    ]);

    return {
      questions,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Create a new question with options and solution
   */
  static async create(data: QuestionCreate) {
    const questionId = `q-${nanoid(21)}`;

    try {
      return await prisma.$transaction(async (tx) => {
        // Sanitize all text inputs
        const sanitizedQuestionText = sanitizeQuestionText(data.questionText);
        const sanitizedExamName = data.examName ? sanitizeIdentifier(data.examName) : null;
        const sanitizedTopic = data.topic ? sanitizeIdentifier(data.topic) : null;
        const sanitizedCorrectAnswer = data.correctAnswer
          ? sanitizeQuestionText(data.correctAnswer)
          : null;

        // Create question
        const question = await tx.question.create({
          data: {
            id: questionId,
            questionText: sanitizedQuestionText,
            examName: sanitizedExamName,
            examYear: data.examYear || null,
            questionNumber: data.questionNumber || null,
            correctAnswer: sanitizedCorrectAnswer,
            topic: sanitizedTopic,
            difficulty: data.difficulty || 'MEDIUM',
            hasImage: false,
            imageUrl: null,
            updatedAt: new Date(),
          },
        });

        // Create options (sanitize option text)
        await tx.option.createMany({
          data: data.options.map((opt) => ({
            id: nanoid(),
            questionId,
            optionLetter: opt.optionLetter,
            optionText: sanitizeOptionText(opt.optionText),
            isCorrect: opt.isCorrect,
          })),
        });

        // Create solution if provided (sanitize solution text)
        if (data.solution) {
          await tx.solution.create({
            data: {
              id: nanoid(),
              questionId,
              solutionText: sanitizeSolutionText(data.solution),
              updatedAt: new Date(),
            },
          });
        }

        return question;
      });
    } catch (error: unknown) {
      // Handle Prisma unique constraint violation
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new Error('A question with this exam name, year, and number already exists');
      }
      throw error;
    }
  }

  /**
   * Update a question and its relations
   * Uses upsert pattern for safer updates
   */
  static async update(id: string, data: QuestionUpdate) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Sanitize all text inputs
        const sanitizedQuestionText = data.questionText
          ? sanitizeQuestionText(data.questionText)
          : undefined;
        const sanitizedExamName = data.examName ? sanitizeIdentifier(data.examName) : null;
        const sanitizedTopic = data.topic ? sanitizeIdentifier(data.topic) : undefined;
        const sanitizedCorrectAnswer = data.correctAnswer
          ? sanitizeQuestionText(data.correctAnswer)
          : undefined;

        // Update question
        const question = await tx.question.update({
          where: { id },
          data: {
            questionText: sanitizedQuestionText,
            examName: sanitizedExamName,
            examYear: data.examYear || null,
            questionNumber: data.questionNumber,
            correctAnswer: sanitizedCorrectAnswer,
            topic: sanitizedTopic,
            difficulty: data.difficulty || 'MEDIUM',
            hasImage: data.hasImage,
            imageUrl: data.imageUrl,
            updatedAt: new Date(),
          },
        });

        // Update options if provided - safer approach using delete within transaction
        if (data.options) {
          // Delete existing options (will rollback if create fails)
          await tx.option.deleteMany({ where: { questionId: id } });

          // Create new options (sanitize option text)
          await tx.option.createMany({
            data: data.options.map((opt) => ({
              id: nanoid(),
              questionId: id,
              optionLetter: opt.optionLetter,
              optionText: sanitizeOptionText(opt.optionText),
              isCorrect: opt.isCorrect,
            })),
          });
        }

        // Update or create solution if provided (sanitize solution text)
        if (data.solution) {
          await tx.solution.upsert({
            where: { questionId: id },
            update: {
              solutionText: sanitizeSolutionText(data.solution),
              updatedAt: new Date(),
            },
            create: {
              id: nanoid(),
              questionId: id,
              solutionText: sanitizeSolutionText(data.solution),
              updatedAt: new Date(),
            },
          });
        }

        return question;
      });
    } catch (error: unknown) {
      // Handle Prisma unique constraint violation
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new Error('A question with this exam name, year, and number already exists');
      }
      throw error;
    }
  }

  /**
   * Soft delete a question
   * Check for existing attempts first to provide friendly error
   */
  static async delete(id: string) {
    // Check if question has attempts
    const attemptCount = await prisma.userAttempt.count({
      where: { questionId: id, deletedAt: null },
    });

    if (attemptCount > 0) {
      throw new Error(
        `Cannot delete question: ${attemptCount} user attempt(s) exist. ` +
          `Questions with attempts can only be soft-deleted to preserve history.`
      );
    }

    return prisma.question.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Get questions count by filters
   */
  static async getCount(filters: Omit<QuestionFilters, 'limit' | 'offset'> = {}) {
    const where: Record<string, unknown> = { deletedAt: null };

    if (filters.topic) where.topic = filters.topic;
    if (filters.examName) where.examName = filters.examName;
    if (filters.examYear) where.examYear = parseInt(filters.examYear);
    if (filters.difficulty) where.difficulty = filters.difficulty;

    // Apply same answer filter as getAll()
    where.OR = [
      // MOEMS: has correctAnswer field (not null AND not empty)
      {
        examName: 'MOEMS Division E',
        AND: [{ correctAnswer: { not: null } }, { correctAnswer: { not: '' } }],
      },
      // AMC8: has at least one correct option
      {
        examName: 'AMC8',
        options: {
          some: { isCorrect: true },
        },
      },
      // Other exams with correctAnswer (not null AND not empty)
      {
        examName: { notIn: ['AMC8', 'MOEMS Division E'] },
        AND: [{ correctAnswer: { not: null } }, { correctAnswer: { not: '' } }],
      },
    ];

    return prisma.question.count({ where });
  }

  /**
   * Get unique values for filters
   */
  static async getFilterOptions() {
    const [topics, exams, difficulties] = await Promise.all([
      prisma.question.findMany({
        where: { deletedAt: null, topic: { not: null } },
        select: { topic: true },
        distinct: ['topic'],
      }),
      prisma.question.findMany({
        where: { deletedAt: null, examName: { not: null } },
        select: { examName: true, examYear: true },
        distinct: ['examName', 'examYear'],
      }),
      prisma.question.findMany({
        where: { deletedAt: null },
        select: { difficulty: true },
        distinct: ['difficulty'],
      }),
    ]);

    return {
      topics: topics.map((t) => t.topic).filter(Boolean),
      exams: exams.map((e) => ({ name: e.examName, year: e.examYear })),
      difficulties: difficulties.map((d) => d.difficulty),
    };
  }
}
