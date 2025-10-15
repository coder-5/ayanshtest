'use client';

import { useState, useEffect } from 'react';
import { useVideoTracking } from '@/hooks/useVideoTracking';
import { getYouTubeEmbedUrl } from '@/lib/utils';

interface VideoPlayerProps {
  questionId: string;
  videoUrl: string;
  title?: string;
  onComplete?: () => void;
}

export function VideoPlayer({ questionId, videoUrl, title, onComplete }: VideoPlayerProps) {
  const [isWatched, setIsWatched] = useState(false);
  const { markAsCompleted } = useVideoTracking({
    questionId,
    videoUrl,
    onComplete: () => {
      setIsWatched(true);
      onComplete?.();
    },
  });

  // Try to get YouTube embed URL, otherwise use the URL directly
  const embedUrl = getYouTubeEmbedUrl(videoUrl) || videoUrl;

  useEffect(() => {
    // Listen for YouTube iframe API messages
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return;

      try {
        const data = JSON.parse(event.data);
        // YouTube player ended event
        if (data.event === 'onStateChange' && data.info === 0) {
          markAsCompleted();
        }
      } catch {
        // Ignore parsing errors
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [markAsCompleted]);

  return (
    <div className="relative">
      {isWatched && (
        <div className="absolute top-2 right-2 z-10 px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full shadow-lg">
          ✓ Completed
        </div>
      )}
      <div
        className="relative w-full bg-gray-100 rounded-lg overflow-hidden"
        style={{ paddingBottom: '56.25%' }}
      >
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={embedUrl}
          title={title || 'Video solution'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
