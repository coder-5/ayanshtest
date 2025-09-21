'use client';

import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import 'katex/dist/katex.min.css';

interface MathRenderConfig {
  engine: 'katex' | 'mathjax' | 'auto';
  displayMode: boolean;
  interactive: boolean;
  accessibility: boolean;
  theme: 'light' | 'dark' | 'high-contrast';
  fontSize: number;
  colorScheme: MathColorScheme;
}

interface MathColorScheme {
  primary: string;
  secondary: string;
  operators: string;
  variables: string;
  constants: string;
  functions: string;
}

interface AdvancedMathRendererProps {
  expression: string;
  config?: Partial<MathRenderConfig>;
  onExpressionClick?: (element: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

const defaultConfig: MathRenderConfig = {
  engine: 'auto',
  displayMode: true,
  interactive: false,
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
};

export const AdvancedMathRenderer: React.FC<AdvancedMathRendererProps> = ({
  expression,
  config: userConfig = {},
  onExpressionClick,
  onError,
  className = ''
}) => {
  const config = { ...defaultConfig, ...userConfig };
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isInteractive, setIsInteractive] = useState(config.interactive);

  useEffect(() => {
    if (!containerRef.current || !expression) return;

    try {
      setRenderError(null);

      if (config.engine === 'katex' || (config.engine === 'auto' && isKaTeXExpression(expression))) {
        renderWithKaTeX(containerRef.current, expression, config);
      } else {
        renderWithMathJax(containerRef.current, expression, config);
      }

      if (config.interactive) {
        setupInteractivity(containerRef.current, onExpressionClick);
      }

      if (config.accessibility) {
        setupAccessibility(containerRef.current, expression);
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setRenderError(errorMsg);
      onError?.(error instanceof Error ? error : new Error(errorMsg));
    }
  }, [expression, config, onExpressionClick]);

  const isKaTeXExpression = (expr: string): boolean => {
    // Simple heuristic to determine if expression is better suited for KaTeX
    const katexFeatures = ['\\frac', '\\sqrt', '\\sum', '\\int', '\\lim', '\\binom'];
    return katexFeatures.some(feature => expr.includes(feature));
  };

  const renderWithKaTeX = (container: HTMLDivElement, expr: string, config: MathRenderConfig): void => {
    const options = {
      displayMode: config.displayMode,
      throwOnError: false,
      strict: false,
      trust: true,
      colorIsTextColor: true,
      maxSize: Infinity,
      maxExpand: 1000,
      output: 'html' as const,
      fleqn: false,
      leqno: false,
      macros: getCustomMacros(),
      globalGroup: true
    };

    const html = katex.renderToString(preprocessExpression(expr), options);
    container.innerHTML = html;

    // Apply custom styling
    applyMathStyling(container, config);
  };

  const renderWithMathJax = (container: HTMLDivElement, expr: string, _config: MathRenderConfig): void => {
    // MathJax rendering will be handled by the MathJax component wrapper
    container.innerHTML = `$$${preprocessExpression(expr)}$$`;
  };

  const preprocessExpression = (expr: string): string => {
    // Enhanced preprocessing for better rendering
    let processed = expr;

    // Convert common text patterns to LaTeX
    processed = processed
      .replace(/\b(\d+)\/(\d+)\b/g, '\\frac{$1}{$2}') // Fractions
      .replace(/\^(\d+)/g, '^{$1}') // Exponents
      .replace(/_(\d+)/g, '_{$1}') // Subscripts
      .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}') // Square roots
      .replace(/\bsin\b/g, '\\sin') // Trig functions
      .replace(/\bcos\b/g, '\\cos')
      .replace(/\btan\b/g, '\\tan')
      .replace(/\blog\b/g, '\\log')
      .replace(/\bln\b/g, '\\ln')
      .replace(/\bpi\b/g, '\\pi')
      .replace(/\balpha\b/g, '\\alpha')
      .replace(/\bbeta\b/g, '\\beta')
      .replace(/\bgamma\b/g, '\\gamma')
      .replace(/\bdelta\b/g, '\\delta')
      .replace(/\btheta\b/g, '\\theta')
      .replace(/\bphi\b/g, '\\phi')
      .replace(/\bomega\b/g, '\\omega')
      .replace(/\binfinity\b/g, '\\infty')
      .replace(/\bsum\b/g, '\\sum')
      .replace(/\bintegral\b/g, '\\int')
      .replace(/\blimit\b/g, '\\lim')
      .replace(/<=>/g, '\\Leftrightarrow')
      .replace(/=>/g, '\\Rightarrow')
      .replace(/<=/g, '\\Leftarrow')
      .replace(/\+\-/g, '\\pm')
      .replace(/\-\+/g, '\\mp')
      .replace(/\.\.\./g, '\\ldots');

    // Handle special cases for different math domains
    processed = enhanceForAlgebra(processed);
    processed = enhanceForGeometry(processed);
    processed = enhanceForCalculus(processed);
    processed = enhanceForStatistics(processed);

    return processed;
  };

  const enhanceForAlgebra = (expr: string): string => {
    return expr
      .replace(/\bx\^2\b/g, 'x^2')
      .replace(/\by\^2\b/g, 'y^2')
      .replace(/\bax\^2\s*\+\s*bx\s*\+\s*c/g, 'ax^2 + bx + c')
      .replace(/\b([a-z])\^(\d+)/g, '$1^{$2}');
  };

  const enhanceForGeometry = (expr: string): string => {
    return expr
      .replace(/\bangle\s*([A-Z]{3})/g, '\\angle $1')
      .replace(/\btriangle\s*([A-Z]{3})/g, '\\triangle $1')
      .replace(/\bparallel\b/g, '\\parallel')
      .replace(/\bperpendicular\b/g, '\\perp')
      .replace(/\bcongruent\b/g, '\\cong')
      .replace(/\bsimilar\b/g, '\\sim')
      .replace(/\bdegree\b/g, '^\\circ');
  };

  const enhanceForCalculus = (expr: string): string => {
    return expr
      .replace(/d\/dx/g, '\\frac{d}{dx}')
      .replace(/d\/dy/g, '\\frac{d}{dy}')
      .replace(/\bderivative\b/g, '\\frac{d}{dx}')
      .replace(/\bpartial\b/g, '\\partial')
      .replace(/\bintegral from (\d+) to (\d+)/g, '\\int_{$1}^{$2}')
      .replace(/\blim as x approaches (\d+)/g, '\\lim_{x \\to $1}');
  };

  const enhanceForStatistics = (expr: string): string => {
    return expr
      .replace(/\bmean\b/g, '\\bar{x}')
      .replace(/\bvariance\b/g, '\\sigma^2')
      .replace(/\bstd dev\b/g, '\\sigma')
      .replace(/\bstandard deviation\b/g, '\\sigma')
      .replace(/\bcombination\b/g, '\\binom')
      .replace(/\bpermutation\b/g, 'P');
  };

  const getCustomMacros = () => ({
    "\\f": "#1f(#2)",
    "\\N": "\\mathbb{N}",
    "\\Z": "\\mathbb{Z}",
    "\\Q": "\\mathbb{Q}",
    "\\R": "\\mathbb{R}",
    "\\C": "\\mathbb{C}",
    "\\diff": "\\mathrm{d}",
    "\\implies": "\\Rightarrow",
    "\\iff": "\\Leftrightarrow",
    "\\therefore": "\\therefore",
    "\\because": "\\because",
    "\\st": "\\text{ such that }",
    "\\given": "\\,|\\,",
    "\\abs": "\\left|#1\\right|",
    "\\norm": "\\left\\|#1\\right\\|",
    "\\set": "\\left\\{#1\\right\\}",
    "\\paren": "\\left(#1\\right)",
    "\\bracket": "\\left[#1\\right]",
    "\\floor": "\\left\\lfloor#1\\right\\rfloor",
    "\\ceil": "\\left\\lceil#1\\right\\rceil"
  });

  const applyMathStyling = (container: HTMLDivElement, config: MathRenderConfig): void => {
    const style = container.style;

    // Base styling
    style.fontSize = `${config.fontSize}px`;
    style.color = config.colorScheme.primary;

    // Theme-specific styling
    if (config.theme === 'dark') {
      style.backgroundColor = '#1a1a1a';
      style.color = '#ffffff';
    } else if (config.theme === 'high-contrast') {
      style.backgroundColor = '#ffffff';
      style.color = '#000000';
      style.border = '2px solid #000000';
    }

    // Color different mathematical elements
    const operators = container.querySelectorAll('.mord, .mbin, .mrel');
    operators.forEach(el => {
      (el as HTMLElement).style.color = config.colorScheme.operators;
    });

    const functions = container.querySelectorAll('.mop');
    functions.forEach(el => {
      (el as HTMLElement).style.color = config.colorScheme.functions;
    });
  };

  const setupInteractivity = (container: HTMLDivElement, onElementClick?: (element: string) => void): void => {
    container.style.cursor = 'pointer';

    const elements = container.querySelectorAll('.mord, .mop, .mbin, .mrel');
    elements.forEach(el => {
      el.addEventListener('click', (event) => {
        event.stopPropagation();
        const element = (event.target as HTMLElement).textContent || '';
        onElementClick?.(element);

        // Visual feedback
        (event.target as HTMLElement).style.backgroundColor = '#ffeb3b';
        setTimeout(() => {
          (event.target as HTMLElement).style.backgroundColor = '';
        }, 200);
      });

      el.addEventListener('mouseenter', () => {
        (el as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
      });

      el.addEventListener('mouseleave', () => {
        (el as HTMLElement).style.backgroundColor = '';
      });
    });
  };

  const setupAccessibility = (container: HTMLDivElement, expression: string): void => {
    container.setAttribute('role', 'math');
    container.setAttribute('aria-label', `Mathematical expression: ${expression}`);
    container.setAttribute('tabindex', '0');

    // Add keyboard navigation
    container.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        const elements = container.querySelectorAll('.mord, .mop, .mbin, .mrel');
        if (elements.length > 0) {
          (elements[0] as HTMLElement).focus();
        }
      }
    });

    // Generate alternative text description
    const altText = generateMathDescription(expression);
    container.setAttribute('aria-describedby', 'math-description');

    const description = document.createElement('div');
    description.id = 'math-description';
    description.className = 'sr-only';
    description.textContent = altText;
    container.appendChild(description);
  };

  const generateMathDescription = (expr: string): string => {
    // Generate human-readable description of mathematical expression
    let description = expr;

    description = description
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2')
      .replace(/\\sqrt\{([^}]+)\}/g, 'square root of $1')
      .replace(/\^(\d+)/g, ' to the power of $1')
      .replace(/_(\d+)/g, ' subscript $1')
      .replace(/\\sum/g, 'sum of')
      .replace(/\\int/g, 'integral of')
      .replace(/\\lim/g, 'limit of')
      .replace(/\\sin/g, 'sine of')
      .replace(/\\cos/g, 'cosine of')
      .replace(/\\tan/g, 'tangent of')
      .replace(/\\log/g, 'logarithm of')
      .replace(/\\ln/g, 'natural logarithm of')
      .replace(/\\pi/g, 'pi')
      .replace(/\\alpha/g, 'alpha')
      .replace(/\\beta/g, 'beta')
      .replace(/\\gamma/g, 'gamma')
      .replace(/\\delta/g, 'delta')
      .replace(/\\theta/g, 'theta')
      .replace(/\\infty/g, 'infinity');

    return `Mathematical expression: ${description}`;
  };

  if (renderError) {
    return (
      <div className={`math-error p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="text-red-700 font-semibold">Math Rendering Error</div>
        <div className="text-red-600 text-sm mt-2">{renderError}</div>
        <div className="text-gray-600 text-xs mt-2">Expression: {expression}</div>
      </div>
    );
  }

  const mathJaxConfig = {
    loader: { load: ['[tex]/color', '[tex]/physics', '[tex]/ams'] },
    tex: {
      packages: { '[+]': ['color', 'physics', 'ams'] },
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      macros: getCustomMacros()
    },
    options: {
      enableMenu: false,
      menuOptions: {
        settings: {
          assistiveMml: config.accessibility
        }
      }
    }
  };

  return (
    <div className={`advanced-math-renderer ${className}`}>
      {config.engine === 'mathjax' || (config.engine === 'auto' && !isKaTeXExpression(expression)) ? (
        <MathJaxContext config={mathJaxConfig}>
          <MathJax dynamic>
            <div ref={containerRef} className="math-container" />
          </MathJax>
        </MathJaxContext>
      ) : (
        <div ref={containerRef} className="math-container" />
      )}

      {config.interactive && (
        <div className="math-controls mt-2 flex gap-2">
          <button
            onClick={() => setIsInteractive(!isInteractive)}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            {isInteractive ? 'Disable' : 'Enable'} Interaction
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(expression)}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Copy LaTeX
          </button>
        </div>
      )}
    </div>
  );
};

export default AdvancedMathRenderer;