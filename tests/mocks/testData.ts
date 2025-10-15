/**
 * Shared Test Data Fixtures
 *
 * Reusable test data for questions, options, achievements, users, etc.
 */

export const mockUsers = {
  testUser: {
    id: 'user-ayansh',
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  ayansh: {
    id: 'user-ayansh',
    name: 'Ayansh',
    email: 'ayansh@example.com',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
};

export const mockQuestions = {
  multipleChoice: {
    id: 'q-mc-1',
    questionText: 'What is 2 + 2?',
    examName: 'AMC8',
    examYear: 2023,
    questionNumber: 1,
    correctAnswer: null,
    topic: 'Algebra',
    difficulty: 'EASY' as const,
    hasImage: false,
    imageUrl: null,
    qualityScore: 5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  },
  fillInBlank: {
    id: 'q-fib-1',
    questionText: 'What is the capital of France?',
    examName: 'MOEMS Division E',
    examYear: 2023,
    questionNumber: 1,
    correctAnswer: 'Paris',
    topic: 'Geography',
    difficulty: 'MEDIUM' as const,
    hasImage: false,
    imageUrl: null,
    qualityScore: 5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  },
  withImage: {
    id: 'q-img-1',
    questionText: 'Identify the shape in the diagram.',
    examName: 'Math Kangaroo',
    examYear: 2023,
    questionNumber: 5,
    correctAnswer: 'Pentagon',
    topic: 'Geometry',
    difficulty: 'HARD' as const,
    hasImage: true,
    imageUrl: '/images/questions/q-img-1.png',
    qualityScore: 4,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  },
  deleted: {
    id: 'q-deleted-1',
    questionText: 'This question was deleted',
    examName: 'AMC8',
    examYear: 2022,
    questionNumber: 10,
    correctAnswer: null,
    topic: 'Algebra',
    difficulty: 'MEDIUM' as const,
    hasImage: false,
    imageUrl: null,
    qualityScore: 3,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: new Date('2024-06-01'),
  },
};

export const mockOptions = {
  question1: [
    {
      id: 'opt-1-a',
      questionId: 'q-mc-1',
      optionLetter: 'A',
      optionText: '3',
      isCorrect: false,
    },
    {
      id: 'opt-1-b',
      questionId: 'q-mc-1',
      optionLetter: 'B',
      optionText: '4',
      isCorrect: true,
    },
    {
      id: 'opt-1-c',
      questionId: 'q-mc-1',
      optionLetter: 'C',
      optionText: '5',
      isCorrect: false,
    },
  ],
};

export const mockSolutions = {
  solution1: {
    id: 'sol-1',
    questionId: 'q-mc-1',
    solutionText: 'Add 2 + 2 to get 4.',
    videoUrl: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  withVideo: {
    id: 'sol-2',
    questionId: 'q-fib-1',
    solutionText: 'Paris is the capital and largest city of France.',
    videoUrl: 'https://youtube.com/watch?v=example',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
};

export const mockAchievements = {
  firstAnswer: {
    id: 'ach-first-answer',
    name: 'First Steps',
    description: 'Answer your first question',
    icon: '🎯',
    points: 10,
    tier: 'BRONZE',
    criteria: JSON.stringify({ type: 'first_attempt' }),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  streak7: {
    id: 'ach-streak-7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    points: 50,
    tier: 'SILVER',
    criteria: JSON.stringify({ type: 'streak', days: 7 }),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  perfectScore: {
    id: 'ach-perfect-100',
    name: 'Perfect Score',
    description: 'Get 100% on a practice session',
    icon: '💯',
    points: 100,
    tier: 'GOLD',
    criteria: JSON.stringify({ type: 'perfect_session' }),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
};

export const mockAttempts = {
  correct: {
    id: 'attempt-1',
    userId: 'user-ayansh',
    questionId: 'q-mc-1',
    selectedAnswer: 'B',
    isCorrect: true,
    timeSpent: 30,
    sessionId: null,
    attemptedAt: new Date('2024-01-15'),
    deletedAt: null,
  },
  incorrect: {
    id: 'attempt-2',
    userId: 'user-ayansh',
    questionId: 'q-mc-1',
    selectedAnswer: 'A',
    isCorrect: false,
    timeSpent: 45,
    sessionId: null,
    attemptedAt: new Date('2024-01-14'),
    deletedAt: null,
  },
};

export const mockSessions = {
  quick: {
    id: 'session-quick-1',
    userId: 'user-ayansh',
    sessionType: 'QUICK' as const,
    startedAt: new Date('2024-01-15T10:00:00Z'),
    completedAt: null,
    totalQuestions: 0,
    correctAnswers: 0,
    averageTimePerQuestion: null,
  },
  timed: {
    id: 'session-timed-1',
    userId: 'user-ayansh',
    sessionType: 'TIMED' as const,
    startedAt: new Date('2024-01-15T14:00:00Z'),
    completedAt: new Date('2024-01-15T14:30:00Z'),
    totalQuestions: 20,
    correctAnswers: 18,
    averageTimePerQuestion: 90,
  },
};

export const mockDailyProgress = {
  today: {
    id: 'dp-1',
    userId: 'user-ayansh',
    date: new Date('2024-01-15'),
    questionsAttempted: 10,
    correctAnswers: 8,
    totalTimeSpent: 600,
    topicsStudied: ['Algebra', 'Geometry'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  yesterday: {
    id: 'dp-2',
    userId: 'user-ayansh',
    date: new Date('2024-01-14'),
    questionsAttempted: 15,
    correctAnswers: 12,
    totalTimeSpent: 900,
    topicsStudied: ['Algebra', 'Number Theory'],
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
};

export const mockTopicPerformance = {
  algebra: {
    id: 'tp-algebra',
    userId: 'user-ayansh',
    topic: 'Algebra',
    totalAttempts: 50,
    correctAttempts: 40,
    accuracy: 80,
    lastAttemptedAt: new Date('2024-01-15'),
    masteryLevel: 'PROFICIENT' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  geometry: {
    id: 'tp-geometry',
    userId: 'user-ayansh',
    topic: 'Geometry',
    totalAttempts: 30,
    correctAttempts: 18,
    accuracy: 60,
    lastAttemptedAt: new Date('2024-01-14'),
    masteryLevel: 'LEARNING' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-14'),
  },
};

export const mockBookmarks = {
  bookmark1: {
    id: 'bm-1',
    userId: 'user-ayansh',
    questionId: 'q-mc-1',
    createdAt: new Date('2024-01-10'),
  },
};

export const mockErrorReports = {
  report1: {
    id: 'err-1',
    questionId: 'q-mc-1',
    userId: 'user-ayansh',
    issueType: 'WRONG_ANSWER' as const,
    description: 'The correct answer should be C, not B',
    status: 'PENDING' as const,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
};

export const mockExamSchedules = {
  upcoming: {
    id: 'exam-1',
    userId: 'user-ayansh',
    examName: 'AMC8',
    examDate: new Date('2024-12-01'),
    notes: 'Prepare geometry and number theory',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
};

/**
 * Helper to create test questions with custom overrides
 */
export function createMockQuestion(overrides: Partial<typeof mockQuestions.multipleChoice> = {}) {
  return {
    ...mockQuestions.multipleChoice,
    ...overrides,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Helper to create test options for a question
 */
export function createMockOptions(questionId: string, correctLetter: string = 'B') {
  return ['A', 'B', 'C', 'D', 'E'].map((letter) => ({
    id: `opt-${questionId}-${letter}`,
    questionId,
    optionLetter: letter,
    optionText: `Option ${letter}`,
    isCorrect: letter === correctLetter,
  }));
}

/**
 * Helper to create test attempt
 */
export function createMockAttempt(
  overrides: Partial<typeof mockAttempts.correct> = {}
): typeof mockAttempts.correct {
  return {
    ...mockAttempts.correct,
    ...overrides,
    attemptedAt: new Date(),
  };
}
