'use client';

import { useEffect, useRef } from 'react';

/**
 * Component that renders mathematical content with MathJax
 * Automatically triggers MathJax typesetting when content changes
 */
export function MathContent({ content, className }: { content: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<string>('');

  useEffect(() => {
    // Only update innerHTML if content actually changed
    if (containerRef.current && contentRef.current !== content) {
      containerRef.current.innerHTML = content;
      contentRef.current = content;

      // Typeset after setting innerHTML
      if (typeof window !== 'undefined' && (window as any).MathJax) {
        (window as any).MathJax.typesetPromise([containerRef.current]).catch((err: any) =>
          console.error('MathJax typesetting failed:', err)
        );
      }
    }
  }, [content]);

  return <div ref={containerRef} className={className} />;
}
