import { prisma } from '@/lib/prisma';

export interface AchievementTrigger {
  type: 'streak' | 'accuracy' | 'volume' | 'speed' | 'milestone';
  threshold: number;
  title: string;
  description: string;
  badgeIcon: string;
}

const ACHIEVEMENT_DEFINITIONS: AchievementTrigger[] = [
  // Streak achievements
  {
    type: 'streak',
    threshold: 3,
    title: 'Getting Started',
    description: 'Practice for 3 days in a row',
    badgeIcon: '🔥'
  },
  {
    type: 'streak',
    threshold: 7,
    title: 'Week Warrior',
    description: 'Practice for 7 days in a row',
    badgeIcon: '⚡'
  },
  {
    type: 'streak',
    threshold: 30,
    title: 'Monthly Master',
    description: 'Practice for 30 days in a row',
    badgeIcon: '👑'
  },

  // Volume achievements
  {
    type: 'volume',
    threshold: 50,
    title: 'Half Century',
    description: 'Solve 50 questions correctly',
    badgeIcon: '🎯'
  },
  {
    type: 'volume',
    threshold: 100,
    title: 'Century Club',
    description: 'Solve 100 questions correctly',
    badgeIcon: '💯'
  },
  {
    type: 'volume',
    threshold: 500,
    title: 'Math Machine',
    description: 'Solve 500 questions correctly',
    badgeIcon: '🤖'
  },

  // Accuracy achievements
  {
    type: 'accuracy',
    threshold: 80,
    title: 'Sharp Shooter',
    description: 'Maintain 80% accuracy over 20 questions',
    badgeIcon: '🎯'
  },
  {
    type: 'accuracy',
    threshold: 90,
    title: 'Precision Expert',
    description: 'Maintain 90% accuracy over 20 questions',
    badgeIcon: '🏹'
  },
  {
    type: 'accuracy',
    threshold: 95,
    title: 'Perfectionist',
    description: 'Maintain 95% accuracy over 20 questions',
    badgeIcon: '⭐'
  },

  // Speed achievements
  {
    type: 'speed',
    threshold: 30,
    title: 'Speed Demon',
    description: 'Average under 30 seconds per question (10 questions)',
    badgeIcon: '💨'
  },
  {
    type: 'speed',
    threshold: 15,
    title: 'Lightning Fast',
    description: 'Average under 15 seconds per question (10 questions)',
    badgeIcon: '⚡'
  },

  // Milestone achievements
  {
    type: 'milestone',
    threshold: 1,
    title: 'First Steps',
    description: 'Complete your first practice session',
    badgeIcon: '👶'
  }
];

export class AchievementService {
  /**
   * Check and award achievements based on user activity
   */
  static async checkAndAwardAchievements(userId: string = 'default-user') {
    const newAchievements: string[] = [];

    for (const achievement of ACHIEVEMENT_DEFINITIONS) {
      const hasAchievement = await this.hasAchievement(userId, achievement.title);
      if (hasAchievement) continue;

      const qualified = await this.checkAchievementQualification(userId, achievement);
      if (qualified) {
        await this.awardAchievement(userId, achievement);
        newAchievements.push(achievement.title);
      }
    }

    return newAchievements;
  }

  /**
   * Check if user has a specific achievement
   */
  private static async hasAchievement(userId: string, title: string): Promise<boolean> {
    const existing = await prisma.achievement.findFirst({
      where: { userId, title }
    });
    return !!existing;
  }

  /**
   * Award an achievement to a user
   */
  private static async awardAchievement(userId: string, achievement: AchievementTrigger) {
    return await prisma.achievement.create({
      data: {
        userId,
        title: achievement.title,
        description: achievement.description,
        badgeIcon: achievement.badgeIcon,
        category: achievement.type,
        unlockedAt: new Date()
      }
    });
  }

  /**
   * Check if user qualifies for a specific achievement
   */
  private static async checkAchievementQualification(
    userId: string,
    achievement: AchievementTrigger
  ): Promise<boolean> {
    switch (achievement.type) {
      case 'streak':
        return await this.checkStreakAchievement(userId, achievement.threshold);

      case 'volume':
        return await this.checkVolumeAchievement(userId, achievement.threshold);

      case 'accuracy':
        return await this.checkAccuracyAchievement(userId, achievement.threshold);

      case 'speed':
        return await this.checkSpeedAchievement(userId, achievement.threshold);

      case 'milestone':
        return await this.checkMilestoneAchievement(userId);

      default:
        return false;
    }
  }

  /**
   * Check streak achievements
   */
  private static async checkStreakAchievement(userId: string, threshold: number): Promise<boolean> {
    const today = new Date();
    const streakStart = new Date(today);
    streakStart.setDate(today.getDate() - threshold + 1);

    const dailyProgress = await prisma.dailyProgress.findMany({
      where: {
        userId,
        date: {
          gte: streakStart,
          lte: today
        },
        isStreakDay: true
      },
      orderBy: { date: 'asc' }
    });

    // Check if we have consecutive days
    if (dailyProgress.length < threshold) return false;

    for (let i = 1; i < dailyProgress.length; i++) {
      const current = new Date(dailyProgress[i].date);
      const previous = new Date(dailyProgress[i-1].date);
      const diffDays = Math.floor((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays !== 1) return false;
    }

    return true;
  }

  /**
   * Check volume achievements
   */
  private static async checkVolumeAchievement(userId: string, threshold: number): Promise<boolean> {
    const correctAnswers = await prisma.userAttempt.count({
      where: {
        userId,
        isCorrect: true
      }
    });

    return correctAnswers >= threshold;
  }

  /**
   * Check accuracy achievements
   */
  private static async checkAccuracyAchievement(userId: string, threshold: number): Promise<boolean> {
    const recentAttempts = await prisma.userAttempt.findMany({
      where: { userId },
      orderBy: { attemptedAt: 'desc' },
      take: 20
    });

    if (recentAttempts.length < 20) return false;

    const correctCount = recentAttempts.filter(attempt => attempt.isCorrect).length;
    const accuracy = (correctCount / recentAttempts.length) * 100;

    return accuracy >= threshold;
  }

  /**
   * Check speed achievements
   */
  private static async checkSpeedAchievement(userId: string, threshold: number): Promise<boolean> {
    const recentAttempts = await prisma.userAttempt.findMany({
      where: { userId },
      orderBy: { attemptedAt: 'desc' },
      take: 10
    });

    if (recentAttempts.length < 10) return false;

    const averageTime = recentAttempts.reduce((sum, attempt) => sum + attempt.timeSpent, 0) / recentAttempts.length;

    return averageTime <= threshold;
  }

  /**
   * Check milestone achievements
   */
  private static async checkMilestoneAchievement(userId: string): Promise<boolean> {
    const sessionCount = await prisma.practiceSession.count({
      where: { userId }
    });

    return sessionCount >= 1;
  }

  /**
   * Get user achievements with statistics
   */
  static async getUserAchievements(userId: string = 'default-user') {
    const achievements = await prisma.achievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' }
    });

    const totalPossible = ACHIEVEMENT_DEFINITIONS.length;
    const completionRate = (achievements.length / totalPossible) * 100;

    return {
      achievements,
      statistics: {
        total: achievements.length,
        totalPossible,
        completionRate: Math.round(completionRate),
        categories: {
          streak: achievements.filter(a => a.category === 'streak').length,
          volume: achievements.filter(a => a.category === 'volume').length,
          accuracy: achievements.filter(a => a.category === 'accuracy').length,
          speed: achievements.filter(a => a.category === 'speed').length,
          milestone: achievements.filter(a => a.category === 'milestone').length,
        }
      }
    };
  }
}