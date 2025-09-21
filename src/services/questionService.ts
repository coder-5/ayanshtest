import { prisma } from '@/lib/prisma';
import { Question } from '@/types';
import { getExamName, isValidExamType } from '@/constants/examTypes';
import { transformQuestion } from '@/utils/questionTransforms';

export interface QuestionQuery {
  examType?: string;
  year?: number;
  limit?: number;
  random?: boolean;
}

export interface QuestionUpdate {
  id: string;
  questionText?: string;
  difficulty?: string;
  topic?: string;
  subtopic?: string;
  hasImage?: boolean;
  imageUrl?: string;
}

export class QuestionService {
  /**
   * Get all available competition names from database
   */
  static async getAllCompetitions(): Promise<Array<{name: string, count: number}>> {
    try {
      const competitions = await prisma.question.groupBy({
        by: ['examName'],
        _count: {
          examName: true
        },
        orderBy: {
          _count: {
            examName: 'desc'
          }
        }
      });

      return competitions.map(comp => ({
        name: comp.examName,
        count: comp._count.examName
      }));
    } catch (error) {
      console.error('Error in QuestionService.getAllCompetitions:', error);
      throw error;
    }
  }

  /**
   * Get questions based on query parameters
   */
  static async getQuestions(query: QuestionQuery): Promise<Question[]> {
    try {
      let whereClause: any = {};

      // Handle exam type filtering
      if (query.examType) {
        whereClause.examName = getExamName(query.examType);
      }

      // Handle year filtering
      if (query.year) {
        whereClause.examYear = query.year;
      }

      const queryOptions: any = {
        where: whereClause,
        include: {
          options: true,
          solution: true
        }
      };

      if (!query.random) {
        queryOptions.orderBy = [
          { examYear: 'desc' },
          { questionNumber: 'asc' }
        ];
      }

      if (query.limit) {
        queryOptions.take = query.limit;
      }

      const questions = await prisma.question.findMany(queryOptions);

      // Shuffle if random is requested
      const finalQuestions = query.random ? this.shuffleArray(questions) : questions;

      // Transform data to ensure no nulls and consistent format
      return finalQuestions.map(transformQuestion);
    } catch (error) {
      console.error('Error in QuestionService.getQuestions:', error);
      throw error;
    }
  }

  /**
   * Get available years for a specific exam type
   */
  static async getAvailableYears(examType: string): Promise<number[]> {
    try {
      const examName = getExamName(examType);

      const years = await prisma.question.findMany({
        where: { examName },
        select: { examYear: true },
        distinct: ['examYear'],
        orderBy: { examYear: 'desc' }
      });

      return years.map(y => y.examYear);
    } catch (error) {
      console.error('Error in QuestionService.getAvailableYears:', error);
      throw error;
    }
  }

  /**
   * Get question counts by exam type
   */
  static async getQuestionCounts(): Promise<Record<string, number>> {
    try {
      const counts = await Promise.all([
        prisma.question.count({ where: { examName: 'AMC8' } }),
        prisma.question.count({ where: { examName: 'MOEMS' } }),
        prisma.question.count({ where: { examName: 'Kangaroo' } }),
        prisma.question.count({ where: { examName: 'MathCounts' } }),
        prisma.question.count({ where: { examName: 'CML' } }),
        prisma.question.count()
      ]);

      return {
        amc8: counts[0],
        moems: counts[1],
        kangaroo: counts[2],
        mathcounts: counts[3],
        cml: counts[4],
        total: counts[5]
      };
    } catch (error) {
      console.error('Error in QuestionService.getQuestionCounts:', error);
      throw error;
    }
  }

  /**
   * Delete a question by ID
   */
  static async deleteQuestion(id: string): Promise<void> {
    try {
      await prisma.question.delete({
        where: { id }
      });
    } catch (error) {
      console.error('Error in QuestionService.deleteQuestion:', error);
      throw error;
    }
  }

  /**
   * Update a question
   */
  static async updateQuestion(update: QuestionUpdate): Promise<Question> {
    try {
      const updatedQuestion = await prisma.question.update({
        where: { id: update.id },
        data: {
          ...(update.questionText && { questionText: update.questionText }),
          difficulty: update.difficulty || 'medium',
          topic: update.topic || 'Mixed',
          subtopic: update.subtopic || 'Problem Solving',
          hasImage: update.hasImage || false,
          imageUrl: update.hasImage ? (update.imageUrl || '') : null
        },
        include: {
          options: true,
          solution: true
        }
      });

      return transformQuestion(updatedQuestion);
    } catch (error) {
      console.error('Error in QuestionService.updateQuestion:', error);
      throw error;
    }
  }


  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Validate exam type (now accepts any string since we support dynamic competitions)
   */
  static isValidExamType(examType: string): boolean {
    return isValidExamType(examType);
  }

  /**
   * Get exam display name
   */
  static getExamDisplayName(examType: string): string | null {
    return getExamName(examType);
  }
}