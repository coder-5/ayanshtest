import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler, successResponse } from '@/lib/error-handler';
import { getCurrentUserId } from '@/lib/userContext';

export const GET = withErrorHandler(async () => {
  const userId = getCurrentUserId();

  // Get all incorrect attempts
  const incorrectAttempts = await prisma.userAttempt.findMany({
    where: {
      userId,
      isCorrect: false,
      deletedAt: null,
    },
    include: {
      question: {
        select: {
          id: true,
          questionText: true,
          topic: true,
          difficulty: true,
          examName: true,
          questionNumber: true,
        },
      },
    },
    orderBy: {
      attemptedAt: 'desc',
    },
  });

  // Group by question ID and calculate review timing
  const questionReviewMap = new Map<
    string,
    {
      questionId: string;
      questionText: string;
      topic: string | null;
      difficulty: string;
      examName: string | null;
      questionNumber: string | null;
      lastAttemptDate: Date;
      attemptCount: number;
      daysSinceAttempt: number;
      reviewPriority: number;
      reviewReason: string;
    }
  >();

  const now = new Date();

  for (const attempt of incorrectAttempts) {
    const questionId = attempt.questionId;
    const daysSinceAttempt = Math.floor(
      (now.getTime() - attempt.attemptedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (!questionReviewMap.has(questionId)) {
      questionReviewMap.set(questionId, {
        questionId,
        questionText: attempt.question.questionText,
        topic: attempt.question.topic,
        difficulty: attempt.question.difficulty,
        examName: attempt.question.examName,
        questionNumber: attempt.question.questionNumber,
        lastAttemptDate: attempt.attemptedAt,
        attemptCount: 1,
        daysSinceAttempt,
        reviewPriority: 0,
        reviewReason: '',
      });
    } else {
      const existing = questionReviewMap.get(questionId)!;
      existing.attemptCount++;
      if (attempt.attemptedAt > existing.lastAttemptDate) {
        existing.lastAttemptDate = attempt.attemptedAt;
        existing.daysSinceAttempt = daysSinceAttempt;
      }
    }
  }

  // Calculate which questions should be reviewed based on spaced repetition
  const questionsToReview: Array<{
    questionId: string;
    questionText: string;
    topic: string | null;
    difficulty: string;
    examName: string | null;
    questionNumber: string | null;
    lastAttemptDate: Date;
    attemptCount: number;
    daysSinceAttempt: number;
    reviewStage: string;
    reviewReason: string;
  }> = [];

  for (const [_, questionData] of questionReviewMap) {
    const { attemptCount, daysSinceAttempt } = questionData;

    let shouldReview = false;
    let reviewStage = '';
    let reviewReason = '';
    let priority = 0;

    // Spaced repetition intervals based on attempt count
    if (attemptCount === 1) {
      // First wrong attempt: review after 1 day
      if (daysSinceAttempt >= 1) {
        shouldReview = true;
        reviewStage = 'First Review';
        reviewReason = 'First review after incorrect attempt';
        priority = 4;
      }
    } else if (attemptCount === 2) {
      // Second wrong attempt: review after 3 days
      if (daysSinceAttempt >= 3) {
        shouldReview = true;
        reviewStage = 'Second Review';
        reviewReason = 'Second review - needs reinforcement';
        priority = 5;
      }
    } else if (attemptCount === 3) {
      // Third wrong attempt: review after 7 days
      if (daysSinceAttempt >= 7) {
        shouldReview = true;
        reviewStage = 'Third Review';
        reviewReason = 'Third review - challenging topic';
        priority = 6;
      }
    } else {
      // Multiple wrong attempts: review after 14 days
      if (daysSinceAttempt >= 14) {
        shouldReview = true;
        reviewStage = 'Extended Review';
        reviewReason = `Multiple incorrect attempts (${attemptCount}x) - high priority`;
        priority = 7 + attemptCount; // Higher priority for more attempts
      }
    }

    if (shouldReview) {
      questionsToReview.push({
        ...questionData,
        reviewStage,
        reviewReason,
      });

      questionData.reviewPriority = priority;
    }
  }

  // Sort by priority (more attempts = higher priority), then by days since attempt
  questionsToReview.sort((a, b) => {
    const priorityDiff = b.attemptCount - a.attemptCount;
    if (priorityDiff !== 0) return priorityDiff;
    return b.daysSinceAttempt - a.daysSinceAttempt;
  });

  return successResponse({
    recommendedQuestions: questionsToReview,
    totalRecommended: questionsToReview.length,
    summary: {
      immediateReview: questionsToReview.filter((q) => q.attemptCount >= 3).length,
      standardReview: questionsToReview.filter((q) => q.attemptCount < 3).length,
    },
  });
});
