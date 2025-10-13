import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/userContext';
import { videoViewSchema } from '@/lib/validations';

// Record a video view
export async function POST(request: Request) {

  try {
    const userId = getCurrentUserId();
    const body = await request.json();

    // Validate request body
    const validated = videoViewSchema.parse(body);

    // Upsert video view (update if exists, create if doesn't)
    const videoView = await prisma.videoView.upsert({
      where: {
        userId_questionId_videoUrl: {
          userId,
          questionId: validated.questionId,
          videoUrl: validated.videoUrl,
        },
      },
      update: {
        watchDuration: validated.watchDuration,
        completedVideo: validated.completedVideo,
        watchedAt: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        userId,
        questionId: validated.questionId,
        videoUrl: validated.videoUrl,
        watchDuration: validated.watchDuration,
        completedVideo: validated.completedVideo,
      },
    });

    return NextResponse.json({ success: true, videoView });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to record video view' }, { status: 500 });
  }
}

// Get video views for the current user
export async function GET(request: Request) {

  try {
    const userId = getCurrentUserId();
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');

    const where: {
      userId: string;
      questionId?: string;
    } = { userId };

    if (questionId) {
      where.questionId = questionId;
    }

    const videoViews = await prisma.videoView.findMany({
      where,
      orderBy: {
        watchedAt: 'desc',
      },
      include: {
        question: {
          select: {
            questionText: true,
            examName: true,
            examYear: true,
            topic: true,
          },
        },
      },
    });

    // Calculate statistics
    const stats = {
      totalVideosWatched: videoViews.length,
      totalWatchTime: videoViews.reduce((sum, view) => sum + view.watchDuration, 0),
      completedVideos: videoViews.filter((view) => view.completedVideo).length,
    };

    return NextResponse.json({ videoViews, stats });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch video views' }, { status: 500 });
  }
}
