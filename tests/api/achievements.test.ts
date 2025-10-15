/**
 * Tests for /api/achievements
 *
 * Critical business logic - achievement tracking and progress calculation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/achievements/route';
import { prisma } from '@/lib/prisma';
import { mockAchievements, mockUsers } from '../mocks/testData';
import { expectResponse } from '../mocks/mockRequest';

// Response type for achievements endpoint
interface AchievementsResponse {
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    points: number;
    tier: string;
    earned: boolean;
    progress: number;
    earnedAt?: Date;
  }>;
  totalPoints: number;
  earnedCount: number;
  totalCount: number;
}

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    achievement: {
      findMany: vi.fn(),
    },
    userAchievement: {
      findMany: vi.fn(),
    },
    userAttempt: {
      count: vi.fn(),
    },
    dailyProgress: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock cache
vi.mock('@/lib/cache', () => ({
  cache: {
    getOrFetch: vi.fn((key, fetcher) => fetcher()),
  },
  CacheKeys: {
    achievements: 'achievements:all',
  },
  CacheTTL: {
    achievements: 3600,
  },
}));

// Mock user context
vi.mock('@/lib/userContext', () => ({
  'user-ayansh': vi.fn(() => 'test-user-id'),
}));

describe('GET /api/achievements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return all achievements with earned status', async () => {
    vi.mocked(prisma.achievement.findMany).mockResolvedValue([
      mockAchievements.firstAnswer,
      mockAchievements.streak7,
    ] as any);

    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([
      {
        id: 'ua-1',
        userId: 'test-user-id',
        achievementId: mockAchievements.firstAnswer.id,
        earnedAt: new Date('2024-01-10'),
        achievement: mockAchievements.firstAnswer,
      },
    ] as any);

    vi.mocked(prisma.userAttempt.count).mockResolvedValue(5);
    vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);

    const response = await GET();
    const data = await expectResponse<AchievementsResponse>(response, 200);

    expect(data.achievements).toHaveLength(2);
    expect(data.achievements[0]!.earned).toBe(true);
    expect(data.achievements[1]!.earned).toBe(false);
  });

  it('should calculate total points from earned achievements', async () => {
    vi.mocked(prisma.achievement.findMany).mockResolvedValue([
      mockAchievements.firstAnswer, // 10 points
      mockAchievements.streak7, // 50 points
      mockAchievements.perfectScore, // 100 points
    ] as any);

    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([
      {
        id: 'ua-1',
        userId: 'test-user-id',
        achievementId: mockAchievements.firstAnswer.id,
        earnedAt: new Date('2024-01-10'),
        achievement: mockAchievements.firstAnswer,
      },
      {
        id: 'ua-2',
        userId: 'test-user-id',
        achievementId: mockAchievements.streak7.id,
        earnedAt: new Date('2024-01-15'),
        achievement: mockAchievements.streak7,
      },
    ] as any);

    vi.mocked(prisma.userAttempt.count).mockResolvedValue(0);
    vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);

    const response = await GET();
    const data = await expectResponse<AchievementsResponse>(response, 200);

    expect(data.totalPoints).toBe(60); // 10 + 50
    expect(data.earnedCount).toBe(2);
    expect(data.totalCount).toBe(3);
  });

  it('should calculate progress for total_questions achievement', async () => {
    vi.mocked(prisma.achievement.findMany).mockResolvedValue([
      {
        ...mockAchievements.firstAnswer,
        criteria: JSON.stringify({ type: 'total_questions', target: 100 }),
      },
    ] as any);

    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([]);

    // User has attempted 50 questions
    vi.mocked(prisma.userAttempt.count).mockResolvedValue(50);
    vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);

    const response = await GET();
    const data = await expectResponse<AchievementsResponse>(response, 200);

    expect(data.achievements[0]!.progress).toBe(50); // 50/100 * 100 = 50%
    expect(data.achievements[0]!.earned).toBe(false);
  });

  it('should calculate progress for correct_answers achievement', async () => {
    vi.mocked(prisma.achievement.findMany).mockResolvedValue([
      {
        id: 'ach-correct-50',
        name: '50 Correct',
        description: 'Answer 50 questions correctly',
        icon: '✓',
        points: 25,
        tier: 'BRONZE',
        criteria: JSON.stringify({ type: 'correct_answers', target: 50 }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([]);

    // Total questions (first call)
    vi.mocked(prisma.userAttempt.count).mockResolvedValueOnce(100);
    // Correct answers (second call)
    vi.mocked(prisma.userAttempt.count).mockResolvedValueOnce(30);

    vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);

    const response = await GET();
    const data = await expectResponse<AchievementsResponse>(response, 200);

    expect(data.achievements[0]!.progress).toBe(60); // 30/50 * 100 = 60%
  });

  it('should calculate progress for streak_days achievement', async () => {
    vi.mocked(prisma.achievement.findMany).mockResolvedValue([
      {
        ...mockAchievements.streak7,
        criteria: JSON.stringify({ type: 'streak_days', target: 7 }),
      },
    ] as any);

    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([]);
    vi.mocked(prisma.userAttempt.count).mockResolvedValue(0);

    // Current streak is 4 days
    vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue({
      id: 'dp-1',
      userId: 'test-user-id',
      date: new Date(),
      questionsAttempted: 10,
      correctAnswers: 8,
      totalTimeSpent: 600,
      topicsStudied: ['Algebra'],
      streakDays: 4,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const response = await GET();
    const data = await expectResponse<AchievementsResponse>(response, 200);

    expect(data.achievements[0]!.progress).toBe(57); // Math.round(4/7 * 100) = 57%
  });

  it('should cap progress at 100%', async () => {
    vi.mocked(prisma.achievement.findMany).mockResolvedValue([
      {
        id: 'ach-1',
        name: 'Test',
        description: 'Test',
        icon: '🎯',
        points: 10,
        tier: 'BRONZE',
        criteria: JSON.stringify({ type: 'total_questions', target: 50 }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([]);

    // User has attempted 200 questions (way over target of 50)
    vi.mocked(prisma.userAttempt.count).mockResolvedValue(200);
    vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);

    const response = await GET();
    const data = await expectResponse<AchievementsResponse>(response, 200);

    expect(data.achievements[0]!.progress).toBe(100); // Capped at 100
  });

  it('should return 100% progress for earned achievements', async () => {
    vi.mocked(prisma.achievement.findMany).mockResolvedValue([mockAchievements.firstAnswer] as any);

    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([
      {
        id: 'ua-1',
        userId: 'test-user-id',
        achievementId: mockAchievements.firstAnswer.id,
        earnedAt: new Date('2024-01-10'),
        achievement: mockAchievements.firstAnswer,
      },
    ] as any);

    vi.mocked(prisma.userAttempt.count).mockResolvedValue(0);
    vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);

    const response = await GET();
    const data = await expectResponse<AchievementsResponse>(response, 200);

    expect(data.achievements[0]!.progress).toBe(100);
    expect(data.achievements[0]!.earned).toBe(true);
    expect(data.achievements[0]!.earnedAt).toBeDefined();
  });

  it('should handle unknown achievement criteria type', async () => {
    vi.mocked(prisma.achievement.findMany).mockResolvedValue([
      {
        id: 'ach-unknown',
        name: 'Unknown',
        description: 'Unknown type',
        icon: '❓',
        points: 10,
        tier: 'BRONZE',
        criteria: JSON.stringify({ type: 'unknown_type', target: 100 }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([]);
    vi.mocked(prisma.userAttempt.count).mockResolvedValue(50);
    vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);

    const response = await GET();
    const data = await expectResponse<AchievementsResponse>(response, 200);

    expect(data.achievements[0]!.progress).toBe(0); // Unknown type = 0 progress
  });

  it('should sort achievements by tier and points', async () => {
    vi.mocked(prisma.achievement.findMany).mockResolvedValue([
      mockAchievements.firstAnswer, // BRONZE, 10 points
      mockAchievements.streak7, // SILVER, 50 points
      mockAchievements.perfectScore, // GOLD, 100 points
    ] as any);

    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([]);
    vi.mocked(prisma.userAttempt.count).mockResolvedValue(0);
    vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);

    const response = await GET();
    const data = await expectResponse<AchievementsResponse>(response, 200);

    expect(prisma.achievement.findMany).toHaveBeenCalledWith({
      orderBy: [{ tier: 'asc' }, { points: 'desc' }],
    });
  });

  it('should sort user achievements by earnedAt descending', async () => {
    vi.mocked(prisma.achievement.findMany).mockResolvedValue([mockAchievements.firstAnswer] as any);

    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([
      {
        id: 'ua-1',
        userId: 'test-user-id',
        achievementId: mockAchievements.firstAnswer.id,
        earnedAt: new Date('2024-01-10'),
        achievement: mockAchievements.firstAnswer,
      },
    ] as any);

    vi.mocked(prisma.userAttempt.count).mockResolvedValue(0);
    vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);

    await GET();

    expect(prisma.userAchievement.findMany).toHaveBeenCalledWith({
      where: { userId: 'test-user-id' },
      include: { achievement: true },
      orderBy: { earnedAt: 'desc' },
    });
  });

  it('should use cache for achievements list', async () => {
    const { cache } = await import('@/lib/cache');

    vi.mocked(prisma.achievement.findMany).mockResolvedValue([]);
    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([]);
    vi.mocked(prisma.userAttempt.count).mockResolvedValue(0);
    vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);

    await GET();

    expect(cache.getOrFetch).toHaveBeenCalled();
  });

  it('should handle no achievements in system', async () => {
    vi.mocked(prisma.achievement.findMany).mockResolvedValue([]);
    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([]);
    vi.mocked(prisma.userAttempt.count).mockResolvedValue(0);
    vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);

    const response = await GET();
    const data = await expectResponse<AchievementsResponse>(response, 200);

    expect(data.achievements).toHaveLength(0);
    expect(data.totalPoints).toBe(0);
    expect(data.earnedCount).toBe(0);
    expect(data.totalCount).toBe(0);
  });

  it('should handle user with no earned achievements', async () => {
    vi.mocked(prisma.achievement.findMany).mockResolvedValue([
      mockAchievements.firstAnswer,
      mockAchievements.streak7,
    ] as any);

    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([]);
    vi.mocked(prisma.userAttempt.count).mockResolvedValue(0);
    vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);

    const response = await GET();
    const data = await expectResponse<AchievementsResponse>(response, 200);

    expect(data.achievements).toHaveLength(2);
    expect(data.achievements.every((a) => !a.earned)).toBe(true);
    expect(data.totalPoints).toBe(0);
    expect(data.earnedCount).toBe(0);
  });
});
