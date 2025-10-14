/**
 * Tests for /api/recommendations/weak-topics
 *
 * Critical business logic - practice recommendation algorithm
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/recommendations/weak-topics/route';
import { prisma } from '@/lib/prisma';
import { createGetRequest, expectResponse } from '../mocks/mockRequest';

// Response type for weak topics recommendation endpoint
interface WeakTopicsResponse {
  weakTopics: Array<{
    topic: string;
    accuracy: number;
    totalAttempts: number;
    correctAttempts: number;
    lastPracticed: Date | null;
    needsPractice: boolean;
    weaknessScore: number;
    reason: string;
    recommendedQuestions: number;
  }>;
  summary: {
    totalWeakTopics: number;
    topicsReturned: number;
    totalRecommendedQuestions: number;
    criticalTopics: number;
    needsReviewTopics: number;
  };
}

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    topicPerformance: {
      findMany: vi.fn(),
    },
  },
}));

// Mock user context
vi.mock('@/lib/userContext', () => ({
  getCurrentUserId: vi.fn(() => 'test-user-id'),
}));

describe('GET /api/recommendations/weak-topics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should identify topics with accuracy < 70% as weak', async () => {
    vi.mocked(prisma.topicPerformance.findMany).mockResolvedValue([
      {
        id: '1',
        userId: 'test-user-id',
        topic: 'Algebra',
        totalAttempts: 20,
        correctAttempts: 12,
        accuracy: 60,
        lastPracticed: new Date('2024-01-10'),
        needsPractice: false,
        masteryLevel: 'LEARNING',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        userId: 'test-user-id',
        topic: 'Geometry',
        totalAttempts: 30,
        correctAttempts: 27,
        accuracy: 90,
        lastPracticed: new Date('2024-01-14'),
        needsPractice: false,
        masteryLevel: 'PROFICIENT',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    const request = createGetRequest('http://localhost/api/recommendations/weak-topics');
    const response = await GET();
    const data = await expectResponse<WeakTopicsResponse>(response, 200);

    expect(data.weakTopics).toHaveLength(1);
    expect(data.weakTopics[0]!.topic).toBe('Algebra');
    expect(data.weakTopics[0]!.accuracy).toBe(60);
  });

  it('should identify topics marked as needsPractice even with high accuracy', async () => {
    vi.mocked(prisma.topicPerformance.findMany).mockResolvedValue([
      {
        id: '1',
        userId: 'test-user-id',
        topic: 'Number Theory',
        totalAttempts: 15,
        correctAttempts: 13,
        accuracy: 87,
        lastPracticed: new Date('2024-01-12'),
        needsPractice: true,
        masteryLevel: 'PROFICIENT',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    const request = createGetRequest('http://localhost/api/recommendations/weak-topics');
    const response = await GET();
    const data = await expectResponse<WeakTopicsResponse>(response, 200);

    expect(data.weakTopics).toHaveLength(1);
    expect(data.weakTopics[0]!.topic).toBe('Number Theory');
    expect(data.weakTopics[0]!.needsPractice).toBe(true);
  });

  it('should calculate weakness score correctly', async () => {
    vi.mocked(prisma.topicPerformance.findMany).mockResolvedValue([
      {
        id: '1',
        userId: 'test-user-id',
        topic: 'Algebra',
        totalAttempts: 50,
        correctAttempts: 25,
        accuracy: 50,
        lastPracticed: new Date('2024-01-10'),
        needsPractice: false,
        masteryLevel: 'LEARNING',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        userId: 'test-user-id',
        topic: 'Geometry',
        totalAttempts: 20,
        correctAttempts: 12,
        accuracy: 60,
        lastPracticed: new Date('2024-01-12'),
        needsPractice: false,
        masteryLevel: 'LEARNING',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    const request = createGetRequest('http://localhost/api/recommendations/weak-topics');
    const response = await GET();
    const data = await expectResponse<WeakTopicsResponse>(response, 200);

    // Algebra: (1 - 50/100) * 50 = 0.5 * 50 = 25
    // Geometry: (1 - 60/100) * 20 = 0.4 * 20 = 8
    // Algebra should be first (higher weakness score)
    expect(data.weakTopics[0]!.topic).toBe('Algebra');
    expect(data.weakTopics[0]!.weaknessScore).toBe(25);
    expect(data.weakTopics[1]!.topic).toBe('Geometry');
    expect(data.weakTopics[1]!.weaknessScore).toBe(8);
  });

  it('should return top 5 weak topics only', async () => {
    const topics = Array.from({ length: 10 }, (_, i) => ({
      id: `${i}`,
      userId: 'test-user-id',
      topic: `Topic ${i}`,
      totalAttempts: 20,
      correctAttempts: 8,
      accuracy: 40,
      lastPracticed: new Date('2024-01-10'),
      needsPractice: false,
      masteryLevel: 'LEARNING' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    vi.mocked(prisma.topicPerformance.findMany).mockResolvedValue(topics as any);

    const request = createGetRequest('http://localhost/api/recommendations/weak-topics');
    const response = await GET();
    const data = await expectResponse<WeakTopicsResponse>(response, 200);

    expect(data.weakTopics).toHaveLength(5);
    expect(data.summary.totalWeakTopics).toBe(10);
    expect(data.summary.topicsReturned).toBe(5);
  });

  it('should provide reason for low accuracy (<50%)', async () => {
    vi.mocked(prisma.topicPerformance.findMany).mockResolvedValue([
      {
        id: '1',
        userId: 'test-user-id',
        topic: 'Algebra',
        totalAttempts: 20,
        correctAttempts: 8,
        accuracy: 40,
        lastPracticed: new Date('2024-01-10'),
        needsPractice: false,
        masteryLevel: 'LEARNING',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    const request = createGetRequest('http://localhost/api/recommendations/weak-topics');
    const response = await GET();
    const data = await expectResponse<WeakTopicsResponse>(response, 200);

    expect(data.weakTopics[0]!.reason).toContain('Low accuracy');
    expect(data.weakTopics[0]!.reason).toContain('40%');
  });

  it('should provide reason for accuracy < 70%', async () => {
    vi.mocked(prisma.topicPerformance.findMany).mockResolvedValue([
      {
        id: '1',
        userId: 'test-user-id',
        topic: 'Geometry',
        totalAttempts: 20,
        correctAttempts: 13,
        accuracy: 65,
        lastPracticed: new Date('2024-01-14'),
        needsPractice: false,
        masteryLevel: 'LEARNING',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    const request = createGetRequest('http://localhost/api/recommendations/weak-topics');
    const response = await GET();
    const data = await expectResponse<WeakTopicsResponse>(response, 200);

    expect(data.weakTopics[0]!.reason).toContain('Below target accuracy');
    expect(data.weakTopics[0]!.reason).toContain('65%');
  });

  it('should provide reason for not practiced in 7+ days', async () => {
    vi.mocked(prisma.topicPerformance.findMany).mockResolvedValue([
      {
        id: '1',
        userId: 'test-user-id',
        topic: 'Algebra',
        totalAttempts: 20,
        correctAttempts: 18,
        accuracy: 90,
        lastPracticed: new Date('2024-01-01'), // 14 days ago
        needsPractice: true,
        masteryLevel: 'PROFICIENT',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    const request = createGetRequest('http://localhost/api/recommendations/weak-topics');
    const response = await GET();
    const data = await expectResponse<WeakTopicsResponse>(response, 200);

    expect(data.weakTopics[0]!.reason).toContain('Not practiced in');
    expect(data.weakTopics[0]!.reason).toContain('14 days');
  });

  it('should handle topic never practiced', async () => {
    vi.mocked(prisma.topicPerformance.findMany).mockResolvedValue([
      {
        id: '1',
        userId: 'test-user-id',
        topic: 'Combinatorics',
        totalAttempts: 5,
        correctAttempts: 2,
        accuracy: 40,
        lastPracticed: null,
        needsPractice: true,
        masteryLevel: 'LEARNING',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    const request = createGetRequest('http://localhost/api/recommendations/weak-topics');
    const response = await GET();
    const data = await expectResponse<WeakTopicsResponse>(response, 200);

    expect(data.weakTopics[0]!.reason).toContain('Never practiced');
  });

  it('should recommend 10 questions per topic', async () => {
    vi.mocked(prisma.topicPerformance.findMany).mockResolvedValue([
      {
        id: '1',
        userId: 'test-user-id',
        topic: 'Algebra',
        totalAttempts: 20,
        correctAttempts: 12,
        accuracy: 60,
        lastPracticed: new Date('2024-01-10'),
        needsPractice: false,
        masteryLevel: 'LEARNING',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    const request = createGetRequest('http://localhost/api/recommendations/weak-topics');
    const response = await GET();
    const data = await expectResponse<WeakTopicsResponse>(response, 200);

    expect(data.weakTopics[0]!.recommendedQuestions).toBe(10);
  });

  it('should calculate summary statistics correctly', async () => {
    vi.mocked(prisma.topicPerformance.findMany).mockResolvedValue([
      {
        id: '1',
        userId: 'test-user-id',
        topic: 'Algebra',
        totalAttempts: 20,
        correctAttempts: 8,
        accuracy: 40, // Critical (<50%)
        lastPracticed: new Date('2024-01-01'), // Needs review (>7 days)
        needsPractice: false,
        masteryLevel: 'LEARNING',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        userId: 'test-user-id',
        topic: 'Geometry',
        totalAttempts: 15,
        correctAttempts: 9,
        accuracy: 60,
        lastPracticed: new Date('2024-01-14'),
        needsPractice: false,
        masteryLevel: 'LEARNING',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    const request = createGetRequest('http://localhost/api/recommendations/weak-topics');
    const response = await GET();
    const data = await expectResponse<WeakTopicsResponse>(response, 200);

    expect(data.summary.totalWeakTopics).toBe(2);
    expect(data.summary.topicsReturned).toBe(2);
    expect(data.summary.totalRecommendedQuestions).toBe(20); // 2 topics * 10 questions
    expect(data.summary.criticalTopics).toBe(1); // Algebra <50%
    expect(data.summary.needsReviewTopics).toBe(1); // Algebra not practiced in 14 days
  });

  it('should exclude strong topics (accuracy >= 70% and not needsPractice)', async () => {
    vi.mocked(prisma.topicPerformance.findMany).mockResolvedValue([
      {
        id: '1',
        userId: 'test-user-id',
        topic: 'Algebra',
        totalAttempts: 30,
        correctAttempts: 27,
        accuracy: 90,
        lastPracticed: new Date('2024-01-14'),
        needsPractice: false,
        masteryLevel: 'MASTERED',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        userId: 'test-user-id',
        topic: 'Geometry',
        totalAttempts: 25,
        correctAttempts: 20,
        accuracy: 80,
        lastPracticed: new Date('2024-01-13'),
        needsPractice: false,
        masteryLevel: 'PROFICIENT',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    const request = createGetRequest('http://localhost/api/recommendations/weak-topics');
    const response = await GET();
    const data = await expectResponse<WeakTopicsResponse>(response, 200);

    expect(data.weakTopics).toHaveLength(0);
    expect(data.summary.totalWeakTopics).toBe(0);
  });

  it('should return empty array when no topics exist', async () => {
    vi.mocked(prisma.topicPerformance.findMany).mockResolvedValue([]);

    const request = createGetRequest('http://localhost/api/recommendations/weak-topics');
    const response = await GET();
    const data = await expectResponse<WeakTopicsResponse>(response, 200);

    expect(data.weakTopics).toHaveLength(0);
    expect(data.summary.totalWeakTopics).toBe(0);
  });
});
