/**
 * Tests for /api/progress
 *
 * Business logic - progress tracking and statistics
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/progress/route';
import { prisma } from '@/lib/prisma';
import { expectResponse } from '../mocks/mockRequest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    userAttempt: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    dailyProgress: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    topicPerformance: {
      findMany: vi.fn(),
    },
    practiceSession: {
      findMany: vi.fn(),
    },
  },
}));

// Mock user context
vi.mock('@/lib/userContext', () => ({
  getCurrentUserId: vi.fn(() => 'test-user-id'),
}));

describe('GET /api/progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return overall statistics', async () => {
    // Mock total questions
    vi.mocked(prisma.userAttempt.count)
      .mockResolvedValueOnce(100) // Total attempts
      .mockResolvedValueOnce(75); // Correct attempts

    // Mock daily progress
    vi.mocked(prisma.dailyProgress.findMany).mockResolvedValue([]);
    vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue({
      id: 'dp-1',
      userId: 'test-user-id',
      date: new Date(),
      questionsAttempted: 10,
      correctAnswers: 8,
      totalTimeSpent: 600,
      topicsStudied: ['Algebra'],
      streakDays: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    vi.mocked(prisma.topicPerformance.findMany).mockResolvedValue([]);
    vi.mocked(prisma.practiceSession.findMany).mockResolvedValue([]);
    vi.mocked(prisma.userAttempt.findMany).mockResolvedValue([]);

    const response = await GET();
    const data = await expectResponse(response, 200);

    expect(data.overall).toBeDefined();
    expect(data.overall.totalQuestions).toBe(100);
    expect(data.overall.correctAnswers).toBe(75);
    expect(data.overall.accuracy).toBe(75);
  });

  it('should calculate accuracy correctly', async () => {
    vi.mocked(prisma.userAttempt.count)
      .mockResolvedValueOnce(50) // Total
      .mockResolvedValueOnce(30); // Correct

    vi.mocked(prisma.dailyProgress.findMany).mockResolvedValue([]);
    vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.topicPerformance.findMany).mockResolvedValue([]);
    vi.mocked(prisma.practiceSession.findMany).mockResolvedValue([]);
    vi.mocked(prisma.userAttempt.findMany).mockResolvedValue([]);

    const response = await GET();
    const data = await expectResponse(response, 200);

    expect(data.overall.accuracy).toBe(60); // 30/50 * 100
  });

  it('should handle zero attempts gracefully', async () => {
    vi.mocked(prisma.userAttempt.count).mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    vi.mocked(prisma.dailyProgress.findMany).mockResolvedValue([]);
    vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.topicPerformance.findMany).mockResolvedValue([]);
    vi.mocked(prisma.practiceSession.findMany).mockResolvedValue([]);
    vi.mocked(prisma.userAttempt.findMany).mockResolvedValue([]);

    const response = await GET();
    const data = await expectResponse(response, 200);

    expect(data.overall.totalQuestions).toBe(0);
    expect(data.overall.correctAnswers).toBe(0);
    expect(data.overall.accuracy).toBe(0);
  });

  it('should return current streak', async () => {
    vi.mocked(prisma.userAttempt.count).mockResolvedValue(0);

    vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue({
      id: 'dp-1',
      userId: 'test-user-id',
      date: new Date(),
      questionsAttempted: 10,
      correctAnswers: 8,
      totalTimeSpent: 600,
      topicsStudied: ['Algebra'],
      streakDays: 7,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    vi.mocked(prisma.dailyProgress.findMany).mockResolvedValue([]);
    vi.mocked(prisma.topicPerformance.findMany).mockResolvedValue([]);
    vi.mocked(prisma.practiceSession.findMany).mockResolvedValue([]);
    vi.mocked(prisma.userAttempt.findMany).mockResolvedValue([]);

    const response = await GET();
    const data = await expectResponse(response, 200);

    expect(data.overall.currentStreak).toBe(7);
  });

  it('should default streak to 0 if no daily progress', async () => {
    vi.mocked(prisma.userAttempt.count).mockResolvedValue(0);
    vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.dailyProgress.findMany).mockResolvedValue([]);
    vi.mocked(prisma.topicPerformance.findMany).mockResolvedValue([]);
    vi.mocked(prisma.practiceSession.findMany).mockResolvedValue([]);
    vi.mocked(prisma.userAttempt.findMany).mockResolvedValue([]);

    const response = await GET();
    const data = await expectResponse(response, 200);

    expect(data.overall.currentStreak).toBe(0);
  });

  it('should return daily progress for last 30 days', async () => {
    vi.mocked(prisma.userAttempt.count).mockResolvedValue(0);
    vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);

    vi.mocked(prisma.dailyProgress.findMany).mockResolvedValue([
      {
        id: 'dp-1',
        userId: 'test-user-id',
        date: new Date('2024-01-15'),
        questionsAttempted: 10,
        correctAnswers: 8,
        totalTimeSpent: 600,
        topicsStudied: ['Algebra'],
        streakDays: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'dp-2',
        userId: 'test-user-id',
        date: new Date('2024-01-14'),
        questionsAttempted: 15,
        correctAnswers: 12,
        totalTimeSpent: 900,
        topicsStudied: ['Geometry'],
        streakDays: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    vi.mocked(prisma.topicPerformance.findMany).mockResolvedValue([]);
    vi.mocked(prisma.practiceSession.findMany).mockResolvedValue([]);
    vi.mocked(prisma.userAttempt.findMany).mockResolvedValue([]);

    const response = await GET();
    const data = await expectResponse(response, 200);

    expect(data.dailyProgress).toHaveLength(2);
  });

  it('should return topic performance', async () => {
    vi.mocked(prisma.userAttempt.count).mockResolvedValue(0);
    vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.dailyProgress.findMany).mockResolvedValue([]);

    vi.mocked(prisma.topicPerformance.findMany).mockResolvedValue([
      {
        id: 'tp-1',
        userId: 'test-user-id',
        topic: 'Algebra',
        totalAttempts: 50,
        correctAttempts: 40,
        accuracy: 80,
        lastPracticed: new Date(),
        needsPractice: false,
        masteryLevel: 'PROFICIENT',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    vi.mocked(prisma.practiceSession.findMany).mockResolvedValue([]);
    vi.mocked(prisma.userAttempt.findMany).mockResolvedValue([]);

    const response = await GET();
    const data = await expectResponse(response, 200);

    expect(data.topicPerformance).toHaveLength(1);
    expect(data.topicPerformance[0].topic).toBe('Algebra');
  });

  it('should return recent sessions', async () => {
    vi.mocked(prisma.userAttempt.count).mockResolvedValue(0);
    vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.dailyProgress.findMany).mockResolvedValue([]);
    vi.mocked(prisma.topicPerformance.findMany).mockResolvedValue([]);

    vi.mocked(prisma.practiceSession.findMany).mockResolvedValue([
      {
        id: 'session-1',
        userId: 'test-user-id',
        sessionType: 'QUICK',
        startedAt: new Date(),
        completedAt: null,
        totalQuestions: 10,
        correctAnswers: 8,
        averageTimePerQuestion: 60,
        focusTopics: null,
        examSimulation: null,
      },
    ] as any);

    vi.mocked(prisma.userAttempt.findMany).mockResolvedValue([]);

    const response = await GET();
    const data = await expectResponse(response, 200);

    expect(data.recentSessions).toHaveLength(1);
  });

  it('should calculate recent activity (last 7 days)', async () => {
    vi.mocked(prisma.userAttempt.count).mockResolvedValue(0);
    vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.dailyProgress.findMany).mockResolvedValue([]);
    vi.mocked(prisma.topicPerformance.findMany).mockResolvedValue([]);
    vi.mocked(prisma.practiceSession.findMany).mockResolvedValue([]);

    vi.mocked(prisma.userAttempt.findMany).mockResolvedValue([
      {
        id: 'attempt-1',
        userId: 'test-user-id',
        questionId: 'q-1',
        selectedAnswer: 'A',
        isCorrect: true,
        timeSpent: 60,
        sessionId: null,
        attemptedAt: new Date(),
        deletedAt: null,
      },
      {
        id: 'attempt-2',
        userId: 'test-user-id',
        questionId: 'q-2',
        selectedAnswer: 'B',
        isCorrect: false,
        timeSpent: 45,
        sessionId: null,
        attemptedAt: new Date(),
        deletedAt: null,
      },
    ] as any);

    const response = await GET();
    const data = await expectResponse(response, 200);

    expect(data.recentActivity.questionsAttempted).toBe(2);
    expect(data.recentActivity.correctAnswers).toBe(1);
  });
});
