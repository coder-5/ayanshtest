import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/user-attempts/route';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    question: {
      findUnique: vi.fn(),
    },
    userAttempt: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    dailyProgress: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    topicPerformance: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    achievement: {
      findMany: vi.fn(),
    },
    userAchievement: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    weeklyAnalysis: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe('POST /api/user-attempts - Answer Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Multiple Choice Questions', () => {
    it('should validate correct answer for multiple choice question', async () => {
      const mockQuestion = {
        id: 'q1',
        questionText: 'What is 2+2?',
        correctAnswer: null,
        topic: 'Algebra',
        options: [
          { id: 'opt1', optionLetter: 'A', optionText: '3', isCorrect: false },
          { id: 'opt2', optionLetter: 'B', optionText: '4', isCorrect: true },
          { id: 'opt3', optionLetter: 'C', optionText: '5', isCorrect: false },
        ],
      };

      vi.mocked(prisma.question.findUnique).mockResolvedValue(mockQuestion as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockAttempt = {
          id: 'attempt1',
          userId: 'user-ayansh',
          questionId: 'q1',
          selectedAnswer: 'B',
          isCorrect: true,
          timeSpent: 30,
        };
        vi.mocked(prisma.userAttempt.create).mockResolvedValue(mockAttempt as any);
        vi.mocked(prisma.userAttempt.findMany).mockResolvedValue([]);
        vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.topicPerformance.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.achievement.findMany).mockResolvedValue([]);
        vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([]);
        vi.mocked(prisma.weeklyAnalysis.findFirst).mockResolvedValue(null);
        return callback(prisma);
      });

      const request = new Request('http://localhost/api/user-attempts', {
        method: 'POST',
        body: JSON.stringify({
          questionId: 'q1',
          selectedAnswer: 'B',
          timeSpent: 30,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.attempt.isCorrect).toBe(true);
      expect(prisma.question.findUnique).toHaveBeenCalledWith({
        where: { id: 'q1', deletedAt: null },
        include: { options: true },
      });
    });

    it('should validate incorrect answer for multiple choice question', async () => {
      const mockQuestion = {
        id: 'q1',
        questionText: 'What is 2+2?',
        correctAnswer: null,
        topic: 'Algebra',
        options: [
          { id: 'opt1', optionLetter: 'A', optionText: '3', isCorrect: false },
          { id: 'opt2', optionLetter: 'B', optionText: '4', isCorrect: true },
          { id: 'opt3', optionLetter: 'C', optionText: '5', isCorrect: false },
        ],
      };

      vi.mocked(prisma.question.findUnique).mockResolvedValue(mockQuestion as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockAttempt = {
          id: 'attempt1',
          userId: 'user-ayansh',
          questionId: 'q1',
          selectedAnswer: 'A',
          isCorrect: false,
          timeSpent: 30,
        };
        vi.mocked(prisma.userAttempt.create).mockResolvedValue(mockAttempt as any);
        vi.mocked(prisma.userAttempt.findMany).mockResolvedValue([]);
        vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.topicPerformance.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.achievement.findMany).mockResolvedValue([]);
        vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([]);
        vi.mocked(prisma.weeklyAnalysis.findFirst).mockResolvedValue(null);
        return callback(prisma);
      });

      const request = new Request('http://localhost/api/user-attempts', {
        method: 'POST',
        body: JSON.stringify({
          questionId: 'q1',
          selectedAnswer: 'A',
          timeSpent: 30,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.attempt.isCorrect).toBe(false);
    });

    it('should reject answer with non-existent option', async () => {
      const mockQuestion = {
        id: 'q1',
        questionText: 'What is 2+2?',
        correctAnswer: null,
        topic: 'Algebra',
        options: [
          { id: 'opt1', optionLetter: 'A', optionText: '3', isCorrect: false },
          { id: 'opt2', optionLetter: 'B', optionText: '4', isCorrect: true },
        ],
      };

      vi.mocked(prisma.question.findUnique).mockResolvedValue(mockQuestion as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockAttempt = {
          id: 'attempt1',
          userId: 'user-ayansh',
          questionId: 'q1',
          selectedAnswer: 'Z',
          isCorrect: false,
          timeSpent: 30,
        };
        vi.mocked(prisma.userAttempt.create).mockResolvedValue(mockAttempt as any);
        vi.mocked(prisma.userAttempt.findMany).mockResolvedValue([]);
        vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.topicPerformance.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.achievement.findMany).mockResolvedValue([]);
        vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([]);
        vi.mocked(prisma.weeklyAnalysis.findFirst).mockResolvedValue(null);
        return callback(prisma);
      });

      const request = new Request('http://localhost/api/user-attempts', {
        method: 'POST',
        body: JSON.stringify({
          questionId: 'q1',
          selectedAnswer: 'Z',
          timeSpent: 30,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should mark as incorrect since option doesn't exist
      expect(data.attempt.isCorrect).toBe(false);
    });
  });

  describe('Fill-in-the-Blank Questions', () => {
    it('should validate correct fill-in answer (case insensitive)', async () => {
      const mockQuestion = {
        id: 'q2',
        questionText: 'What is the capital of France?',
        correctAnswer: 'Paris',
        topic: 'Geography',
        options: [],
      };

      vi.mocked(prisma.question.findUnique).mockResolvedValue(mockQuestion as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockAttempt = {
          id: 'attempt2',
          userId: 'user-ayansh',
          questionId: 'q2',
          selectedAnswer: 'paris',
          isCorrect: true,
          timeSpent: 30,
        };
        vi.mocked(prisma.userAttempt.create).mockResolvedValue(mockAttempt as any);
        vi.mocked(prisma.userAttempt.findMany).mockResolvedValue([]);
        vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.topicPerformance.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.achievement.findMany).mockResolvedValue([]);
        vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([]);
        vi.mocked(prisma.weeklyAnalysis.findFirst).mockResolvedValue(null);
        return callback(prisma);
      });

      const request = new Request('http://localhost/api/user-attempts', {
        method: 'POST',
        body: JSON.stringify({
          questionId: 'q2',
          selectedAnswer: 'paris',
          timeSpent: 30,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.attempt.isCorrect).toBe(true);
    });

    it('should handle extra whitespace in fill-in answers', async () => {
      const mockQuestion = {
        id: 'q2',
        questionText: 'What is the capital of France?',
        correctAnswer: 'Paris',
        topic: 'Geography',
        options: [],
      };

      vi.mocked(prisma.question.findUnique).mockResolvedValue(mockQuestion as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockAttempt = {
          id: 'attempt2',
          userId: 'user-ayansh',
          questionId: 'q2',
          selectedAnswer: '  Paris  ',
          isCorrect: true,
          timeSpent: 30,
        };
        vi.mocked(prisma.userAttempt.create).mockResolvedValue(mockAttempt as any);
        vi.mocked(prisma.userAttempt.findMany).mockResolvedValue([]);
        vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.topicPerformance.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.achievement.findMany).mockResolvedValue([]);
        vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([]);
        vi.mocked(prisma.weeklyAnalysis.findFirst).mockResolvedValue(null);
        return callback(prisma);
      });

      const request = new Request('http://localhost/api/user-attempts', {
        method: 'POST',
        body: JSON.stringify({
          questionId: 'q2',
          selectedAnswer: '  Paris  ',
          timeSpent: 30,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.attempt.isCorrect).toBe(true);
    });

    it('should validate incorrect fill-in answer', async () => {
      const mockQuestion = {
        id: 'q2',
        questionText: 'What is the capital of France?',
        correctAnswer: 'Paris',
        topic: 'Geography',
        options: [],
      };

      vi.mocked(prisma.question.findUnique).mockResolvedValue(mockQuestion as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockAttempt = {
          id: 'attempt2',
          userId: 'user-ayansh',
          questionId: 'q2',
          selectedAnswer: 'London',
          isCorrect: false,
          timeSpent: 30,
        };
        vi.mocked(prisma.userAttempt.create).mockResolvedValue(mockAttempt as any);
        vi.mocked(prisma.userAttempt.findMany).mockResolvedValue([]);
        vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.topicPerformance.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.achievement.findMany).mockResolvedValue([]);
        vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([]);
        vi.mocked(prisma.weeklyAnalysis.findFirst).mockResolvedValue(null);
        return callback(prisma);
      });

      const request = new Request('http://localhost/api/user-attempts', {
        method: 'POST',
        body: JSON.stringify({
          questionId: 'q2',
          selectedAnswer: 'London',
          timeSpent: 30,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.attempt.isCorrect).toBe(false);
    });
  });

  describe('Security - Server-side Validation', () => {
    it('should NOT trust client-provided isCorrect field', async () => {
      const mockQuestion = {
        id: 'q1',
        questionText: 'What is 2+2?',
        correctAnswer: null,
        topic: 'Algebra',
        options: [
          { id: 'opt1', optionLetter: 'A', optionText: '3', isCorrect: false },
          { id: 'opt2', optionLetter: 'B', optionText: '4', isCorrect: true },
        ],
      };

      vi.mocked(prisma.question.findUnique).mockResolvedValue(mockQuestion as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockAttempt = {
          id: 'attempt1',
          userId: 'user-ayansh',
          questionId: 'q1',
          selectedAnswer: 'A',
          isCorrect: false, // Server calculates this, not client
          timeSpent: 30,
        };
        vi.mocked(prisma.userAttempt.create).mockResolvedValue(mockAttempt as any);
        vi.mocked(prisma.userAttempt.findMany).mockResolvedValue([]);
        vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.topicPerformance.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.achievement.findMany).mockResolvedValue([]);
        vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([]);
        vi.mocked(prisma.weeklyAnalysis.findFirst).mockResolvedValue(null);
        return callback(prisma);
      });

      // Client tries to cheat by saying wrong answer is correct
      const request = new Request('http://localhost/api/user-attempts', {
        method: 'POST',
        body: JSON.stringify({
          questionId: 'q1',
          selectedAnswer: 'A',
          isCorrect: true, // Client lying - trying to cheat
          timeSpent: 30,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Server should calculate correctness, not trust client
      expect(data.attempt.isCorrect).toBe(false);
    });
  });

  describe('Soft Delete Filter', () => {
    it('should reject attempts on soft-deleted questions', async () => {
      vi.mocked(prisma.question.findUnique).mockResolvedValue(null);

      const request = new Request('http://localhost/api/user-attempts', {
        method: 'POST',
        body: JSON.stringify({
          questionId: 'deleted-question',
          selectedAnswer: 'A',
          timeSpent: 30,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Question not found');
      expect(prisma.question.findUnique).toHaveBeenCalledWith({
        where: { id: 'deleted-question', deletedAt: null },
        include: { options: true },
      });
    });
  });

  describe('Validation', () => {
    it('should reject missing questionId', async () => {
      const request = new Request('http://localhost/api/user-attempts', {
        method: 'POST',
        body: JSON.stringify({
          selectedAnswer: 'A',
          timeSpent: 30,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject missing selectedAnswer', async () => {
      const request = new Request('http://localhost/api/user-attempts', {
        method: 'POST',
        body: JSON.stringify({
          questionId: 'q1',
          timeSpent: 30,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject question with no correct answer configured', async () => {
      const mockQuestion = {
        id: 'q3',
        questionText: 'Broken question',
        correctAnswer: null,
        topic: 'Test',
        options: [], // No options and no correctAnswer
      };

      vi.mocked(prisma.question.findUnique).mockResolvedValue(mockQuestion as any);

      const request = new Request('http://localhost/api/user-attempts', {
        method: 'POST',
        body: JSON.stringify({
          questionId: 'q3',
          selectedAnswer: 'anything',
          timeSpent: 30,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Question has no correct answer configured');
    });
  });

  describe('Session Tracking', () => {
    it('should accept optional sessionId', async () => {
      const mockQuestion = {
        id: 'q1',
        questionText: 'What is 2+2?',
        correctAnswer: null,
        topic: 'Algebra',
        options: [{ id: 'opt1', optionLetter: 'A', optionText: '4', isCorrect: true }],
      };

      vi.mocked(prisma.question.findUnique).mockResolvedValue(mockQuestion as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockAttempt = {
          id: 'attempt1',
          userId: 'user-ayansh',
          questionId: 'q1',
          selectedAnswer: 'A',
          isCorrect: true,
          timeSpent: 30,
          sessionId: 'session-123',
        };
        vi.mocked(prisma.userAttempt.create).mockResolvedValue(mockAttempt as any);
        vi.mocked(prisma.userAttempt.findMany).mockResolvedValue([]);
        vi.mocked(prisma.dailyProgress.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.topicPerformance.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.achievement.findMany).mockResolvedValue([]);
        vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([]);
        vi.mocked(prisma.weeklyAnalysis.findFirst).mockResolvedValue(null);
        return callback(prisma);
      });

      const request = new Request('http://localhost/api/user-attempts', {
        method: 'POST',
        body: JSON.stringify({
          questionId: 'q1',
          selectedAnswer: 'A',
          timeSpent: 30,
          sessionId: 'session-123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.attempt.sessionId).toBe('session-123');
    });
  });
});
