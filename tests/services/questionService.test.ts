import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuestionService } from '@/lib/services/questionService';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    question: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    option: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    solution: {
      create: vi.fn(),
      upsert: vi.fn(),
    },
    userAttempt: {
      count: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

// Mock sanitizer
vi.mock('@/lib/sanitizer', () => ({
  sanitizeQuestionText: vi.fn((text) => text),
  sanitizeOptionText: vi.fn((text) => text),
  sanitizeSolutionText: vi.fn((text) => text),
  sanitizeIdentifier: vi.fn((text) => text),
}));

describe('QuestionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getById', () => {
    it('should fetch question by ID with relations', async () => {
      const mockQuestion = {
        id: 'q-123',
        questionText: 'What is 2+2?',
        options: [
          { optionLetter: 'A', optionText: '3', isCorrect: false },
          { optionLetter: 'B', optionText: '4', isCorrect: true },
        ],
        solution: { solutionText: 'Add the numbers' },
      };

      vi.mocked(prisma.question.findUnique).mockResolvedValue(mockQuestion as any);

      const result = await QuestionService.getById('q-123');

      expect(result).toEqual(mockQuestion);
      expect(prisma.question.findUnique).toHaveBeenCalledWith({
        where: { id: 'q-123', deletedAt: null },
        include: {
          options: {
            orderBy: { optionLetter: 'asc' },
          },
          solution: true,
        },
      });
    });

    it('should return null for deleted question', async () => {
      vi.mocked(prisma.question.findUnique).mockResolvedValue(null);

      const result = await QuestionService.getById('deleted-q');

      expect(result).toBe(null);
      expect(prisma.question.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'deleted-q', deletedAt: null },
        })
      );
    });
  });

  describe('getAll', () => {
    const mockQuestions = [
      {
        id: 'q-1',
        questionText: 'Question 1',
        options: [],
        solution: null,
        createdAt: new Date(),
      },
      {
        id: 'q-2',
        questionText: 'Question 2',
        options: [],
        solution: null,
        createdAt: new Date(),
      },
    ];

    it('should fetch all questions with default pagination', async () => {
      vi.mocked(prisma.question.findMany).mockResolvedValue(mockQuestions as any);
      vi.mocked(prisma.question.count).mockResolvedValue(2);

      const result = await QuestionService.getAll();

      expect(result.questions).toEqual(mockQuestions);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('should apply filters correctly', async () => {
      vi.mocked(prisma.question.findMany).mockResolvedValue([mockQuestions[0]] as any);
      vi.mocked(prisma.question.count).mockResolvedValue(1);

      await QuestionService.getAll({
        topic: 'Algebra',
        examName: 'AMC8',
        examYear: '2024',
        difficulty: 'EASY',
        search: 'fraction',
      });

      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            topic: 'Algebra',
            examName: 'AMC8',
            examYear: 2024,
            difficulty: 'EASY',
            questionText: {
              contains: 'fraction',
              mode: 'insensitive',
            },
          }),
        })
      );
    });

    it('should apply answer validation filter', async () => {
      vi.mocked(prisma.question.findMany).mockResolvedValue(mockQuestions as any);
      vi.mocked(prisma.question.count).mockResolvedValue(2);

      await QuestionService.getAll();

      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ examName: 'MOEMS Division E' }),
              expect.objectContaining({ examName: 'AMC8' }),
            ]),
          }),
        })
      );
    });

    it('should handle custom pagination', async () => {
      vi.mocked(prisma.question.findMany).mockResolvedValue(mockQuestions as any);
      vi.mocked(prisma.question.count).mockResolvedValue(100);

      const result = await QuestionService.getAll({
        limit: 20,
        offset: 40,
      });

      expect(result.limit).toBe(20);
      expect(result.offset).toBe(40);
      expect(result.hasMore).toBe(true);
      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 40,
        })
      );
    });

    it('should sort by createdAt desc', async () => {
      vi.mocked(prisma.question.findMany).mockResolvedValue(mockQuestions as any);
      vi.mocked(prisma.question.count).mockResolvedValue(2);

      await QuestionService.getAll();

      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('create', () => {
    const validQuestionData = {
      questionText: 'What is 2+2?',
      examName: 'AMC8',
      examYear: 2024,
      questionNumber: '1',
      topic: 'Algebra',
      difficulty: 'EASY' as const,
      options: [
        { optionLetter: 'A', optionText: '3', isCorrect: false },
        { optionLetter: 'B', optionText: '4', isCorrect: true },
      ],
      solution: 'Add the numbers together',
    };

    it('should create question with options and solution', async () => {
      const mockCreatedQuestion = {
        id: 'q-123',
        ...validQuestionData,
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        vi.mocked(prisma.question.create).mockResolvedValue(mockCreatedQuestion as any);
        vi.mocked(prisma.option.createMany).mockResolvedValue({ count: 2 } as any);
        vi.mocked(prisma.solution.create).mockResolvedValue({} as any);
        return callback(prisma);
      });

      const result = await QuestionService.create(validQuestionData);

      expect(result).toEqual(mockCreatedQuestion);
      expect(prisma.question.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            questionText: 'What is 2+2?',
            examName: 'AMC8',
            examYear: 2024,
            topic: 'Algebra',
            difficulty: 'EASY',
          }),
        })
      );
      expect(prisma.option.createMany).toHaveBeenCalled();
      expect(prisma.solution.create).toHaveBeenCalled();
    });

    it('should create question without solution', async () => {
      const dataWithoutSolution = {
        ...validQuestionData,
        solution: undefined,
      };

      const mockCreatedQuestion = {
        id: 'q-456',
        ...dataWithoutSolution,
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        vi.mocked(prisma.question.create).mockResolvedValue(mockCreatedQuestion as any);
        vi.mocked(prisma.option.createMany).mockResolvedValue({ count: 2 } as any);
        return callback(prisma);
      });

      await QuestionService.create(dataWithoutSolution);

      expect(prisma.solution.create).not.toHaveBeenCalled();
    });

    it('should generate unique question ID', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        vi.mocked(prisma.question.create).mockResolvedValue({ id: 'q-test' } as any);
        vi.mocked(prisma.option.createMany).mockResolvedValue({ count: 2 } as any);
        return callback(prisma);
      });

      await QuestionService.create(validQuestionData);

      expect(prisma.question.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            id: expect.stringMatching(/^q-[a-zA-Z0-9_-]{21}$/),
          }),
        })
      );
    });

    it('should sanitize text inputs during creation', async () => {
      const { sanitizeQuestionText, sanitizeIdentifier, sanitizeSolutionText } = await import(
        '@/lib/sanitizer'
      );

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        vi.mocked(prisma.question.create).mockResolvedValue({ id: 'q-test' } as any);
        vi.mocked(prisma.option.createMany).mockResolvedValue({ count: 2 } as any);
        vi.mocked(prisma.solution.create).mockResolvedValue({} as any);
        return callback(prisma);
      });

      await QuestionService.create(validQuestionData);

      expect(sanitizeQuestionText).toHaveBeenCalledWith('What is 2+2?');
      expect(sanitizeIdentifier).toHaveBeenCalledWith('AMC8');
      expect(sanitizeIdentifier).toHaveBeenCalledWith('Algebra');
      expect(sanitizeSolutionText).toHaveBeenCalledWith('Add the numbers together');
    });

    it('should throw error on duplicate question', async () => {
      const duplicateError = {
        code: 'P2002',
        message: 'Unique constraint failed',
      };

      vi.mocked(prisma.$transaction).mockRejectedValue(duplicateError);

      await expect(QuestionService.create(validQuestionData)).rejects.toThrow(
        'A question with this exam name, year, and number already exists'
      );
    });

    it('should rollback transaction on error', async () => {
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Database error'));

      await expect(QuestionService.create(validQuestionData)).rejects.toThrow('Database error');
    });
  });

  describe('update', () => {
    const updateData = {
      questionText: 'Updated question',
      examName: 'AMC10',
      difficulty: 'HARD' as const,
      options: [
        { optionLetter: 'A', optionText: 'New A', isCorrect: true },
        { optionLetter: 'B', optionText: 'New B', isCorrect: false },
      ],
      solution: 'Updated solution',
    };

    it('should update question with all fields', async () => {
      const mockUpdatedQuestion = {
        id: 'q-123',
        ...updateData,
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        vi.mocked(prisma.question.update).mockResolvedValue(mockUpdatedQuestion as any);
        vi.mocked(prisma.option.deleteMany).mockResolvedValue({ count: 2 } as any);
        vi.mocked(prisma.option.createMany).mockResolvedValue({ count: 2 } as any);
        vi.mocked(prisma.solution.upsert).mockResolvedValue({} as any);
        return callback(prisma);
      });

      const result = await QuestionService.update('q-123', updateData);

      expect(result).toEqual(mockUpdatedQuestion);
      expect(prisma.question.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'q-123' },
          data: expect.objectContaining({
            questionText: 'Updated question',
            examName: 'AMC10',
            difficulty: 'HARD',
          }),
        })
      );
    });

    it('should update options by delete and recreate', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        vi.mocked(prisma.question.update).mockResolvedValue({ id: 'q-123' } as any);
        vi.mocked(prisma.option.deleteMany).mockResolvedValue({ count: 2 } as any);
        vi.mocked(prisma.option.createMany).mockResolvedValue({ count: 2 } as any);
        vi.mocked(prisma.solution.upsert).mockResolvedValue({} as any);
        return callback(prisma);
      });

      await QuestionService.update('q-123', updateData);

      expect(prisma.option.deleteMany).toHaveBeenCalledWith({
        where: { questionId: 'q-123' },
      });
      expect(prisma.option.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              questionId: 'q-123',
              optionLetter: 'A',
              optionText: 'New A',
            }),
          ]),
        })
      );
    });

    it('should upsert solution', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        vi.mocked(prisma.question.update).mockResolvedValue({ id: 'q-123' } as any);
        vi.mocked(prisma.solution.upsert).mockResolvedValue({} as any);
        return callback(prisma);
      });

      await QuestionService.update('q-123', updateData);

      expect(prisma.solution.upsert).toHaveBeenCalledWith({
        where: { questionId: 'q-123' },
        update: expect.objectContaining({
          solutionText: 'Updated solution',
        }),
        create: expect.objectContaining({
          questionId: 'q-123',
          solutionText: 'Updated solution',
        }),
      });
    });

    it('should handle partial updates', async () => {
      const partialData = {
        questionText: 'Only update text',
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        vi.mocked(prisma.question.update).mockResolvedValue({ id: 'q-123' } as any);
        return callback(prisma);
      });

      await QuestionService.update('q-123', partialData);

      expect(prisma.option.deleteMany).not.toHaveBeenCalled();
      expect(prisma.solution.upsert).not.toHaveBeenCalled();
    });

    it('should throw error on duplicate constraint', async () => {
      const duplicateError = {
        code: 'P2002',
        message: 'Unique constraint failed',
      };

      vi.mocked(prisma.$transaction).mockRejectedValue(duplicateError);

      await expect(QuestionService.update('q-123', updateData)).rejects.toThrow(
        'A question with this exam name, year, and number already exists'
      );
    });
  });

  describe('delete', () => {
    it('should soft delete question without attempts', async () => {
      vi.mocked(prisma.userAttempt.count).mockResolvedValue(0);
      vi.mocked(prisma.question.update).mockResolvedValue({
        id: 'q-123',
        deletedAt: new Date(),
      } as any);

      const result = await QuestionService.delete('q-123');

      expect(result.deletedAt).toBeDefined();
      expect(prisma.question.update).toHaveBeenCalledWith({
        where: { id: 'q-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should reject deletion if attempts exist', async () => {
      vi.mocked(prisma.userAttempt.count).mockResolvedValue(5);

      await expect(QuestionService.delete('q-123')).rejects.toThrow(
        'Cannot delete question: 5 user attempt(s) exist'
      );

      expect(prisma.question.update).not.toHaveBeenCalled();
    });

    it('should check for non-deleted attempts only', async () => {
      vi.mocked(prisma.userAttempt.count).mockResolvedValue(0);
      vi.mocked(prisma.question.update).mockResolvedValue({ id: 'q-123' } as any);

      await QuestionService.delete('q-123');

      expect(prisma.userAttempt.count).toHaveBeenCalledWith({
        where: { questionId: 'q-123', deletedAt: null },
      });
    });
  });

  describe('getCount', () => {
    it('should return total count without filters', async () => {
      vi.mocked(prisma.question.count).mockResolvedValue(150);

      const result = await QuestionService.getCount();

      expect(result).toBe(150);
      expect(prisma.question.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        })
      );
    });

    it('should apply filters to count', async () => {
      vi.mocked(prisma.question.count).mockResolvedValue(25);

      const result = await QuestionService.getCount({
        topic: 'Geometry',
        examName: 'AMC10',
        difficulty: 'HARD',
      });

      expect(result).toBe(25);
      expect(prisma.question.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            topic: 'Geometry',
            examName: 'AMC10',
            difficulty: 'HARD',
          }),
        })
      );
    });

    it('should apply answer validation filter', async () => {
      vi.mocked(prisma.question.count).mockResolvedValue(100);

      await QuestionService.getCount();

      expect(prisma.question.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });
  });

  describe('getFilterOptions', () => {
    it('should return unique filter values', async () => {
      const mockTopics = [{ topic: 'Algebra' }, { topic: 'Geometry' }];
      const mockExams = [
        { examName: 'AMC8', examYear: 2024 },
        { examName: 'AMC10', examYear: 2024 },
      ];
      const mockDifficulties = [{ difficulty: 'EASY' }, { difficulty: 'HARD' }];

      vi.mocked(prisma.question.findMany)
        .mockResolvedValueOnce(mockTopics as any)
        .mockResolvedValueOnce(mockExams as any)
        .mockResolvedValueOnce(mockDifficulties as any);

      const result = await QuestionService.getFilterOptions();

      expect(result.topics).toEqual(['Algebra', 'Geometry']);
      expect(result.exams).toEqual([
        { name: 'AMC8', year: 2024 },
        { name: 'AMC10', year: 2024 },
      ]);
      expect(result.difficulties).toEqual(['EASY', 'HARD']);
    });

    it('should filter out null topics', async () => {
      const mockTopics = [{ topic: 'Algebra' }, { topic: null }, { topic: 'Geometry' }];

      vi.mocked(prisma.question.findMany)
        .mockResolvedValueOnce(mockTopics as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await QuestionService.getFilterOptions();

      expect(result.topics).toEqual(['Algebra', 'Geometry']);
      expect(result.topics).not.toContain(null);
    });
  });
});
