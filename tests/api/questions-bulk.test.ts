/**
 * Tests for /api/questions/bulk endpoint
 *
 * Critical tests for bulk update and delete operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/questions/bulk/route';
import { prisma } from '@/lib/prisma';
import { createPostRequest, expectResponse } from '../mocks/mockRequest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    question: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    $disconnect: vi.fn(),
  },
}));

// Mock cache
vi.mock('@/lib/cache', () => ({
  cache: {
    invalidatePattern: vi.fn(),
    invalidate: vi.fn(),
  },
}));

describe('POST /api/questions/bulk - Bulk Update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should bulk update questions successfully', async () => {
    const questionIds = ['q1', 'q2', 'q3'];

    // Mock finding all questions
    vi.mocked(prisma.question.findMany).mockResolvedValue(questionIds.map((id) => ({ id })) as any);

    // Mock update
    vi.mocked(prisma.question.updateMany).mockResolvedValue({ count: 3 });

    const request = createPostRequest('http://localhost/api/questions/bulk', {
      action: 'update',
      questionIds,
      updates: {
        topic: 'Geometry',
        difficulty: 'HARD',
      },
    });

    const response = await POST(request);
    const data = await expectResponse(response, 200);

    expect(data.success).toBe(true);
    expect(data.action).toBe('update');
    expect(data.updatedCount).toBe(3);
    expect(data.updates).toEqual({
      topic: 'Geometry',
      difficulty: 'HARD',
    });

    expect(prisma.question.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: questionIds },
        deletedAt: null,
      },
      data: {
        topic: 'Geometry',
        difficulty: 'HARD',
        updatedAt: expect.any(Date),
      },
    });
  });

  it('should enforce max 100 questions limit for bulk update', async () => {
    const questionIds = Array.from({ length: 101 }, (_, i) => `q${i}`);

    const request = createPostRequest('http://localhost/api/questions/bulk', {
      action: 'update',
      questionIds,
      updates: { topic: 'Algebra' },
    });

    const response = await POST(request);
    const data = await expectResponse(response, 400);

    expect(data.error).toBe('Invalid request');
    expect(prisma.question.updateMany).not.toHaveBeenCalled();
  });

  it('should require at least one question ID', async () => {
    const request = createPostRequest('http://localhost/api/questions/bulk', {
      action: 'update',
      questionIds: [],
      updates: { topic: 'Algebra' },
    });

    const response = await POST(request);
    const data = await expectResponse(response, 400);

    expect(data.error).toBe('Invalid request');
  });

  it('should return 404 if some questions not found', async () => {
    const questionIds = ['q1', 'q2', 'q3'];

    // Only 2 questions found
    vi.mocked(prisma.question.findMany).mockResolvedValue([{ id: 'q1' }, { id: 'q2' }] as any);

    const request = createPostRequest('http://localhost/api/questions/bulk', {
      action: 'update',
      questionIds,
      updates: { topic: 'Geometry' },
    });

    const response = await POST(request);
    const data = await expectResponse(response, 404);

    expect(data.error).toContain('not found');
    expect(data.missingIds).toEqual(['q3']);
    expect(prisma.question.updateMany).not.toHaveBeenCalled();
  });

  it('should update only specific fields', async () => {
    const questionIds = ['q1'];

    vi.mocked(prisma.question.findMany).mockResolvedValue([{ id: 'q1' }] as any);
    vi.mocked(prisma.question.updateMany).mockResolvedValue({ count: 1 });

    const request = createPostRequest('http://localhost/api/questions/bulk', {
      action: 'update',
      questionIds,
      updates: {
        difficulty: 'EXPERT',
      },
    });

    const response = await POST(request);
    await expectResponse(response, 200);

    expect(prisma.question.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: questionIds },
        deletedAt: null,
      },
      data: {
        difficulty: 'EXPERT',
        updatedAt: expect.any(Date),
      },
    });
  });

  it('should validate difficulty enum', async () => {
    const request = createPostRequest('http://localhost/api/questions/bulk', {
      action: 'update',
      questionIds: ['q1'],
      updates: {
        difficulty: 'SUPER_HARD', // Invalid
      },
    });

    const response = await POST(request);
    const data = await expectResponse(response, 400);

    expect(data.error).toBe('Invalid request');
  });

  it('should invalidate caches after bulk update', async () => {
    const { cache } = await import('@/lib/cache');
    const questionIds = ['q1'];

    vi.mocked(prisma.question.findMany).mockResolvedValue([{ id: 'q1' }] as any);
    vi.mocked(prisma.question.updateMany).mockResolvedValue({ count: 1 });

    const request = createPostRequest('http://localhost/api/questions/bulk', {
      action: 'update',
      questionIds,
      updates: { topic: 'Algebra' },
    });

    await POST(request);

    expect(cache.invalidatePattern).toHaveBeenCalledWith('questions:');
    expect(cache.invalidate).toHaveBeenCalledWith('question_counts');
    expect(cache.invalidate).toHaveBeenCalledWith('topics:all');
    expect(cache.invalidatePattern).toHaveBeenCalledWith('exams:');
  });
});

describe('POST /api/questions/bulk - Bulk Delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should bulk soft-delete questions successfully', async () => {
    const questionIds = ['q1', 'q2'];

    // Mock check for attempts - no attempts found
    vi.mocked(prisma.question.findMany).mockResolvedValue([]);

    // Mock delete
    vi.mocked(prisma.question.updateMany).mockResolvedValue({ count: 2 });

    const request = createPostRequest('http://localhost/api/questions/bulk', {
      action: 'delete',
      questionIds,
    });

    const response = await POST(request);
    const data = await expectResponse(response, 200);

    expect(data.success).toBe(true);
    expect(data.action).toBe('delete');
    expect(data.deletedCount).toBe(2);

    expect(prisma.question.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: questionIds },
        deletedAt: null,
      },
      data: {
        deletedAt: expect.any(Date),
      },
    });
  });

  it('should prevent deletion of questions with user attempts', async () => {
    const questionIds = ['q1', 'q2'];

    // Mock questions with attempts
    vi.mocked(prisma.question.findMany).mockResolvedValue([
      {
        id: 'q1',
        _count: { attempts: 5 },
      },
    ] as any);

    const request = createPostRequest('http://localhost/api/questions/bulk', {
      action: 'delete',
      questionIds,
    });

    const response = await POST(request);
    const data = await expectResponse(response, 400);

    expect(data.error).toContain('Cannot delete questions with user attempts');
    expect(data.questionsWithAttempts).toEqual([
      {
        id: 'q1',
        attemptCount: 5,
      },
    ]);

    expect(prisma.question.updateMany).not.toHaveBeenCalled();
  });

  it('should enforce max 100 questions limit for bulk delete', async () => {
    const questionIds = Array.from({ length: 101 }, (_, i) => `q${i}`);

    const request = createPostRequest('http://localhost/api/questions/bulk', {
      action: 'delete',
      questionIds,
    });

    const response = await POST(request);
    const data = await expectResponse(response, 400);

    expect(data.error).toBe('Invalid request');
  });

  it('should require at least one question ID for delete', async () => {
    const request = createPostRequest('http://localhost/api/questions/bulk', {
      action: 'delete',
      questionIds: [],
    });

    const response = await POST(request);
    const data = await expectResponse(response, 400);

    expect(data.error).toBe('Invalid request');
  });

  it('should only soft-delete (set deletedAt)', async () => {
    const questionIds = ['q1'];

    vi.mocked(prisma.question.findMany).mockResolvedValue([]);
    vi.mocked(prisma.question.updateMany).mockResolvedValue({ count: 1 });

    const request = createPostRequest('http://localhost/api/questions/bulk', {
      action: 'delete',
      questionIds,
    });

    await POST(request);

    // Verify it's an UPDATE not DELETE
    expect(prisma.question.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { deletedAt: expect.any(Date) },
      })
    );
  });

  it('should invalidate caches after bulk delete', async () => {
    const { cache } = await import('@/lib/cache');
    const questionIds = ['q1'];

    vi.mocked(prisma.question.findMany).mockResolvedValue([]);
    vi.mocked(prisma.question.updateMany).mockResolvedValue({ count: 1 });

    const request = createPostRequest('http://localhost/api/questions/bulk', {
      action: 'delete',
      questionIds,
    });

    await POST(request);

    expect(cache.invalidatePattern).toHaveBeenCalledWith('questions:');
    expect(cache.invalidate).toHaveBeenCalledWith('question_counts');
  });
});

describe('POST /api/questions/bulk - Input Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject invalid action', async () => {
    const request = createPostRequest('http://localhost/api/questions/bulk', {
      action: 'invalid',
      questionIds: ['q1'],
    });

    const response = await POST(request);
    const data = await expectResponse(response, 400);

    expect(data.error).toBe('Invalid request');
  });

  it('should reject missing action field', async () => {
    const request = createPostRequest('http://localhost/api/questions/bulk', {
      questionIds: ['q1'],
    });

    const response = await POST(request);
    const data = await expectResponse(response, 400);

    expect(data.error).toBe('Invalid request');
  });

  it('should reject update without updates field', async () => {
    const request = createPostRequest('http://localhost/api/questions/bulk', {
      action: 'update',
      questionIds: ['q1'],
      // Missing 'updates'
    });

    const response = await POST(request);
    const data = await expectResponse(response, 400);

    expect(data.error).toBe('Invalid request');
  });

  it('should reject non-array questionIds', async () => {
    const request = createPostRequest('http://localhost/api/questions/bulk', {
      action: 'delete',
      questionIds: 'not-an-array',
    });

    const response = await POST(request);
    const data = await expectResponse(response, 400);

    expect(data.error).toBe('Invalid request');
  });
});
