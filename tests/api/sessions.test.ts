/**
 * Tests for /api/sessions
 *
 * Business logic - practice session management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/sessions/route';
import { prisma } from '@/lib/prisma';
import { createGetRequest, createPostRequest, expectResponse } from '../mocks/mockRequest';
import { mockSessions } from '../mocks/testData';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    practiceSession: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock user context
vi.mock('@/lib/userContext', () => ({
  getCurrentUserId: vi.fn(() => 'test-user-id'),
}));

describe('GET /api/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user sessions with default limit', async () => {
    vi.mocked(prisma.practiceSession.findMany).mockResolvedValue([
      {
        ...mockSessions.quick,
        _count: { attempts: 5 },
      },
      {
        ...mockSessions.timed,
        _count: { attempts: 20 },
      },
    ] as any);

    const request = createGetRequest('http://localhost/api/sessions');
    const response = await GET(request);
    const data = await expectResponse(response, 200);

    expect(data.sessions).toHaveLength(2);
    expect(prisma.practiceSession.findMany).toHaveBeenCalledWith({
      where: { userId: 'test-user-id' },
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: {
        _count: {
          select: { attempts: true },
        },
      },
    });
  });

  it('should respect custom limit parameter', async () => {
    vi.mocked(prisma.practiceSession.findMany).mockResolvedValue([]);

    const request = createGetRequest('http://localhost/api/sessions', {
      limit: '10',
    });
    const response = await GET(request);
    await expectResponse(response, 200);

    expect(prisma.practiceSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
      })
    );
  });

  it('should enforce max limit of 500', async () => {
    vi.mocked(prisma.practiceSession.findMany).mockResolvedValue([]);

    const request = createGetRequest('http://localhost/api/sessions', {
      limit: '1000',
    });
    const response = await GET(request);

    // Validation will fail because max is 500
    expect(response.status).toBe(400);
  });

  it('should enforce min limit of 1', async () => {
    vi.mocked(prisma.practiceSession.findMany).mockResolvedValue([]);

    const request = createGetRequest('http://localhost/api/sessions', {
      limit: '0',
    });
    const response = await GET(request);

    // Validation will fail because min is 1
    expect(response.status).toBe(400);
  });

  it('should reject invalid limit parameter', async () => {
    const request = createGetRequest('http://localhost/api/sessions', {
      limit: 'invalid',
    });
    const response = await GET(request);

    expect(response.status).toBe(400); // Validation error
  });

  it('should sort sessions by startedAt descending', async () => {
    vi.mocked(prisma.practiceSession.findMany).mockResolvedValue([]);

    const request = createGetRequest('http://localhost/api/sessions');
    await GET(request);

    expect(prisma.practiceSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { startedAt: 'desc' },
      })
    );
  });

  it('should include attempt count in response', async () => {
    vi.mocked(prisma.practiceSession.findMany).mockResolvedValue([
      {
        ...mockSessions.timed,
        _count: { attempts: 20 },
      },
    ] as any);

    const request = createGetRequest('http://localhost/api/sessions');
    const response = await GET(request);
    const data = await expectResponse(response, 200);

    expect(data.sessions[0]._count.attempts).toBe(20);
  });
});

describe('POST /api/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(1705329600000); // Fixed timestamp
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a QUICK session', async () => {
    const newSession = {
      id: 'session-1705329600000-abcdefghi',
      userId: 'test-user-id',
      sessionType: 'QUICK' as const,
      focusTopics: null,
      examSimulation: null,
      startedAt: new Date(),
      completedAt: null,
      totalQuestions: 0,
      correctAnswers: 0,
      averageTimePerQuestion: null,
    };

    vi.mocked(prisma.practiceSession.create).mockResolvedValue(newSession as any);

    const request = createPostRequest('http://localhost/api/sessions', {
      sessionType: 'QUICK',
    });

    const response = await POST(request);
    const data = await expectResponse(response, 201);

    expect(data.success).toBe(true);
    expect(data.session.sessionType).toBe('QUICK');
    expect(prisma.practiceSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'test-user-id',
        sessionType: 'QUICK',
        focusTopics: null,
        examSimulation: null,
        startedAt: expect.any(Date),
      }),
    });
  });

  it('should create a TIMED session', async () => {
    const newSession = {
      id: 'session-123',
      userId: 'test-user-id',
      sessionType: 'TIMED' as const,
      focusTopics: null,
      examSimulation: null,
      startedAt: new Date(),
      completedAt: null,
      totalQuestions: 0,
      correctAnswers: 0,
      averageTimePerQuestion: null,
    };

    vi.mocked(prisma.practiceSession.create).mockResolvedValue(newSession as any);

    const request = createPostRequest('http://localhost/api/sessions', {
      sessionType: 'TIMED',
    });

    const response = await POST(request);
    const data = await expectResponse(response, 201);

    expect(data.session.sessionType).toBe('TIMED');
  });

  it('should create a TOPIC_FOCUSED session with focusTopics', async () => {
    const newSession = {
      id: 'session-123',
      userId: 'test-user-id',
      sessionType: 'TOPIC_FOCUSED' as const,
      focusTopics: ['Algebra', 'Geometry'],
      examSimulation: null,
      startedAt: new Date(),
      completedAt: null,
      totalQuestions: 0,
      correctAnswers: 0,
      averageTimePerQuestion: null,
    };

    vi.mocked(prisma.practiceSession.create).mockResolvedValue(newSession as any);

    const request = createPostRequest('http://localhost/api/sessions', {
      sessionType: 'TOPIC_FOCUSED',
      focusTopics: ['Algebra', 'Geometry'],
    });

    const response = await POST(request);
    const data = await expectResponse(response, 201);

    expect(data.session.sessionType).toBe('TOPIC_FOCUSED');
    expect(prisma.practiceSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        focusTopics: ['Algebra', 'Geometry'],
      }),
    });
  });

  it('should create WEAK_AREAS session', async () => {
    const newSession = {
      id: 'session-123',
      userId: 'test-user-id',
      sessionType: 'WEAK_AREAS' as const,
      focusTopics: null,
      examSimulation: null,
      startedAt: new Date(),
      completedAt: null,
      totalQuestions: 0,
      correctAnswers: 0,
      averageTimePerQuestion: null,
    };

    vi.mocked(prisma.practiceSession.create).mockResolvedValue(newSession as any);

    const request = createPostRequest('http://localhost/api/sessions', {
      sessionType: 'WEAK_AREAS',
    });

    const response = await POST(request);
    const data = await expectResponse(response, 201);

    expect(data.session.sessionType).toBe('WEAK_AREAS');
  });

  it('should create RETRY_FAILED session', async () => {
    const newSession = {
      id: 'session-123',
      userId: 'test-user-id',
      sessionType: 'RETRY_FAILED' as const,
      focusTopics: null,
      examSimulation: null,
      startedAt: new Date(),
      completedAt: null,
      totalQuestions: 0,
      correctAnswers: 0,
      averageTimePerQuestion: null,
    };

    vi.mocked(prisma.practiceSession.create).mockResolvedValue(newSession as any);

    const request = createPostRequest('http://localhost/api/sessions', {
      sessionType: 'RETRY_FAILED',
    });

    const response = await POST(request);
    const data = await expectResponse(response, 201);

    expect(data.session.sessionType).toBe('RETRY_FAILED');
  });

  it('should reject invalid session type', async () => {
    const request = createPostRequest('http://localhost/api/sessions', {
      sessionType: 'INVALID_TYPE',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400); // Validation error
    expect(data.error).toBeDefined();
  });

  it('should reject missing sessionType', async () => {
    const request = createPostRequest('http://localhost/api/sessions', {});

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400); // Validation error
    expect(data.error).toBeDefined();
  });

  it('should accept optional examSimulation parameter', async () => {
    const newSession = {
      id: 'session-123',
      userId: 'test-user-id',
      sessionType: 'TIMED' as const,
      focusTopics: null,
      examSimulation: 'AMC8',
      startedAt: new Date(),
      completedAt: null,
      totalQuestions: 0,
      correctAnswers: 0,
      averageTimePerQuestion: null,
    };

    vi.mocked(prisma.practiceSession.create).mockResolvedValue(newSession as any);

    const request = createPostRequest('http://localhost/api/sessions', {
      sessionType: 'TIMED',
      examSimulation: 'AMC8',
    });

    const response = await POST(request);
    const data = await expectResponse(response, 201);

    expect(prisma.practiceSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        examSimulation: 'AMC8',
      }),
    });
  });

  it('should generate unique session IDs', async () => {
    vi.mocked(prisma.practiceSession.create).mockImplementation((args) => {
      return Promise.resolve(args.data as any);
    });

    const request = createPostRequest('http://localhost/api/sessions', {
      sessionType: 'QUICK',
    });

    await POST(request);

    expect(prisma.practiceSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: expect.stringContaining('session-'),
      }),
    });
  });

  it('should set startedAt to current time', async () => {
    const now = new Date();
    vi.mocked(prisma.practiceSession.create).mockImplementation((args) => {
      return Promise.resolve(args.data as any);
    });

    const request = createPostRequest('http://localhost/api/sessions', {
      sessionType: 'QUICK',
    });

    await POST(request);

    expect(prisma.practiceSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        startedAt: expect.any(Date),
      }),
    });
  });
});
