import { NextRequest, NextResponse } from 'next/server';
import { AchievementService } from '@/services/achievementService';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/middleware/apiWrapper';
import { safeUserIdFromParams } from '@/utils/nullSafety';

async function getAchievementsHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = safeUserIdFromParams(searchParams);
  const category = searchParams.get('category'); // streak, accuracy, volume, speed
  const withStats = searchParams.get('withStats') === 'true';

  if (withStats) {
    const data = await AchievementService.getUserAchievements(userId);
    return NextResponse.json(data);
  }

  const where: any = { userId };
  if (category) {
    where.category = category;
  }

  const achievements = await prisma.achievement.findMany({
    where,
    orderBy: { unlockedAt: 'desc' }
  });

  return NextResponse.json(achievements);
}

async function createAchievementHandler(request: NextRequest) {
  const body = await request.json();
  const { userId = 'ayansh', title, description, badgeIcon, category } = body;

  // Check if achievement already exists
  const existing = await prisma.achievement.findFirst({
    where: {
      userId,
      title
    }
  });

  if (existing) {
    return NextResponse.json({ message: 'Achievement already exists' }, { status: 409 });
  }

  const achievement = await prisma.achievement.create({
    data: {
      userId,
      title,
      description,
      badgeIcon,
      category,
      unlockedAt: new Date()
    }
  });

  return NextResponse.json(achievement);
}

export const GET = withErrorHandling(getAchievementsHandler);
export const POST = withErrorHandling(createAchievementHandler);