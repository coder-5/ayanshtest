import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/userContext';
import { withErrorHandler, successResponse } from '@/lib/error-handler';

export const PUT = withErrorHandler(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const userId = getCurrentUserId();
    const { id } = await params;
    const body = await request.json();
    const { status, score, percentile, notes } = body;

    // Verify exam belongs to current user and is not deleted
    const existingExam = await prisma.examSchedule.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existingExam) {
      return NextResponse.json({ error: 'Exam not found or access denied' }, { status: 404 });
    }

    const exam = await prisma.examSchedule.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(score !== undefined && { score }),
        ...(percentile !== undefined && { percentile }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date(),
      },
    });

    return successResponse({ success: true, exam });
  }
);

export const DELETE = withErrorHandler(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const userId = getCurrentUserId();
    const { id } = await params;

    // Verify exam belongs to current user and is not already deleted
    const existingExam = await prisma.examSchedule.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existingExam) {
      return NextResponse.json({ error: 'Exam not found or access denied' }, { status: 404 });
    }

    // Soft delete: Set deletedAt timestamp
    await prisma.examSchedule.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return successResponse({ success: true });
  }
);
