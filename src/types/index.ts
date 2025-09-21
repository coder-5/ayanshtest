export interface Question {
  id: string;
  questionText: string;
  examName: string;
  examYear: number;
  questionNumber: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  subtopic: string | null;
  hasImage: boolean;
  imageUrl: string | null;
  timeLimit: number | null;
  createdAt: Date;
  updatedAt: Date;
  options?: Option[];
  solution?: Solution;
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
}

export interface ProgressStats {
  totalAttempts: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;
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
  status: 'upcoming' | 'completed' | 'missed' | 'cancelled';
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
