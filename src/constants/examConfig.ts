export interface ExamConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon: string;
  timePerQuestion?: number;
  totalQuestions?: number;
  hasSimulation?: boolean;
}

export const EXAM_CONFIGS: Record<string, ExamConfig> = {
  amc8: {
    id: 'amc8',
    name: 'AMC8',
    displayName: 'AMC 8',
    description: 'American Mathematics Competitions 8',
    color: 'blue',
    icon: 'Target',
    timePerQuestion: 2,
    totalQuestions: 25,
    hasSimulation: true,
  },
  kangaroo: {
    id: 'kangaroo',
    name: 'Kangaroo',
    displayName: 'Math Kangaroo',
    description: 'International Mathematical Kangaroo',
    color: 'green',
    icon: 'BookOpen',
    timePerQuestion: 3,
    totalQuestions: 30,
    hasSimulation: false,
  },
  moems: {
    id: 'moems',
    name: 'MOEMS',
    displayName: 'MOEMS',
    description: 'Mathematical Olympiad for Elementary and Middle Schools',
    color: 'purple',
    icon: 'Clock',
    timePerQuestion: 5,
    totalQuestions: 5,
    hasSimulation: false,
  },
  mathcounts: {
    id: 'mathcounts',
    name: 'MathCounts',
    displayName: 'MathCounts',
    description: 'MathCounts Competition Sprint Round',
    color: 'red',
    icon: 'Target',
    timePerQuestion: 2,
    totalQuestions: 30,
    hasSimulation: false,
  },
  cml: {
    id: 'cml',
    name: 'CML',
    displayName: 'CML',
    description: 'Continental Mathematics League',
    color: 'orange',
    icon: 'BookOpen',
    timePerQuestion: 2,
    totalQuestions: 15,
    hasSimulation: false,
  },
} as const;

export type ExamType = keyof typeof EXAM_CONFIGS;