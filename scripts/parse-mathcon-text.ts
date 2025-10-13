import * as fs from 'fs';
import * as path from 'path';

/**
 * Parse extracted MathCON text into structured JSON format
 *
 * Handles the format from Python PyPDF2 extraction:
 * - Problem X [Topic] [Points]
 * - Question text
 * - A) Option A
 * - B) Option B
 * - etc.
 */

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
  topic: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  hasImage: boolean;
}

function determineDifficulty(points: number): 'EASY' | 'MEDIUM' | 'HARD' {
  if (points === 3) return 'EASY';
  if (points === 5) return 'MEDIUM';
  return 'HARD';
}

function parseQuestions(text: string, year: number): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];

  // Split by "Problem" keyword
  const sections = text.split(/Problem\s+(\d+)/);

  for (let i = 1; i < sections.length; i += 2) {
    const questionNum = sections[i];
    const content = sections[i + 1];

    if (!content) continue;

    try {
      // Extract topic and points
      const topicMatch = content.match(
        /(Algebra|Geometry|Number Theory|Combinatorics|Patterns|Counting)/i
      );
      const pointsMatch = content.match(/(\d+)\s+[Pp]oints?/);

      if (!topicMatch || !pointsMatch) {
        console.log(`  ⚠️  Skipping Problem ${questionNum} - Missing topic or points`);
        continue;
      }

      const topic = topicMatch[1];
      const points = parseInt(pointsMatch[1]);

      // Extract question text (everything before options)
      const questionMatch = content.match(/[Pp]oints?\s+(.*?)(?=\n[A-E]\))/s);
      if (!questionMatch) {
        console.log(`  ⚠️  Skipping Problem ${questionNum} - No question text found`);
        continue;
      }

      let questionText = questionMatch[1]
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/Page \d+/g, '')
        .trim();

      // Extract options A-E
      const options: Array<{ letter: string; text: string; isCorrect: boolean }> = [];
      const optionPattern = /([A-E])\)\s+([^\n]+)/g;
      let optionMatch;

      while ((optionMatch = optionPattern.exec(content)) !== null) {
        const letter = optionMatch[1];
        const text = optionMatch[2].trim();

        options.push({
          letter,
          text,
          isCorrect: false, // Will be marked manually or by answer key
        });
      }

      // Need at least 3 options to be valid
      if (options.length < 3) {
        console.log(`  ⚠️  Skipping Problem ${questionNum} - Only ${options.length} options found`);
        continue;
      }

      // Create question object
      const question: ParsedQuestion = {
        examName: 'MathCON',
        examYear: year,
        questionNumber: questionNum,
        questionText,
        options,
        topic,
        difficulty: determineDifficulty(points),
        hasImage: false,
      };

      questions.push(question);
      console.log(
        `  ✅ Parsed Problem ${questionNum}: ${topic}, ${points} points, ${options.length} options`
      );
    } catch (error: any) {
      console.log(`  ❌ Error parsing Problem ${questionNum}: ${error.message}`);
    }
  }

  return questions;
}

async function main() {
  const inputFile = process.argv[2] || 'mathcon-all-pages.txt';
  const outputFile = process.argv[3] || 'mathcon-parsed-questions.json';
  const year = process.argv[4] ? parseInt(process.argv[4]) : 2019;

  console.log('\n📝 MATHCON TEXT PARSER');
  console.log('='.repeat(70));
  console.log(`Input: ${inputFile}`);
  console.log(`Output: ${outputFile}`);
  console.log(`Year: ${year}\n`);

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file not found: ${inputFile}`);
    process.exit(1);
  }

  const text = fs.readFileSync(inputFile, 'utf-8');
  console.log(`📄 Loaded ${text.length} characters\n`);

  console.log('🔍 Parsing questions...\n');
  const questions = parseQuestions(text, year);

  console.log(`\n✅ Successfully parsed ${questions.length} questions\n`);

  // Save to JSON
  fs.writeFileSync(outputFile, JSON.stringify(questions, null, 2));
  console.log(`💾 Saved to: ${outputFile}`);

  // Summary
  console.log('\n📊 Summary:');
  console.log(`  Total Questions: ${questions.length}`);

  const byTopic: Record<string, number> = {};
  const byDifficulty: Record<string, number> = {};

  questions.forEach((q) => {
    byTopic[q.topic] = (byTopic[q.topic] || 0) + 1;
    byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
  });

  console.log('\n  By Topic:');
  Object.entries(byTopic).forEach(([topic, count]) => {
    console.log(`    ${topic}: ${count}`);
  });

  console.log('\n  By Difficulty:');
  Object.entries(byDifficulty).forEach(([diff, count]) => {
    console.log(`    ${diff}: ${count}`);
  });

  console.log(
    '\n⚠️  NOTE: Correct answers need to be marked manually or extracted from answer key'
  );
  console.log('📖 Review the output file and mark isCorrect: true for correct options\n');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  });
}

export { parseQuestions, ParsedQuestion };
