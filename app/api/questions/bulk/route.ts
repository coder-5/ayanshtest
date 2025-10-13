import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * POST /api/questions/bulk
 *
 * Bulk operations for questions:
 * - action: 'update' - Update multiple questions (topic, difficulty, examName, etc.)
 * - action: 'delete' - Soft delete multiple questions
 */

// Validation schemas
const bulkUpdateSchema = z.object({
  action: z.literal('update'),
  questionIds: z.array(z.string()).min(1).max(100), // Max 100 questions at once
  updates: z.object({
    topic: z.string().optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).optional(),
    examName: z.string().optional(),
    examYear: z.number().optional(),
  }),
});

const bulkDeleteSchema = z.object({
  action: z.literal('delete'),
  questionIds: z.array(z.string()).min(1).max(100),
});

const bulkActionSchema = z.discriminatedUnion('action', [bulkUpdateSchema, bulkDeleteSchema]);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request
    const validation = bulkActionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.format() },
        { status: 400 }
      );
    }

    const data = validation.data;

    if (data.action === 'update') {
      return await handleBulkUpdate(data);
    } else if (data.action === 'delete') {
      return await handleBulkDelete(data);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Bulk operation error:', error);
    return NextResponse.json({ error: 'Bulk operation failed' }, { status: 500 });
  }
}

async function handleBulkUpdate(data: z.infer<typeof bulkUpdateSchema>) {
  const { questionIds, updates } = data;

  // Verify all questions exist and are not deleted
  const questions = await prisma.question.findMany({
    where: {
      id: { in: questionIds },
      deletedAt: null,
    },
    select: { id: true },
  });

  if (questions.length !== questionIds.length) {
    const foundIds = new Set(questions.map((q) => q.id));
    const missingIds = questionIds.filter((id) => !foundIds.has(id));
    return NextResponse.json(
      {
        error: 'Some questions not found or already deleted',
        missingIds,
      },
      { status: 404 }
    );
  }

  // Perform bulk update
  const result = await prisma.question.updateMany({
    where: {
      id: { in: questionIds },
      deletedAt: null,
    },
    data: {
      ...updates,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    action: 'update',
    updatedCount: result.count,
    updates,
  });
}

async function handleBulkDelete(data: z.infer<typeof bulkDeleteSchema>) {
  const { questionIds } = data;

  // Check if any questions have attempts (can't delete if they do)
  const questionsWithAttempts = await prisma.question.findMany({
    where: {
      id: { in: questionIds },
      deletedAt: null,
      attempts: {
        some: {
          deletedAt: null,
        },
      },
    },
    select: {
      id: true,
      _count: {
        select: {
          attempts: true,
        },
      },
    },
  });

  if (questionsWithAttempts.length > 0) {
    return NextResponse.json(
      {
        error: 'Cannot delete questions with user attempts',
        questionsWithAttempts: questionsWithAttempts.map((q) => ({
          id: q.id,
          attemptCount: q._count.attempts,
        })),
        message:
          'Questions with attempts can only be soft-deleted to preserve history. They already have deletedAt set.',
      },
      { status: 400 }
    );
  }

  // Perform bulk soft delete
  const result = await prisma.question.updateMany({
    where: {
      id: { in: questionIds },
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    action: 'delete',
    deletedCount: result.count,
  });
}
