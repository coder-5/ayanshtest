import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/userContext';
import { withErrorHandler, successResponse, errorResponse } from '@/lib/error-handler';

/**
 * GET /api/user - Get current user profile
 */
export const GET = withErrorHandler(async () => {
  const userId = getCurrentUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      grade: true,
      preferences: true,
      createdAt: true,
    },
  });

  if (!user) {
    return errorResponse('User not found', 404);
  }

  return successResponse({ user });
});
