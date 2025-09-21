import { prisma } from '@/lib/prisma';
import {
  CompleteQuestionSchema,
  SolutionSchema,
  validateMathematicalContent
} from '@/schemas/qualityValidation';

export interface QualityIssue {
  field: string;
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: QualityIssue[];
  confidence: number;
}

export interface QualityMetrics {
  mathematicalAccuracy: number;
  solutionCompleteness: number;
  clarityScore: number;
  difficultyAlignment: number;
  overallScore: number;
}

export class QualityValidationService {
  /**
   * Validate a complete question with options and solution
   */
  async validateQuestion(questionData: any): Promise<ValidationResult> {
    const issues: QualityIssue[] = [];
    let totalScore = 0;
    let maxScore = 0;

    try {
      // Validate basic question structure
      const questionValidation = CompleteQuestionSchema.safeParse(questionData);
      if (!questionValidation.success) {
        questionValidation.error.errors.forEach(error => {
          issues.push({
            field: error.path.join('.'),
            severity: 'error',
            message: error.message,
            suggestion: this.getSuggestionForError(error.code, error.path.join('.'))
          });
        });
      } else {
        totalScore += 25;
      }
      maxScore += 25;

      // Validate mathematical content
      const mathValidation = validateMathematicalContent(questionData.questionText);
      if (!mathValidation.isValid) {
        mathValidation.issues.forEach(issue => {
          issues.push({
            field: 'questionText',
            severity: 'warning',
            message: issue
          });
        });
      } else {
        totalScore += 25;
      }
      maxScore += 25;

      // Validate solution if present
      if (questionData.solution) {
        const solutionValidation = await this.validateSolution(
          questionData.solution,
          questionData.questionText
        );
        if (solutionValidation.isValid) {
          totalScore += 30;
        } else {
          issues.push(...solutionValidation.issues);
        }
      }
      maxScore += 30;

      // Validate options if multiple choice
      if (questionData.options && questionData.options.length > 0) {
        const optionsValidation = this.validateMultipleChoiceOptions(questionData.options);
        if (optionsValidation.isValid) {
          totalScore += 20;
        } else {
          issues.push(...optionsValidation.issues);
        }
      }
      maxScore += 20;

      const finalScore = maxScore > 0 ? totalScore / maxScore : 0;
      const confidence = this.calculateConfidence(issues, finalScore);

      return {
        isValid: issues.filter(i => i.severity === 'error').length === 0,
        score: finalScore,
        issues,
        confidence
      };

    } catch (error) {
      console.error('Error validating question:', error);
      return {
        isValid: false,
        score: 0,
        issues: [{
          field: 'general',
          severity: 'error',
          message: 'Unexpected validation error occurred'
        }],
        confidence: 0
      };
    }
  }

  /**
   * Validate solution content and methodology
   */
  async validateSolution(solution: any, questionText: string): Promise<ValidationResult> {
    const issues: QualityIssue[] = [];
    let score = 0;

    // Basic schema validation
    const schemaValidation = SolutionSchema.safeParse(solution);
    if (!schemaValidation.success) {
      schemaValidation.error.errors.forEach(error => {
        issues.push({
          field: error.path.join('.'),
          severity: 'error',
          message: error.message
        });
      });
      return { isValid: false, score: 0, issues, confidence: 0.9 };
    }

    // Check mathematical content in solution
    const mathValidation = validateMathematicalContent(solution.solutionText);
    if (mathValidation.isValid) {
      score += 0.3;
    } else {
      mathValidation.issues.forEach(issue => {
        issues.push({
          field: 'solutionText',
          severity: 'warning',
          message: issue
        });
      });
    }

    // Check for step-by-step approach
    if (this.hasStepByStepApproach(solution.solutionText)) {
      score += 0.25;
    } else {
      issues.push({
        field: 'solutionText',
        severity: 'suggestion',
        message: 'Solution could benefit from clearer step-by-step approach'
      });
    }

    // Check for key mathematical concepts
    if (this.containsKeyMathConcepts(solution.solutionText, questionText)) {
      score += 0.25;
    } else {
      issues.push({
        field: 'solutionText',
        severity: 'suggestion',
        message: 'Solution should reference key mathematical concepts from the question'
      });
    }

    // Check completeness
    if (this.isSolutionComplete(solution.solutionText)) {
      score += 0.2;
    } else {
      issues.push({
        field: 'solutionText',
        severity: 'warning',
        message: 'Solution appears incomplete or lacks final answer'
      });
    }

    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      score,
      issues,
      confidence: 0.85
    };
  }

  /**
   * Validate multiple choice options
   */
  validateMultipleChoiceOptions(options: any[]): ValidationResult {
    const issues: QualityIssue[] = [];
    let score = 0;

    // Check number of options
    if (options.length < 2 || options.length > 5) {
      issues.push({
        field: 'options',
        severity: 'error',
        message: 'Must have between 2 and 5 options'
      });
      return { isValid: false, score: 0, issues, confidence: 1.0 };
    }

    // Check for exactly one correct answer
    const correctAnswers = options.filter(opt => opt.isCorrect);
    if (correctAnswers.length !== 1) {
      issues.push({
        field: 'options',
        severity: 'error',
        message: 'Must have exactly one correct answer'
      });
      return { isValid: false, score: 0, issues, confidence: 1.0 };
    }

    score += 0.5;

    // Check option diversity (different from each other)
    if (this.areOptionsDistinct(options)) {
      score += 0.3;
    } else {
      issues.push({
        field: 'options',
        severity: 'warning',
        message: 'Options should be more distinct from each other'
      });
    }

    // Check for reasonable distractors
    if (this.hasReasonableDistractors(options)) {
      score += 0.2;
    } else {
      issues.push({
        field: 'options',
        severity: 'suggestion',
        message: 'Consider making distractors more plausible'
      });
    }

    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      score,
      issues,
      confidence: 0.9
    };
  }

  /**
   * Calculate quality metrics for a question
   */
  async calculateQualityMetrics(questionId: string): Promise<QualityMetrics> {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        options: true,
        solution: true,
        attempts: true
      }
    });

    if (!question) {
      throw new Error('Question not found');
    }

    // Calculate mathematical accuracy from user attempts
    const attempts = question.attempts;
    const mathematicalAccuracy = attempts.length > 0
      ? attempts.filter(a => a.isCorrect).length / attempts.length
      : 0.5; // Default for new questions

    // Calculate solution completeness
    const solutionCompleteness = question.solution
      ? this.scoreSolutionCompleteness(question.solution)
      : 0;

    // Calculate clarity score based on content analysis
    const clarityScore = this.calculateClarityScore(question.questionText);

    // Calculate difficulty alignment
    const difficultyAlignment = this.calculateDifficultyAlignment(
      question.difficulty,
      mathematicalAccuracy
    );

    // Calculate overall score
    const overallScore = (
      mathematicalAccuracy * 0.3 +
      solutionCompleteness * 0.25 +
      clarityScore * 0.25 +
      difficultyAlignment * 0.2
    );

    return {
      mathematicalAccuracy,
      solutionCompleteness,
      clarityScore,
      difficultyAlignment,
      overallScore
    };
  }

  /**
   * Bulk validate multiple questions
   */
  async bulkValidateQuestions(questionIds: string[]): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();

    for (const questionId of questionIds) {
      try {
        const question = await prisma.question.findUnique({
          where: { id: questionId },
          include: {
            options: true,
            solution: true
          }
        });

        if (question) {
          const validation = await this.validateQuestion(question);
          results.set(questionId, validation);
        }
      } catch (error) {
        console.error(`Error validating question ${questionId}:`, error);
        results.set(questionId, {
          isValid: false,
          score: 0,
          issues: [{ field: 'general', severity: 'error', message: 'Validation failed' }],
          confidence: 0
        });
      }
    }

    return results;
  }

  // Helper methods
  private getSuggestionForError(errorCode: string, _field: string): string {
    const suggestions: Record<string, string> = {
      'too_small': 'Content should be more detailed',
      'too_big': 'Content should be more concise',
      'invalid_enum_value': 'Please select a valid option',
      'invalid_type': 'Please check the data format'
    };

    return suggestions[errorCode] || 'Please review and correct this field';
  }

  private calculateConfidence(issues: QualityIssue[], score: number): number {
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    let confidence = 1.0;
    confidence -= errorCount * 0.2;
    confidence -= warningCount * 0.1;
    confidence = Math.max(0.1, confidence);

    // Boost confidence for high scores
    if (score > 0.8) confidence = Math.min(1.0, confidence + 0.1);

    return confidence;
  }

  private hasStepByStepApproach(solutionText: string): boolean {
    const stepIndicators = [
      /step\s*\d+/i,
      /first[ly]?[,:]?/i,
      /second[ly]?[,:]?/i,
      /then[,:]?/i,
      /next[,:]?/i,
      /finally[,:]?/i,
      /\d+\./,
      /\n\s*-/
    ];

    return stepIndicators.some(pattern => pattern.test(solutionText));
  }

  private containsKeyMathConcepts(solutionText: string, questionText: string): boolean {
    // Extract mathematical terms from both question and solution
    const mathTerms = [
      'equation', 'formula', 'theorem', 'proof', 'calculate',
      'solve', 'factor', 'simplify', 'substitute', 'evaluate'
    ];

    const questionTerms = mathTerms.filter(term =>
      questionText.toLowerCase().includes(term)
    );

    return questionTerms.some(term =>
      solutionText.toLowerCase().includes(term)
    );
  }

  private isSolutionComplete(solutionText: string): boolean {
    const completionIndicators = [
      /therefore[,:]?/i,
      /thus[,:]?/i,
      /so[,:]?/i,
      /answer[,:]?/i,
      /result[,:]?/i,
      /=\s*\d+/,
      /the\s+answer\s+is/i
    ];

    return completionIndicators.some(pattern => pattern.test(solutionText));
  }

  private areOptionsDistinct(options: any[]): boolean {
    // Check if options are sufficiently different
    const texts = options.map(opt => opt.optionText.toLowerCase());
    const uniqueWords = new Set();

    texts.forEach(text => {
      text.split(/\s+/).forEach((word: string) => uniqueWords.add(word));
    });

    // If total unique words vs total words ratio is high, options are distinct
    const totalWords = texts.reduce((sum, text) => sum + text.split(/\s+/).length, 0);
    return uniqueWords.size / totalWords > 0.7;
  }

  private hasReasonableDistractors(options: any[]): boolean {
    // Basic heuristic: distractors should not be obviously wrong
    const correctAnswer = options.find(opt => opt.isCorrect);
    const distractors = options.filter(opt => !opt.isCorrect);

    // Check if distractors are not too similar or too different from correct answer
    return distractors.every(distractor => {
      const similarity = this.calculateSimilarity(
        correctAnswer.optionText,
        distractor.optionText
      );
      return similarity > 0.2 && similarity < 0.8; // Not too similar, not too different
    });
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));

    return commonWords.length / Math.max(words1.length, words2.length);
  }

  private scoreSolutionCompleteness(solution: any): number {
    let score = 0;

    if (solution.solutionText && solution.solutionText.length > 50) score += 0.3;
    if (solution.approach) score += 0.2;
    if (solution.keyInsights) score += 0.2;
    if (solution.timeEstimate && solution.timeEstimate > 0) score += 0.1;
    if (this.isSolutionComplete(solution.solutionText)) score += 0.2;

    return Math.min(1.0, score);
  }

  private calculateClarityScore(questionText: string): number {
    let score = 0;

    // Check length (not too short, not too long)
    if (questionText.length >= 20 && questionText.length <= 500) score += 0.3;

    // Check for clear question structure
    if (questionText.includes('?') || questionText.match(/^(find|calculate|determine)/i)) {
      score += 0.3;
    }

    // Check for mathematical notation
    if (questionText.includes('$') || questionText.includes('\\')) score += 0.2;

    // Check readability (simple heuristic)
    const sentences = questionText.split(/[.!?]+/);
    const avgSentenceLength = questionText.length / sentences.length;
    if (avgSentenceLength < 100) score += 0.2; // Not too long sentences

    return Math.min(1.0, score);
  }

  private calculateDifficultyAlignment(difficulty: string, successRate: number): number {
    const expectedSuccessRates: Record<string, [number, number]> = {
      'easy': [0.7, 0.9],
      'medium': [0.4, 0.7],
      'hard': [0.1, 0.4]
    };

    const [minRate, maxRate] = expectedSuccessRates[difficulty] || [0, 1];

    if (successRate >= minRate && successRate <= maxRate) {
      return 1.0; // Perfect alignment
    } else {
      // Calculate how far off we are
      const distance = successRate < minRate
        ? minRate - successRate
        : successRate - maxRate;
      return Math.max(0, 1 - distance);
    }
  }
}

// Export singleton instance
export const qualityValidationService = new QualityValidationService();