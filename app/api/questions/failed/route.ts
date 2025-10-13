import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/userContext';

export async function GET() {
  try {
    const userId = getCurrentUserId();

    // Get questions where user has failed attempts
    const failedQuestions = await prisma.question.findMany({
      where: {
        deletedAt: null,
        attempts: {
          some: {
            userId,
            isCorrect: false,
            deletedAt: null,
          },
        },
      },
      include: {
        options: {
          orderBy: { optionLetter: 'asc' },
        },
        solution: true,
        attempts: {
          where: {
            userId,
            deletedAt: null,
          },
          orderBy: {
            attemptedAt: 'desc',
          },
          take: 5, // Last 5 attempts
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Calculate statistics for each question
    const questionsWithStats = failedQuestions.map((q) => {
      const totalAttempts = q.attempts.length;
      const wrongAttempts = q.attempts.filter((a) => !a.isCorrect).length;
      const correctAttempts = q.attempts.filter((a) => a.isCorrect).length;
      const lastAttempt = q.attempts[0];
      const neverCorrect = correctAttempts === 0;

      return {
        ...q,
        stats: {
          totalAttempts,
          wrongAttempts,
          correctAttempts,
          lastAttemptedAt: lastAttempt?.attemptedAt,
          neverCorrect,
          priority: neverCorrect ? wrongAttempts * 2 : wrongAttempts, // Double priority if never gotten right
        },
      };
    });

    // Sort by priority (highest first)
    questionsWithStats.sort((a, b) => b.stats.priority - a.stats.priority);

    return NextResponse.json({
      questions: questionsWithStats,
      total: questionsWithStats.length,
      summary: {
        totalFailed: questionsWithStats.length,
        neverCorrect: questionsWithStats.filter((q) => q.stats.neverCorrect).length,
        highPriority: questionsWithStats.filter((q) => q.stats.wrongAttempts >= 3).length,
      },
    });
  } catch (error) {
    console.error('Error fetching failed questions:', error);
    return NextResponse.json({ error: 'Failed to fetch failed questions' }, { status: 500 });
  }
}
