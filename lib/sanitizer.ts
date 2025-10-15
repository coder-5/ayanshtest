/**
 * Input Sanitization Library
 *
 * Sanitizes text input to prevent HTML injection and rendering issues
 * while preserving LaTeX math expressions for KaTeX rendering.
 *
 * Critical for importing data from:
 * - PDFs (OCR extraction)
 * - Images (OCR)
 * - Web scraping
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize question text, preserving LaTeX math delimiters
 *
 * Only removes dangerous tags (script, style, iframe) while preserving:
 * - LaTeX inline math: $...$ and \(...\)
 * - LaTeX display math: $$...$$ and \[...\]
 * - All safe formatting tags (bold, italic, lists, etc.)
 */
export function sanitizeQuestionText(text: string): string {
  if (!text) return '';

  // Minimal sanitization - only block dangerous tags
  const sanitized = DOMPurify.sanitize(text, {
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'link'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });

  return sanitized.trim();
}

/**
 * Sanitize option text (same as question text)
 */
export function sanitizeOptionText(text: string): string {
  return sanitizeQuestionText(text);
}

/**
 * Sanitize solution text (same minimal sanitization)
 */
export function sanitizeSolutionText(text: string): string {
  return sanitizeQuestionText(text);
}

/**
 * Sanitize exam/topic names (alphanumeric + spaces + hyphens only)
 */
export function sanitizeIdentifier(text: string): string {
  if (!text) return '';
  return text.replace(/[^a-zA-Z0-9\s\-]/g, '').trim();
}
