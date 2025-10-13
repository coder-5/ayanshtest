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
 * Removes HTML tags while preserving:
 * - LaTeX inline math: $...$ and \(...\)
 * - LaTeX display math: $$...$$ and \[...\]
 */
export function sanitizeQuestionText(text: string): string {
  if (!text) return '';

  // Temporarily replace LaTeX math with placeholders
  const mathPlaceholders: string[] = [];
  let processedText = text;

  // Match $$...$$ (display math)
  processedText = processedText.replace(/\$\$([\s\S]*?)\$\$/g, (_match, content) => {
    mathPlaceholders.push(`$$${content}$$`);
    return `__MATH_${mathPlaceholders.length - 1}__`;
  });

  // Match $...$ (inline math)
  processedText = processedText.replace(/\$([^\$\n]+?)\$/g, (_match, content) => {
    mathPlaceholders.push(`$${content}$`);
    return `__MATH_${mathPlaceholders.length - 1}__`;
  });

  // Match \[...\] (display math)
  processedText = processedText.replace(/\\\[([\s\S]*?)\\\]/g, (_match, content) => {
    mathPlaceholders.push(`\\[${content}\\]`);
    return `__MATH_${mathPlaceholders.length - 1}__`;
  });

  // Match \(...\) (inline math)
  processedText = processedText.replace(/\\\(([\s\S]*?)\\\)/g, (_match, content) => {
    mathPlaceholders.push(`\\(${content}\\)`);
    return `__MATH_${mathPlaceholders.length - 1}__`;
  });

  // Sanitize HTML (strip all tags)
  const sanitized = DOMPurify.sanitize(processedText, { ALLOWED_TAGS: [] });

  // Restore LaTeX math
  let result = sanitized;
  mathPlaceholders.forEach((math, index) => {
    result = result.replace(`__MATH_${index}__`, math);
  });

  return result.trim();
}

/**
 * Sanitize option text (same as question text)
 */
export function sanitizeOptionText(text: string): string {
  return sanitizeQuestionText(text);
}

/**
 * Sanitize solution text (preserves more formatting for explanations)
 */
export function sanitizeSolutionText(text: string): string {
  if (!text) return '';

  // Temporarily replace LaTeX math with placeholders
  const mathPlaceholders: string[] = [];
  let processedText = text;

  // Match $$...$$ (display math)
  processedText = processedText.replace(/\$\$([\s\S]*?)\$\$/g, (_match, content) => {
    mathPlaceholders.push(`$$${content}$$`);
    return `__MATH_${mathPlaceholders.length - 1}__`;
  });

  // Match $...$ (inline math)
  processedText = processedText.replace(/\$([^\$\n]+?)\$/g, (_match, content) => {
    mathPlaceholders.push(`$${content}$`);
    return `__MATH_${mathPlaceholders.length - 1}__`;
  });

  // Match \[...\] (display math)
  processedText = processedText.replace(/\\\[([\s\S]*?)\\\]/g, (_match, content) => {
    mathPlaceholders.push(`\\[${content}\\]`);
    return `__MATH_${mathPlaceholders.length - 1}__`;
  });

  // Match \(...\) (inline math)
  processedText = processedText.replace(/\\\(([\s\S]*?)\\\)/g, (_match, content) => {
    mathPlaceholders.push(`\\(${content}\\)`);
    return `__MATH_${mathPlaceholders.length - 1}__`;
  });

  // Sanitize HTML - allow basic formatting for solutions
  const sanitized = DOMPurify.sanitize(processedText, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: [],
  });

  // Restore LaTeX math
  let result = sanitized;
  mathPlaceholders.forEach((math, index) => {
    result = result.replace(`__MATH_${index}__`, math);
  });

  return result.trim();
}

/**
 * Sanitize exam/topic names (alphanumeric + spaces + hyphens only)
 */
export function sanitizeIdentifier(text: string): string {
  if (!text) return '';
  return text.replace(/[^a-zA-Z0-9\s\-]/g, '').trim();
}
