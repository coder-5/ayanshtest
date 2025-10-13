'use client';

import { useCallback, useRef, useEffect } from 'react';

interface VideoTrackingOptions {
  questionId: string;
  videoUrl: string;
  onComplete?: () => void;
}

export function useVideoTracking({ questionId, videoUrl, onComplete }: VideoTrackingOptions) {
  const startTimeRef = useRef<number>(Date.now());
  const watchDurationRef = useRef<number>(0);
  const hasTrackedRef = useRef<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const trackVideoView = useCallback(
    async (completed: boolean = false) => {
      const watchDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      watchDurationRef.current = watchDuration;

      try {
        await fetch('/api/video-views', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId,
            videoUrl,
            watchDuration,
            completedVideo: completed,
          }),
        });

        if (completed && !hasTrackedRef.current) {
          hasTrackedRef.current = true;
          onComplete?.();
        }
      } catch (error) {
        console.error('Failed to track video view:', error);
      }
    },
    [questionId, videoUrl, onComplete]
  );

  // Track video view on mount
  useEffect(() => {
    startTimeRef.current = Date.now();
    hasTrackedRef.current = false;

    // Track progress every 10 seconds
    intervalRef.current = setInterval(() => {
      const currentDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      watchDurationRef.current = currentDuration;

      // Auto-save progress every 30 seconds
      if (currentDuration % 30 === 0 && currentDuration > 0) {
        trackVideoView(false);
      }
    }, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Save final watch duration on unmount
      if (watchDurationRef.current > 0) {
        trackVideoView(false);
      }
    };
  }, [questionId, videoUrl, trackVideoView]);

  const markAsCompleted = useCallback(() => {
    trackVideoView(true);
  }, [trackVideoView]);

  return {
    markAsCompleted,
    trackProgress: trackVideoView,
  };
}
