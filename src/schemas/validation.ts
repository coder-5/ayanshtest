import { z } from 'zod';

// Base schemas
export const idSchema = z.string().min(1, 'ID is required').max(100, 'ID too long');

// Question schemas
export const questionSchema = z.object({
  questionText: z.string().min(1, 'Question text is required').max(5000, 'Question text too long'),
  examName: z.string().nullable().optional(),
  examYear: z.number().min(2000).max(new Date().getFullYear() + 1).nullable().optional(),
  questionNumber: z.string().nullable().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  topic: z.string().min(1, 'Topic is required'),
  subtopic: z.string().optional(),
  hasImage: z.boolean().default(false),
  imageUrl: z.string().url().optional(),
  timeLimit: z.number().positive().optional(),
});

export const optionSchema = z.object({
  optionLetter: z.string().min(1).max(1),
  optionText: z.string().min(1, 'Option text is required'),
  isCorrect: z.boolean().default(false),
});

// Progress tracking schema
export const progressSchema = z.object({
  userId: z.string().default('ayansh'),
  questionId: z.string().min(1, 'Question ID is required'),
  isCorrect: z.boolean(),
  timeSpent: z.number().min(0).default(0),
  userAnswer: z.string().optional(),
  excludeFromScoring: z.boolean().default(false),
});

// Topic performance schema
export const topicPerformanceSchema = z.object({
  userId: z.string().default('ayansh'),
  topicName: z.string().min(1, 'Topic name is required'),
  isCorrect: z.boolean(),
  timeSpent: z.number().min(0).default(0),
});

export const createQuestionSchema = z.object({
  question: questionSchema,
  options: z.array(optionSchema).max(10, 'Maximum 10 options allowed').optional(),
  solution: z.object({
    solutionText: z.string().max(10000, 'Solution text is too long (maximum 10,000 characters)').optional(),
    approach: z.string().optional(),
    difficulty: z.string().optional(),
    timeEstimate: z.number().positive().optional(),
    keyInsights: z.string().optional(),
    commonMistakes: z.string().optional(),
  }).optional(),
});

// User attempt schema
export const userAttemptSchema = z.object({
  questionId: z.string().cuid(),
  selectedAnswer: z.string().optional(),
  timeSpent: z.number().min(0),
  hintsUsed: z.number().min(0).default(0),
  excludeFromScoring: z.boolean().default(false),
});

// Practice session schema
export const practiceSessionSchema = z.object({
  sessionType: z.enum(['timed', 'topic-focused', 'exam-simulation', 'quick-practice']),
  totalQuestions: z.number().positive(),
  focusTopics: z.string().optional(),
});

// Exam schedule schema
export const examScheduleSchema = z.object({
  examName: z.string().min(1),
  examDate: z.string().datetime(),
  location: z.string().min(1),
  duration: z.number().positive().optional(),
  notes: z.string().optional(),
});

// Query parameter schemas
export const questionQuerySchema = z.object({
  examName: z.string().optional(), // Now accepts any competition name
  examYear: z.coerce.number().optional(),
  difficulty: z.string().optional(), // Also made more flexible for dynamic difficulties
  topic: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  page: z.coerce.number().min(1).default(1),
});

export const statsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  topic: z.string().optional(),
  difficulty: z.string().optional(),
});

// File upload schema
export const fileUploadSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().positive(),
  fileType: z.enum(['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['asc', 'desc']).default('desc')
});

export type QuestionInput = z.infer<typeof questionSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UserAttemptInput = z.infer<typeof userAttemptSchema>;
export type PracticeSessionInput = z.infer<typeof practiceSessionSchema>;
export type ExamScheduleInput = z.infer<typeof examScheduleSchema>;
export type QuestionQuery = z.infer<typeof questionQuerySchema>;
export type StatsQuery = z.infer<typeof statsQuerySchema>;
export type Pagination = z.infer<typeof paginationSchema>;