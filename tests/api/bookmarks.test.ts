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

vi.mock('@/lib/prisma', () => ({
  prisma: {
    bookmark: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/userContext', () => ({
  getCurrentUserId: vi.fn(() => 'test-user-id'),
}));

describe('GET /api/bookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user bookmarks with question details', async () => {
    vi.mocked(prisma.bookmark.findMany).mockResolvedValue([
      {
        id: 'bm-1',
        userId: 'test-user-id',
        questionId: 'q-1',
        createdAt: new Date(),
        question: {
          id: 'q-1',
          questionText: 'What is 2+2?',
          topic: 'Algebra',
          difficulty: 'EASY',
        },
      },
    ] as any);

    const request = createGetRequest('http://localhost/api/bookmarks');
    const response = await GET(request);
    const data = await expectResponse(response, 200);

    expect(data.bookmarks).toHaveLength(1);
    expect(data.bookmarks[0].question.questionText).toBe('What is 2+2?');
  });

  it('should sort bookmarks by createdAt desc', async () => {
    vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);

    await GET(createGetRequest('http://localhost/api/bookmarks'));

    expect(prisma.bookmark.findMany).toHaveBeenCalledWith({
      where: { userId: 'test-user-id' },
      include: { question: true },
      orderBy: { createdAt: 'desc' },
    });
  });
});

describe('POST /api/bookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a bookmark', async () => {
    vi.mocked(prisma.bookmark.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.bookmark.create).mockResolvedValue({
      id: 'bm-1',
      userId: 'test-user-id',
      questionId: 'q-1',
      createdAt: new Date(),
    } as any);

    const request = createPostRequest('http://localhost/api/bookmarks', {
      questionId: 'q-1',
    });

    const response = await POST(request);
    const data = await expectResponse(response, 201);

    expect(data.success).toBe(true);
    expect(data.bookmark.questionId).toBe('q-1');
  });

  it('should prevent duplicate bookmarks', async () => {
    vi.mocked(prisma.bookmark.findFirst).mockResolvedValue({
      id: 'bm-1',
      userId: 'test-user-id',
      questionId: 'q-1',
      createdAt: new Date(),
    } as any);

    const request = createPostRequest('http://localhost/api/bookmarks', {
      questionId: 'q-1',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('Bookmark already exists');
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
    vi.mocked(prisma.bookmark.findFirst).mockResolvedValue({
      id: 'bm-1',
      userId: 'test-user-id',
      questionId: 'q-1',
      createdAt: new Date(),
    } as any);

    vi.mocked(prisma.bookmark.delete).mockResolvedValue({} as any);

    const request = new Request('http://localhost/api/bookmarks?questionId=q-1', {
      method: 'DELETE',
    });

    const response = await DELETE(request);
    const data = await expectResponse(response, 200);

    expect(data.success).toBe(true);
  });

  it('should return 404 if bookmark not found', async () => {
    vi.mocked(prisma.bookmark.findFirst).mockResolvedValue(null);

    const request = new Request('http://localhost/api/bookmarks?questionId=q-1', {
      method: 'DELETE',
    });

    const response = await DELETE(request);

    expect(response.status).toBe(404);
  });
});
