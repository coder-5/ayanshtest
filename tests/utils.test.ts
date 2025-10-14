import { describe, it, expect } from 'vitest';
import {
  cn,
  getYouTubeEmbedUrl,
  formatPercentage,
  formatTime,
  formatRelativeTime,
  sanitizeFilename,
} from '@/lib/utils';

describe('Utils - Class Name Merging', () => {
  describe('cn', () => {
    it('should merge simple class names', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'truthy', false && 'falsy');
      expect(result).toBe('base truthy');
    });

    it('should merge Tailwind classes with proper precedence', () => {
      const result = cn('px-4', 'px-8');
      expect(result).toBe('px-8'); // Later class should win
    });

    it('should handle undefined and null', () => {
      const result = cn('base', undefined, null, 'other');
      expect(result).toBe('base other');
    });
  });
});

describe('Utils - YouTube URL Conversion', () => {
  describe('getYouTubeEmbedUrl', () => {
    it('should convert standard watch URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const result = getYouTubeEmbedUrl(url);
      expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should convert youtu.be short URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      const result = getYouTubeEmbedUrl(url);
      expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should handle already embedded URL', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      const result = getYouTubeEmbedUrl(url);
      expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should convert mobile URL', () => {
      const url = 'https://m.youtube.com/watch?v=dQw4w9WgXcQ';
      const result = getYouTubeEmbedUrl(url);
      expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should handle URL without www', () => {
      const url = 'https://youtube.com/watch?v=dQw4w9WgXcQ';
      const result = getYouTubeEmbedUrl(url);
      expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should handle URL with additional query parameters', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s&list=PLxyz';
      const result = getYouTubeEmbedUrl(url);
      expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should handle old /v/ format', () => {
      const url = 'https://www.youtube.com/v/dQw4w9WgXcQ';
      const result = getYouTubeEmbedUrl(url);
      expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should handle youtu.be with query parameters', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ?t=30';
      const result = getYouTubeEmbedUrl(url);
      expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should return null for empty string', () => {
      const result = getYouTubeEmbedUrl('');
      expect(result).toBe(null);
    });

    it('should return null for non-YouTube URL', () => {
      const url = 'https://vimeo.com/123456';
      const result = getYouTubeEmbedUrl(url);
      expect(result).toBe(null);
    });

    it('should return null for invalid URL', () => {
      const url = 'not-a-url';
      const result = getYouTubeEmbedUrl(url);
      expect(result).toBe(null);
    });

    it('should reject video ID that is not 11 characters', () => {
      const url = 'https://www.youtube.com/watch?v=short';
      const result = getYouTubeEmbedUrl(url);
      expect(result).toBe(null);
    });

    it('should handle URL with embed and query params', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1';
      const result = getYouTubeEmbedUrl(url);
      expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });
  });
});

describe('Utils - Formatting Functions', () => {
  describe('formatPercentage', () => {
    it('should format whole numbers', () => {
      expect(formatPercentage(75)).toBe('75%');
    });

    it('should round decimals', () => {
      expect(formatPercentage(75.6)).toBe('76%');
      expect(formatPercentage(75.4)).toBe('75%');
    });

    it('should handle 0', () => {
      expect(formatPercentage(0)).toBe('0%');
    });

    it('should handle 100', () => {
      expect(formatPercentage(100)).toBe('100%');
    });

    it('should handle values over 100', () => {
      expect(formatPercentage(125)).toBe('125%');
    });

    it('should handle negative values', () => {
      expect(formatPercentage(-10)).toBe('-10%');
    });
  });

  describe('formatTime', () => {
    it('should format seconds only', () => {
      expect(formatTime(45)).toBe('0:45');
    });

    it('should format minutes and seconds', () => {
      expect(formatTime(150)).toBe('2:30');
    });

    it('should pad seconds with zero', () => {
      expect(formatTime(125)).toBe('2:05');
    });

    it('should handle 0 seconds', () => {
      expect(formatTime(0)).toBe('0:00');
    });

    it('should handle exactly 1 minute', () => {
      expect(formatTime(60)).toBe('1:00');
    });

    it('should handle large times', () => {
      expect(formatTime(3665)).toBe('61:05');
    });
  });

  describe('formatRelativeTime', () => {
    it('should return "Today" for current day', () => {
      const today = new Date();
      expect(formatRelativeTime(today)).toBe('Today');
    });

    it('should return "Yesterday" for previous day', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatRelativeTime(yesterday)).toBe('Yesterday');
    });

    it('should return days ago for recent dates', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');
    });

    it('should return weeks ago for older dates', () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      expect(formatRelativeTime(twoWeeksAgo)).toBe('2 weeks ago');
    });

    it('should return months ago for much older dates', () => {
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
      expect(formatRelativeTime(twoMonthsAgo)).toBe('2 months ago');
    });

    it('should return years ago for very old dates', () => {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      expect(formatRelativeTime(twoYearsAgo)).toBe('2 years ago');
    });

    it('should handle edge case of exactly 7 days', () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const result = formatRelativeTime(sevenDaysAgo);
      expect(['7 days ago', '1 weeks ago']).toContain(result);
    });
  });

  describe('sanitizeFilename', () => {
    it('should keep alphanumeric characters', () => {
      expect(sanitizeFilename('test123.pdf')).toBe('test123.pdf');
    });

    it('should replace spaces with underscores', () => {
      expect(sanitizeFilename('my file.pdf')).toBe('my_file.pdf');
    });

    it('should replace special characters with underscores', () => {
      expect(sanitizeFilename('file@#$%name.pdf')).toBe('file_name.pdf');
    });

    it('should collapse multiple underscores', () => {
      expect(sanitizeFilename('file   name.pdf')).toBe('file_name.pdf');
    });

    it('should convert to lowercase', () => {
      expect(sanitizeFilename('MyFile.PDF')).toBe('myfile.pdf');
    });

    it('should keep dots and hyphens', () => {
      expect(sanitizeFilename('my-file.v2.pdf')).toBe('my-file.v2.pdf');
    });

    it('should handle filenames with paths', () => {
      expect(sanitizeFilename('path/to/file.pdf')).toBe('path_to_file.pdf');
    });

    it('should handle empty string', () => {
      expect(sanitizeFilename('')).toBe('');
    });

    it('should handle only special characters', () => {
      expect(sanitizeFilename('@#$%^&*()')).toBe('_');
    });
  });
});
