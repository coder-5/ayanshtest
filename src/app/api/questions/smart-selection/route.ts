import { NextRequest, NextResponse } from 'next/server';
import { QuestionSelectionService } from '@/services/questionSelectionService';
import { safeUserIdFromParams } from '@/utils/nullSafety';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const examType = searchParams.get('examType');
    const topic = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty');

    if (!examType) {
      return NextResponse.json({ error: 'examType is required' }, { status: 400 });
    }

    const options: any = {
      userId: safeUserIdFromParams(searchParams),
      examType,
      limit: parseInt(searchParams.get('limit') || '10'),
      sessionType: (searchParams.get('sessionType') as any) || 'practice',
      excludeQuestionIds: searchParams.get('exclude')?.split(',').filter(Boolean) || []
    };

    if (topic) {
      options.topic = topic;
    }

    if (difficulty) {
      options.difficulty = difficulty;
    }

    const result = await QuestionSelectionService.getQuestionsWithRoundControl(options);

    return NextResponse.json({
      success: true,
      data: result.questions,
      roundInfo: result.roundInfo,
      message: result.message,
      meta: {
        totalReturned: result.questions.length,
        requestedLimit: options.limit,
        filters: {
          examType: options.examType,
          topic: options.topic,
          difficulty: options.difficulty
        }
      }
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to select questions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId = 'ayansh',
      sessionQuestions = [],
      newLimit = 5,
      ...otherOptions
    } = body;

    // Get additional questions while excluding ones already in current session
    const excludeQuestionIds = sessionQuestions.map((q: any) => q.id);

    const result = await QuestionSelectionService.getQuestionsWithRoundControl({
      userId,
      limit: newLimit,
      excludeQuestionIds,
      ...otherOptions
    });

    return NextResponse.json({
      success: true,
      data: result.questions,
      roundInfo: result.roundInfo,
      message: `Added ${result.questions.length} more questions to your session`,
      sessionInfo: {
        previousCount: sessionQuestions.length,
        newCount: result.questions.length,
        totalInSession: sessionQuestions.length + result.questions.length
      }
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add questions to session'
      },
      { status: 500 }
    );
  }
}