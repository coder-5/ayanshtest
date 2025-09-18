'use client';

import { useEffect, useRef } from 'react';

// Import KaTeX CSS
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  content: string;
  displayMode?: boolean;
  className?: string;
}

export function MathRenderer({ content, displayMode = false, className = '' }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderMath = async () => {
      if (!containerRef.current) return;

      try {
        // Dynamic import to avoid SSR issues
        const katex = await import('katex');

        // Clear previous content
        containerRef.current.innerHTML = '';

        // Process content to find and render LaTeX expressions
        const processedContent = await processLatexContent(content, katex.default, displayMode);
        containerRef.current.innerHTML = processedContent;
      } catch (error) {
        console.error('Error rendering math:', error);
        // Fallback to plain text
        if (containerRef.current) {
          containerRef.current.textContent = content;
        }
      }
    };

    renderMath();
  }, [content, displayMode]);

  return <div ref={containerRef} className={`math-content ${className}`} />;
}

// Helper function to process LaTeX content
async function processLatexContent(content: string, katex: any, displayMode: boolean): Promise<string> {
  // Patterns for different LaTeX delimiters
  const patterns = [
    { regex: /\$\$([\s\S]*?)\$\$/g, display: true },  // $$...$$
    { regex: /\\\[([\s\S]*?)\\\]/g, display: true },   // \[...\]
    { regex: /\$(.*?)\$/g, display: false },           // $...$
    { regex: /\\\((.*?)\\\)/g, display: false }        // \(...\)
  ];

  let processedContent = content;

  // Process each pattern
  for (const pattern of patterns) {
    processedContent = processedContent.replace(pattern.regex, (match, latex) => {
      try {
        return katex.renderToString(latex.trim(), {
          displayMode: pattern.display || displayMode,
          throwOnError: false,
          output: 'html',
          strict: false
        });
      } catch (error) {
        console.warn('KaTeX rendering error:', error);
        return match; // Return original if rendering fails
      }
    });
  }

  // Handle common math expressions that might not be in LaTeX format
  processedContent = processedContent.replace(/\b(\d+)\/(\d+)\b/g, '\\frac{$1}{$2}');
  processedContent = processedContent.replace(/\b(\w+)\^(\d+)\b/g, '$1^{$2}');
  processedContent = processedContent.replace(/\b(\w+)_(\d+)\b/g, '$1_{$2}');

  // Re-render after common math conversions
  const finalPatterns = [
    { regex: /\\frac\{(\d+)\}\{(\d+)\}/g, display: false },
    { regex: /(\w+)\^\{(\d+)\}/g, display: false },
    { regex: /(\w+)_\{(\d+)\}/g, display: false }
  ];

  for (const pattern of finalPatterns) {
    processedContent = processedContent.replace(pattern.regex, (match) => {
      try {
        return katex.renderToString(match, {
          displayMode: false,
          throwOnError: false,
          output: 'html',
          strict: false
        });
      } catch (error) {
        return match;
      }
    });
  }

  return processedContent;
}

// Component for inline math
export function InlineMath({ children, className = '' }: { children: string; className?: string }) {
  return <MathRenderer content={children} displayMode={false} className={`inline-math ${className}`} />;
}

// Component for display math
export function DisplayMath({ children, className = '' }: { children: string; className?: string }) {
  return <MathRenderer content={children} displayMode={true} className={`display-math ${className}`} />;
}

// Component for math within text content
export function MathText({ children, className = '' }: { children: string; className?: string }) {
  return (
    <div className={`math-text ${className}`}>
      <MathRenderer content={children} displayMode={false} />
    </div>
  );
}