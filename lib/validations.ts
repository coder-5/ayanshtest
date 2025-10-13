import { z } from 'zod';

// User Attempt Validation
export const userAttemptSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  selectedAnswer: z.string().min(1, 'Answer is required'),
  timeSpent: z.number().min(0).max(3600).optional().default(0),
  sessionId: z.string().optional().nullable(),
});

// Error Report Validation
export const errorReportSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  reportType: z.enum(['INCORRECT_ANSWER', 'MISSING_DIAGRAM', 'TYPO', 'OTHER']),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description too long'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
  evidence: z.string().max(5000).optional().nullable(),
  confidence: z.number().min(0).max(100).optional().default(50),
});

// Exam Schedule Validation
export const examScheduleSchema = z.object({
  examName: z.string().min(1, 'Exam name is required').max(100),
  examDate: z
    .string()
    .datetime('Invalid date format')
    .refine((date) => new Date(date) > new Date(), { message: 'Exam date must be in the future' }),
  location: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

// Exam Update Validation
export const examUpdateSchema = z.object({
  status: z.enum(['UPCOMING', 'REGISTERED', 'COMPLETED', 'SCORED']).optional(),
  score: z.number().min(0).optional().nullable(),
  percentile: z.number().min(0).max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

// Question Creation Validation
export const questionSchema = z.object({
  questionText: z.string().min(1, 'Question text is required').max(5000),
  examName: z.string().max(50).optional().nullable(),
  examYear: z.number().min(1990).max(2030).optional().nullable(),
  questionNumber: z.string().max(50).optional().nullable(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).default('MEDIUM'),
  topic: z.string().max(200).optional().nullable(),
  subtopic: z.string().max(200).optional().nullable(),
  hasImage: z.boolean().default(false),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  videoUrl: z.string().url('Invalid video URL').optional().nullable(),
  correctAnswer: z.string().max(200).optional().nullable(),
  options: z
    .array(
      z.object({
        optionLetter: z.enum(['A', 'B', 'C', 'D', 'E']),
        optionText: z.string().min(1).max(1000),
        isCorrect: z.boolean().default(false),
      })
    )
    .optional(),
  solution: z
    .object({
      solutionText: z.string(),
      videoLinks: z.array(z.string().url()).optional().nullable(),
      hints: z.any().optional().nullable(),
    })
    .optional()
    .nullable(),
});

// Session Validation
export const sessionSchema = z.object({
  sessionType: z.enum(['QUICK', 'TIMED', 'TOPIC_FOCUSED', 'WEAK_AREAS', 'RETRY_FAILED']),
  userId: z.string().min(1, 'User ID is required'),
});

export const sessionUpdateSchema = z.object({
  totalQuestions: z.number().min(0),
  correctAnswers: z.number().min(0),
  totalTime: z.number().min(0).optional().nullable(),
});

// Video View Validation
export const videoViewSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  videoUrl: z.string().url('Invalid video URL').min(1, 'Video URL is required'),
  watchDuration: z.number().min(0).max(7200).optional().default(0),
  completedVideo: z.boolean().optional().default(false),
});

// Diagram Upload Validation
export const diagramUploadSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
});

// Bulk Question Upload Validation
export const bulkQuestionSchema = z.object({
  questions: z
    .array(questionSchema)
    .min(1, 'At least one question is required')
    .max(100, 'Maximum 100 questions per upload'),
});
