'use client';

/**
 * HTML Sanitization utility using DOMPurify
 * Protects against XSS attacks
 */

import React from 'react';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS
 * For math content that may contain formulas
 * @param dirty Untrusted HTML string
 * @returns Safe HTML string
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'span',
      'div',
      'a',
      'img',
      'sub',
      'sup',
      'h1',
      'h2',
      'h3',
      'h4',
      'ul',
      'ol',
      'li',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize plain text (strips all HTML)
 * Use for user input that should never contain markup
 * @param dirty Untrusted text
 * @returns Plain text only
 */
export function sanitizeText(dirty: string): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

/**
 * Component for safely rendering user content with HTML
 * Usage: <SafeHtml html={userContent} className="..." />
 */
export const SafeHtml = ({ html, className }: { html: string; className?: string }) => {
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />;
};

/**
 * Component for rendering plain text only (no HTML allowed)
 * Usage: <SafeText text={userInput} className="..." />
 */
export const SafeText = ({ text, className }: { text: string; className?: string }) => {
  return <span className={className}>{sanitizeText(text)}</span>;
};
