import { prisma } from '@/lib/prisma';

export interface QuestionSelectionOptions {
  userId?: string;
  examType?: string;
  topic?: string;
  difficulty?: string;
  limit?: number;
  sessionType?: 'practice' | 'retry' | 'weak-areas' | 'exam-simulation';
  excludeQuestionIds?: string[];
}

export interface QuestionRound {
  roundNumber: number;
  totalQuestionsInRound: number;
  attemptedInRound: number;
  completedRounds: number;
}

export class QuestionSelectionService {
  /**
   * Get questions ensuring all are attempted once before any repeats
   * Uses a round-based system where Round 1 = first attempt at all questions
   */
  static async getQuestionsWithRoundControl(options: QuestionSelectionOptions) {
    const {
      userId = 'ayansh',
      examType,
      topic,
      difficulty,
      limit = 10,
      excludeQuestionIds = []
    } = options;

    try {
      // Step 1: Get all available questions matching criteria
      const whereClause: any = {};

      if (examType && examType !== 'all' && examType !== 'mixed') {
        whereClause.examName = examType;
      }

      if (topic && topic !== 'all') {
        whereClause.topic = topic;
      }

      if (difficulty && difficulty !== 'all') {
        whereClause.difficulty = difficulty;
      }

      // Exclude specific questions if provided
      if (excludeQuestionIds.length > 0) {
        whereClause.id = { notIn: excludeQuestionIds };
      }

      const allAvailableQuestions = await prisma.question.findMany({
        where: whereClause,
        select: { id: true },
        orderBy: { createdAt: 'asc' }
      });

      if (allAvailableQuestions.length === 0) {
        return {
          questions: [],
          roundInfo: {
            roundNumber: 1,
            totalQuestionsInRound: 0,
            attemptedInRound: 0,
            completedRounds: 0
          },
          message: 'No questions available for the selected criteria'
        };
      }

      // Step 2: Get user's attempt history for these questions
      const questionIds = allAvailableQuestions.map(q => q.id);

      const userAttempts = await prisma.userAttempt.findMany({
        where: {
          userId,
          questionId: { in: questionIds }
        },
        select: {
          questionId: true,
          attemptedAt: true,
          isCorrect: true
        },
        orderBy: { attemptedAt: 'asc' }
      });

      // Step 3: Calculate round information
      const roundInfo = this.calculateRoundInfo(allAvailableQuestions, userAttempts);

      // Step 4: Select questions based on round priority
      const selectedQuestions = await this.selectQuestionsFromRound(
        questionIds,
        userAttempts,
        roundInfo,
        limit
      );

      // Step 5: Get full question details
      const questionsWithDetails = await prisma.question.findMany({
        where: {
          id: { in: selectedQuestions }
        },
        include: {
          options: true,
          solution: true
        },
        orderBy: [
          { difficulty: 'asc' }, // Start with easier questions
          { createdAt: 'asc' }    // Then by creation order
        ]
      });

      return {
        questions: questionsWithDetails.map(q => ({
          ...q,
          type: q.options && q.options.length > 0 ? 'multiple-choice' : 'open-ended',
          options: q.options?.map(opt => ({
            ...opt,
            label: opt.optionLetter,  // Map to consistent field name
            text: opt.optionText      // Map to consistent field name
          }))
        })),
        roundInfo,
        message: this.getRoundMessage(roundInfo)
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate what round the user is currently in
   */
  private static calculateRoundInfo(
    allQuestions: { id: string }[],
    userAttempts: { questionId: string; attemptedAt: Date; isCorrect: boolean }[]
  ): QuestionRound {
    const totalQuestions = allQuestions.length;

    // Count unique questions attempted
    const attemptedQuestionIds = new Set(userAttempts.map(a => a.questionId));
    const uniqueQuestionsAttempted = attemptedQuestionIds.size;

    // Calculate completed rounds (how many times user has gone through ALL questions)
    const completedRounds = Math.floor(uniqueQuestionsAttempted / totalQuestions);

    // Current round number
    const currentRound = completedRounds + 1;

    // Questions attempted in current round
    const questionsInCurrentRound = uniqueQuestionsAttempted % totalQuestions;

    return {
      roundNumber: currentRound,
      totalQuestionsInRound: totalQuestions,
      attemptedInRound: questionsInCurrentRound,
      completedRounds
    };
  }

  /**
   * Select questions prioritizing unattempted ones first
   */
  private static async selectQuestionsFromRound(
    questionIds: string[],
    userAttempts: { questionId: string; attemptedAt: Date; isCorrect: boolean }[],
    _roundInfo: QuestionRound,
    limit: number
  ): Promise<string[]> {

    // Get questions attempted by user
    const attemptedQuestionIds = new Set(userAttempts.map(a => a.questionId));

    // Separate attempted vs unattempted questions
    const unattemptedQuestions = questionIds.filter(id => !attemptedQuestionIds.has(id));
    const attemptedQuestions = questionIds.filter(id => attemptedQuestionIds.has(id));

    // PRIORITY 1: If there are unattempted questions, use those first
    if (unattemptedQuestions.length > 0) {
      return unattemptedQuestions.slice(0, limit);
    }

    // PRIORITY 2: All questions attempted at least once, now use smart selection
    // Focus on incorrect answers and oldest attempts first
    const questionAttemptsMap = new Map();

    userAttempts.forEach(attempt => {
      if (!questionAttemptsMap.has(attempt.questionId)) {
        questionAttemptsMap.set(attempt.questionId, []);
      }
      questionAttemptsMap.get(attempt.questionId).push(attempt);
    });

    // Score questions based on:
    // 1. Last attempt was incorrect (higher priority)
    // 2. Fewer total attempts (higher priority)
    // 3. Older last attempt (higher priority)
    const questionScores = attemptedQuestions.map(questionId => {
      const attempts = questionAttemptsMap.get(questionId) || [];
      const lastAttempt = attempts[attempts.length - 1];
      const totalAttempts = attempts.length;
      const lastAttemptScore = lastAttempt?.isCorrect ? 0 : 100; // High priority for incorrect
      const attemptsScore = Math.max(0, 50 - totalAttempts * 10); // Fewer attempts = higher score
      const timeScore = lastAttempt ?
        Math.max(0, 50 - (Date.now() - lastAttempt.attemptedAt.getTime()) / (1000 * 60 * 60 * 24)) : 50;

      return {
        questionId,
        score: lastAttemptScore + attemptsScore + timeScore,
        lastAttempt: lastAttempt?.attemptedAt || new Date(0)
      };
    });

    // Sort by score (highest first) and return top questions
    return questionScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.questionId);
  }

  /**
   * Get descriptive message about current round status
   */
  private static getRoundMessage(roundInfo: QuestionRound): string {
    const { roundNumber, totalQuestionsInRound, attemptedInRound, completedRounds } = roundInfo;

    if (completedRounds === 0 && attemptedInRound === 0) {
      return `Starting Round ${roundNumber}! You'll see ${totalQuestionsInRound} questions for the first time.`;
    }

    if (attemptedInRound < totalQuestionsInRound) {
      const remaining = totalQuestionsInRound - attemptedInRound;
      return `Round ${roundNumber}: ${remaining} new questions remaining before moving to Round ${roundNumber + 1}.`;
    }

    return `Starting Round ${roundNumber}! You've completed ${completedRounds} full rounds. Now focusing on questions that need more practice.`;
  }

  /**
   * Get user's progress summary across all questions
   */
  static async getUserProgressSummary(userId: string = 'ayansh', examType?: string) {
    try {
      const whereClause: any = {};
      if (examType && examType !== 'all' && examType !== 'mixed') {
        whereClause.examName = examType;
      }

      const [totalQuestions, userAttempts] = await Promise.all([
        prisma.question.count({ where: whereClause }),
        prisma.userAttempt.findMany({
          where: {
            userId,
            ...(whereClause.examName && { question: { examName: whereClause.examName } })
          },
          include: { question: true }
        })
      ]);

      const uniqueQuestionsAttempted = new Set(userAttempts.map(a => a.questionId)).size;
      const completedRounds = Math.floor(uniqueQuestionsAttempted / totalQuestions);
      const currentRoundProgress = uniqueQuestionsAttempted % totalQuestions;

      return {
        totalQuestions,
        uniqueQuestionsAttempted,
        completedRounds,
        currentRoundProgress,
        progressPercentage: totalQuestions > 0 ? (uniqueQuestionsAttempted / totalQuestions) * 100 : 0
      };
    } catch (error) {
      throw error;
    }
  }
}