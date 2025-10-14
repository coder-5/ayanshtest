'use client';

import { useEffect, useRef } from 'react';

/**
 * Component that renders mathematical content with MathJax
 * Automatically triggers MathJax typesetting when content changes
 */
export function MathContent({ content, className }: { content: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && typeof window !== 'undefined' && (window as any).MathJax) {
      // Typeset the math content
      (window as any).MathJax.typesetPromise([containerRef.current]).catch((err: any) =>
        console.error('MathJax typesetting failed:', err)
      );
    }
  }, [content]);

  return (
    <div ref={containerRef} className={className} dangerouslySetInnerHTML={{ __html: content }} />
  );
}
