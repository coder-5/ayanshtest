// Legacy mapping for backwards compatibility
export const LEGACY_EXAM_NAME_MAP: Record<string, string> = {
  'amc8': 'AMC8',
  'kangaroo': 'Kangaroo',
  'moems': 'MOEMS',
  'mathcounts': 'MathCounts',
  'cml': 'CML'
};

// Valid exam types for validation
export const VALID_EXAM_TYPES = Object.keys(LEGACY_EXAM_NAME_MAP);

// Get exam name from exam type (handles legacy mapping)
export function getExamName(examType: string): string {
  const examName = LEGACY_EXAM_NAME_MAP[examType.toLowerCase()];
  return examName || examType;
}

// Check if exam type is valid
export function isValidExamType(examType: string): boolean {
  return VALID_EXAM_TYPES.includes(examType.toLowerCase());
}