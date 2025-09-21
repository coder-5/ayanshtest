import { z } from 'zod';
import { DIFFICULTY_LEVELS, EXAM_TYPES, TOPICS } from '@/constants';

// Question schemas
export const questionSchema = z.object({
  questionText: z.string().min(1, 'Question text is required').max(5000, 'Question text too long'),
  examName: z.enum([EXAM_TYPES.AMC8, EXAM_TYPES.KANGAROO, EXAM_TYPES.MOEMS, EXAM_TYPES.OTHERS]),
  examYear: z.number().min(2000).max(new Date().getFullYear() + 1),
  questionNumber: z.string().optional(),
  difficulty: z.enum([DIFFICULTY_LEVELS.BEGINNER, DIFFICULTY_LEVELS.INTERMEDIATE, DIFFICULTY_LEVELS.ADVANCED, DIFFICULTY_LEVELS.OTHERS]),
  topic: z.enum([
    TOPICS.ALGEBRA,
    TOPICS.GEOMETRY,
    TOPICS.NUMBER_THEORY,
    TOPICS.COMBINATORICS,
    TOPICS.PROBABILITY,
    TOPICS.STATISTICS,
    TOPICS.LOGIC,
    TOPICS.MIXED,
    TOPICS.OTHERS
  ]),
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

export const createQuestionSchema = z.object({
  question: questionSchema,
  options: z.array(optionSchema).min(2, 'At least 2 options required').max(5, 'Maximum 5 options allowed'),
  solution: z.object({
    solutionText: z.string().min(1, 'Solution is required').max(10000),
    approach: z.string().optional(),
    difficulty: z.string().min(1, 'Solution difficulty is required'),
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

export type QuestionInput = z.infer<typeof questionSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UserAttemptInput = z.infer<typeof userAttemptSchema>;
export type PracticeSessionInput = z.infer<typeof practiceSessionSchema>;
export type ExamScheduleInput = z.infer<typeof examScheduleSchema>;
export type QuestionQuery = z.infer<typeof questionQuerySchema>;
export type StatsQuery = z.infer<typeof statsQuerySchema>;