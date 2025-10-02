'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import katex from 'katex';
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
  interactive: true,
  accessibility: true,
  theme: 'light',
  fontSize: 16,
  colorScheme: {
    primary: 'inherit',
    secondary: 'inherit',
    operators: 'inherit',
    variables: 'inherit',
    constants: 'inherit',
    functions: 'inherit'
  }
};

// Preprocessing function - now just returns the expression as-is for mixed content parsing
const preprocessExpression = (expr: string): string => {
  // Enhanced math expressions will be processed individually during rendering
  return expr;
};

// Enhanced math expression processing (only for content inside dollar signs)
const enhanceMathExpression = (mathExpr: string): string => {
  let processed = mathExpr.trim();

  // Convert common text patterns to LaTeX (only inside math expressions)
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

export const AdvancedMathRenderer: React.FC<AdvancedMathRendererProps> = React.memo(({
  expression,
  config: userConfig = {},
  onExpressionClick,
  onError,
  className = ''
}) => {
  const config = useMemo(() => ({ ...defaultConfig, ...userConfig }), [userConfig]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const lastRenderedExpressionRef = useRef<string>('');

  // Memoize the processed expression to prevent re-renders
  const processedExpression = useMemo(() => preprocessExpression(expression), [expression]);

  // Stable references for callbacks
  const stableOnExpressionClick = useRef(onExpressionClick);
  const stableOnError = useRef(onError);

  useEffect(() => {
    stableOnExpressionClick.current = onExpressionClick;
  }, [onExpressionClick]);

  useEffect(() => {
    stableOnError.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!containerRef.current || !expression || !processedExpression) return;

    // Skip re-render if expression hasn't changed
    if (lastRenderedExpressionRef.current === processedExpression && !isRendering) {
      return;
    }

    const container = containerRef.current;
    let isMounted = true;

    const renderMath = async () => {
      if (!isMounted || !container || !processedExpression) return;

      // Prevent concurrent renders
      if (isRendering) return;
      setIsRendering(true);

      try {
        setRenderError(null);

        // Create a temporary container for new content
        const tempContainer = document.createElement('div');
        tempContainer.style.visibility = 'hidden';
        tempContainer.style.position = 'absolute';
        document.body.appendChild(tempContainer);

        // Always use the mixed content renderer for proper text/math handling
        renderMixedContent(tempContainer, processedExpression, config);

        // Wait for any async rendering to complete
        await new Promise(resolve => setTimeout(resolve, 0));

        // Only replace content after successful render
        if (isMounted && container) {
          // Use opacity transition to reduce flicker
          container.style.opacity = '0';

          setTimeout(() => {
            if (isMounted && container) {
              container.innerHTML = tempContainer.innerHTML;

              if (config.interactive) {
                setupInteractivity(container, stableOnExpressionClick.current);
              }

              if (config.accessibility) {
                setupAccessibility(container, processedExpression);
              }

              container.style.opacity = '1';
              lastRenderedExpressionRef.current = processedExpression;
            }
          }, 10);
        }

        // Clean up temp container
        document.body.removeChild(tempContainer);

      } catch (error) {
        if (isMounted) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          setRenderError(errorMsg);
          stableOnError.current?.(error instanceof Error ? error : new Error(errorMsg));
        }
      } finally {
        if (isMounted) {
          setIsRendering(false);
        }
      }
    };

    renderMath();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processedExpression, config]);


  const renderMixedContent = (container: HTMLDivElement, expr: string, config: MathRenderConfig): void => {
    const processedExpr = preprocessExpression(expr);

    // Check if the content contains any math expressions
    const hasMath = /\$\$.*?\$\$|\$.*?\$/g.test(processedExpr);

    if (!hasMath) {
      // Pure text content
      container.textContent = processedExpr;
      container.style.whiteSpace = 'pre-line'; // Preserve line breaks
      return;
    }

    // Mixed content - parse and render each part
    const parts = parseMixedContent(processedExpr);
    container.innerHTML = '';

    parts.forEach(part => {
      if (part.type === 'text') {
        const textSpan = document.createElement('span');
        textSpan.textContent = part.content;
        textSpan.style.color = 'inherit';
        textSpan.style.display = 'inline';
        textSpan.style.whiteSpace = 'pre-line'; // Preserve line breaks
        container.appendChild(textSpan);
      } else if (part.type === 'math') {
        const mathSpan = document.createElement('span');
        mathSpan.style.display = 'inline';
        renderSingleMathExpression(mathSpan, part.content);
        container.appendChild(mathSpan);
      }
    });

    // Apply custom styling
    applyMathStyling(container, config);
  };

  const parseMixedContent = (expr: string): Array<{type: 'text' | 'math', content: string}> => {
    const parts: Array<{type: 'text' | 'math', content: string}> = [];
    let currentPos = 0;

    // Find all math expressions - improved regex to handle various LaTeX formats
    const mathRegex = /(\$\$([^$]*?)\$\$|\\\[(.*?)\\\]|\\\((.*?)\\\)|\$([^$]+?)\$)/g;
    let match;

    while ((match = mathRegex.exec(expr)) !== null) {
      // Add text before math expression
      if (match.index > currentPos) {
        const textContent = expr.slice(currentPos, match.index);
        if (textContent) {
          parts.push({type: 'text', content: textContent});
        }
      }

      // Add math expression (without delimiters) - check all capture groups
      const mathContent = match[2] || match[3] || match[4] || match[5];
      if (mathContent && mathContent.trim()) {
        parts.push({type: 'math', content: mathContent.trim()});
      }

      currentPos = match.index + match[0].length;
    }

    // Add remaining text after last math expression
    if (currentPos < expr.length) {
      const textContent = expr.slice(currentPos);
      if (textContent) {
        parts.push({type: 'text', content: textContent});
      }
    }

    // If no parts were found, treat the entire expression as text
    if (parts.length === 0 && expr.trim()) {
      parts.push({type: 'text', content: expr});
    }

    return parts;
  };

  const renderSingleMathExpression = (container: HTMLElement, mathExpr: string): void => {
    try {
      // Apply math enhancements to the expression
      const enhancedExpr = enhanceMathExpression(mathExpr);

      const options = {
        displayMode: false, // Inline math for mixed content
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

      const html = katex.renderToString(enhancedExpr, options);
      container.innerHTML = html;
    } catch (error) {
      // Log the issue for debugging

      // Better fallback handling - try to render as simple math or show readable text
      try {
        // Try a simpler version without complex LaTeX commands
        const simpleExpr = mathExpr
          .replace(/\\[a-zA-Z]+\{([^}]+)\}/g, '$1') // Remove LaTeX commands, keep content
          .replace(/\\[a-zA-Z]+/g, '') // Remove LaTeX commands without braces
          .replace(/[{}]/g, '') // Remove remaining braces
          .trim();

        if (simpleExpr) {
          // Try to render the simplified expression
          const html = katex.renderToString(simpleExpr, {
            displayMode: false,
            throwOnError: false,
            strict: false,
            trust: true
          });
          container.innerHTML = html;
        } else {
          // Show as plain text without dollar signs
          container.textContent = mathExpr;
          container.style.whiteSpace = 'pre-line'; // Preserve line breaks
        }
      } catch (secondError) {
        // Final fallback - show as readable text without LaTeX syntax
        const readableText = mathExpr
          .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
          .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
          .replace(/\^(\d+)/g, '^$1')
          .replace(/_(\d+)/g, '_$1')
          .replace(/\\[a-zA-Z]+/g, '')
          .replace(/[{}]/g, '')
          .trim();
        container.textContent = readableText || mathExpr;
        container.style.whiteSpace = 'pre-line'; // Preserve line breaks
      }
    }
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

    // Base styling - only set font size, not color for mixed content
    style.fontSize = `${config.fontSize}px`;

    // Theme-specific styling - only for background, not text color
    if (config.theme === 'dark') {
      style.backgroundColor = '#1a1a1a';
    } else if (config.theme === 'high-contrast') {
      style.backgroundColor = '#ffffff';
    }

    // Color different mathematical elements only (KaTeX classes)
    const operators = container.querySelectorAll('.mord, .mbin, .mrel');
    operators.forEach(el => {
      (el as HTMLElement).style.color = config.colorScheme.operators;
    });

    const functions = container.querySelectorAll('.mop');
    functions.forEach(el => {
      (el as HTMLElement).style.color = config.colorScheme.functions;
    });

    // Ensure text spans maintain their inherited color
    const textSpans = container.querySelectorAll('span:not([class])');
    textSpans.forEach(el => {
      const element = el as HTMLElement;
      if (!element.innerHTML.includes('katex')) {
        element.style.color = 'inherit';
      }
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


  return (
    <div className={`advanced-math-renderer ${className}`}>
      <div
        ref={containerRef}
        className="math-container"
        style={{
          transition: 'opacity 0.1s ease-in-out',
          minHeight: '1em'
        }}
      />

      {config.interactive && (
        <div className="math-controls mt-2 flex gap-2">
          <button
            onClick={async () => {
              try {
                if (navigator.clipboard && window.isSecureContext) {
                  await navigator.clipboard.writeText(expression);
                } else {
                  // Fallback for non-secure contexts
                  const textArea = document.createElement('textarea');
                  textArea.value = expression;
                  document.body.appendChild(textArea);
                  textArea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textArea);
                }
              } catch (err) {
              }
            }}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Copy LaTeX
          </button>
        </div>
      )}
    </div>
  );
});

AdvancedMathRenderer.displayName = 'AdvancedMathRenderer';

export default AdvancedMathRenderer;