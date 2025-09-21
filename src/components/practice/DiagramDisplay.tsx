'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { DiagramService } from '@/services/diagramService';
import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';

// Dynamically import advanced components to avoid SSR issues
const InteractiveDiagram = dynamic(() => import('@/components/diagrams/InteractiveDiagram'), {
  ssr: false,
  loading: () => <DiagramLoadingSkeleton />
});

const AdvancedMathRenderer = dynamic(() => import('@/components/math/AdvancedMathRenderer'), {
  ssr: false,
  loading: () => <MathLoadingSkeleton />
});

interface DiagramDisplayProps {
  questionText: string;
  className?: string;
  enhanced?: boolean; // Use advanced features
  interactive?: boolean;
}

function DiagramLoadingSkeleton() {
  return (
    <div className="animate-pulse bg-gray-200 h-96 rounded-lg flex items-center justify-center">
      <div className="text-gray-500">Loading interactive diagram...</div>
    </div>
  );
}

function MathLoadingSkeleton() {
  return (
    <div className="animate-pulse bg-gray-200 h-20 rounded-lg flex items-center justify-center">
      <div className="text-gray-500">Rendering mathematics...</div>
    </div>
  );
}

export default function DiagramDisplay({
  questionText,
  className = '',
  enhanced = true,
  interactive = true
}: DiagramDisplayProps) {
  const [needsDiagram, setNeedsDiagram] = useState(false);
  const [diagramType, setDiagramType] = useState<'basic' | 'interactive' | 'math'>('basic');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Determine if diagram is needed and what type
      const requires = DiagramService.needsDiagram(questionText);
      setNeedsDiagram(requires);

      if (requires) {
        // Determine diagram type based on content analysis
        const hasAdvancedMath = /\$.*?\$|\\[a-zA-Z]+|[a-zA-Z]\s*=\s*[0-9]+|\b(?:sin|cos|tan|log|ln|sqrt|sum|int)\b/.test(questionText);
        const hasGeometry = /triangle|circle|rectangle|polygon|angle|coordinate|graph/.test(questionText.toLowerCase());

        if (hasAdvancedMath && enhanced) {
          setDiagramType('math');
        } else if (hasGeometry && enhanced && interactive) {
          setDiagramType('interactive');
        } else {
          setDiagramType('basic');
        }
      }

      // Load KaTeX CSS if not already loaded
      if (!document.querySelector('link[href*="katex"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
        document.head.appendChild(link);
      }
    } catch (err) {
      console.error('Error analyzing diagram requirements:', err);
      setError('Failed to analyze diagram requirements');
    }
  }, [questionText, enhanced, interactive]);

  if (error) {
    return (
      <div className={`error-container bg-red-50 border border-red-200 p-4 rounded-lg ${className}`}>
        <div className="text-red-700 font-semibold">Diagram Error</div>
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  if (!needsDiagram) {
    return null;
  }

  const renderDiagramContent = () => {
    switch (diagramType) {
      case 'interactive':
        return (
          <Suspense fallback={<DiagramLoadingSkeleton />}>
            <InteractiveDiagram
              questionText={questionText}
              config={{
                interactive: true,
                animated: true,
                responsive: true,
                accessibility: {
                  screenReaderSupport: true,
                  highContrast: false,
                  fontSize: 'medium',
                  colorBlindFriendly: true,
                  keyboardNavigation: true
                }
              }}
              onShapeClick={(_shapeId, _data) => {
              }}
              onMeasurementChange={(_measurement, _value) => {
              }}
            />
          </Suspense>
        );

      case 'math':
        return (
          <Suspense fallback={<MathLoadingSkeleton />}>
            <AdvancedMathRenderer
              expression={extractMathExpression(questionText)}
              config={{
                engine: 'auto',
                displayMode: true,
                interactive: true,
                accessibility: true,
                theme: 'light',
                fontSize: 16,
                colorScheme: {
                  primary: '#000000',
                  secondary: '#666666',
                  operators: '#0066cc',
                  variables: '#cc6600',
                  constants: '#009900',
                  functions: '#cc0066'
                }
              }}
              onExpressionClick={(element) => {
              }}
              onError={(error) => {
                console.error('Math rendering error:', error);
                setError('Failed to render mathematical expression');
              }}
            />
          </Suspense>
        );

      case 'basic':
      default:
        // Fallback to original diagram service
        const diagram = DiagramService.generateDiagram(questionText);
        if (!diagram) return null;

        const isMathDiagram = diagram.includes('<div class="math-diagram"');

        return (
          <div className="diagram-content">
            <div className="text-sm text-blue-700 mb-3 font-semibold flex items-center">
              {isMathDiagram ? '🧮' : '📐'} {isMathDiagram ? 'Mathematical Expression' : 'Visual Diagram'}
            </div>

            {isMathDiagram ? (
              <div dangerouslySetInnerHTML={{ __html: diagram }} />
            ) : (
              <div className="flex justify-center bg-white p-4 rounded-lg shadow-inner">
                <div dangerouslySetInnerHTML={{ __html: diagram }} />
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className={`diagram-container bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200 shadow-sm ${className}`}>
      {renderDiagramContent()}

      <div className="text-xs text-blue-600 mt-3 text-center italic flex items-center justify-center gap-1">
        ✨
        {diagramType === 'interactive' && 'Interactive '}
        {diagramType === 'math' && 'Advanced Mathematical '}
        AI-generated visualization to help understand the problem
        {diagramType === 'interactive' && ' • Click and drag to explore'}
      </div>
    </div>
  );
}

function extractMathExpression(text: string): string {
  // Extract mathematical expressions from the text
  const latexMatch = text.match(/\$(.+?)\$/);
  if (latexMatch) return latexMatch[1];

  const equationMatch = text.match(/([a-zA-Z]\s*=\s*[0-9+\-*/()^.\s]+)/);
  if (equationMatch) return equationMatch[1];

  const fractionMatch = text.match(/(\d+)\/(\d+)/);
  if (fractionMatch) return `\\frac{${fractionMatch[1]}}{${fractionMatch[2]}}`;

  // Return simplified version of the text for mathematical rendering
  return text.replace(/\b(\d+)\/(\d+)\b/g, '\\frac{$1}{$2}')
    .replace(/\^(\d+)/g, '^{$1}')
    .replace(/_(\d+)/g, '_{$1}');
}