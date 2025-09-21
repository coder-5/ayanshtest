// Application constants
// Re-export exam type utilities
export { getExamName, isValidExamType, VALID_EXAM_TYPES, LEGACY_EXAM_NAME_MAP } from './examTypes';
export { EXAM_CONFIGS, type ExamType, type ExamConfig } from './examConfig';

export const EXAM_TYPES = {
  AMC8: 'AMC8',
  KANGAROO: 'Kangaroo',
  MOEMS: 'MOEMS',
  MATHCOUNTS: 'MathCounts',
  CML: 'CML',
  OTHERS: 'Others',
} as const;

export const DIFFICULTY_LEVELS = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  OTHERS: 'Others',
} as const;

export const TOPICS = {
  ALGEBRA: 'Algebra',
  GEOMETRY: 'Geometry',
  NUMBER_THEORY: 'Number Theory',
  COMBINATORICS: 'Combinatorics',
  PROBABILITY: 'Probability',
  STATISTICS: 'Statistics',
  LOGIC: 'Logic',
  MIXED: 'Mixed',
  OTHERS: 'Others',
} as const;

export const API_ROUTES = {
  QUESTIONS: '/api/questions',
  QUESTION_BY_ID: '/api/questions/question',
  QUESTION_COUNTS: '/api/question-counts',
  USER_ATTEMPTS: '/api/user-attempts',
  EXAMS: '/api/exams',
  STATS: '/api/stats',
  PROGRESS: '/api/progress',
  UPLOAD: '/api/upload',
  // Analytics endpoints
  PRACTICE_SESSIONS: '/api/practice-sessions',
  DAILY_PROGRESS: '/api/daily-progress',
  TOPIC_PERFORMANCE: '/api/topic-performance',
  ACHIEVEMENTS: '/api/achievements',
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    SESSION: '/api/auth/session',
  },
} as const;

export const NAVIGATION_ROUTES = {
  HOME: '/',
  PRACTICE: '/practice',
  PRACTICE_QUICK: '/practice/quick',
  PRACTICE_AMC8: '/practice/amc8',
  PRACTICE_KANGAROO: '/practice/kangaroo',
  PRACTICE_MOEMS: '/practice/moems',
  PRACTICE_WEAK_AREAS: '/practice/weak-areas',
  EXAMS: '/exams',
  LIBRARY: '/library',
  PROGRESS: '/progress',
  UPLOAD: '/upload',
} as const;

export const ERROR_MESSAGES = {
  GENERAL: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  VALIDATION: 'Please check your input and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;