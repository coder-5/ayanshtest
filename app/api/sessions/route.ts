/**
 * SINGLE-USER APPLICATION
 * This API is designed for Ayansh only - no multi-user support needed.
 * All sessions belong to the hardcoded user ID.
 * DO NOT add userId parameters, user switching, or multi-tenant features.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { USER_ID } from '@/lib/constants';
import { sessionSchema } from '@/lib/validation';
import { z } from 'zod';
import { withErrorHandler, successResponse } from '@/lib/error-handler';

export const GET = withErrorHandler(async (request: Request) => {
  // Hardcoded for single user - this is intentional
  const userId = USER_ID;
  const { searchParams } = new URL(request.url);
  const rawLimit = searchParams.get('limit') || '50';

  // Validate query params
  const limitSchema = z.number().min(1).max(500);
  const limit = limitSchema.parse(parseInt(rawLimit));

  const sessions = await prisma.practiceSession.findMany({
    where: {
      userId,
    },
    orderBy: {
      startedAt: 'desc',
    },
    take: limit,
    include: {
      _count: {
        select: {
          attempts: true,
        },
      },
    },
  });

  return successResponse({ sessions });
});

export const POST = withErrorHandler(async (request: Request) => {
  // Hardcoded for single user - this is intentional
  const userId = USER_ID;
  const body = await request.json();

  // Validate request body
  const validated = sessionSchema.parse({ ...body, userId });

  const session = await prisma.practiceSession.create({
    data: {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: validated.userId,
      sessionType: validated.sessionType,
      focusTopics: body.focusTopics || null,
      examSimulation: body.examSimulation || null,
      startedAt: new Date(),
    },
  });

  return successResponse({ success: true, session }, 201);
});
