import { QuestionService } from '@/services/questionService';
import { isValidExamType } from '@/constants/examTypes';
import { ApiResponse } from '@/lib/api-response';

export async function GET(
  _request: Request,
  { params }: { params: { examType: string } }
) {
  try {
    const { examType } = params;

    // Validate exam type
    if (!isValidExamType(examType)) {
      return ApiResponse.validationError('Invalid exam type');
    }

    const availableYears = await QuestionService.getAvailableYears(examType);

    return ApiResponse.success(availableYears);
  } catch (error) {
    console.error(`Error fetching ${params.examType} years:`, error);
    return ApiResponse.serverError('Failed to fetch years');
  }
}