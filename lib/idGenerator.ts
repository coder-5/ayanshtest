/**
 * Centralized ID Generation
 *
 * Provides consistent ID generation across the application
 * using nanoid for better performance and shorter IDs than UUID
 */

import { nanoid } from 'nanoid';

/**
 * Generate a unique ID with optional prefix
 * @param prefix Optional prefix for the ID (e.g., 'q' for questions)
 * @param length Length of the random part (default: 21 characters)
 */
export function generateId(prefix?: string, length: number = 21): string {
  const id = nanoid(length);
  return prefix ? `${prefix}-${id}` : id;
}

/**
 * Pre-configured ID generators for specific entities
 */
export const IdGenerators = {
  question: () => generateId('q', 21),
  option: () => generateId('opt', 21),
  solution: () => generateId('sol', 21),
  session: () => generateId('sess', 21),
  exam: () => generateId('exam', 21),
  achievement: () => generateId('ach', 21),
  errorReport: () => generateId('err', 21),
  diagram: () => generateId('diag', 21),
  // For models that don't need prefix, use crypto.randomUUID() or Prisma's default
  generic: () => crypto.randomUUID(),
};
