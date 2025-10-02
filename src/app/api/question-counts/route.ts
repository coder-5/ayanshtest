import { QuestionService } from '@/services/questionService';
import { ApiResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const counts = await QuestionService.getQuestionCounts();

    return ApiResponse.success(counts);
  } catch (error) {
    return ApiResponse.error('Failed to get question counts', 500);
  }
}