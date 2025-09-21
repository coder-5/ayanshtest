import { NextResponse } from 'next/server';
import { QuestionService } from '@/services/questionService';
import { isValidExamType } from '@/constants/examTypes';

export async function GET(
  _request: Request,
  { params }: { params: { examType: string } }
) {
  try {
    const { examType } = params;

    // Validate exam type
    if (!isValidExamType(examType)) {
      return NextResponse.json({ error: 'Invalid exam type' }, { status: 400 });
    }

    const availableYears = await QuestionService.getAvailableYears(examType);

    return NextResponse.json(availableYears);
  } catch (error) {
    console.error(`Error fetching ${params.examType} years:`, error);
    return NextResponse.json({ error: 'Failed to fetch years' }, { status: 500 });
  }
}