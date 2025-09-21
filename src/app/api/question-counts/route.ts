import { NextResponse } from 'next/server';
import { QuestionService } from '@/services/questionService';

export async function GET() {
  try {
    const counts = await QuestionService.getQuestionCounts();

    return NextResponse.json(counts);
  } catch (error) {
    console.error('Failed to get question counts:', error);
    return NextResponse.json(
      { error: 'Failed to get question counts' },
      { status: 500 }
    );
  }
}