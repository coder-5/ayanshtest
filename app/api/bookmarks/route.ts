import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler, successResponse } from '@/lib/error-handler';
import { USER_ID } from '@/lib/constants';

// GET - Fetch all bookmarks for the user
export const GET = withErrorHandler(async () => {
  const userId = USER_ID;

  const bookmarks = await prisma.questionBookmark.findMany({
    where: {
      userId,
    },
    include: {
      question: {
        select: {
          id: true,
          questionText: true,
          topic: true,
          difficulty: true,
          examName: true,
          questionNumber: true,
          hasImage: true,
          imageUrl: true,
          options: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return successResponse({ success: true, bookmarks, total: bookmarks.length });
});

// POST - Create a new bookmark
export const POST = withErrorHandler(async (request: Request) => {
  const userId = USER_ID;
  const body = await request.json();

  const { questionId, note } = body;

  if (!questionId) {
    return successResponse({ error: 'questionId is required' }, 400);
  }

  // Check if bookmark already exists
  const existingBookmark = await prisma.questionBookmark.findUnique({
    where: {
      userId_questionId: {
        userId,
        questionId,
      },
    },
  });

  if (existingBookmark) {
    return successResponse({ error: 'Question already bookmarked' }, 409);
  }

  // Check if question exists
  const question = await prisma.question.findUnique({
    where: { id: questionId, deletedAt: null },
  });

  if (!question) {
    return successResponse({ error: 'Question not found' }, 404);
  }

  const bookmark = await prisma.questionBookmark.create({
    data: {
      userId,
      questionId,
      note: note || null,
    },
    include: {
      question: {
        select: {
          id: true,
          questionText: true,
          topic: true,
          difficulty: true,
          examName: true,
          questionNumber: true,
        },
      },
    },
  });

  return successResponse(
    { success: true, bookmark, message: 'Bookmark created successfully' },
    201
  );
});

// DELETE - Remove a bookmark
export const DELETE = withErrorHandler(async (request: Request) => {
  const userId = USER_ID;
  const { searchParams } = new URL(request.url);
  const questionId = searchParams.get('questionId');

  if (!questionId) {
    return successResponse({ error: 'questionId is required' }, 400);
  }

  const bookmark = await prisma.questionBookmark.findUnique({
    where: {
      userId_questionId: {
        userId,
        questionId,
      },
    },
  });

  if (!bookmark) {
    return successResponse({ error: 'Bookmark not found' }, 404);
  }

  await prisma.questionBookmark.delete({
    where: {
      userId_questionId: {
        userId,
        questionId,
      },
    },
  });

  return successResponse({ success: true, message: 'Bookmark deleted successfully' });
});

// PUT - Update bookmark note
export const PUT = withErrorHandler(async (request: Request) => {
  const userId = USER_ID;
  const body = await request.json();

  const { questionId, note } = body;

  if (!questionId) {
    return successResponse({ error: 'questionId is required' }, 400);
  }

  const bookmark = await prisma.questionBookmark.findUnique({
    where: {
      userId_questionId: {
        userId,
        questionId,
      },
    },
  });

  if (!bookmark) {
    return successResponse({ error: 'Bookmark not found' }, 404);
  }

  const updated = await prisma.questionBookmark.update({
    where: {
      userId_questionId: {
        userId,
        questionId,
      },
    },
    data: {
      note: note || null,
    },
    include: {
      question: {
        select: {
          id: true,
          questionText: true,
          topic: true,
          difficulty: true,
        },
      },
    },
  });

  return successResponse({ bookmark: updated, message: 'Bookmark updated successfully' });
});
