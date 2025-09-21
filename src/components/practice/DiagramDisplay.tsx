'use client';

import React, { useEffect } from 'react';
import { DiagramService } from '@/services/diagramService';
import 'katex/dist/katex.min.css';

interface DiagramDisplayProps {
  questionText: string;
  className?: string;
}

export default function DiagramDisplay({ questionText, className = '' }: DiagramDisplayProps) {
  // Check if this question needs a diagram
  const needsDiagram = DiagramService.needsDiagram(questionText);

  useEffect(() => {
    // Load KaTeX CSS if not already loaded
    if (!document.querySelector('link[href*="katex"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
      document.head.appendChild(link);
    }
  }, []);

  if (!needsDiagram) {
    return null;
  }

  // Generate the diagram
  const diagram = DiagramService.generateDiagram(questionText);

  if (!diagram) {
    return null;
  }

  // Check if this is a math diagram (HTML) or SVG diagram
  const isMathDiagram = diagram.includes('<div class="math-diagram"');

  return (
    <div className={`diagram-container bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200 shadow-sm ${className}`}>
      <div className="text-sm text-blue-700 mb-3 font-semibold flex items-center">
        {isMathDiagram ? '🧮' : '📐'} {isMathDiagram ? 'Mathematical Expression' : 'Visual Diagram'}
      </div>

      {isMathDiagram ? (
        <div
          className="diagram-content"
          dangerouslySetInnerHTML={{ __html: diagram }}
        />
      ) : (
        <div className="diagram-content flex justify-center bg-white p-4 rounded-lg shadow-inner">
          <div dangerouslySetInnerHTML={{ __html: diagram }} />
        </div>
      )}

      <div className="text-xs text-blue-600 mt-3 text-center italic">
        ✨ AI-generated visualization to help understand the problem
      </div>
    </div>
  );
}