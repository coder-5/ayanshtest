export interface Question {
  id: string;
  questionText: string;
  examName: string;
  examYear: number;
  questionNumber: string | null;
  difficulty: string; // Fixed: should match schema string type (validation happens in app logic)
  topic: string;
  subtopic: string | null;
  hasImage: boolean;
  imageUrl: string | null;
  timeLimit: number | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations (optional for when populated)
  options?: Option[];
  solution?: Solution;
  attempts?: UserAttempt[];
  tags?: QuestionTag[];
  errorReports?: ErrorReport[];
  // Computed field (not in database)
  type?: 'multiple-choice' | 'open-ended';
}

export interface Option {
  id: string;
  questionId: string;
  optionLetter: string;
  optionText: string;
  isCorrect: boolean;
}

export interface Solution {
  id: string;
  questionId: string;
  solutionText: string;
  approach: string | null;
  difficulty: string;
  timeEstimate: number | null;
  keyInsights: string | null;
  commonMistakes: string | null;
  alternativeApproaches: string | null;
  successRate: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAttempt {
  id: string;
  userId: string;
  questionId: string;
  selectedAnswer: string | null; // Can be null for skipped questions
  isCorrect: boolean;
  timeSpent: number;
  hintsUsed: number;
  excludeFromScoring: boolean;
  attemptedAt: Date;
  sessionId: string | null; // Track which session this belongs to
}

export interface PracticeSession {
  id: string;
  userId: string;
  sessionType: string;
  startedAt: Date;
  completedAt: Date | null;
  totalQuestions: number;
  correctAnswers: number;
  totalTime: number | null;
  averageTimePerQuestion: number | null;
  focusTopics: string | null;
  // Relations (optional for when populated)
  attempts?: UserAttempt[];
}

export interface RetryQuestion {
  question: Question;
  lastAttempt: {
    id: string;
    selectedAnswer: string;
    timeSpent: number;
    attemptedAt: Date;
    hintsUsed: number;
  };
  attemptCount: number;
  totalAttempts?: number;
  successRate?: number;
  needsRetry?: 'recent_failure' | 'low_success_rate' | 'inconsistent_performance';
}

export interface QuestionCounts {
  total: number;
  amc8: number;
  moems: number;
  kangaroo: number;
  mathcounts: number;
}

export interface ProgressData {
  questionId: string;
  isCorrect: boolean;
  timeSpent: number;
  userAnswer: string;
  userId?: string;
  isRetry?: boolean;
  sessionType?: string;
  excludeFromScoring?: boolean;
}

export interface ProgressStats {
  totalAttempts: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;
  streakData: {
    currentStreak: number;
    longestStreak: number;
  };
  topicBreakdown: Record<string, {
    attempted: number;
    correct: number;
    accuracy: number;
  }>;
  difficultyBreakdown: Record<string, {
    attempted: number;
    correct: number;
    accuracy: number;
  }>;
  recentSessions: Array<{
    date: Date;
    questionsAnswered: number;
    correctAnswers: number;
    averageTime: number;
  }>;
}

export interface ExamSchedule {
  id: string;
  examName: string;
  examDate: Date;
  location: string;
  duration: number | null;
  status: string; // Fixed: should match schema string type (validation happens in app logic)
  notes: string | null;
  availableFromDate: Date | null;
  availableToDate: Date | null;
  examUrl: string | null;
  loginId: string | null;
  loginPassword: string | null;
  registeredAt: Date | null;
  registrationId: string | null;
  score: number | null;
  maxScore: number | null;
  percentile: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DifficultyLevel {
  value: 'easy' | 'medium' | 'hard';
  label: string;
  color: string;
}

export interface PracticeQuestion extends Omit<Question, 'options'> {
  text?: string; // Alias for questionText for component compatibility
  options?: Array<{
    id: string;
    questionId: string;
    label: string; // Maps to optionLetter from database
    text: string;  // Maps to optionText from database
    isCorrect: boolean;
  }>;
  type: 'multiple-choice' | 'open-ended';
  solution?: Solution; // Use full Solution interface
  solutions?: Array<{
    id: string;
    text: string;
    type: string;
  }>; // Legacy support for mapped solutions
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
}

// ========================================
// MISSING DATABASE MODEL INTERFACES
// ========================================

export interface ErrorReport {
  id: string;
  questionId: string;
  userId: string | null;
  reportType: string; // WRONG_ANSWER, INCORRECT_SOLUTION, UNCLEAR_QUESTION, MISSING_DIAGRAM, BROKEN_IMAGE, etc.
  description: string;
  severity: string; // Fixed: should match schema string type (validation happens in app logic)
  evidence: string | null; // Screenshot, explanation
  suggestedFix: string | null;
  confidence: number; // 1-10 how confident reporter is
  status: string; // Fixed: should match schema string type (validation happens in app logic)
  reviewedBy: string | null;
  reviewNotes: string | null;
  resolution: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface User {
  id: string;
  name: string; // Ayansh
  email: string | null;
  grade: number | null; // School grade level (5th grade)
  targetScore: number | null; // Goal score for competitions
  createdAt: Date;
  // Relations (optional for when populated)
  attempts?: UserAttempt[];
  sessions?: PracticeSession[];
  achievements?: Achievement[];
  dailyStats?: DailyProgress[];
  weeklyStats?: WeeklyAnalysis[];
  topicPerformance?: TopicPerformance[];
  errorReports?: ErrorReport[];
}

export interface Exam {
  id: string;
  name: string; // AMC8, Kangaroo, MOEMS, MathCounts, CML
  year: number;
  fullName: string; // "American Mathematics Competitions 8"
  description: string | null;
  timeLimit: number | null; // Time limit in minutes
  totalQuestions: number | null; // Number of questions in exam
  passingScore: number | null; // Qualifying score if applicable
  createdAt: Date;
}

export interface DailyProgress {
  id: string;
  userId: string;
  date: Date; // Date of practice (date only, no time)
  questionsAttempted: number;
  correctAnswers: number;
  totalTimeSpent: number; // Total minutes spent
  averageAccuracy: number; // Percentage accuracy
  topicsStudied: string | null; // Topics practiced today (comma-separated)
  difficultiesStudied: string | null; // Difficulty levels attempted (comma-separated)
  streakDays: number; // Consecutive days of practice
  isStreakDay: boolean; // Did practice today
  createdAt: Date;
}

export interface WeeklyAnalysis {
  id: string;
  userId: string;
  weekStartDate: Date; // Monday of the week
  weekEndDate: Date; // Sunday of the week
  totalQuestions: number;
  totalCorrect: number;
  totalTimeSpent: number; // Total minutes
  averageAccuracy: number;
  improvementRate: number; // % improvement from last week

  // Weak Areas Analysis
  weakestTopics: string | null; // Topics with low accuracy (comma-separated)
  strongestTopics: string | null; // Topics with high accuracy (comma-separated)
  slowestTopics: string | null; // Topics taking most time (comma-separated)
  recommendedFocus: string | null; // Topics to focus on next week (comma-separated)

  // Daily Consistency
  practicedays: number; // Days practiced this week
  longestStreak: number; // Longest consecutive days
  averageDailyQuestions: number;

  // Difficulty Analysis
  beginnerAccuracy: number | null; // Accuracy on beginner questions
  intermediateAccuracy: number | null; // Accuracy on intermediate questions
  advancedAccuracy: number | null; // Accuracy on advanced questions

  createdAt: Date;
}

export interface TopicPerformance {
  id: string;
  userId: string;
  topicName: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  averageTime: number; // Average seconds per question
  lastPracticed: Date | null;
  improvementTrend: string; // Fixed: should match schema string type (validation happens in app logic)
  strengthLevel: string; // Fixed: should match schema string type (validation happens in app logic)
  updatedAt: Date;
}

export interface Topic {
  id: string;
  name: string; // Algebra, Geometry, etc.
  description: string | null;
  parentId: string | null; // For subtopics
}

export interface Tag {
  id: string;
  name: string; // "quadratic-formula", "pythagorean-theorem"
  description: string | null;
  // Relations (optional for when populated)
  questions?: QuestionTag[];
}

export interface QuestionTag {
  questionId: string;
  tagId: string;
}

export interface Achievement {
  id: string;
  userId: string;
  title: string; // "First 100 Questions", "Perfect Week"
  description: string;
  badgeIcon: string; // Icon identifier
  unlockedAt: Date;
  category: string; // streak, accuracy, volume, speed
}
