/**
 * Utility functions for the application
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts various YouTube URL formats to embed URL
 *
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID (already correct)
 * - https://m.youtube.com/watch?v=VIDEO_ID
 *
 * @param url YouTube URL in any supported format
 * @returns Embed URL or null if not a valid YouTube URL
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    let videoId: string | null = null;

    // Check different YouTube URL formats
    if (urlObj.hostname === 'youtu.be') {
      // Short format: https://youtu.be/VIDEO_ID
      videoId = urlObj.pathname.slice(1).split('?')[0] || null;
    } else if (
      urlObj.hostname === 'www.youtube.com' ||
      urlObj.hostname === 'youtube.com' ||
      urlObj.hostname === 'm.youtube.com'
    ) {
      if (urlObj.pathname === '/watch') {
        // Standard format: https://www.youtube.com/watch?v=VIDEO_ID
        videoId = urlObj.searchParams.get('v') ?? null;
      } else if (urlObj.pathname.startsWith('/embed/')) {
        // Already embed format: https://www.youtube.com/embed/VIDEO_ID
        videoId = urlObj.pathname.split('/embed/')[1]?.split('?')[0] ?? null;
      } else if (urlObj.pathname.startsWith('/v/')) {
        // Old format: https://www.youtube.com/v/VIDEO_ID
        videoId = urlObj.pathname.split('/v/')[1]?.split('?')[0] ?? null;
      }
    }

    // If we found a video ID, return the embed URL
    if (videoId && videoId.length === 11) {
      // YouTube video IDs are always 11 characters
      return `https://www.youtube.com/embed/${videoId}`;
    }

    return null;
  } catch {
    // If URL parsing fails, try simple replace (fallback)
    if (url.includes('watch?v=')) {
      const result = url.replace('watch?v=', 'embed/').split('&')[0];
      return result ?? null;
    }
    return null;
  }
}

/**
 * Formats a number as a percentage string
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Formats seconds as minutes and seconds (e.g., "2:30")
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats a date as a relative time string (e.g., "2 days ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Sanitizes a filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}
