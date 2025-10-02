import { prisma } from "@/lib/prisma";
import { ApiResponse } from '@/lib/api-response';

export async function DELETE() {
  try {
    // Delete in correct order due to foreign key constraints
    await prisma.option.deleteMany({});
    await prisma.solution.deleteMany({});
    await prisma.userAttempt.deleteMany({});
    await prisma.question.deleteMany({});

    return ApiResponse.success(
      { message: 'Database cleared successfully' },
      'All questions and related data have been removed'
    );
  } catch (error) {
    console.error('Error clearing database:', error);
    return ApiResponse.serverError('Failed to clear database');
  }
}