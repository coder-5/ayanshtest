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
 * Sanitize text input to prevent XSS and HTML injection
 * Removes HTML tags and dangerous characters
 */
export function sanitizeText(input: string): string {
  return (
    input
      .trim()
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove script tags and content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  );
}

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

// Practice submission validation
export const practiceSubmitSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  selectedAnswer: z.string().optional(),
  isCorrect: z.boolean(),
  timeSpent: z.number().min(0).optional(),
});

// Question create validation (strict - all fields required for creation)
export const questionCreateSchema = z.object({
  questionText: z
    .string()
    .min(1, 'Question text is required')
    .max(
      MAX_LENGTHS.QUESTION_TEXT,
      `Question text must not exceed ${MAX_LENGTHS.QUESTION_TEXT} characters`
    )
    .transform(sanitizeText)
    .refine((val) => val.trim().length > 0, { message: 'Question text cannot be only whitespace' }),
  examName: z
    .string()
    .max(MAX_LENGTHS.EXAM_NAME, `Exam name must not exceed ${MAX_LENGTHS.EXAM_NAME} characters`)
    .optional()
    .transform((val) => (val ? sanitizeText(val) : val)),
  examYear: z.number().int().min(1900).max(2100).optional(),
  questionNumber: z.string().optional(),
  correctAnswer: z.string().optional(),
  topic: z
    .string()
    .max(MAX_LENGTHS.TOPIC, `Topic must not exceed ${MAX_LENGTHS.TOPIC} characters`)
    .optional()
    .transform((val) => (val ? sanitizeText(val) : val)),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).default('MEDIUM'),
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
          )
          .transform(sanitizeText),
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
    .optional()
    .transform((val) => (val ? sanitizeText(val) : val)),
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
    .transform(sanitizeText)
    .refine((val) => val.trim().length > 0, { message: 'Question text cannot be only whitespace' })
    .optional(),
  examName: z
    .string()
    .max(MAX_LENGTHS.EXAM_NAME, `Exam name must not exceed ${MAX_LENGTHS.EXAM_NAME} characters`)
    .optional()
    .transform((val) => (val ? sanitizeText(val) : val)),
  examYear: z.number().int().min(1900).max(2100).optional(),
  questionNumber: z.string().optional(),
  correctAnswer: z.string().optional(),
  hasImage: z.boolean().optional(),
  imageUrl: z.string().optional(),
  topic: z
    .string()
    .max(MAX_LENGTHS.TOPIC, `Topic must not exceed ${MAX_LENGTHS.TOPIC} characters`)
    .optional()
    .transform((val) => (val ? sanitizeText(val) : val)),
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
          )
          .transform(sanitizeText),
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
    .optional()
    .transform((val) => (val ? sanitizeText(val) : val)),
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

export type PracticeSubmit = z.infer<typeof practiceSubmitSchema>;
export type QuestionCreate = z.infer<typeof questionCreateSchema>;
export type QuestionUpdate = z.infer<typeof questionUpdateSchema>;
export type QuestionFilters = z.infer<typeof questionFiltersSchema>;
