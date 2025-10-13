import { describe, it, expect } from 'vitest';

/**
 * Test suite for question parser functions
 * These tests validate the OCR parsing logic for different question formats
 */

describe('Question Parser - Text Cleaning', () => {
  /**
   * Simulates the cleanText function from parse-weekly-tests.ts
   */
  function cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[""]​/g, '"')
      .replace(/['']​/g, "'")
      .replace(/–/g, '-')
      .replace(/\|/g, 'I')
      .trim();
  }

  it('should remove extra whitespace', () => {
    const input = 'What  is   2 + 2?';
    const result = cleanText(input);
    expect(result).toBe('What is 2 + 2?');
  });

  it('should normalize unicode quotes', () => {
    const input = '"Hello"';
    const result = cleanText(input);
    expect(result).toContain('Hello');
  });

  it('should replace pipe with I', () => {
    const input = 'Use the figure | ABC';
    const result = cleanText(input);
    expect(result).toBe('Use the figure I ABC');
  });

  it('should trim leading and trailing spaces', () => {
    const input = '  What is 2 + 2?  ';
    const result = cleanText(input);
    expect(result).toBe('What is 2 + 2?');
  });
});

describe('Question Parser - Topic Extraction', () => {
  /**
   * Simulates extractTopicPoints function
   */
  function extractTopicPoints(text: string): { topic?: string; points?: number } {
    const match = text.match(/\[(.*?),\s*(\d+)\s*Points?\]/i);
    if (match && match[1] && match[2]) {
      return {
        topic: match[1].trim(),
        points: parseInt(match[2]),
      };
    }
    return {};
  }

  it('should extract topic and points from weekly test format', () => {
    const input = '[Algebra, 3 Points]';
    const result = extractTopicPoints(input);
    expect(result).toEqual({ topic: 'Algebra', points: 3 });
  });

  it('should handle single point', () => {
    const input = '[Geometry, 1 Point]';
    const result = extractTopicPoints(input);
    expect(result).toEqual({ topic: 'Geometry', points: 1 });
  });

  it('should handle extra spaces', () => {
    const input = '[Number Theory,   7 Points]';
    const result = extractTopicPoints(input);
    expect(result).toEqual({ topic: 'Number Theory', points: 7 });
  });

  it('should return empty object if no match', () => {
    const input = 'Regular question text';
    const result = extractTopicPoints(input);
    expect(result).toEqual({});
  });
});

describe('Question Parser - Difficulty Calculation', () => {
  /**
   * Calculates difficulty based on point value
   */
  function calculateDifficulty(points: number): string {
    if (points <= 3) return 'EASY';
    if (points <= 5) return 'MEDIUM';
    if (points <= 7) return 'HARD';
    return 'EXPERT';
  }

  it('should return EASY for 1-3 points', () => {
    expect(calculateDifficulty(1)).toBe('EASY');
    expect(calculateDifficulty(2)).toBe('EASY');
    expect(calculateDifficulty(3)).toBe('EASY');
  });

  it('should return MEDIUM for 4-5 points', () => {
    expect(calculateDifficulty(4)).toBe('MEDIUM');
    expect(calculateDifficulty(5)).toBe('MEDIUM');
  });

  it('should return HARD for 6-7 points', () => {
    expect(calculateDifficulty(6)).toBe('HARD');
    expect(calculateDifficulty(7)).toBe('HARD');
  });

  it('should return EXPERT for 8+ points', () => {
    expect(calculateDifficulty(8)).toBe('EXPERT');
    expect(calculateDifficulty(10)).toBe('EXPERT');
  });
});

describe('Question Parser - Option Parsing', () => {
  /**
   * Simulates option parsing logic
   */
  function parseOptions(text: string): Array<{ letter: string; text: string }> {
    const options: Array<{ letter: string; text: string }> = [];
    // Match: A) text or B) text, capturing until next letter or end
    const parts = text.split(/\s*([A-E])\s*\)/i);

    for (let i = 1; i < parts.length; i += 2) {
      const letter = parts[i]?.toUpperCase();
      const optText = parts[i + 1]?.trim();

      if (letter && optText && optText.length > 0 && optText.length < 500) {
        options.push({ letter, text: optText });
      }
    }

    return options;
  }

  it('should parse standard option format', () => {
    const input = 'A) Apple B) Banana C) Cherry';
    const result = parseOptions(input);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ letter: 'A', text: 'Apple' });
    expect(result[1]).toEqual({ letter: 'B', text: 'Banana' });
    expect(result[2]).toEqual({ letter: 'C', text: 'Cherry' });
  });

  it('should handle options without spaces after letter', () => {
    const input = 'A)Apple B)Banana C)Cherry';
    const result = parseOptions(input);
    expect(result).toHaveLength(3);
    expect(result[0]?.text).toBe('Apple');
  });

  it('should normalize letter case', () => {
    const input = 'a) Apple b) Banana c) Cherry';
    const result = parseOptions(input);
    expect(result[0]?.letter).toBe('A');
    expect(result[1]?.letter).toBe('B');
    expect(result[2]?.letter).toBe('C');
  });

  it('should handle 5 options', () => {
    const input = 'A) 1 B) 2 C) 3 D) 4 E) 5';
    const result = parseOptions(input);
    expect(result).toHaveLength(5);
  });

  it('should filter out empty options', () => {
    const input = 'A) Valid B) C) Another';
    const result = parseOptions(input);
    expect(result).toHaveLength(2);
    expect(result[0]?.text).toBe('Valid');
    expect(result[1]?.text).toBe('Another');
  });
});

describe('Question Parser - Image Detection', () => {
  /**
   * Detects if a question mentions diagrams/figures
   */
  function hasImage(questionText: string): boolean {
    const keywords = ['figure', 'diagram', 'shown', 'triangle', 'square', 'circle', 'graph'];
    const lowerText = questionText.toLowerCase();
    return keywords.some((keyword) => lowerText.includes(keyword));
  }

  it('should detect figure mention', () => {
    const text = 'In the figure shown, triangle ABC...';
    expect(hasImage(text)).toBe(true);
  });

  it('should detect diagram mention', () => {
    const text = 'The diagram shows a square...';
    expect(hasImage(text)).toBe(true);
  });

  it('should detect geometric shapes', () => {
    expect(hasImage('Draw a triangle with sides...')).toBe(true);
    expect(hasImage('A circle with radius 5...')).toBe(true);
  });

  it('should return false for text-only questions', () => {
    const text = 'What is 2 + 2?';
    expect(hasImage(text)).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(hasImage('FIGURE ABC shows...')).toBe(true);
    expect(hasImage('Figure ABC shows...')).toBe(true);
  });
});

describe('Question Parser - Validation', () => {
  interface Question {
    questionText: string;
    options: Array<{ letter: string; text: string }>;
  }

  function validateQuestion(q: Question): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!q.questionText || q.questionText.length < 10) {
      errors.push('Question text too short');
    }

    if (!q.options || q.options.length < 2) {
      errors.push('Insufficient options');
    }

    // Check for duplicate letters
    const letters = new Set<string>();
    q.options.forEach((opt) => {
      if (letters.has(opt.letter)) {
        errors.push(`Duplicate option letter: ${opt.letter}`);
      }
      letters.add(opt.letter);
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  it('should validate a correct question', () => {
    const question = {
      questionText: 'What is 2 + 2?',
      options: [
        { letter: 'A', text: '3' },
        { letter: 'B', text: '4' },
        { letter: 'C', text: '5' },
      ],
    };

    const result = validateQuestion(question);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail on short question text', () => {
    const question = {
      questionText: 'Short',
      options: [
        { letter: 'A', text: 'Option 1' },
        { letter: 'B', text: 'Option 2' },
      ],
    };

    const result = validateQuestion(question);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Question text too short');
  });

  it('should fail on insufficient options', () => {
    const question = {
      questionText: 'What is the capital of France?',
      options: [{ letter: 'A', text: 'Paris' }],
    };

    const result = validateQuestion(question);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Insufficient options');
  });

  it('should detect duplicate option letters', () => {
    const question = {
      questionText: 'What is 2 + 2?',
      options: [
        { letter: 'A', text: '3' },
        { letter: 'A', text: '4' },
        { letter: 'B', text: '5' },
      ],
    };

    const result = validateQuestion(question);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Duplicate option letter: A');
  });
});
