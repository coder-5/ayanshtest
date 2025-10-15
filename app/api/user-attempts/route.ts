import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler, successResponse } from '@/lib/error-handler';
import { USER_ID } from '@/lib/constants';
import { Prisma } from '@prisma/client';
import { userAttemptSchema } from '@/lib/validation';
import {
  determineStrengthLevel,
  needsPractice as calculateNeedsPractice,
} from '@/lib/config/thresholds';

export const POST = withErrorHandler(async (request: Request) => {
  const userId = USER_ID;
  const body = await request.json();

  // Validate request body
  const validation = userAttemptSchema.safeParse(body);
  if (!validation.success) {
    return successResponse({ error: 'Validation failed', details: validation.error.format() }, 400);
  }

  const { questionId, selectedAnswer, timeSpent, sessionId } = validation.data;

  // SERVER-SIDE VALIDATION: Calculate correctness instead of trusting client
  const question = await prisma.question.findUnique({
    where: { id: questionId, deletedAt: null },
    include: {
      options: true,
    },
  });

  if (!question) {
    return successResponse({ error: 'Question not found' }, 404);
  }

  // Calculate if the answer is correct
  let isCorrect = false;

  if (question.options.length > 0) {
    // Multiple choice question - check if selected option is correct
    const selectedOption = question.options.find((opt) => opt.optionLetter === selectedAnswer);
    isCorrect = selectedOption?.isCorrect || false;
  } else if (question.correctAnswer) {
    // Fill-in-the-blank question - compare with correctAnswer (case-insensitive)
    isCorrect = selectedAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
  } else {
    return successResponse({ error: 'Question has no correct answer configured' }, 400);
  }

  // Use transaction to ensure all updates succeed or none do
  const result = await prisma.$transaction(async (tx) => {
    // Create attempt
    const attempt = await tx.userAttempt.create({
      data: {
        userId,
        questionId,
        selectedAnswer: selectedAnswer || null,
        isCorrect,
        timeSpent: timeSpent || 0,
        sessionId: sessionId || null,
      },
    });

    // Update daily progress
    await updateDailyProgress(userId, tx);

    // Update topic performance
    await updateTopicPerformance(userId, questionId, tx);

    // Check and grant achievements
    await checkAchievements(userId, tx);

    // Update weekly analysis if it's Sunday or if the week is complete
    await updateWeeklyAnalysis(userId, tx);

    return attempt;
  });

  return successResponse({ success: true, attempt: result });
});

async function updateDailyProgress(userId: string, tx: Prisma.TransactionClient) {
  // Use local time for simplicity (single-user app)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const todayStart = new Date(today);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const attempts = await tx.userAttempt.findMany({
    where: {
      userId,
      attemptedAt: {
        gte: todayStart,
        lte: todayEnd,
      },
      deletedAt: null,
    },
    include: {
      question: {
        select: {
          topic: true,
        },
      },
    },
  });

  const questionsAttempted = attempts.length;
  const correctAnswers = attempts.filter((a) => a.isCorrect).length;
  const totalTimeSpent = attempts.reduce((sum, a) => sum + a.timeSpent, 0);
  const averageAccuracy = questionsAttempted > 0 ? (correctAnswers / questionsAttempted) * 100 : 0;

  const topicsSet = new Set(attempts.map((a) => a.question.topic).filter((t) => t));
  const topicsStudied = Array.from(topicsSet).join(', ');

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayProgress = await tx.dailyProgress.findFirst({
    where: {
      userId,
      date: yesterday,
    },
  });

  // Check if today's record already exists to preserve streak
  const todayProgress = await tx.dailyProgress.findFirst({
    where: {
      userId,
      date: today,
    },
  });

  const isStreakDay = questionsAttempted > 0;

  // Calculate streak days
  // Streak Logic:
  // 1. If today already has a streak recorded (multiple attempts in same day):
  //    → Keep the existing streak value (don't reset mid-day)
  // 2. If yesterday was a streak day:
  //    → Extend the streak: yesterday's streak + 1
  // 3. If yesterday was NOT a streak day (user took a break):
  //    → Start fresh: streak = 1
  //
  // Example: 10-day streak, then 1 day off, then come back
  //   Day 10: streak = 10, isStreakDay = true
  //   Day 11: streak = 0,  isStreakDay = false (no practice)
  //   Day 12: streak = 1,  isStreakDay = true (fresh start, not 11!)
  let streakDays: number;
  if (todayProgress && todayProgress.streakDays > 0) {
    streakDays = todayProgress.streakDays;
  } else if (yesterdayProgress?.isStreakDay) {
    streakDays = yesterdayProgress.streakDays + 1;
  } else {
    streakDays = 1;
  }

  await tx.dailyProgress.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    update: {
      questionsAttempted,
      correctAnswers,
      totalTimeSpent,
      averageAccuracy,
      topicsStudied,
      streakDays,
      isStreakDay,
      updatedAt: new Date(),
    },
    create: {
      id: crypto.randomUUID(),
      userId,
      date: today,
      questionsAttempted,
      correctAnswers,
      totalTimeSpent,
      averageAccuracy,
      topicsStudied,
      streakDays,
      isStreakDay,
    },
  });
}

async function updateTopicPerformance(
  userId: string,
  questionId: string,
  tx: Prisma.TransactionClient
) {
  const question = await tx.question.findUnique({
    where: { id: questionId, deletedAt: null },
    select: { topic: true },
  });

  if (!question?.topic) return;

  const topic = question.topic;

  // Fetch topic attempts - optimized to select only needed fields
  const allAttempts = await tx.userAttempt.findMany({
    where: {
      userId,
      deletedAt: null,
      question: {
        topic,
      },
    },
    select: {
      isCorrect: true,
      timeSpent: true,
    },
  });

  const totalAttempts = allAttempts.length;
  const correctAttempts = allAttempts.filter((a) => a.isCorrect).length;
  const totalTime = allAttempts.reduce((sum, a) => sum + a.timeSpent, 0);
  const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
  const averageTime = totalAttempts > 0 ? Math.round(totalTime / totalAttempts) : 0;

  // Use configurable thresholds from lib/config/thresholds.ts
  const strengthLevel = determineStrengthLevel(totalAttempts, accuracy);

  // Get current lastPracticed date if exists
  const existingPerformance = await tx.topicPerformance.findUnique({
    where: { userId_topic: { userId, topic } },
    select: { lastPracticed: true },
  });

  const needsPractice = calculateNeedsPractice(
    accuracy,
    existingPerformance?.lastPracticed || null
  );

  await tx.topicPerformance.upsert({
    where: {
      userId_topic: {
        userId,
        topic,
      },
    },
    update: {
      totalAttempts,
      correctAttempts,
      accuracy,
      averageTime,
      lastPracticed: new Date(),
      strengthLevel,
      needsPractice,
      updatedAt: new Date(),
    },
    create: {
      id: crypto.randomUUID(),
      userId,
      topic,
      totalAttempts,
      correctAttempts,
      accuracy,
      averageTime,
      lastPracticed: new Date(),
      strengthLevel,
      needsPractice,
    },
  });
}

async function checkAchievements(userId: string, tx: Prisma.TransactionClient) {
  // Get user's achievements (both earned and in-progress)
  const userAchievements = await tx.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true, progress: true },
  });

  const earnedIds = new Set(
    userAchievements.filter((ua) => ua.progress === 100).map((ua) => ua.achievementId)
  );

  // Load all achievements (including those in progress)
  const allAchievements = await tx.achievement.findMany();

  // Get user stats
  const stats = await tx.userAttempt.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    select: {
      isCorrect: true,
    },
  });

  const totalQuestions = stats.length;
  const correctAnswers = stats.filter((a) => a.isCorrect).length;

  const latestProgress = await tx.dailyProgress.findFirst({
    where: { userId },
    orderBy: { date: 'desc' },
  });

  const currentStreak = latestProgress?.streakDays || 0;

  for (const achievement of allAchievements) {
    const criteria = achievement.criteria as { type: string; target: number };
    let currentValue = 0;

    // Calculate current progress value based on achievement type
    switch (criteria.type) {
      case 'total_questions':
        currentValue = totalQuestions;
        break;
      case 'correct_answers':
        currentValue = correctAnswers;
        break;
      case 'streak_days':
        currentValue = currentStreak;
        break;
    }

    // Calculate progress percentage (0-100)
    const progressPercentage = Math.min(100, Math.floor((currentValue / criteria.target) * 100));

    // Check if already earned
    if (earnedIds.has(achievement.id)) {
      continue;
    }

    // Check if achievement exists for this user
    const existingAchievement = userAchievements.find((ua) => ua.achievementId === achievement.id);

    if (progressPercentage >= 100) {
      // Grant achievement
      if (existingAchievement) {
        // Update to 100% if it exists
        await tx.userAchievement.updateMany({
          where: {
            userId,
            achievementId: achievement.id,
          },
          data: {
            progress: 100,
            earnedAt: new Date(),
          },
        });
      } else {
        // Create new achievement record
        await tx.userAchievement.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            achievementId: achievement.id,
            progress: 100,
            earnedAt: new Date(),
          },
        });
      }
    } else if (progressPercentage > 0) {
      // Update or create in-progress achievement
      if (existingAchievement) {
        // Update progress if changed
        if (existingAchievement.progress !== progressPercentage) {
          await tx.userAchievement.updateMany({
            where: {
              userId,
              achievementId: achievement.id,
            },
            data: {
              progress: progressPercentage,
            },
          });
        }
      } else {
        // Create new in-progress achievement
        await tx.userAchievement.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            achievementId: achievement.id,
            progress: progressPercentage,
            earnedAt: new Date(), // Will be updated when progress reaches 100%
          },
        });
      }
    }
  }
}

async function updateWeeklyAnalysis(userId: string, tx: Prisma.TransactionClient) {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

  // Get the start of this week (Sunday) in local time
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - currentDay);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Get all attempts for this week
  const attempts = await tx.userAttempt.findMany({
    where: {
      userId,
      attemptedAt: {
        gte: weekStart,
        lte: weekEnd,
      },
      deletedAt: null,
    },
    include: {
      question: {
        select: {
          topic: true,
        },
      },
    },
  });

  if (attempts.length === 0) return;

  const totalQuestions = attempts.length;
  const correctAnswers = attempts.filter((a) => a.isCorrect).length;
  const totalTime = attempts.reduce((sum, a) => sum + a.timeSpent, 0);
  const averageAccuracy = (correctAnswers / totalQuestions) * 100;

  // Topic analysis
  const topicStats = new Map<string, { correct: number; total: number }>();
  attempts.forEach((a) => {
    const topic = a.question.topic;
    if (!topic) return;

    const stats = topicStats.get(topic) || { correct: 0, total: 0 };
    stats.total++;
    if (a.isCorrect) stats.correct++;
    topicStats.set(topic, stats);
  });

  const strongTopics: string[] = [];
  const weakTopics: string[] = [];

  topicStats.forEach((stats, topic) => {
    const accuracy = (stats.correct / stats.total) * 100;
    if (stats.total >= 3) {
      if (accuracy >= 75) {
        strongTopics.push(topic);
      } else if (accuracy < 60) {
        weakTopics.push(topic);
      }
    }
  });

  // Calculate improvement from previous week
  const previousWeekStart = new Date(weekStart);
  previousWeekStart.setDate(weekStart.getDate() - 7);

  const previousWeek = await tx.weeklyAnalysis.findFirst({
    where: {
      userId,
      weekStartDate: previousWeekStart,
    },
  });

  const improvementPercentage = previousWeek ? averageAccuracy - previousWeek.averageAccuracy : 0;

  // Use upsert to update throughout the week instead of creating once
  await tx.weeklyAnalysis.upsert({
    where: {
      userId_weekStartDate: {
        userId,
        weekStartDate: weekStart,
      },
    },
    update: {
      totalQuestions,
      correctAnswers,
      totalTimeSpent: totalTime,
      averageAccuracy,
      strongTopics: strongTopics.join(', '),
      weakTopics: weakTopics.join(', '),
      improvementRate: improvementPercentage,
    },
    create: {
      id: crypto.randomUUID(),
      userId,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      totalQuestions,
      correctAnswers,
      totalTimeSpent: totalTime,
      averageAccuracy,
      strongTopics: strongTopics.join(', '),
      weakTopics: weakTopics.join(', '),
      improvementRate: improvementPercentage,
    },
  });
}
