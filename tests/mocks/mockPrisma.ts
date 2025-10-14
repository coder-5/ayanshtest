/**
 * Prisma Mock Factory
 *
 * Creates reusable Prisma client mocks for testing
 */

import { vi } from 'vitest';

/**
 * Create a fresh Prisma mock with all models
 */
export function createPrismaMock() {
  return {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    question: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    option: {
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    solution: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    userAttempt: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    practiceSession: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    achievement: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userAchievement: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    dailyProgress: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    weeklyAnalysis: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    topicPerformance: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    bookmark: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    errorReport: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    userDiagram: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    videoView: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    examSchedule: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((callback) => {
      // Execute transaction callback immediately with same mock
      if (typeof callback === 'function') {
        return callback(createPrismaMock());
      }
      return Promise.resolve([]);
    }),
    $disconnect: vi.fn(),
  };
}

/**
 * Reset all mocks in a Prisma mock instance
 */
export function resetPrismaMock(prismaMock: ReturnType<typeof createPrismaMock>) {
  Object.values(prismaMock).forEach((model) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((fn) => {
        if (typeof fn === 'function' && 'mockClear' in fn) {
          fn.mockClear();
        }
      });
    }
  });
}

/**
 * Helper to mock transaction behavior
 */
export function mockTransaction(
  prismaMock: ReturnType<typeof createPrismaMock>,
  callback: (tx: ReturnType<typeof createPrismaMock>) => Promise<unknown>
) {
  prismaMock.$transaction.mockImplementation(async (cb) => {
    if (typeof cb === 'function') {
      return await callback(prismaMock);
    }
    return [];
  });
}
