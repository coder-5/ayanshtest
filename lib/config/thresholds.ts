/**
 * Configurable thresholds for topic performance classification
 *
 * These values determine how users are classified into strength levels
 * based on their performance on specific topics.
 */

export interface StrengthThresholds {
  /** Minimum attempts required for each tier */
  attemptsRequired: {
    beginner: number;
    intermediate: number;
    advanced: number;
    expert: number;
  };
  /** Accuracy thresholds (percentage) for each tier */
  accuracyThresholds: {
    expert: number; // >= this accuracy = EXPERT
    advanced: number; // >= this accuracy = ADVANCED
    intermediate: number; // >= this accuracy = INTERMEDIATE
    // < intermediate = BEGINNER
  };
}

/**
 * Default strength level thresholds
 * Can be overridden per user or globally via admin interface
 */
export const DEFAULT_STRENGTH_THRESHOLDS: StrengthThresholds = {
  attemptsRequired: {
    beginner: 0, // Always starts as beginner
    intermediate: 5, // Need 5+ attempts to reach intermediate
    advanced: 10, // Need 10+ attempts to reach advanced
    expert: 20, // Need 20+ attempts to reach expert
  },
  accuracyThresholds: {
    expert: 90, // 90%+ accuracy
    advanced: 75, // 75%+ accuracy
    intermediate: 60, // 60%+ accuracy
    // < 60% = beginner
  },
};

/**
 * Determine strength level based on attempts and accuracy
 * @param totalAttempts Number of questions attempted
 * @param accuracy Percentage correct (0-100)
 * @param thresholds Optional custom thresholds (defaults to DEFAULT_STRENGTH_THRESHOLDS)
 * @returns Strength level string
 */
export function determineStrengthLevel(
  totalAttempts: number,
  accuracy: number,
  thresholds: StrengthThresholds = DEFAULT_STRENGTH_THRESHOLDS
): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' {
  const { attemptsRequired, accuracyThresholds } = thresholds;

  // Not enough attempts = BEGINNER
  if (totalAttempts < attemptsRequired.intermediate) {
    return 'BEGINNER';
  }

  // EXPERT tier (requires most attempts)
  if (totalAttempts >= attemptsRequired.expert) {
    if (accuracy >= accuracyThresholds.expert) return 'EXPERT';
    if (accuracy >= accuracyThresholds.advanced) return 'ADVANCED';
    if (accuracy >= accuracyThresholds.intermediate) return 'INTERMEDIATE';
    return 'BEGINNER';
  }

  // ADVANCED tier
  if (totalAttempts >= attemptsRequired.advanced) {
    if (accuracy >= accuracyThresholds.advanced) return 'ADVANCED';
    if (accuracy >= accuracyThresholds.intermediate) return 'INTERMEDIATE';
    return 'BEGINNER';
  }

  // INTERMEDIATE tier
  if (totalAttempts >= attemptsRequired.intermediate) {
    if (accuracy >= accuracyThresholds.intermediate) return 'INTERMEDIATE';
    return 'BEGINNER';
  }

  return 'BEGINNER';
}

/**
 * Calculate if user needs practice on this topic
 * @param accuracy Percentage correct (0-100)
 * @param lastPracticed Date of last practice
 * @param thresholds Optional custom thresholds
 * @returns true if needs practice
 */
export function needsPractice(
  accuracy: number,
  lastPracticed: Date | null,
  thresholds: StrengthThresholds = DEFAULT_STRENGTH_THRESHOLDS
): boolean {
  // Low accuracy = needs practice
  if (accuracy < thresholds.accuracyThresholds.intermediate) {
    return true;
  }

  // Haven't practiced in 7+ days = needs practice
  if (lastPracticed) {
    const daysSinceLastPractice = Math.floor(
      (Date.now() - lastPracticed.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastPractice >= 7) {
      return true;
    }
  }

  return false;
}
