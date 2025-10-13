#!/usr/bin/env node
/**
 * Parse OCR-extracted MathCON questions into JSON format
 * Handles multiple question formats from OCR output
 */

import * as fs from 'fs';
import * as path from 'path';

interface ParsedQuestion {
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
  answer?: string; // If extracted from OCR
}

/**
 * Clean OCR artifacts from text
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[""]/g, '"') // Fix smart quotes
    .replace(/['']/g, "'") // Fix smart apostrophes
    .replace(/–/g, '-') // Fix em dash
    .replace(/…/g, '...') // Fix ellipsis
    .trim();
}

/**
 * Extract topic and points from bracket notation
 * [Algebra, 3 Points] → { topic: 'Algebra', points: 3 }
 */
function extractTopicPoints(text: string): { topic?: string; points?: number } {
  const match = text.match(/\[(.*?),\s*(\d+)\s*Points?\]/i);
  if (match) {
    return {
      topic: match[1].trim(),
      points: parseInt(match[2]),
    };
  }
  return {};
}

/**
 * Parse "Question #X" format (pages 78-151)
 */
function parseQuestionHash(
  content: string,
  startIndex: number,
  year: number
): ParsedQuestion | null {
  const lines = content.split('\n');
  let i = startIndex;

  // Extract question number
  const qNumMatch = lines[i].match(/Question\s+#(\d+)/i);
  if (!qNumMatch) return null;

  const questionNum = qNumMatch[1];
  i++;

  // Skip empty lines
  while (i < lines.length && !lines[i].trim()) i++;

  // Extract topic and points
  let topic: string | undefined;
  let points: number | undefined;

  if (i < lines.length && lines[i].includes('[')) {
    const topicPoints = extractTopicPoints(lines[i]);
    topic = topicPoints.topic;
    points = topicPoints.points;
    i++;
  }

  // Collect question text until options
  const questionLines: string[] = [];
  while (i < lines.length && !lines[i].match(/^[A-E][\):]/) && !lines[i].startsWith('Answer:')) {
    const line = lines[i].trim();
    if (line && !line.match(/^Question\s+#\d+/i) && !line.includes('--- Page')) {
      questionLines.push(line);
    }
    i++;
  }

  const questionText = cleanText(questionLines.join(' '));
  if (!questionText) return null;

  // Extract options - handle both inline "A) text B) text" and newline format
  const options: Array<{ letter: string; text: string; isCorrect: boolean }> = [];
  const optionPattern = /([A-E])[\):]\s*([^A-E\n]+?)(?=[A-E][\):]|Answer:|$)/gi;

  // Collect lines that might contain options
  const optionLines: string[] = [];
  while (
    i < lines.length &&
    !lines[i].startsWith('Answer:') &&
    !lines[i].match(/^Question\s+#\d+/i)
  ) {
    if (lines[i].trim()) {
      optionLines.push(lines[i]);
    }
    i++;
    if (options.length >= 5) break; // Max 5 options
  }

  const optionText = optionLines.join(' ');
  let match;
  while ((match = optionPattern.exec(optionText)) !== null && options.length < 5) {
    options.push({
      letter: match[1].toUpperCase(), // Ensure uppercase A-E
      text: cleanText(match[2]),
      isCorrect: false,
    });
  }

  // Extract answer if present (but leave all isCorrect: false for now)
  let answer: string | undefined;
  if (i < lines.length && lines[i].startsWith('Answer:')) {
    const ansMatch = lines[i].match(/Answer:\s*([A-E])/i);
    if (ansMatch) {
      answer = ansMatch[1].toUpperCase();
      // Note: NOT marking correct option - user will add answers later
    }
  }

  return {
    examName: 'MathCON',
    examYear: year,
    questionNumber: questionNum,
    questionText,
    options,
    topic,
    points,
    difficulty: points ? (points <= 3 ? 'EASY' : points <= 5 ? 'MEDIUM' : 'HARD') : undefined,
    hasImage:
      questionText.toLowerCase().includes('figure') ||
      questionText.toLowerCase().includes('diagram') ||
      questionText.toLowerCase().includes('shown'),
    answer,
  };
}

/**
 * Parse numbered format "1." (pages 8-21, 25-77)
 */
function parseNumberedQuestion(
  content: string,
  startIndex: number,
  year: number
): ParsedQuestion | null {
  const lines = content.split('\n');
  let i = startIndex;

  // Extract question number
  const qNumMatch = lines[i].match(/^(\d+)\./);
  if (!qNumMatch) return null;

  const questionNum = qNumMatch[1];
  i++;

  // Extract topic and points if present
  let topic: string | undefined;
  let points: number | undefined;

  if (i < lines.length && lines[i].includes('[')) {
    const topicPoints = extractTopicPoints(lines[i]);
    topic = topicPoints.topic;
    points = topicPoints.points;
    i++;
  }

  // Collect question text
  const questionLines: string[] = [];
  while (i < lines.length && !lines[i].match(/^[A-E][\)\.:]/) && !lines[i].match(/^\d+\./)) {
    const line = lines[i].trim();
    if (line && !line.includes('--- Page')) {
      questionLines.push(line);
    }
    i++;
  }

  const questionText = cleanText(questionLines.join(' '));
  if (!questionText) return null;

  // Extract options
  const options: Array<{ letter: string; text: string; isCorrect: boolean }> = [];
  const optionPattern = /([A-E])[\)\.:\s]+([^A-E\n]+?)(?=[A-E][\)\.:]|\d+\.|$)/gi;

  const optionLines: string[] = [];
  while (i < lines.length && !lines[i].match(/^\d+\./) && options.length < 5) {
    if (lines[i].trim()) {
      optionLines.push(lines[i]);
    }
    i++;
  }

  const optionText = optionLines.join(' ');
  let match;
  while ((match = optionPattern.exec(optionText)) !== null && options.length < 5) {
    options.push({
      letter: match[1].toUpperCase(), // Ensure uppercase A-E
      text: cleanText(match[2]),
      isCorrect: false,
    });
  }

  return {
    examName: 'MathCON',
    examYear: year,
    questionNumber: questionNum,
    questionText,
    options,
    topic,
    points,
    difficulty: points ? (points <= 3 ? 'EASY' : points <= 5 ? 'MEDIUM' : 'HARD') : undefined,
    hasImage:
      questionText.toLowerCase().includes('figure') ||
      questionText.toLowerCase().includes('diagram') ||
      questionText.toLowerCase().includes('shown'),
  };
}

/**
 * Main parser function
 */
function parseOCRQuestions(filePath: string, year: number = 2023): ParsedQuestion[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const questions: ParsedQuestion[] = [];

  console.log(`\n📖 Parsing OCR questions from: ${path.basename(filePath)}`);
  console.log('='.repeat(70));

  let questionHashCount = 0;
  let numberedCount = 0;
  let skipped = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Try "Question #X" format
    if (line.match(/^Question\s+#\d+/i)) {
      const question = parseQuestionHash(content, i, year);
      if (question && question.options.length >= 3) {
        questions.push(question);
        questionHashCount++;
        console.log(
          `  [${questions.length}] Question #${question.questionNumber} - ${question.options.length} options${question.answer ? ' (Answer: ' + question.answer + ')' : ''}`
        );
      } else {
        skipped++;
      }
    }

    // Try numbered "X." format
    else if (line.match(/^\d+\.$/) && parseInt(line) <= 100) {
      const question = parseNumberedQuestion(content, i, year);
      if (question && question.options.length >= 3) {
        questions.push(question);
        numberedCount++;
        console.log(
          `  [${questions.length}] Q${question.questionNumber} - ${question.options.length} options`
        );
      } else {
        skipped++;
      }
    }
  }

  console.log('\n📊 Parsing Summary:');
  console.log(`  "Question #X" format: ${questionHashCount}`);
  console.log(`  Numbered "X." format: ${numberedCount}`);
  console.log(`  Total parsed: ${questions.length}`);
  console.log(`  Skipped (incomplete): ${skipped}\n`);

  return questions;
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: npx tsx scripts/parse-ocr-questions.ts <input-file> [output-file] [year]');
    console.log('\nExample:');
    console.log(
      '  npx tsx scripts/parse-ocr-questions.ts mathcon-all-pages-OCR.txt mathcon-parsed.json 2023'
    );
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1] || 'mathcon-ocr-parsed.json';
  const year = args[2] ? parseInt(args[2]) : 2023;

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Error: File not found: ${inputFile}`);
    process.exit(1);
  }

  try {
    const questions = parseOCRQuestions(inputFile, year);

    // Write to file
    fs.writeFileSync(outputFile, JSON.stringify(questions, null, 2));

    console.log(`✅ Success! Saved ${questions.length} questions to: ${outputFile}`);

    // Show statistics
    const withAnswers = questions.filter((q) => q.answer).length;
    const withTopics = questions.filter((q) => q.topic).length;
    const withImages = questions.filter((q) => q.hasImage).length;

    console.log('\n📈 Statistics:');
    console.log(`  Questions with answers: ${withAnswers}`);
    console.log(`  Questions with topics: ${withTopics}`);
    console.log(`  Questions with diagrams: ${withImages}`);
    console.log(
      `  Average options per question: ${(questions.reduce((sum, q) => sum + q.options.length, 0) / questions.length).toFixed(1)}`
    );
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { parseOCRQuestions, ParsedQuestion };
