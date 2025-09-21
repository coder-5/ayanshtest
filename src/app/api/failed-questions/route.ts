import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-user';
    const examType = searchParams.get('examType'); // Optional filter by exam type
    const topic = searchParams.get('topic'); // Optional filter by topic
    const limit = parseInt(searchParams.get('limit') || '20');
    const timeFrame = searchParams.get('timeFrame'); // 'week', 'month', 'all'

    // Build date filter based on timeFrame
    let dateFilter = {};
    if (timeFrame === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { attemptedAt: { gte: weekAgo } };
    } else if (timeFrame === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { attemptedAt: { gte: monthAgo } };
    }

    // Get all attempts for the user with their questions
    const allAttempts = await prisma.userAttempt.findMany({
      where: {
        userId,
        ...dateFilter
      },
      include: {
        question: {
          include: {
            solution: true,
            options: true
          }
        }
      },
      orderBy: { attemptedAt: 'asc' }
    });

    // Analyze each question's attempt history to find those needing retry
    const questionAnalysis = new Map();

    // Group attempts by question
    for (const attempt of allAttempts) {
      const questionId = attempt.questionId;
      if (!questionAnalysis.has(questionId)) {
        questionAnalysis.set(questionId, {
          attempts: [],
          question: attempt.question
        });
      }
      questionAnalysis.get(questionId).attempts.push(attempt);
    }

    const uniqueFailedQuestions = new Map();

    // Analyze each question's pattern
    for (const [questionId, data] of Array.from(questionAnalysis.entries())) {
      const { attempts, question } = data;
      if (!question) continue;

      // Find the most recent attempt
      const mostRecentAttempt = attempts[attempts.length - 1];

      // Calculate failure patterns
      const totalAttempts = attempts.length;
      const failedAttempts = attempts.filter((a: any) => !a.isCorrect);
      const successfulAttempts = attempts.filter((a: any) => a.isCorrect);

      // Include question if:
      // 1. Most recent attempt was incorrect, OR
      // 2. Has multiple failures with success rate < 70%, OR
      // 3. Last failure was recent (within last 5 attempts) with overall low success
      const successRate = totalAttempts > 0 ? (successfulAttempts.length / totalAttempts) * 100 : 0;
      const recentFailures = attempts.slice(-5).filter((a: any) => !a.isCorrect).length;

      const shouldRetry = (
        !mostRecentAttempt.isCorrect || // Last attempt failed
        (failedAttempts.length >= 2 && successRate < 70) || // Multiple failures with low success rate
        (recentFailures >= 2 && successRate < 50) // Recent failures with very low success rate
      );

      if (shouldRetry) {
        // Apply filters
        let includeQuestion = true;

        if (examType && question.examName !== examType) {
          includeQuestion = false;
        }

        if (topic && question.topic !== topic) {
          includeQuestion = false;
        }

        if (includeQuestion) {
          // Find the most recent failed attempt for display
          const lastFailedAttempt = failedAttempts[failedAttempts.length - 1] || mostRecentAttempt;

          uniqueFailedQuestions.set(questionId, {
            question,
            lastAttempt: {
              id: lastFailedAttempt.id,
              selectedAnswer: lastFailedAttempt.selectedAnswer,
              timeSpent: lastFailedAttempt.timeSpent,
              attemptedAt: lastFailedAttempt.attemptedAt,
              hintsUsed: lastFailedAttempt.hintsUsed
            },
            attemptCount: failedAttempts.length,
            totalAttempts,
            successRate: Math.round(successRate),
            needsRetry: !mostRecentAttempt.isCorrect ? 'recent_failure' :
                       successRate < 50 ? 'low_success_rate' : 'inconsistent_performance'
          });
        }
      }
    }

    // Convert to array and limit results
    const failedQuestions = Array.from(uniqueFailedQuestions.values()).slice(0, limit);

    // Get summary statistics
    const totalFailedQuestions = uniqueFailedQuestions.size;
    const totalFailedAttempts = allAttempts.filter((a: any) => !a.isCorrect).length;

    // Group by topic for insights
    const topicBreakdown: Record<string, number> = {};
    failedQuestions.forEach((item: any) => {
      const topic = item.question.topic;
      if (!topicBreakdown[topic]) {
        topicBreakdown[topic] = 0;
      }
      topicBreakdown[topic]++;
    });

    // Group by exam type
    const examBreakdown: Record<string, number> = {};
    failedQuestions.forEach((item: any) => {
      const exam = item.question.examName;
      if (!examBreakdown[exam]) {
        examBreakdown[exam] = 0;
      }
      examBreakdown[exam]++;
    });

    return NextResponse.json({
      questions: failedQuestions,
      summary: {
        totalFailedQuestions,
        totalFailedAttempts,
        topicBreakdown,
        examBreakdown
      },
      filters: {
        examType,
        topic,
        timeFrame,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching failed questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch failed questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = 'default-user', questionIds, sessionType = 'retry' } = body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json(
        { error: 'Question IDs array is required' },
        { status: 400 }
      );
    }

    // Get the questions with their details
    const questions = await prisma.question.findMany({
      where: {
        id: { in: questionIds }
      },
      include: {
        solution: true
      }
    });

    // Create a retry session record (optional - for tracking retry sessions)
    const retrySession = await prisma.practiceSession.create({
      data: {
        userId,
        sessionType,
        totalQuestions: questions.length,
        startedAt: new Date()
      }
    });

    return NextResponse.json({
      sessionId: retrySession.id,
      questions: questions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        examName: q.examName,
        examYear: q.examYear,
        questionNumber: q.questionNumber,
        topic: q.topic,
        subtopic: q.subtopic,
        difficulty: q.difficulty,
        timeLimit: q.timeLimit,
        hasImage: q.hasImage,
        imageUrl: q.imageUrl,
        solution: q.solution,
        type: (q as any).options && (q as any).options.length > 0 ? 'multiple-choice' : 'open-ended',
        options: (q as any).options || []
      }))
    });

  } catch (error) {
    console.error('Error creating retry session:', error);
    return NextResponse.json(
      { error: 'Failed to create retry session' },
      { status: 500 }
    );
  }
}

