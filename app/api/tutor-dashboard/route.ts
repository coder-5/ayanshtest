import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { USER_ID } from '@/lib/constants';
import { withErrorHandler, successResponse } from '@/lib/error-handler';

/**
 * GET /api/tutor-dashboard
 *
 * Returns weak areas for Ayansh:
 * - Topics with < 70% accuracy
 * - Questions he got wrong multiple times
 * - Resolution tracking (mark topics/questions as taught)
 */
export const GET = withErrorHandler(async () => {
  const userId = USER_ID;

  // Get all topic performance
  const topicPerformance = await prisma.topicPerformance.findMany({
    where: {
      userId,
    },
    orderBy: {
      accuracy: 'asc', // Weakest topics first
    },
  });

  // Filter weak topics (< 70% accuracy)
  const weakTopics = topicPerformance
    .filter((tp) => tp.accuracy < 70 && tp.totalAttempts >= 3) // Min 3 attempts to qualify
    .map((tp) => ({
      topic: tp.topic,
      accuracy: Math.round(tp.accuracy * 10) / 10,
      totalAttempts: tp.totalAttempts,
      correctAttempts: tp.correctAttempts,
      lastPracticed: tp.lastPracticed,
      needsPractice: tp.needsPractice,
      strengthLevel: tp.strengthLevel,
      resolved: tp.resolved || false,
      resolvedAt: tp.resolvedAt || null,
      tutorNotes: tp.tutorNotes || null,
    }));

  // Get failed questions (wrong >= 2 times, never got right)
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
        take: 10, // Last 10 attempts
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  // Calculate statistics and filter
  const problemQuestions = failedQuestions
    .map((q) => {
      const totalAttempts = q.attempts.length;
      const wrongAttempts = q.attempts.filter((a) => !a.isCorrect).length;
      const correctAttempts = q.attempts.filter((a) => a.isCorrect).length;
      const neverCorrect = correctAttempts === 0;
      const lastAttempt = q.attempts[0];

      return {
        id: q.id,
        questionText: q.questionText,
        topic: q.topic,
        difficulty: q.difficulty,
        examName: q.examName,
        examYear: q.examYear,
        questionNumber: q.questionNumber,
        totalAttempts,
        wrongAttempts,
        correctAttempts,
        neverCorrect,
        lastAttemptedAt: lastAttempt?.attemptedAt,
        priority: neverCorrect ? wrongAttempts * 2 : wrongAttempts, // Higher priority if never correct
        resolved: q.resolved || false,
        resolvedAt: q.resolvedAt || null,
        tutorNotes: q.tutorNotes || null,
      };
    })
    .filter((q) => q.wrongAttempts >= 2) // Only questions failed 2+ times
    .sort((a, b) => b.priority - a.priority); // Highest priority first

  return successResponse({
    weakTopics: weakTopics.filter((t) => !t.resolved), // Hide resolved
    resolvedTopics: weakTopics.filter((t) => t.resolved),
    problemQuestions: problemQuestions.filter((q) => !q.resolved), // Hide resolved
    resolvedQuestions: problemQuestions.filter((q) => q.resolved),
    summary: {
      weakTopicsCount: weakTopics.filter((t) => !t.resolved).length,
      problemQuestionsCount: problemQuestions.filter((q) => !q.resolved).length,
      resolvedTopicsCount: weakTopics.filter((t) => t.resolved).length,
      resolvedQuestionsCount: problemQuestions.filter((q) => q.resolved).length,
    },
  });
});

/**
 * POST /api/tutor-dashboard
 *
 * Mark topics or questions as resolved after teaching
 */
export const POST = withErrorHandler(async (request: Request) => {
  const userId = USER_ID;
  const body = await request.json();

  const { type, id, resolved, tutorNotes } = body;

  if (type === 'topic') {
    // Mark topic as resolved
    await prisma.topicPerformance.update({
      where: {
        userId_topic: {
          userId,
          topic: id,
        },
      },
      data: {
        resolved: resolved ?? true,
        resolvedAt: resolved === false ? null : new Date(),
        tutorNotes: tutorNotes || null,
      },
    });

    return successResponse({
      success: true,
      message: `Topic "${id}" marked as ${resolved ? 'resolved' : 'unresolved'}`,
    });
  } else if (type === 'question') {
    // Mark question as resolved
    await prisma.question.update({
      where: { id },
      data: {
        resolved: resolved ?? true,
        resolvedAt: resolved === false ? null : new Date(),
        tutorNotes: tutorNotes || null,
      },
    });

    return successResponse({
      success: true,
      message: `Question marked as ${resolved ? 'resolved' : 'unresolved'}`,
    });
  }

  return NextResponse.json(
    { error: 'Invalid type (must be "topic" or "question")' },
    { status: 400 }
  );
});
