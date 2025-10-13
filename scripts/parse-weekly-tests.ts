import * as fs from 'fs';

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
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  points?: number;
  hasImage: boolean;
  week?: number;
  answer?: string;
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[""]​/g, '"')
    .replace(/['']​/g, "'")
    .replace(/–/g, '-')
    .replace(/\|/g, 'I')
    .trim();
}

function parseWeeklyTests(ocrContent: string, year: number): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  const lines = ocrContent.split('\n');

  let currentWeek = 0;
  let globalQuestionNumber = 1;

  // Find all [Topic, Points] markers and their positions
  const topicMarkers: Array<{
    lineIndex: number;
    topic: string;
    points: number;
  }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect week headers
    const weekMatch = line.match(/Week\s+(\d+)/i);
    if (weekMatch) {
      currentWeek = parseInt(weekMatch[1]);
      continue;
    }

    // Detect [Topic, Points] markers
    const topicMatch = line.match(/^\[([^,]+),\s*(\d+)\s*Points?\]/i);
    if (topicMatch) {
      topicMarkers.push({
        lineIndex: i,
        topic: topicMatch[1].trim(),
        points: parseInt(topicMatch[2]),
      });
    }
  }

  console.log(`Found ${topicMarkers.length} topic markers in weekly tests`);

  // Process each topic marker as a question
  for (let markerIndex = 0; markerIndex < topicMarkers.length; markerIndex++) {
    const marker = topicMarkers[markerIndex];
    const nextMarker = topicMarkers[markerIndex + 1];

    // Determine the end line for this question
    const endLine = nextMarker ? nextMarker.lineIndex : lines.length;

    // Extract lines for this question
    const questionLines = lines.slice(marker.lineIndex + 1, endLine);

    // Find where the question text ends and options begin
    let questionText = '';
    let optionsText = '';
    let foundOptions = false;

    for (let i = 0; i < questionLines.length; i++) {
      const line = questionLines[i].trim();

      // Skip page markers and empty lines
      if (line.startsWith('---') || line.length === 0) continue;
      if (line.match(/^MathCON/)) continue;
      if (line.match(/^\[.*,.*Points/)) break; // Next question

      // Detect options pattern
      if (line.match(/[A-E]\s*\)/)) {
        foundOptions = true;
      }

      if (foundOptions) {
        optionsText += ' ' + line;
      } else {
        questionText += ' ' + line;
      }
    }

    questionText = cleanText(questionText);
    optionsText = cleanText(optionsText);

    // Skip if question text is too short
    if (questionText.length < 10) {
      continue;
    }

    // Parse options
    const options: Array<{ letter: string; text: string; isCorrect: boolean }> = [];

    // Match patterns like: A) text B) text C) text
    // Also handle corrupted OCR like: A)text B)text
    const optionPattern = /([A-E])\s*\)\s*([^A-E\)]+?)(?=\s*[A-E]\s*\)|$)/gi;

    let match;
    while ((match = optionPattern.exec(optionsText)) !== null) {
      const letter = match[1].toUpperCase();
      let text = cleanText(match[2]);

      // Clean up common OCR artifacts in options
      text = text.replace(/\s+/g, ' ').trim();

      if (text.length > 0 && text.length < 500) {
        options.push({
          letter,
          text,
          isCorrect: false, // User will add answers later
        });
      }
    }

    // Skip if we don't have at least 2 options
    if (options.length < 2) {
      console.log(
        `Skipped question at marker ${markerIndex}: insufficient options (${options.length})`
      );
      continue;
    }

    // Determine difficulty based on points
    let difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' = 'MEDIUM';
    if (marker.points <= 3) difficulty = 'EASY';
    else if (marker.points <= 5) difficulty = 'MEDIUM';
    else if (marker.points <= 7) difficulty = 'HARD';
    else difficulty = 'EXPERT';

    // Check if question mentions a figure/diagram
    const hasImage =
      questionText.toLowerCase().includes('figure') ||
      questionText.toLowerCase().includes('diagram') ||
      questionText.toLowerCase().includes('shown') ||
      questionText.toLowerCase().includes('triangle') ||
      questionText.toLowerCase().includes('square') ||
      questionText.toLowerCase().includes('circle');

    questions.push({
      examName: 'MathCON',
      examYear: year,
      questionNumber: `W${currentWeek}-${globalQuestionNumber}`,
      questionText,
      options,
      topic: marker.topic,
      difficulty,
      points: marker.points,
      hasImage,
      week: currentWeek,
    });

    globalQuestionNumber++;
  }

  return questions;
}

// Main execution
const args = process.argv.slice(2);
const inputFile = args[0] || 'mathcon-all-pages-OCR.txt';
const outputFile = args[1] || 'mathcon-weekly-tests.json';
const year = parseInt(args[2] || '2023');

console.log('='.repeat(60));
console.log('MathCON Weekly Tests Parser');
console.log('='.repeat(60));
console.log(`Input: ${inputFile}`);
console.log(`Output: ${outputFile}`);
console.log(`Year: ${year}`);
console.log('');

// Read OCR content
const ocrContent = fs.readFileSync(inputFile, 'utf-8');
console.log(`Loaded ${ocrContent.length} characters from ${inputFile}`);

// Parse weekly tests
const questions = parseWeeklyTests(ocrContent, year);

console.log('');
console.log('='.repeat(60));
console.log('PARSING RESULTS');
console.log('='.repeat(60));
console.log(`Total questions parsed: ${questions.length}`);

// Group by week
const byWeek = questions.reduce(
  (acc, q) => {
    const week = q.week || 0;
    acc[week] = (acc[week] || 0) + 1;
    return acc;
  },
  {} as Record<number, number>
);

console.log('\nQuestions by week:');
Object.entries(byWeek)
  .sort(([a], [b]) => parseInt(a) - parseInt(b))
  .forEach(([week, count]) => {
    console.log(`  Week ${week}: ${count} questions`);
  });

// Group by topic
const byTopic = questions.reduce(
  (acc, q) => {
    const topic = q.topic || 'Unknown';
    acc[topic] = (acc[topic] || 0) + 1;
    return acc;
  },
  {} as Record<string, number>
);

console.log('\nQuestions by topic:');
Object.entries(byTopic)
  .sort(([, a], [, b]) => b - a)
  .forEach(([topic, count]) => {
    console.log(`  ${topic}: ${count} questions`);
  });

// Group by difficulty
const byDifficulty = questions.reduce(
  (acc, q) => {
    const diff = q.difficulty || 'UNKNOWN';
    acc[diff] = (acc[diff] || 0) + 1;
    return acc;
  },
  {} as Record<string, number>
);

console.log('\nQuestions by difficulty:');
Object.entries(byDifficulty).forEach(([difficulty, count]) => {
  console.log(`  ${difficulty}: ${count} questions`);
});

// Questions with images
const withImages = questions.filter((q) => q.hasImage).length;
console.log(
  `\nQuestions with diagrams/images: ${withImages} (${((withImages / questions.length) * 100).toFixed(1)}%)`
);

// Average options per question
const avgOptions = questions.reduce((sum, q) => sum + q.options.length, 0) / questions.length;
console.log(`Average options per question: ${avgOptions.toFixed(1)}`);

// Save to JSON
fs.writeFileSync(outputFile, JSON.stringify(questions, null, 2));
console.log(`\n✅ Saved ${questions.length} questions to ${outputFile}`);

// Show sample questions
console.log('\n' + '='.repeat(60));
console.log('SAMPLE QUESTIONS');
console.log('='.repeat(60));
questions.slice(0, 3).forEach((q, i) => {
  console.log(`\n[${i + 1}] ${q.questionNumber} [${q.topic}, ${q.points} Points]`);
  console.log(`Q: ${q.questionText.substring(0, 120)}...`);
  q.options.forEach((opt) => {
    console.log(
      `  ${opt.letter}) ${opt.text.substring(0, 60)}${opt.text.length > 60 ? '...' : ''}`
    );
  });
});

console.log('\n' + '='.repeat(60));
console.log('NEXT STEPS');
console.log('='.repeat(60));
console.log(`1. Review ${outputFile} for quality`);
console.log(`2. Run validation: npx tsx scripts/validate-questions.ts ${outputFile}`);
console.log(`3. Import to database: npx tsx scripts/import.ts ${outputFile}`);
console.log('='.repeat(60));
