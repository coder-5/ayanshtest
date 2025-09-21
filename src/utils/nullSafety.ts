/**
 * Minimal null safety utilities for URL parameter handling and Prisma queries
 */

function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

function isNotNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function safeNumber(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (isNullish(value)) return defaultValue;

  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

function safePositiveNumber(value: unknown, defaultValue: number = 1, min: number = 1, max: number = 1000): number {
  if (isNullish(value)) return defaultValue;

  const parsed = Number(value);
  if (isNaN(parsed) || !isFinite(parsed)) return defaultValue;
  if (parsed < min) return defaultValue;
  if (parsed > max) return max;

  return Math.floor(parsed);
}

export function safeUrlParam(searchParams: URLSearchParams, key: string, defaultValue: string = ''): string {
  const value = searchParams.get(key);
  return isNullish(value) ? defaultValue : value;
}

export function safeUrlParamNumber(searchParams: URLSearchParams, key: string, defaultValue: number = 0): number {
  const value = searchParams.get(key);
  return safeNumber(value, defaultValue);
}

export function safeUrlParamPositiveNumber(
  searchParams: URLSearchParams,
  key: string,
  defaultValue: number = 1,
  min: number = 1,
  max: number = 1000
): number {
  const value = searchParams.get(key);
  return safePositiveNumber(value, defaultValue, min, max);
}

export function createSafeWhere(filters: Record<string, unknown>): Record<string, any> {
  const where: Record<string, any> = {};

  for (const [key, value] of Object.entries(filters)) {
    if (isNotNullish(value) && value !== '' && value !== 'all') {
      where[key] = value;
    }
  }

  return where;
}

export function safeUserIdFromParams(searchParams: URLSearchParams, defaultUserId: string = 'default-user'): string {
  const userId = searchParams.get('userId');
  return userId?.trim() || defaultUserId;
}