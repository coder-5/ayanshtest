/**
 * TEXT CLEANUP UTILITIES
 *
 * Fixes spelling mistakes and formatting issues from document parsing
 */

// Common OCR and parsing errors to fix
const SPELLING_CORRECTIONS: Record<string, string> = {
  // Hyphenated words that got split incorrectly
  'quadri- laterals': 'quadrilaterals',
  'paral- lelogram': 'parallelogram',
  'perpen- dicular': 'perpendicular',
  'cir- cumference': 'circumference',
  'trian- gles': 'triangles',
  'rectan- gles': 'rectangles',
  'diag- onal': 'diagonal',
  'seg- ment': 'segment',
  'equa- tion': 'equation',
  'frac- tion': 'fraction',
  'divi- sion': 'division',
  'multi- plication': 'multiplication',
  'calcu- lation': 'calculation',
  'solu- tion': 'solution',
  'prob- lem': 'problem',
  'num- ber': 'number',
  'mea- sure': 'measure',
  'diam- eter': 'diameter',
  'perim- eter': 'perimeter',
  'pytha- gorean': 'pythagorean',

  // Common OCR misreads - be more specific to avoid false positives
  'gtid': 'grid',  // specific OCR error
  'sma11': 'small', // OCR error: ll -> 11
  'ca11': 'call',
  'wa11': 'wall',
  'a11': 'all',
  'wi11': 'will',
  'sti11': 'still',
  'spccific': 'specific',
  'numbcr': 'number',
  'problcm': 'problem',
  'answcr': 'answer',
  'qucstion': 'question',
  'lcngth': 'length',
  'mcasure': 'measure',
  'pcrimcter': 'perimeter',
  'circlc': 'circle',
  'trianglc': 'triangle',
  'squarc': 'square',
  'rectanglc': 'rectangle',
  'mathe matical': 'mathematical',
  'geomet ric': 'geometric',
  'alge braic': 'algebraic',
  'arith metic': 'arithmetic',
  'statis tics': 'statistics',
  'probabil ity': 'probability',
  'combina tions': 'combinations',
  'permuta tions': 'permutations',
};

// Words that commonly get broken across lines
const HYPHENATION_FIXES: Array<[RegExp, string]> = [
  [/(\w+)-\s*\n\s*(\w+)/g, '$1$2'],  // Fix hyphenated words across lines
  [/(\w+)-\s+(\w+)/g, '$1$2'],       // Fix hyphenated words with spaces
  [/([a-z])-\s*([a-z])/g, '$1$2'],   // Fix broken words
];


/**
 * Clean up text extracted from documents
 */
export function cleanupQuestionText(text: string): string {
  if (!text || typeof text !== 'string') {
    return text || '';
  }

  let cleaned = text.trim();

  // Identify and protect LaTeX expressions
  const latexProtection: Map<string, string> = new Map();
  let protectionCounter = 0;

  // Protect LaTeX expressions from text cleanup
  const latexPatterns = [
    /\$\$[\s\S]*?\$\$/g,  // $$...$$
    /\\\[[\s\S]*?\\\]/g,   // \[...\]
    /\$[^$]*?\$/g,         // $...$
    /\\\([^)]*?\\\)/g      // \(...\)
  ];

  for (const pattern of latexPatterns) {
    cleaned = cleaned.replace(pattern, (match) => {
      const placeholder = `__LATEX_PROTECTED_${protectionCounter++}__`;
      latexProtection.set(placeholder, match);
      return placeholder;
    });
  }

  // Apply spelling corrections (outside of LaTeX)
  for (const [wrong, correct] of Object.entries(SPELLING_CORRECTIONS)) {
    const regex = new RegExp(wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    cleaned = cleaned.replace(regex, correct);
  }

  // Apply hyphenation fixes (outside of LaTeX)
  for (const [regex, replacement] of HYPHENATION_FIXES) {
    cleaned = cleaned.replace(regex, replacement);
  }

  // Apply formatting fixes (outside of LaTeX) - with LaTeX-aware modifications
  const latexAwareFormattingFixes: Array<[RegExp, string]> = [
    // Fix multiple spaces
    [/\s{2,}/g, ' '],

    // Fix space before punctuation
    [/\s+([.!?:;,])/g, '$1'],

    // Fix missing space after punctuation
    [/([.!?])([A-Z])/g, '$1 $2'],

    // Fix parentheses spacing
    [/\(\s+/g, '('],
    [/\s+\)/g, ')'],

    // Modified mathematical notation fixes - only apply outside protected areas
    // These are less aggressive to avoid breaking LaTeX
    [/(?<!\\)\s*=\s*/g, ' = '],     // Don't touch \= in LaTeX
    [/(?<!\\)\s*\+\s*/g, ' + '],    // Don't touch \+ in LaTeX

    // Fix common number formatting
    [/(\d)\s*,\s*(\d)/g, '$1,$2'],  // Fix comma in numbers
    [/(\d)\s*\.\s*(\d)/g, '$1.$2'], // Fix decimal points

    // Fix degree symbols
    [/(\d)\s*degrees?/gi, '$1°'],
    [/(\d)\s*deg/gi, '$1°'],
  ];

  for (const [regex, replacement] of latexAwareFormattingFixes) {
    cleaned = cleaned.replace(regex, replacement);
  }

  // Fix missing spaces between words (common OCR issue)
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2'); // Add space between lowercase and uppercase
  cleaned = cleaned.replace(/(\d)([A-Z])/g, '$1 $2');    // Add space between digit and uppercase
  cleaned = cleaned.replace(/([a-z])(\d)/g, '$1 $2');    // Add space between letter and digit
  cleaned = cleaned.replace(/([.!?])([A-Z])/g, '$1 $2'); // Add space after punctuation

  // Remove excessive whitespace and normalize (but preserve LaTeX structure and line breaks)
  cleaned = cleaned
    .replace(/\t/g, ' ')           // Convert tabs to spaces
    .replace(/\r\n/g, '\n')       // Normalize line endings
    .replace(/\r/g, '\n')         // Normalize line endings
    .replace(/\n{3,}/g, '\n\n')   // Limit consecutive newlines
    .replace(/[ \t]+$/gm, '')     // Remove trailing whitespace
    .replace(/^[ \t]+/gm, '')     // Remove leading whitespace
    .replace(/[ \t]+/g, ' ')      // Normalize spaces and tabs only (preserve line breaks)
    .trim();

  // Restore protected LaTeX expressions
  const entries = Array.from(latexProtection.entries());
  for (const [placeholder, original] of entries) {
    cleaned = cleaned.replace(placeholder, original);
  }

  return cleaned;
}

/**
 * Clean up option text
 */
export function cleanupOptionText(text: string): string {
  if (!text || typeof text !== 'string') {
    return text || '';
  }

  let cleaned = text.trim();

  // Remove common option prefixes that might have been included
  cleaned = cleaned.replace(/^[A-E][)\.]?\s*/i, '');

  // Apply basic formatting fixes
  cleaned = cleaned
    .replace(/\s{2,}/g, ' ')
    .replace(/\t/g, ' ')
    .trim();

  return cleaned;
}

/**
 * Clean up solution text
 */
export function cleanupSolutionText(text: string): string {
  if (!text || typeof text !== 'string') {
    return text || '';
  }

  let cleaned = cleanupQuestionText(text);

  // Additional solution-specific cleaning
  cleaned = cleaned
    .replace(/^(Solution|Answer|Explanation):\s*/i, '')  // Remove redundant labels
    .replace(/Step\s*(\d+):\s*/gi, 'Step $1: ')          // Normalize step labels
    .trim();

  return cleaned;
}

/**
 * Batch cleanup function for database migration
 */
export function batchCleanupText(items: Array<{text: string}>): Array<{text: string; cleaned: string}> {
  return items.map(item => ({
    text: item.text,
    cleaned: cleanupQuestionText(item.text)
  }));
}

/**
 * Detect if text needs cleanup (has common issues)
 */
export function needsCleanup(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // Check for common issues
  const hasHyphenationIssues = /\w+-\s+\w+/.test(text);
  const hasSpellingIssues = Object.keys(SPELLING_CORRECTIONS).some(wrong =>
    text.toLowerCase().includes(wrong.toLowerCase())
  );
  const hasFormattingIssues = /\s{2,}|\s[.!?]|[.!?][A-Z]/.test(text);

  return hasHyphenationIssues || hasSpellingIssues || hasFormattingIssues;
}

/**
 * Get cleanup statistics
 */
export function getCleanupStats(original: string, cleaned: string) {
  return {
    originalLength: original.length,
    cleanedLength: cleaned.length,
    changesMade: original !== cleaned,
    spacesReduced: (original.match(/\s/g) || []).length - (cleaned.match(/\s/g) || []).length,
    linesReduced: (original.match(/\n/g) || []).length - (cleaned.match(/\n/g) || []).length
  };
}

/**
 * Parse LaTeX answer format and extract options with preserved LaTeX formatting
 * Format: $\textbf{(A)}\ 40 \qquad \textbf{(B)}\ 50 \qquad \textbf{(C)}\ 60 \qquad \textbf{(D)}\ 75 \qquad \textbf{(E)}\ 80$
 * Also handles: $\textbf{(A)}\ \frac{1}{2} \qquad \textbf{(B)}\ \sqrt{3} \qquad ...$
 */
export function parseLatexAnswers(text: string): Array<{letter: string, text: string}> {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const options: Array<{letter: string, text: string}> = [];

  // Enhanced pattern to capture LaTeX content properly
  // This pattern captures everything between \textbf{(X)} and the next \textbf or end
  const latexPattern = /\\textbf\{?\(([A-E])\)\}?\\?\s*((?:[^\\]|\\(?!textbf|qquad))*?)(?:\s*\\qquad\s*|(?=\s*\\textbf)|(?=\s*\$)|$)/g;

  let match;
  while ((match = latexPattern.exec(text)) !== null) {
    const letter = match[1];
    let answerContent = match[2].trim();

    // Clean up the answer content while preserving LaTeX
    answerContent = answerContent
      .replace(/^\s*\\?\s*/, '')  // Remove leading backslashes/spaces
      .replace(/\s*\\qquad\s*$/, '')  // Remove trailing qquad
      .replace(/\s+/g, ' ')  // Normalize spaces
      .trim();

    if (letter && answerContent) {
      // Wrap in LaTeX delimiters if it contains LaTeX commands
      const hasLatex = /\\[a-zA-Z]+|[{}^_]/.test(answerContent);
      const formattedText = hasLatex ? `$${answerContent}$` : answerContent;

      options.push({ letter, text: formattedText });
    }
  }

  // Fallback: try simpler patterns if the main one didn't work
  if (options.length === 0) {
    // Try pattern without \textbf - just look for (A), (B), etc.
    const simplePattern = /\(([A-E])\)\s*([^(]+?)(?=\s*\([A-E]\)|$)/g;

    while ((match = simplePattern.exec(text)) !== null) {
      const letter = match[1];
      let answerContent = match[2].trim()
        .replace(/\\qquad/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (letter && answerContent) {
        // Check if content has LaTeX and wrap appropriately
        const hasLatex = /\\[a-zA-Z]+|[{}^_]/.test(answerContent);
        const formattedText = hasLatex ? `$${answerContent}$` : answerContent;

        options.push({ letter, text: formattedText });
      }
    }
  }

  // Sort by letter to ensure correct order
  return options.sort((a, b) => a.letter.localeCompare(b.letter));
}

/**
 * Convert LaTeX math to simple readable text for Ayansh
 * This is specifically designed to make math problems easy to read
 */
export function simplifyMathForAyansh(text: string): string {
  if (!text || typeof text !== 'string') {
    return text || '';
  }

  let simplified = text;

  // Convert LaTeX expressions to simple readable text
  const mathConversions: Array<[RegExp, string]> = [
    // Fractions - make them clear
    [/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)'],
    [/\$\\frac\{([^}]+)\}\{([^}]+)\}\$/g, '($1)/($2)'],
    [/\$\$\\frac\{([^}]+)\}\{([^}]+)\}\$\$/g, '($1)/($2)'],

    // Exponents and powers
    [/\^(\d+)/g, '^$1'],
    [/\^\{([^}]+)\}/g, '^($1)'],
    [/(\w+)\^\{?(\d+)\}?/g, '$1^$2'],

    // Square roots
    [/\\sqrt\{([^}]+)\}/g, 'sqrt($1)'],
    [/\$\\sqrt\{([^}]+)\}\$/g, 'sqrt($1)'],

    // Remove LaTeX delimiters - keep the math content
    [/\$\$([^$]+)\$\$/g, '$1'],  // Display math
    [/\$([^$]+)\$/g, '$1'],      // Inline math
    [/\\\[([^\]]+)\\\]/g, '$1'], // Display math alternative
    [/\\\(([^)]+)\\\)/g, '$1'],  // Inline math alternative

    // Mathematical symbols to readable text
    [/\\cdot/g, '×'],
    [/\\times/g, '×'],
    [/\\div/g, '÷'],
    [/\\pi/g, 'π'],
    [/\\theta/g, 'θ'],
    [/\\alpha/g, 'α'],
    [/\\beta/g, 'β'],

    // Clean up remaining LaTeX commands
    [/\\[a-zA-Z]+\{([^}]*)\}/g, '$1'], // Remove LaTeX commands, keep content
    [/\\[a-zA-Z]+/g, ''],               // Remove LaTeX commands without braces
    [/\{([^}]*)\}/g, '$1'],            // Remove remaining braces

    // Fix spacing around operators
    [/\s*([+\-×÷=<>])\s*/g, ' $1 '],

    // Clean up multiple spaces
    [/\s+/g, ' ']
  ];

  // Apply all conversions
  for (const [regex, replacement] of mathConversions) {
    simplified = simplified.replace(regex, replacement);
  }

  return simplified.trim();
}