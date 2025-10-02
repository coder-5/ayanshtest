import { prisma } from '@/lib/prisma';
import { UserAttempt, ProgressData, ProgressStats } from '@/types';
import { QuestionQualityService } from './questionQualityService';

export class ProgressService {
  /**
   * Save user progress for a question attempt
   */
  static async saveProgress(data: ProgressData): Promise<UserAttempt> {
    try {
      // For now, we'll use a default user ID since user auth isn't implemented
      const userId = data.userId || 'ayansh';

      // First check if the question exists to prevent foreign key constraint errors
      const questionExists = await prisma.question.findUnique({
        where: { id: data.questionId },
        select: { id: true }
      });

      if (!questionExists) {
        throw new Error(`Question with ID ${data.questionId} not found`);
      }

      const attempt = await prisma.userAttempt.create({
        data: {
          userId,
          questionId: data.questionId,
          selectedAnswer: data.userAnswer,
          isCorrect: data.isCorrect,
          timeSpent: data.timeSpent,
          hintsUsed: 0, // Default for now
          excludeFromScoring: data.excludeFromScoring || false,
          attemptedAt: new Date()
        }
      });

      return {
        id: attempt.id,
        userId: attempt.userId,
        questionId: attempt.questionId,
        selectedAnswer: attempt.selectedAnswer || '',
        isCorrect: attempt.isCorrect,
        excludeFromScoring: attempt.excludeFromScoring,
        timeSpent: attempt.timeSpent,
        hintsUsed: attempt.hintsUsed,
        attemptedAt: attempt.attemptedAt,
        sessionId: attempt.sessionId
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get comprehensive progress statistics for a user
   */
  static async getProgressStats(userId: string = 'ayansh'): Promise<ProgressStats> {
    try {
      // Get all attempts for the user
      const allAttempts = await prisma.userAttempt.findMany({
        where: { userId },
        include: {
          question: true
        },
        orderBy: { attemptedAt: 'desc' }
      });

      // Filter out attempts excluded from scoring for statistics
      const attempts = allAttempts.filter(a => !a.excludeFromScoring);

      // Get quality scores for all questions
      const questionIds = attempts.map(a => a.questionId);
      const qualityMap = await QuestionQualityService.getBulkQuestionQuality(questionIds);

      // Calculate quality-weighted statistics
      let totalWeightedScore = 0;
      let totalWeight = 0;
      let reliableAttempts = 0;
      let reliableCorrect = 0;

      attempts.forEach(attempt => {
        const quality = qualityMap.get(attempt.questionId);
        if (quality && quality.isReliable) {
          const scoring = QuestionQualityService.calculateWeightedScore(attempt.isCorrect, quality);
          totalWeightedScore += scoring.weightedScore;
          totalWeight += scoring.weight;
          reliableAttempts++;
          if (attempt.isCorrect) reliableCorrect++;
        }
      });

      const totalAttempts = reliableAttempts;
      const correctAnswers = reliableCorrect;
      const accuracy = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;
      const averageTime = totalAttempts > 0
        ? attempts.filter(a => qualityMap.get(a.questionId)?.isReliable)
            .reduce((sum, a) => sum + a.timeSpent, 0) / totalAttempts
        : 0;

      // Topic breakdown (only include reliable questions)
      const topicBreakdown: Record<string, { attempted: number; correct: number; accuracy: number }> = {};
      attempts.forEach(attempt => {
        const quality = qualityMap.get(attempt.questionId);
        if (quality && quality.isReliable) {
          const topic = attempt.question?.topic || 'Unknown';
          if (!topicBreakdown[topic]) {
            topicBreakdown[topic] = { attempted: 0, correct: 0, accuracy: 0 };
          }
          topicBreakdown[topic].attempted++;
          if (attempt.isCorrect) {
            topicBreakdown[topic].correct++;
          }
          topicBreakdown[topic].accuracy = (topicBreakdown[topic].correct / topicBreakdown[topic].attempted) * 100;
        }
      });

      // Difficulty breakdown (only include reliable questions)
      const difficultyBreakdown: Record<string, { attempted: number; correct: number; accuracy: number }> = {};
      attempts.forEach(attempt => {
        const quality = qualityMap.get(attempt.questionId);
        if (quality && quality.isReliable) {
          const difficulty = attempt.question?.difficulty || 'Unknown';
          if (!difficultyBreakdown[difficulty]) {
            difficultyBreakdown[difficulty] = { attempted: 0, correct: 0, accuracy: 0 };
          }
          difficultyBreakdown[difficulty].attempted++;
          if (attempt.isCorrect) {
            difficultyBreakdown[difficulty].correct++;
          }
          difficultyBreakdown[difficulty].accuracy = (difficultyBreakdown[difficulty].correct / difficultyBreakdown[difficulty].attempted) * 100;
        }
      });

      // Recent sessions (group by day)
      const recentSessions = this.groupAttemptsByDay(attempts);

      // Calculate streak data
      const streakData = this.calculateStreaks(attempts);

      const result = {
        totalAttempts,
        correctAnswers,
        accuracy,
        averageTime,
        streakData,
        topicBreakdown,
        difficultyBreakdown,
        recentSessions
      };


      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get weak areas (topics with low accuracy)
   */
  static async getWeakAreas(userId: string = 'ayansh', minAttempts: number = 3): Promise<Array<{
    topic: string;
    accuracy: number;
    attempted: number;
    correct: number;
  }>> {
    try {
      const stats = await this.getProgressStats(userId);

      return Object.entries(stats.topicBreakdown)
        .filter(([_, data]) => data.attempted >= minAttempts && data.accuracy < 70)
        .map(([topic, data]) => ({
          topic,
          accuracy: data.accuracy,
          attempted: data.attempted,
          correct: data.correct
        }))
        .sort((a, b) => a.accuracy - b.accuracy);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get questions for weak areas practice
   */
  static async getWeakAreaQuestions(
    userId: string = 'ayansh',
    limit: number = 10
  ): Promise<string[]> {
    try {
      const weakAreas = await this.getWeakAreas(userId);

      if (weakAreas.length === 0) {
        return [];
      }

      // Get questions from the weakest topics
      const weakTopics = weakAreas.slice(0, 3).map(area => area.topic);

      const questions = await prisma.question.findMany({
        where: {
          topic: { in: weakTopics }
        },
        select: { id: true },
        take: limit,
        orderBy: { difficulty: 'asc' } // Start with easier questions
      });

      return questions.map(q => q.id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get performance analytics for dashboard
   */
  static async getAnalytics(userId: string = 'ayansh'): Promise<{
    dailyProgress: Array<{ date: string; questionsAnswered: number; accuracy: number }>;
    topicPerformance: Array<{ topic: string; accuracy: number; count: number }>;
    streakData: { currentStreak: number; longestStreak: number };
  }> {
    try {
      const attempts = await prisma.userAttempt.findMany({
        where: { userId },
        include: { question: true },
        orderBy: { attemptedAt: 'asc' }
      });

      // Daily progress (last 30 days)
      const dailyProgress = this.getDailyProgress(attempts, 30);

      // Topic performance
      const topicPerformance = this.getTopicPerformance(attempts);

      // Streak calculation
      const streakData = this.calculateStreaks(attempts);

      return {
        dailyProgress,
        topicPerformance,
        streakData
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Group attempts by day for session analysis
   */
  private static groupAttemptsByDay(attempts: any[]): Array<{
    date: Date;
    questionsAnswered: number;
    correctAnswers: number;
    averageTime: number;
  }> {
    const groupedByDay: Record<string, any[]> = {};

    attempts.forEach(attempt => {
      const dateKey = attempt.attemptedAt.toISOString().split('T')[0];
      if (!groupedByDay[dateKey]) {
        groupedByDay[dateKey] = [];
      }
      groupedByDay[dateKey].push(attempt);
    });

    return Object.entries(groupedByDay).map(([dateStr, dayAttempts]) => {
      const correctAnswers = dayAttempts.filter(a => a.isCorrect).length;
      const averageTime = dayAttempts.reduce((sum, a) => sum + a.timeSpent, 0) / dayAttempts.length;

      return {
        date: new Date(dateStr),
        questionsAnswered: dayAttempts.length,
        correctAnswers,
        averageTime
      };
    }).slice(0, 10); // Last 10 sessions
  }

  /**
   * Get daily progress for analytics
   */
  private static getDailyProgress(attempts: any[], days: number): Array<{
    date: string;
    questionsAnswered: number;
    accuracy: number;
  }> {
    const today = new Date();
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayAttempts = attempts.filter(attempt =>
        attempt.attemptedAt.toISOString().split('T')[0] === dateStr
      );

      const questionsAnswered = dayAttempts.length;
      const correctAnswers = dayAttempts.filter(a => a.isCorrect).length;
      const accuracy = questionsAnswered > 0 ? (correctAnswers / questionsAnswered) * 100 : 0;

      result.push({
        date: dateStr,
        questionsAnswered,
        accuracy
      });
    }

    return result;
  }

  /**
   * Get topic performance data
   */
  private static getTopicPerformance(attempts: any[]): Array<{
    topic: string;
    accuracy: number;
    count: number;
  }> {
    const topicStats: Record<string, { correct: number; total: number }> = {};

    attempts.forEach(attempt => {
      const topic = attempt.question?.topic || 'Unknown';
      if (!topicStats[topic]) {
        topicStats[topic] = { correct: 0, total: 0 };
      }
      topicStats[topic].total++;
      if (attempt.isCorrect) {
        topicStats[topic].correct++;
      }
    });

    return Object.entries(topicStats).map(([topic, stats]) => ({
      topic,
      accuracy: (stats.correct / stats.total) * 100,
      count: stats.total
    }));
  }

  /**
   * Calculate daily practice streaks (consecutive days with practice)
   */
  private static calculateStreaks(attempts: any[]): {
    currentStreak: number;
    longestStreak: number;
  } {
    if (attempts.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Group attempts by date (day only, not time)
    const dailyPractice = new Map();

    attempts.forEach(attempt => {
      const dateKey = attempt.attemptedAt.toISOString().split('T')[0];
      if (!dailyPractice.has(dateKey)) {
        dailyPractice.set(dateKey, {
          date: dateKey,
          totalAttempts: 0,
          correctAttempts: 0,
          practiced: true
        });
      }
      const dayData = dailyPractice.get(dateKey);
      dayData.totalAttempts++;
      if (attempt.isCorrect) {
        dayData.correctAttempts++;
      }
    });

    // Convert to sorted array of practice days
    const practiceDays = Array.from(dailyPractice.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (practiceDays.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Calculate current streak from today backwards
    const today = new Date().toISOString().split('T')[0];
    const todayIndex = practiceDays.findIndex(day => day.date === today);

    if (todayIndex !== -1) {
      // Count backwards from today
      currentStreak = 1;
      for (let i = todayIndex - 1; i >= 0; i--) {
        const currentDate = new Date(practiceDays[i + 1].date);
        const prevDate = new Date(practiceDays[i].date);
        const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak overall
    tempStreak = 1;
    for (let i = 1; i < practiceDays.length; i++) {
      const currentDate = new Date(practiceDays[i].date);
      const prevDate = new Date(practiceDays[i - 1].date);
      const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  }
}