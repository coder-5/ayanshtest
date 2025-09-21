import { NextRequest, NextResponse } from 'next/server';
import { QuestionQualityService } from '@/services/questionQualityService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');
    const questionIds = searchParams.get('questionIds');

    if (questionId) {
      // Single question quality
      const quality = await QuestionQualityService.getQuestionQuality(questionId);
      return NextResponse.json(quality);
    } else if (questionIds) {
      // Multiple questions quality
      const ids = questionIds.split(',');
      const qualityMap = await QuestionQualityService.getBulkQuestionQuality(ids);

      // Convert Map to object for JSON response
      const result: Record<string, any> = {};
      qualityMap.forEach((quality, id) => {
        result[id] = quality;
      });

      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: 'Either questionId or questionIds parameter is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching question quality:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question quality' },
      { status: 500 }
    );
  }
}

// Get questions that need quality review
export async function POST(_request: NextRequest) {
  try {
    const questionsNeedingReview = await QuestionQualityService.getQuestionsNeedingReview();

    return NextResponse.json({
      success: true,
      count: questionsNeedingReview.length,
      questions: questionsNeedingReview
    });
  } catch (error) {
    console.error('Error fetching questions needing review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions needing review' },
      { status: 500 }
    );
  }
}