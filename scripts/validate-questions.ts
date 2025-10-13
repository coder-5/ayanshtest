#!/usr/bin/env node
/**
 * Validate parsed questions for quality and completeness
 * Detect issues, duplicates, and score quality
 */

import * as fs from 'fs';

interface Question {
  examName: string;
  examYear: number;
  questionNumber: string;
  questionText: string;
  options: Array<{
    letter: string;
    text: string;
    isCorrect: boolean;
  }>;
  topic?: string;
  difficulty?: string;
  points?: number;
  hasImage: boolean;
  answer?: string;
}

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  questionNumber: string;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  qualityScore: number;
  stats: {
    total: number;
    errors: number;
    warnings: number;
    duplicates: number;
    withAnswers: number;
    withTopics: number;
  };
}

/**
 * Validate a single question
 */
function validateQuestion(q: Question, index: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check required fields
  if (!q.questionText || q.questionText.trim().length < 10) {
    issues.push({
      severity: 'error',
      questionNumber: q.questionNumber,
      message: 'Question text too short or missing',
    });
  }

  if (!q.examName) {
    issues.push({
      severity: 'error',
      questionNumber: q.questionNumber,
      message: 'Missing exam name',
    });
  }

  if (!q.examYear || q.examYear < 2000 || q.examYear > 2030) {
    issues.push({
      severity: 'warning',
      questionNumber: q.questionNumber,
      message: `Invalid exam year: ${q.examYear}`,
    });
  }

  // Validate options
  if (!q.options || q.options.length < 2) {
    issues.push({
      severity: 'error',
      questionNumber: q.questionNumber,
      message: `Insufficient options: ${q.options?.length || 0}`,
    });
  } else if (q.options.length > 5) {
    issues.push({
      severity: 'warning',
      questionNumber: q.questionNumber,
      message: `Too many options: ${q.options.length}`,
    });
  }

  // Check option structure
  const letters = new Set<string>();
  let correctCount = 0;

  q.options.forEach((opt, i) => {
    if (!opt.letter) {
      issues.push({
        severity: 'error',
        questionNumber: q.questionNumber,
        message: `Option ${i + 1} missing letter`,
      });
    } else {
      if (letters.has(opt.letter)) {
        issues.push({
          severity: 'error',
          questionNumber: q.questionNumber,
          message: `Duplicate option letter: ${opt.letter}`,
        });
      }
      letters.add(opt.letter);
    }

    if (!opt.text || opt.text.trim().length === 0) {
      issues.push({
        severity: 'error',
        questionNumber: q.questionNumber,
        message: `Option ${opt.letter} has no text`,
      });
    }

    if (opt.isCorrect) correctCount++;
  });

  // Check correct answer
  if (correctCount === 0) {
    issues.push({
      severity: 'warning',
      questionNumber: q.questionNumber,
      message: 'No correct answer marked',
    });
  } else if (correctCount > 1) {
    issues.push({
      severity: 'error',
      questionNumber: q.questionNumber,
      message: `Multiple correct answers: ${correctCount}`,
    });
  }

  // Check for OCR garbage
  const garbagePatterns = [
    /[�]/g, // Replacement character
    /\s{5,}/g, // Excessive whitespace
    /[^\x00-\x7F]{10,}/g, // Long non-ASCII sequences
  ];

  garbagePatterns.forEach((pattern) => {
    if (pattern.test(q.questionText)) {
      issues.push({
        severity: 'warning',
        questionNumber: q.questionNumber,
        message: 'Possible OCR garbage in question text',
      });
    }
  });

  // Check for incomplete text
  if (q.questionText.endsWith('...') && q.questionText.length < 50) {
    issues.push({
      severity: 'warning',
      questionNumber: q.questionNumber,
      message: 'Question text appears truncated',
    });
  }

  return issues;
}

/**
 * Detect duplicate questions
 */
function findDuplicates(questions: Question[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Map<string, string[]>();

  questions.forEach((q, i) => {
    const key = `${q.examYear}-${q.questionNumber}`;
    if (!seen.has(key)) {
      seen.set(key, []);
    }
    seen.get(key)!.push(`Index ${i}`);
  });

  seen.forEach((indices, key) => {
    if (indices.length > 1) {
      issues.push({
        severity: 'warning',
        questionNumber: key,
        message: `Duplicate question found at: ${indices.join(', ')}`,
      });
    }
  });

  return issues;
}

/**
 * Calculate quality score
 */
function calculateQualityScore(question: Question, issues: ValidationIssue[]): number {
  let score = 100;

  // Deduct for errors
  const errors = issues.filter((i) => i.severity === 'error').length;
  score -= errors * 20;

  // Deduct for warnings
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  score -= warnings * 10;

  // Bonus for complete data
  if (question.topic) score += 5;
  if (question.points) score += 5;
  if (question.answer || question.options.some((o) => o.isCorrect)) score += 10;

  // Bonus for good question length
  if (question.questionText.length > 50 && question.questionText.length < 300) {
    score += 5;
  }

  // Bonus for good number of options
  if (question.options.length === 5) score += 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Validate all questions
 */
function validateQuestions(filePath: string): ValidationResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const questions: Question[] = JSON.parse(content);

  console.log(`\n🔍 Validating questions from: ${filePath}`);
  console.log('='.repeat(70));

  let allIssues: ValidationIssue[] = [];
  const qualityScores: number[] = [];

  // Validate each question
  questions.forEach((q, i) => {
    const issues = validateQuestion(q, i);
    allIssues.push(...issues);

    const score = calculateQualityScore(q, issues);
    qualityScores.push(score);

    // Log significant issues
    const errors = issues.filter((i) => i.severity === 'error');
    if (errors.length > 0) {
      console.log(`  ❌ Q${q.questionNumber}: ${errors.length} error(s)`);
      errors.forEach((e) => console.log(`     - ${e.message}`));
    }
  });

  // Find duplicates
  const duplicateIssues = findDuplicates(questions);
  allIssues.push(...duplicateIssues);

  // Calculate statistics
  const stats = {
    total: questions.length,
    errors: allIssues.filter((i) => i.severity === 'error').length,
    warnings: allIssues.filter((i) => i.severity === 'warning').length,
    duplicates: duplicateIssues.length,
    withAnswers: questions.filter((q) => q.answer || q.options.some((o) => o.isCorrect)).length,
    withTopics: questions.filter((q) => q.topic).length,
  };

  const avgQuality = qualityScores.reduce((sum, s) => sum + s, 0) / qualityScores.length;

  console.log('\n📊 Validation Summary:');
  console.log(`  Total questions: ${stats.total}`);
  console.log(`  Errors: ${stats.errors}`);
  console.log(`  Warnings: ${stats.warnings}`);
  console.log(`  Duplicates: ${stats.duplicates}`);
  console.log(
    `  With answers: ${stats.withAnswers} (${((stats.withAnswers / stats.total) * 100).toFixed(1)}%)`
  );
  console.log(
    `  With topics: ${stats.withTopics} (${((stats.withTopics / stats.total) * 100).toFixed(1)}%)`
  );
  console.log(`  Average quality score: ${avgQuality.toFixed(1)}/100\n`);

  return {
    valid: stats.errors === 0,
    issues: allIssues,
    qualityScore: avgQuality,
    stats,
  };
}

/**
 * Filter questions by quality
 */
function filterByQuality(questions: Question[], minScore: number = 70): Question[] {
  return questions.filter((q) => {
    const issues = validateQuestion(q, 0);
    const score = calculateQualityScore(q, issues);
    return score >= minScore;
  });
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(
      'Usage: npx tsx scripts/validate-questions.ts <questions-json> [--filter-quality=70] [--output=filtered.json]'
    );
    console.log('\nExample:');
    console.log('  npx tsx scripts/validate-questions.ts mathcon-ocr-parsed.json');
    console.log(
      '  npx tsx scripts/validate-questions.ts mathcon-ocr-parsed.json --filter-quality=80 --output=clean.json'
    );
    process.exit(1);
  }

  const inputFile = args[0];
  let filterQuality: number | null = null;
  let outputFile: string | null = null;

  // Parse optional arguments
  args.slice(1).forEach((arg) => {
    if (arg.startsWith('--filter-quality=')) {
      filterQuality = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--output=')) {
      outputFile = arg.split('=')[1];
    }
  });

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Error: File not found: ${inputFile}`);
    process.exit(1);
  }

  try {
    const result = validateQuestions(inputFile);

    if (filterQuality !== null && outputFile) {
      const questions: Question[] = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
      const filtered = filterByQuality(questions, filterQuality);

      fs.writeFileSync(outputFile, JSON.stringify(filtered, null, 2));

      console.log(
        `✅ Filtered ${filtered.length}/${questions.length} questions with score >= ${filterQuality}`
      );
      console.log(`💾 Saved to: ${outputFile}\n`);
    }

    if (result.valid) {
      console.log('✅ All questions passed validation!');
    } else {
      console.log(
        `⚠️  Validation found ${result.stats.errors} errors and ${result.stats.warnings} warnings`
      );
      console.log('   Review issues above before importing\n');
    }
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { validateQuestions, filterByQuality, ValidationResult };
