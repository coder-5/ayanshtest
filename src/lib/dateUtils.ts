/**
 * Calculate days between two dates using simple calendar date comparison
 */
export function getDaysUntil(targetDateString: string): number {
  return Math.floor((new Date(targetDateString).getTime() - new Date().getTime()) / 86400000);
}

/**
 * Format days until as a human-readable string
 */
export function formatDaysUntil(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 0) return `${days} days`;
  return `${Math.abs(days)} days ago`;
}

/**
 * Check if a date is today
 */
export function isToday(dateString: string): boolean {
  return getDaysUntil(dateString) === 0;
}

/**
 * Check if a date is in the future
 */
export function isFuture(dateString: string): boolean {
  return getDaysUntil(dateString) > 0;
}

/**
 * Check if a date is in the past
 */
export function isPast(dateString: string): boolean {
  return getDaysUntil(dateString) < 0;
}