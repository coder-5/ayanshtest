import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/userContext';
import { withErrorHandler, successResponse } from '@/lib/error-handler';

/**
 * GET /api/questions/[id]/stats
 *
 * Returns detailed statistics for a specific question:
 * - Total attempts by Ayansh
 * - Success rate / accuracy
 * - Average time to solve
 * - Last attempted date
 * - Auto-calculated difficulty based on performance
 */
export const GET = withErrorHandler(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const userId = getCurrentUserId();

    // Get question to verify it exists
    const question = await prisma.question.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        questionText: true,
        difficulty: true,
        topic: true,
      },
    });

    if (!question) {
      return successResponse({ error: 'Question not found' }, 404);
    }

    // Get all attempts for this question by this user
    const attempts = await prisma.userAttempt.findMany({
      where: {
        questionId: id,
        userId,
        deletedAt: null,
      },
      orderBy: {
        attemptedAt: 'desc',
      },
    });

    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter((a) => a.isCorrect).length;
    const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

    const totalTime = attempts.reduce((sum, a) => sum + a.timeSpent, 0);
    const avgTimeSeconds = totalAttempts > 0 ? Math.round(totalTime / totalAttempts) : 0;

    const lastAttempt = attempts[0];
    const firstAttempt = attempts[attempts.length - 1];

    // Auto-calculate difficulty based on actual performance
    let calculatedDifficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' = 'MEDIUM';

    if (totalAttempts >= 3) {
      // Only calculate if we have enough data
      if (accuracy >= 80 && avgTimeSeconds < 60) {
        calculatedDifficulty = 'EASY';
      } else if (accuracy >= 60 && avgTimeSeconds < 120) {
        calculatedDifficulty = 'MEDIUM';
      } else if (accuracy >= 40 || avgTimeSeconds < 180) {
        calculatedDifficulty = 'HARD';
      } else {
        calculatedDifficulty = 'EXPERT';
      }
    }

    // Check if difficulty rating matches actual performance
    const difficultyMismatch = question.difficulty !== calculatedDifficulty;

    return NextResponse.json({
      questionId: id,
      questionText: question.questionText.substring(0, 100) + '...', // Truncated for summary
      topic: question.topic,

      // Attempt statistics
      totalAttempts,
      correctAttempts,
      incorrectAttempts: totalAttempts - correctAttempts,
      accuracy: Math.round(accuracy * 10) / 10, // Round to 1 decimal

      // Time statistics
      avgTimeSeconds,
      totalTimeSpent: totalTime,

      // Timeline
      firstAttemptedAt: firstAttempt?.attemptedAt || null,
      lastAttemptedAt: lastAttempt?.attemptedAt || null,

      // Difficulty analysis
      currentDifficulty: question.difficulty,
      calculatedDifficulty,
      difficultyMismatch,
      suggestedAction: difficultyMismatch
        ? `Consider updating difficulty from ${question.difficulty} to ${calculatedDifficulty}`
        : 'Difficulty rating matches performance',

      // Performance trend (last 5 attempts)
      recentPerformance: attempts.slice(0, 5).map((a) => ({
        attemptedAt: a.attemptedAt,
        isCorrect: a.isCorrect,
        timeSpent: a.timeSpent,
      })),
    });
  }
);
