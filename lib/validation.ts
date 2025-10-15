import { z } from 'zod';

// Maximum length constraints to prevent DoS attacks
export const MAX_LENGTHS = {
  QUESTION_TEXT: 5000,
  OPTION_TEXT: 1000,
  SOLUTION_TEXT: 10000,
  TOPIC: 200,
  EXAM_NAME: 50,
} as const;

/**
 * Validate payload size to prevent DoS
 */
export function validatePayloadSize(data: unknown, maxSizeKB: number = 1024): void {
  const size = JSON.stringify(data).length;
  const maxBytes = maxSizeKB * 1024;

  if (size > maxBytes) {
    throw new Error(`Request payload too large. Maximum size is ${maxSizeKB}KB`);
  }
}

/**
 * NOTE: Sanitization removed from validation layer
 *
 * Sanitization now happens at the service layer (lib/services/questionService.ts)
 * using lib/sanitizer.ts which properly preserves LaTeX math delimiters.
 *
 * Validation schemas focus on structure/format only, not content sanitization.
 */

// ============================================================================
// PRACTICE & SUBMISSION SCHEMAS
// ============================================================================

// Practice submission validation
export const practiceSubmitSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  selectedAnswer: z.string().optional(),
  isCorrect: z.boolean(),
  timeSpent: z.number().min(0).optional(),
});

// User Attempt Validation
export const userAttemptSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  selectedAnswer: z.string().min(1, 'Answer is required'),
  timeSpent: z.number().min(0).max(3600).optional().default(0),
  sessionId: z.string().optional().nullable(),
});

// ============================================================================
// QUESTION SCHEMAS
// ============================================================================

// Question create validation (strict - all fields required for creation)
export const questionCreateSchema = z.object({
  questionText: z
    .string()
    .min(1, 'Question text is required')
    .max(
      MAX_LENGTHS.QUESTION_TEXT,
      `Question text must not exceed ${MAX_LENGTHS.QUESTION_TEXT} characters`
    )
    .refine((val) => val.trim().length > 0, { message: 'Question text cannot be only whitespace' }),
  examName: z
    .string()
    .max(MAX_LENGTHS.EXAM_NAME, `Exam name must not exceed ${MAX_LENGTHS.EXAM_NAME} characters`)
    .optional(),
  examYear: z.number().int().min(1900).max(2100).optional(),
  questionNumber: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .optional(),
  correctAnswer: z.string().optional(),
  topic: z
    .string()
    .max(MAX_LENGTHS.TOPIC, `Topic must not exceed ${MAX_LENGTHS.TOPIC} characters`)
    .optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).default('MEDIUM'),
  hasImage: z.boolean().optional(),
  imageUrl: z.string().optional(),
  options: z
    .array(
      z.object({
        optionLetter: z.string().min(1, 'Option letter is required'),
        optionText: z
          .string()
          .min(1, 'Option text is required')
          .max(
            MAX_LENGTHS.OPTION_TEXT,
            `Option text must not exceed ${MAX_LENGTHS.OPTION_TEXT} characters`
          ),
        isCorrect: z.boolean(),
      })
    )
    .min(2, 'At least 2 options required')
    .max(6, 'Maximum 6 options allowed')
    .refine((opts) => opts.some((opt) => opt.isCorrect), {
      message: 'At least one option must be marked as correct',
    }),
  solution: z
    .string()
    .max(
      MAX_LENGTHS.SOLUTION_TEXT,
      `Solution text must not exceed ${MAX_LENGTHS.SOLUTION_TEXT} characters`
    )
    .optional(),
  videoUrl: z.string().url('Invalid YouTube URL format').optional().or(z.literal('')),
});

// Question update validation (flexible - all fields optional for partial updates)
export const questionUpdateSchema = z.object({
  questionText: z
    .string()
    .min(1, 'Question text is required')
    .max(
      MAX_LENGTHS.QUESTION_TEXT,
      `Question text must not exceed ${MAX_LENGTHS.QUESTION_TEXT} characters`
    )
    .refine((val) => val.trim().length > 0, { message: 'Question text cannot be only whitespace' })
    .optional(),
  examName: z
    .string()
    .max(MAX_LENGTHS.EXAM_NAME, `Exam name must not exceed ${MAX_LENGTHS.EXAM_NAME} characters`)
    .optional(),
  examYear: z.number().int().min(1900).max(2100).optional(),
  questionNumber: z.string().optional(),
  correctAnswer: z.string().optional(),
  hasImage: z.boolean().optional(),
  imageUrl: z.string().optional(),
  topic: z
    .string()
    .max(MAX_LENGTHS.TOPIC, `Topic must not exceed ${MAX_LENGTHS.TOPIC} characters`)
    .optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).optional(),
  options: z
    .array(
      z.object({
        optionLetter: z.string().min(1, 'Option letter is required'),
        optionText: z
          .string()
          .min(1, 'Option text is required')
          .max(
            MAX_LENGTHS.OPTION_TEXT,
            `Option text must not exceed ${MAX_LENGTHS.OPTION_TEXT} characters`
          ),
        isCorrect: z.boolean(),
      })
    )
    .min(2, 'At least 2 options required')
    .max(6, 'Maximum 6 options allowed')
    .refine((opts) => opts.some((opt) => opt.isCorrect), {
      message: 'At least one option must be marked as correct',
    })
    .optional(),
  solution: z
    .string()
    .max(
      MAX_LENGTHS.SOLUTION_TEXT,
      `Solution text must not exceed ${MAX_LENGTHS.SOLUTION_TEXT} characters`
    )
    .optional(),
  videoUrl: z.string().url('Invalid YouTube URL format').optional().or(z.literal('')),
});

// Question query filters validation
export const questionFiltersSchema = z.object({
  topic: z.string().optional(),
  examName: z.string().optional(),
  examYear: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).optional(),
  search: z.string().optional(),
});

// Alternative question schema (simpler, for bulk uploads)
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

// Bulk Question Upload Validation
export const bulkQuestionSchema = z.object({
  questions: z
    .array(questionSchema)
    .min(1, 'At least one question is required')
    .max(100, 'Maximum 100 questions per upload'),
});

// ============================================================================
// ERROR REPORT SCHEMAS
// ============================================================================

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

// ============================================================================
// EXAM SCHEMAS
// ============================================================================

export const examScheduleSchema = z.object({
  examName: z.string().min(1, 'Exam name is required').max(100),
  examDate: z
    .string()
    .datetime('Invalid date format')
    .refine((date) => new Date(date) > new Date(), { message: 'Exam date must be in the future' }),
  location: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const examUpdateSchema = z.object({
  status: z.enum(['UPCOMING', 'REGISTERED', 'COMPLETED', 'SCORED']).optional(),
  score: z.number().min(0).optional().nullable(),
  percentile: z.number().min(0).max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

// ============================================================================
// SESSION SCHEMAS
// ============================================================================

export const sessionSchema = z.object({
  sessionType: z.enum(['QUICK', 'TIMED', 'TOPIC_FOCUSED', 'WEAK_AREAS', 'RETRY_FAILED']),
  userId: z.string().min(1, 'User ID is required'),
});

export const sessionUpdateSchema = z.object({
  totalQuestions: z.number().min(0),
  correctAnswers: z.number().min(0),
  totalTime: z.number().min(0).optional().nullable(),
});

// ============================================================================
// VIDEO & DIAGRAM SCHEMAS
// ============================================================================

export const videoViewSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  videoUrl: z.string().url('Invalid video URL').min(1, 'Video URL is required'),
  watchDuration: z.number().min(0).max(7200).optional().default(0),
  completedVideo: z.boolean().optional().default(false),
});

export const diagramUploadSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type PracticeSubmit = z.infer<typeof practiceSubmitSchema>;
export type QuestionCreate = z.infer<typeof questionCreateSchema>;
export type QuestionUpdate = z.infer<typeof questionUpdateSchema>;
export type QuestionFilters = z.infer<typeof questionFiltersSchema>;
