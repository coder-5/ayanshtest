import { describe, it, expect } from 'vitest';
import {
  validatePayloadSize,
  MAX_LENGTHS,
  practiceSubmitSchema,
  userAttemptSchema,
  questionCreateSchema,
  questionUpdateSchema,
  questionFiltersSchema,
  questionSchema,
  bulkQuestionSchema,
  errorReportSchema,
  examScheduleSchema,
  examUpdateSchema,
  sessionSchema,
  sessionUpdateSchema,
  videoViewSchema,
  diagramUploadSchema,
} from '@/lib/validation';

describe('Validation - Payload Size', () => {
  describe('validatePayloadSize', () => {
    it('should accept payload under limit', () => {
      const smallData = { test: 'data' };
      expect(() => validatePayloadSize(smallData, 1)).not.toThrow();
    });

    it('should reject payload over limit', () => {
      const largeData = { data: 'x'.repeat(1024 * 1024) }; // 1MB of data
      expect(() => validatePayloadSize(largeData, 1)).toThrow('Request payload too large');
    });

    it('should use default 1024KB limit', () => {
      const mediumData = { data: 'x'.repeat(512 * 1024) }; // 512KB
      expect(() => validatePayloadSize(mediumData)).not.toThrow();
    });

    it('should reject exactly at boundary', () => {
      const boundaryData = { data: 'x'.repeat(1024 * 1024 + 100) }; // Just over 1MB
      expect(() => validatePayloadSize(boundaryData, 1)).toThrow();
    });
  });
});

describe('Validation - Practice & Submission Schemas', () => {
  describe('practiceSubmitSchema', () => {
    it('should validate correct practice submission', () => {
      const validData = {
        questionId: 'q-123',
        selectedAnswer: 'A',
        isCorrect: true,
        timeSpent: 30,
      };
      const result = practiceSubmitSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow optional selectedAnswer', () => {
      const validData = {
        questionId: 'q-123',
        isCorrect: false,
      };
      const result = practiceSubmitSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing questionId', () => {
      const invalidData = {
        isCorrect: true,
      };
      const result = practiceSubmitSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative timeSpent', () => {
      const invalidData = {
        questionId: 'q-123',
        isCorrect: true,
        timeSpent: -5,
      };
      const result = practiceSubmitSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('userAttemptSchema', () => {
    it('should validate correct user attempt', () => {
      const validData = {
        questionId: 'q-123',
        selectedAnswer: 'A',
        timeSpent: 30,
        sessionId: 'session-123',
      };
      const result = userAttemptSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty selectedAnswer', () => {
      const invalidData = {
        questionId: 'q-123',
        selectedAnswer: '',
        timeSpent: 30,
      };
      const result = userAttemptSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject timeSpent over 3600 seconds', () => {
      const invalidData = {
        questionId: 'q-123',
        selectedAnswer: 'A',
        timeSpent: 4000,
      };
      const result = userAttemptSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should default timeSpent to 0 if not provided', () => {
      const validData = {
        questionId: 'q-123',
        selectedAnswer: 'A',
      };
      const result = userAttemptSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timeSpent).toBe(0);
      }
    });

    it('should allow null sessionId', () => {
      const validData = {
        questionId: 'q-123',
        selectedAnswer: 'A',
        sessionId: null,
      };
      const result = userAttemptSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

describe('Validation - Question Schemas', () => {
  describe('questionCreateSchema', () => {
    const validQuestion = {
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
      solution: 'Add the numbers',
    };

    it('should validate complete question', () => {
      const result = questionCreateSchema.safeParse(validQuestion);
      expect(result.success).toBe(true);
    });

    it('should reject question text over MAX_LENGTHS', () => {
      const invalidData = {
        ...validQuestion,
        questionText: 'x'.repeat(MAX_LENGTHS.QUESTION_TEXT + 1),
      };
      const result = questionCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject whitespace-only question text', () => {
      const invalidData = {
        ...validQuestion,
        questionText: '   ',
      };
      const result = questionCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require at least 2 options', () => {
      const invalidData = {
        ...validQuestion,
        options: [{ optionLetter: 'A', optionText: '4', isCorrect: true }],
      };
      const result = questionCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject more than 6 options', () => {
      const invalidData = {
        ...validQuestion,
        options: [
          { optionLetter: 'A', optionText: '1', isCorrect: false },
          { optionLetter: 'B', optionText: '2', isCorrect: false },
          { optionLetter: 'C', optionText: '3', isCorrect: false },
          { optionLetter: 'D', optionText: '4', isCorrect: true },
          { optionLetter: 'E', optionText: '5', isCorrect: false },
          { optionLetter: 'F', optionText: '6', isCorrect: false },
          { optionLetter: 'G', optionText: '7', isCorrect: false },
        ],
      };
      const result = questionCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require at least one correct option', () => {
      const invalidData = {
        ...validQuestion,
        options: [
          { optionLetter: 'A', optionText: '3', isCorrect: false },
          { optionLetter: 'B', optionText: '4', isCorrect: false },
        ],
      };
      const result = questionCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid exam year', () => {
      const invalidData = {
        ...validQuestion,
        examYear: 1800,
      };
      const result = questionCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid difficulty', () => {
      const invalidData = {
        ...validQuestion,
        difficulty: 'SUPER_HARD',
      };
      const result = questionCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should default difficulty to MEDIUM', () => {
      const dataWithoutDifficulty = {
        questionText: 'What is 2+2?',
        options: [
          { optionLetter: 'A', optionText: '3', isCorrect: false },
          { optionLetter: 'B', optionText: '4', isCorrect: true },
        ],
      };
      const result = questionCreateSchema.safeParse(dataWithoutDifficulty);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.difficulty).toBe('MEDIUM');
      }
    });

    it('should reject invalid YouTube URL', () => {
      const invalidData = {
        ...validQuestion,
        videoUrl: 'not-a-url',
      };
      const result = questionCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should allow empty string for videoUrl', () => {
      const validData = {
        ...validQuestion,
        videoUrl: '',
      };
      const result = questionCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('questionUpdateSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        questionText: 'Updated question',
      };
      const result = questionUpdateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow updating only options', () => {
      const optionsOnly = {
        options: [
          { optionLetter: 'A', optionText: '3', isCorrect: false },
          { optionLetter: 'B', optionText: '4', isCorrect: true },
        ],
      };
      const result = questionUpdateSchema.safeParse(optionsOnly);
      expect(result.success).toBe(true);
    });

    it('should allow empty object for no updates', () => {
      const result = questionUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('questionFiltersSchema', () => {
    it('should validate filters', () => {
      const filters = {
        topic: 'Algebra',
        examName: 'AMC8',
        examYear: '2024',
        difficulty: 'EASY' as const,
        search: 'fraction',
      };
      const result = questionFiltersSchema.safeParse(filters);
      expect(result.success).toBe(true);
    });

    it('should allow empty filters', () => {
      const result = questionFiltersSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('bulkQuestionSchema', () => {
    it('should validate bulk upload', () => {
      const bulkData = {
        questions: [
          {
            questionText: 'Question 1',
            difficulty: 'EASY' as const,
          },
          {
            questionText: 'Question 2',
            difficulty: 'MEDIUM' as const,
          },
        ],
      };
      const result = bulkQuestionSchema.safeParse(bulkData);
      expect(result.success).toBe(true);
    });

    it('should require at least 1 question', () => {
      const invalidData = { questions: [] };
      const result = bulkQuestionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject more than 100 questions', () => {
      const tooManyQuestions = {
        questions: Array(101)
          .fill(null)
          .map(() => ({
            questionText: 'Question',
            difficulty: 'EASY' as const,
          })),
      };
      const result = bulkQuestionSchema.safeParse(tooManyQuestions);
      expect(result.success).toBe(false);
    });
  });
});

describe('Validation - Error Report Schema', () => {
  describe('errorReportSchema', () => {
    const validReport = {
      questionId: 'q-123',
      reportType: 'INCORRECT_ANSWER' as const,
      description: 'The answer should be B, not A. I checked the solution.',
      severity: 'HIGH' as const,
    };

    it('should validate error report', () => {
      const result = errorReportSchema.safeParse(validReport);
      expect(result.success).toBe(true);
    });

    it('should reject description under 10 characters', () => {
      const invalidData = {
        ...validReport,
        description: 'Too short',
      };
      const result = errorReportSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should default severity to MEDIUM', () => {
      const dataWithoutSeverity = {
        questionId: 'q-123',
        reportType: 'TYPO' as const,
        description: 'There is a typo in the question text.',
      };
      const result = errorReportSchema.safeParse(dataWithoutSeverity);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.severity).toBe('MEDIUM');
      }
    });

    it('should validate all report types', () => {
      const types = ['INCORRECT_ANSWER', 'MISSING_DIAGRAM', 'TYPO', 'OTHER'] as const;
      types.forEach((type) => {
        const data = {
          questionId: 'q-123',
          reportType: type,
          description: 'This is a valid description with enough characters.',
        };
        const result = errorReportSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should default confidence to 50', () => {
      const dataWithoutConfidence = {
        questionId: 'q-123',
        reportType: 'OTHER' as const,
        description: 'Something is wrong but I am not sure.',
      };
      const result = errorReportSchema.safeParse(dataWithoutConfidence);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.confidence).toBe(50);
      }
    });
  });
});

describe('Validation - Exam Schemas', () => {
  describe('examScheduleSchema', () => {
    it('should validate exam schedule', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const validData = {
        examName: 'AMC8',
        examDate: futureDate.toISOString(),
        location: 'School Auditorium',
        notes: 'Bring calculator',
      };
      const result = examScheduleSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject past exam dates', () => {
      const pastDate = new Date('2020-01-01');
      const invalidData = {
        examName: 'AMC8',
        examDate: pastDate.toISOString(),
      };
      const result = examScheduleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid date format', () => {
      const invalidData = {
        examName: 'AMC8',
        examDate: '2024-12-25',
      };
      const result = examScheduleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('examUpdateSchema', () => {
    it('should validate exam update', () => {
      const validData = {
        status: 'COMPLETED' as const,
        score: 18,
        percentile: 85,
        notes: 'Did well on geometry',
      };
      const result = examUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow partial updates', () => {
      const partialData = {
        status: 'REGISTERED' as const,
      };
      const result = examUpdateSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should validate all status types', () => {
      const statuses = ['UPCOMING', 'REGISTERED', 'COMPLETED', 'SCORED'] as const;
      statuses.forEach((status) => {
        const result = examUpdateSchema.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });
  });
});

describe('Validation - Session Schemas', () => {
  describe('sessionSchema', () => {
    it('should validate session creation', () => {
      const validData = {
        sessionType: 'QUICK' as const,
        userId: 'user-123',
      };
      const result = sessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate all session types', () => {
      const types = ['QUICK', 'TIMED', 'TOPIC_FOCUSED', 'WEAK_AREAS', 'RETRY_FAILED'] as const;
      types.forEach((type) => {
        const data = {
          sessionType: type,
          userId: 'user-123',
        };
        const result = sessionSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('sessionUpdateSchema', () => {
    it('should validate session update', () => {
      const validData = {
        totalQuestions: 10,
        correctAnswers: 8,
        totalTime: 300,
      };
      const result = sessionUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative values', () => {
      const invalidData = {
        totalQuestions: -5,
        correctAnswers: 8,
      };
      const result = sessionUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Validation - Video & Diagram Schemas', () => {
  describe('videoViewSchema', () => {
    it('should validate video view', () => {
      const validData = {
        questionId: 'q-123',
        videoUrl: 'https://youtube.com/watch?v=abc123',
        watchDuration: 120,
        completedVideo: true,
      };
      const result = videoViewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should default watchDuration to 0', () => {
      const dataWithoutDuration = {
        questionId: 'q-123',
        videoUrl: 'https://youtube.com/watch?v=abc123',
      };
      const result = videoViewSchema.safeParse(dataWithoutDuration);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.watchDuration).toBe(0);
      }
    });

    it('should reject watchDuration over 7200 seconds', () => {
      const invalidData = {
        questionId: 'q-123',
        videoUrl: 'https://youtube.com/watch?v=abc123',
        watchDuration: 8000,
      };
      const result = videoViewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('diagramUploadSchema', () => {
    it('should validate diagram upload', () => {
      const validData = {
        questionId: 'q-123',
      };
      const result = diagramUploadSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty questionId', () => {
      const invalidData = {
        questionId: '',
      };
      const result = diagramUploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
