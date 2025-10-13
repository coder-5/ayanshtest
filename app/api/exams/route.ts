import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { getCurrentUserId } from '@/lib/userContext';
import { examScheduleSchema } from '@/lib/validation';
import { withErrorHandler, successResponse } from '@/lib/error-handler';

export const GET = withErrorHandler(async () => {
  const userId = getCurrentUserId();
  const exams = await prisma.examSchedule.findMany({
    where: {
      userId,
      deletedAt: null, // Only return active exams
    },
    orderBy: {
      examDate: 'asc',
    },
  });

  return successResponse({ exams });
});

export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();

  // Validate request body
  const validated = examScheduleSchema.parse(body);

  const userId = getCurrentUserId();

  const exam = await prisma.examSchedule.create({
    data: {
      id: `exam-${nanoid(21)}`,
      userId,
      examName: validated.examName,
      examDate: new Date(validated.examDate),
      location: validated.location,
      notes: validated.notes,
      status: 'UPCOMING',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return successResponse({ success: true, exam });
});
