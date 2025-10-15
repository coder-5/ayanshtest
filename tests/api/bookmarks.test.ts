/**
 * Tests for /api/bookmarks
 *
 * Feature tests - bookmark management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, DELETE } from '@/app/api/bookmarks/route';
import { prisma } from '@/lib/prisma';
import {
  createGetRequest,
  createPostRequest,
  createDeleteRequest,
  expectResponse,
} from '../mocks/mockRequest';

// Response types
interface BookmarksGetResponse {
  success: boolean;
  bookmarks: Array<{
    id: string;
    userId: string;
    questionId: string;
    note?: string | null;
    createdAt: Date;
    question: {
      id: string;
      questionText: string;
      topic: string | null;
      difficulty: string;
      examName?: string | null;
      questionNumber?: string | null;
      hasImage?: boolean;
      imageUrl?: string | null;
      options?: unknown[];
    };
  }>;
  total: number;
}

interface BookmarkPostResponse {
  success: boolean;
  bookmark: {
    id: string;
    userId: string;
    questionId: string;
    note?: string | null;
    createdAt: Date;
  };
  message: string;
}

interface BookmarkDeleteResponse {
  success: boolean;
  message: string;
}

vi.mock('@/lib/prisma', () => ({
  prisma: {
    questionBookmark: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    question: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/userContext', () => ({
  'user-ayansh': vi.fn(() => 'test-user-id'),
}));

describe('GET /api/bookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user bookmarks with question details', async () => {
    vi.mocked(prisma.questionBookmark.findMany).mockResolvedValue([
      {
        id: 'bm-1',
        userId: 'test-user-id',
        questionId: 'q-1',
        note: null,
        createdAt: new Date(),
        question: {
          id: 'q-1',
          questionText: 'What is 2+2?',
          topic: 'Algebra',
          difficulty: 'EASY',
          examName: 'AMC8',
          questionNumber: '1',
          hasImage: false,
          imageUrl: null,
          options: [],
        },
      },
    ] as any);

    const response = await GET();
    const data = await expectResponse<BookmarksGetResponse>(response, 200);

    expect(data.success).toBe(true);
    expect(data.bookmarks).toHaveLength(1);
    expect(data.total).toBe(1);
    expect(data.bookmarks[0]!.question.questionText).toBe('What is 2+2?');
  });

  it('should sort bookmarks by createdAt desc', async () => {
    vi.mocked(prisma.questionBookmark.findMany).mockResolvedValue([]);

    await GET();

    expect(prisma.questionBookmark.findMany).toHaveBeenCalledWith({
      where: { userId: 'test-user-id' },
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
      orderBy: { createdAt: 'desc' },
    });
  });
});

describe('POST /api/bookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a bookmark', async () => {
    vi.mocked(prisma.questionBookmark.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.question.findUnique).mockResolvedValue({
      id: 'q-1',
      questionText: 'What is 2+2?',
      deletedAt: null,
    } as any);
    vi.mocked(prisma.questionBookmark.create).mockResolvedValue({
      id: 'bm-1',
      userId: 'test-user-id',
      questionId: 'q-1',
      createdAt: new Date(),
    } as any);

    const request = createPostRequest('http://localhost/api/bookmarks', {
      questionId: 'q-1',
    });

    const response = await POST(request);
    const data = await expectResponse<BookmarkPostResponse>(response, 201);

    expect(data.success).toBe(true);
    expect(data.bookmark.questionId).toBe('q-1');
    expect(data.message).toBe('Bookmark created successfully');
  });

  it('should prevent duplicate bookmarks', async () => {
    vi.mocked(prisma.questionBookmark.findUnique).mockResolvedValue({
      id: 'bm-1',
      userId: 'test-user-id',
      questionId: 'q-1',
      note: null,
      createdAt: new Date(),
    } as any);

    const request = createPostRequest('http://localhost/api/bookmarks', {
      questionId: 'q-1',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('Question already bookmarked');
  });

  it('should reject missing questionId', async () => {
    const request = createPostRequest('http://localhost/api/bookmarks', {});

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});

describe('DELETE /api/bookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete a bookmark', async () => {
    vi.mocked(prisma.questionBookmark.findUnique).mockResolvedValue({
      id: 'bm-1',
      userId: 'test-user-id',
      questionId: 'q-1',
      note: null,
      createdAt: new Date(),
    } as any);

    vi.mocked(prisma.questionBookmark.delete).mockResolvedValue({} as any);

    const request = new Request('http://localhost/api/bookmarks?questionId=q-1', {
      method: 'DELETE',
    });

    const response = await DELETE(request);
    const data = await expectResponse<BookmarkDeleteResponse>(response, 200);

    expect(data.success).toBe(true);
    expect(data.message).toBe('Bookmark deleted successfully');
  });

  it('should return 404 if bookmark not found', async () => {
    vi.mocked(prisma.questionBookmark.findUnique).mockResolvedValue(null);

    const request = new Request('http://localhost/api/bookmarks?questionId=q-1', {
      method: 'DELETE',
    });

    const response = await DELETE(request);

    expect(response.status).toBe(404);
  });
});
