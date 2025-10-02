import { z } from 'zod';

// Mathematical Expression Validation Schema
export const MathExpressionSchema = z.string()
  .min(1, "Mathematical expression cannot be empty")
  .refine((expr) => {
    // Basic validation for mathematical expressions
    const mathPatterns = [
      /\d+/,                    // Contains numbers
      /[+\-*/=]/,              // Contains basic operators
      /[a-zA-Z]/,              // Contains variables
      /\\[a-zA-Z]+/,           // Contains LaTeX commands
      /\$.*\$/,                // Contains math delimiters
      /\\frac\{.*\}\{.*\}/,    // Contains fractions
      /\\sqrt\{.*\}/,          // Contains square roots
      /\^/,                    // Contains exponents
      /_/,                     // Contains subscripts
    ];

    return mathPatterns.some(pattern => pattern.test(expr));
  }, "Must contain valid mathematical content")
  .refine((expr) => {
    // Check for balanced parentheses and braces
    const openChars = ['(', '[', '{'];
    const closeChars = [')', ']', '}'];
    const stack: string[] = [];

    for (const char of expr) {
      if (openChars.includes(char)) {
        stack.push(char);
      } else if (closeChars.includes(char)) {
        const lastOpen = stack.pop();
        const expectedClose = closeChars[openChars.indexOf(lastOpen || '')];
        if (char !== expectedClose) {
          return false;
        }
      }
    }

    return stack.length === 0;
  }, "Parentheses and braces must be balanced");

// Question Content Validation Schema
export const QuestionContentSchema = z.object({
  questionText: z.string()
    .min(10, "Question must be at least 10 characters")
    .max(2000, "Question cannot exceed 2000 characters")
    .refine((text) => {
      // Must contain a question mark or be imperative
      return text.includes('?') ||
             /^(find|calculate|determine|solve|what|how|which)/i.test(text.trim());
    }, "Question must be properly formatted")
    .refine((expr) => {
      // Basic validation for mathematical expressions
      const mathPatterns = [
        /\d+/,                    // Contains numbers
        /[+\-*/=]/,              // Contains basic operators
        /[a-zA-Z]/,              // Contains variables
        /\\[a-zA-Z]+/,           // Contains LaTeX commands
        /\$.*\$/,                // Contains math delimiters
        /\\frac\{.*\}\{.*\}/,    // Contains fractions
        /\\sqrt\{.*\}/,          // Contains square roots
        /\^/,                    // Contains exponents
        /_/,                     // Contains subscripts
      ];

      return mathPatterns.some(pattern => pattern.test(expr));
    }, "Must contain valid mathematical content"),

  topic: z.string()
    .min(2, "Topic must be specified")
    .max(50, "Topic name too long")
    .refine((topic) => {
      // Valid mathematical topics
      const validTopics = [
        'algebra', 'geometry', 'number theory', 'combinatorics',
        'probability', 'arithmetic', 'statistics', 'calculus',
        'trigonometry', 'discrete math', 'logic'
      ];
      return validTopics.some(valid =>
        topic.toLowerCase().includes(valid) || valid.includes(topic.toLowerCase())
      );
    }, "Must be a valid mathematical topic"),

  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD'], {
    errorMap: () => ({ message: "Difficulty must be EASY, MEDIUM, or HARD" })
  }),

  examName: z.string()
    .min(2, "Exam name required")
    .refine((name) => {
      const validExams = ['AMC8', 'AMC10', 'AMC12', 'AIME', 'MOEMS', 'Kangaroo', 'MathCounts', 'CML'];
      return validExams.includes(name);
    }, "Must be a recognized math competition"),
});

// Multiple Choice Option Validation Schema
export const OptionSchema = z.object({
  optionLetter: z.enum(['A', 'B', 'C', 'D', 'E'], {
    errorMap: () => ({ message: "Option letter must be A, B, C, D, or E" })
  }),
  optionText: z.string()
    .min(1, "Option text cannot be empty")
    .max(200, "Option text too long"),
  isCorrect: z.boolean()
});

// Multiple Choice Question Validation
export const MultipleChoiceSchema = z.object({
  options: z.array(OptionSchema)
    .min(2, "Must have at least 2 options")
    .max(5, "Cannot have more than 5 options")
    .refine((options) => {
      // Exactly one correct answer
      const correctCount = options.filter(opt => opt.isCorrect).length;
      return correctCount === 1;
    }, "Must have exactly one correct answer")
    .refine((options) => {
      // All option letters must be unique
      const letters = options.map(opt => opt.optionLetter);
      return new Set(letters).size === letters.length;
    }, "Option letters must be unique")
    .refine((options) => {
      // Options should be sequential (A, B, C, etc.)
      const letters = options.map(opt => opt.optionLetter).sort();
      const expected = ['A', 'B', 'C', 'D', 'E'].slice(0, options.length);
      return JSON.stringify(letters) === JSON.stringify(expected);
    }, "Options must be sequential (A, B, C, D, E)")
});

// Solution Content Validation Schema
export const SolutionSchema = z.object({
  solutionText: z.string()
    .min(20, "Solution must be at least 20 characters")
    .max(5000, "Solution cannot exceed 5000 characters")
    .refine((text) => {
      // Must contain step-by-step reasoning
      const stepIndicators = [
        /step\s*\d+/i,
        /first[ly]?[,:]?/i,
        /second[ly]?[,:]?/i,
        /then[,:]?/i,
        /next[,:]?/i,
        /finally[,:]?/i,
        /therefore[,:]?/i,
        /\d+\./,  // Numbered steps
        /\n\s*-/  // Bullet points
      ];
      return stepIndicators.some(pattern => pattern.test(text));
    }, "Solution must contain step-by-step reasoning"),

  approach: z.string()
    .min(3, "Approach must be specified")
    .max(100, "Approach description too long")
    .optional(),

  timeEstimate: z.number()
    .min(1, "Time estimate must be at least 1 minute")
    .max(60, "Time estimate cannot exceed 60 minutes")
    .optional(),

  keyInsights: z.string()
    .max(500, "Key insights too long")
    .optional(),

  difficulty: z.enum(['beginner', 'intermediate', 'advanced'], {
    errorMap: () => ({ message: "Solution difficulty must be beginner, intermediate, or advanced" })
  }).optional()
});

// Image/Diagram Validation Schema
export const ImageValidationSchema = z.object({
  hasImage: z.boolean(),
  imageUrl: z.string()
    .url("Must be a valid URL")
    .optional()
    .refine((url) => {
      // Validation is handled elsewhere
      return url || true;
    }, "Image URL required when hasImage is true")
    .refine((url) => {
      if (!url) return true;
      // Valid image extensions
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
      return validExtensions.some(ext => url.toLowerCase().includes(ext));
    }, "Must be a valid image URL")
});

// Complete Question Validation Schema
export const CompleteQuestionSchema = QuestionContentSchema
  .merge(ImageValidationSchema)
  .merge(z.object({
    solution: SolutionSchema.optional(),
    options: z.array(OptionSchema).optional()
  }))
  .refine((data) => {
    // If it's multiple choice, must have options
    if (data.options && data.options.length > 0) {
      return MultipleChoiceSchema.safeParse({ options: data.options }).success;
    }
    return true;
  }, "Invalid multiple choice format");

// Answer Validation Schema
export const AnswerValidationSchema = z.object({
  questionType: z.enum(['multiple_choice', 'open_ended', 'numerical']),
  providedAnswer: z.string().min(1, "Answer cannot be empty"),
  correctAnswer: z.string().min(1, "Correct answer must be provided"),

  // For numerical answers
  tolerance: z.number().min(0).optional(),

  // For multiple choice
  selectedOption: z.enum(['A', 'B', 'C', 'D', 'E']).optional(),
})
.refine((data) => {
  if (data.questionType === 'multiple_choice') {
    return data.selectedOption !== undefined;
  }
  return true;
}, "Multiple choice questions must have a selected option")
.refine((data) => {
  if (data.questionType === 'numerical') {
    // Check if answers are valid numbers
    const provided = parseFloat(data.providedAnswer);
    const correct = parseFloat(data.correctAnswer);
    return !isNaN(provided) && !isNaN(correct);
  }
  return true;
}, "Numerical answers must be valid numbers");

// Quality Score Calculation Schema
export const QualityScoreSchema = z.object({
  mathematicalAccuracy: z.number().min(0).max(1),
  solutionCompleteness: z.number().min(0).max(1),
  clarityScore: z.number().min(0).max(1),
  difficultyAlignment: z.number().min(0).max(1),
  overallScore: z.number().min(0).max(1)
});

// Validation Result Schema
export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  score: z.number().min(0).max(1),
  issues: z.array(z.object({
    field: z.string(),
    severity: z.enum(['error', 'warning', 'suggestion']),
    message: z.string(),
    suggestion: z.string().optional()
  })),
  confidence: z.number().min(0).max(1)
});

// Helper function to validate mathematical content
export function validateMathematicalContent(content: string): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for common mathematical notation issues
  if (content.includes('*') && !content.includes('\\cdot') && !content.includes('\\times')) {
    suggestions.push("Consider using \\cdot or \\times instead of * for multiplication");
  }

  if (content.includes('/') && !content.includes('\\frac')) {
    suggestions.push("Consider using \\frac{a}{b} for fractions instead of a/b");
  }

  // Check for proper LaTeX formatting
  if (content.includes('$') && !content.match(/\$[^$]+\$/)) {
    issues.push("Incomplete LaTeX math delimiters");
  }

  // Check for balanced parentheses
  const openParens = (content.match(/\(/g) || []).length;
  const closeParens = (content.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    issues.push("Unbalanced parentheses");
  }

  // Check for common errors
  if (content.includes('=')) {
    const equations = content.split('=');
    if (equations.length > 2) {
      suggestions.push("Consider breaking complex equations into steps");
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
}

// All schemas are exported above with their individual export statements