#!/usr/bin/env node
/**
 * Map correct answers to questions from OCR-extracted answer keys
 * Handles multiple answer key formats
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

/**
 * Extract answers from OCR text
 * Handles formats like:
 * - "Answer: A"
 * - "Question #1 Answer: B"
 * - "1. A"
 * - "Problem 1: C"
 */
function extractAnswers(ocrText: string): Record<string, string> {
  const answers: Record<string, string> = {};
  const lines = ocrText.split('\n');

  for (const line of lines) {
    // Format: "Question #X Answer: Y"
    let match = line.match(/Question\s+#(\d+)\s+Answer:\s*([A-E])/i);
    if (match) {
      answers[match[1]] = match[2].toUpperCase();
      continue;
    }

    // Format: "Answer: Y" (after question)
    match = line.match(/Answer:\s*([A-E])/i);
    if (match) {
      // Look back for question number
      const qNumMatch = ocrText
        .substring(Math.max(0, ocrText.indexOf(line) - 200), ocrText.indexOf(line))
        .match(/(?:Question\s+#|Problem\s+|^\s*)(\d+)/);
      if (qNumMatch) {
        answers[qNumMatch[1]] = match[1].toUpperCase();
      }
      continue;
    }

    // Format: "1. A" or "1) A"
    match = line.match(/^(\d+)[\.\)]\s*([A-E])\s*$/);
    if (match) {
      answers[match[1]] = match[2].toUpperCase();
      continue;
    }

    // Format: "Problem X: Y"
    match = line.match(/Problem\s+(\d+):\s*([A-E])/i);
    if (match) {
      answers[match[1]] = match[2].toUpperCase();
      continue;
    }
  }

  return answers;
}

/**
 * Map answers to questions
 */
function mapAnswers(questions: Question[], answers: Record<string, string>): Question[] {
  let mappedCount = 0;
  let alreadyHadCount = 0;

  const updatedQuestions = questions.map((q) => {
    const correctAnswer = answers[q.questionNumber];

    if (correctAnswer) {
      // Check if question already has a correct answer marked
      const alreadyMarked = q.options.some((opt) => opt.isCorrect);

      if (alreadyMarked) {
        alreadyHadCount++;
        return q; // Keep existing answer
      }

      // Mark the correct option
      const updatedOptions = q.options.map((opt) => ({
        ...opt,
        isCorrect: opt.letter === correctAnswer,
      }));

      // Verify that the correct letter exists in options
      const correctOptionExists = updatedOptions.some((opt) => opt.isCorrect);

      if (correctOptionExists) {
        mappedCount++;
        return {
          ...q,
          options: updatedOptions,
          answer: correctAnswer,
        };
      } else {
        console.log(
          `  Warning: Q${q.questionNumber} - Answer ${correctAnswer} not in options [${q.options.map((o) => o.letter).join(', ')}]`
        );
        return q;
      }
    }

    return q;
  });

  console.log(`\nAnswer Mapping Results:`);
  console.log(`  Already had answers: ${alreadyHadCount}`);
  console.log(`  New answers mapped: ${mappedCount}`);
  console.log(`  Still missing answers: ${questions.length - alreadyHadCount - mappedCount}`);

  return updatedQuestions;
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: npx tsx scripts/map-answers.ts <questions-json> <ocr-text> [output-json]');
    console.log('\nExample:');
    console.log(
      '  npx tsx scripts/map-answers.ts mathcon-ocr-parsed.json mathcon-all-pages-OCR.txt mathcon-with-answers.json'
    );
    process.exit(1);
  }

  const questionsFile = args[0];
  const ocrFile = args[1];
  const outputFile = args[2] || 'mathcon-with-answers.json';

  // Check files exist
  if (!fs.existsSync(questionsFile)) {
    console.error(`Error: Questions file not found: ${questionsFile}`);
    process.exit(1);
  }

  if (!fs.existsSync(ocrFile)) {
    console.error(`Error: OCR file not found: ${ocrFile}`);
    process.exit(1);
  }

  try {
    console.log('\n=== Answer Mapper ===\n');

    // Load questions
    console.log(`Loading questions from: ${questionsFile}`);
    const questions: Question[] = JSON.parse(fs.readFileSync(questionsFile, 'utf-8'));
    console.log(`  Loaded ${questions.length} questions`);

    // Count questions with/without answers
    const withAnswers = questions.filter((q) => q.options.some((opt) => opt.isCorrect)).length;
    const withoutAnswers = questions.length - withAnswers;
    console.log(`  With answers: ${withAnswers}`);
    console.log(`  Without answers: ${withoutAnswers}`);

    // Extract answers from OCR
    console.log(`\nExtracting answers from: ${ocrFile}`);
    const ocrText = fs.readFileSync(ocrFile, 'utf-8');
    const answers = extractAnswers(ocrText);
    console.log(`  Found ${Object.keys(answers).length} answer mappings`);

    // Show sample answers
    const sampleKeys = Object.keys(answers).slice(0, 10);
    console.log('\n  Sample answers:');
    sampleKeys.forEach((key) => {
      console.log(`    Q${key}: ${answers[key]}`);
    });

    // Map answers to questions
    console.log('\nMapping answers to questions...');
    const updatedQuestions = mapAnswers(questions, answers);

    // Save output
    fs.writeFileSync(outputFile, JSON.stringify(updatedQuestions, null, 2));
    console.log(`\nSuccess! Saved ${updatedQuestions.length} questions to: ${outputFile}`);

    // Final statistics
    const finalWithAnswers = updatedQuestions.filter((q) =>
      q.options.some((opt) => opt.isCorrect)
    ).length;
    const improvement = finalWithAnswers - withAnswers;

    console.log('\n=== Final Statistics ===');
    console.log(
      `  Before: ${withAnswers}/${questions.length} with answers (${((withAnswers / questions.length) * 100).toFixed(1)}%)`
    );
    console.log(
      `  After: ${finalWithAnswers}/${updatedQuestions.length} with answers (${((finalWithAnswers / updatedQuestions.length) * 100).toFixed(1)}%)`
    );
    console.log(`  Improvement: +${improvement} questions\n`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { extractAnswers, mapAnswers };
