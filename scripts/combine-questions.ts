import * as fs from 'fs';

// Combine multiple question JSON files into one
const args = process.argv.slice(2);

if (args.length < 3) {
  console.log(
    'Usage: npx tsx scripts/combine-questions.ts <output-file> <input-file-1> <input-file-2> ...'
  );
  console.log(
    'Example: npx tsx scripts/combine-questions.ts all-questions.json mathcon-all-questions.json mathcon-weekly-tests.json'
  );
  process.exit(1);
}

const outputFile = args[0];
const inputFiles = args.slice(1);

console.log('='.repeat(60));
console.log('Combining Question Files');
console.log('='.repeat(60));
console.log(`Output: ${outputFile}`);
console.log(`Input files: ${inputFiles.length}`);
inputFiles.forEach((f) => console.log(`  - ${f}`));
console.log('');

const allQuestions: any[] = [];
const stats: Record<string, number> = {};

for (const inputFile of inputFiles) {
  console.log(`Reading ${inputFile}...`);
  try {
    const content = fs.readFileSync(inputFile, 'utf-8');
    const questions = JSON.parse(content);

    if (!Array.isArray(questions)) {
      console.log(`  ⚠️  Warning: ${inputFile} is not an array, skipping`);
      continue;
    }

    console.log(`  ✅ Loaded ${questions.length} questions`);
    allQuestions.push(...questions);
    stats[inputFile] = questions.length;
  } catch (error: any) {
    console.log(`  ❌ Error reading ${inputFile}: ${error.message}`);
  }
}

console.log('');
console.log('='.repeat(60));
console.log('COMBINED RESULTS');
console.log('='.repeat(60));
console.log(`Total questions: ${allQuestions.length}`);
console.log('');

// Analyze combined dataset
const byExam = allQuestions.reduce(
  (acc, q) => {
    const key = `${q.examName} ${q.examYear}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  },
  {} as Record<string, number>
);

console.log('Questions by exam:');
Object.entries(byExam).forEach(([exam, count]) => {
  console.log(`  ${exam}: ${count}`);
});

const byTopic = allQuestions.reduce(
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
    console.log(`  ${topic}: ${count}`);
  });

const byDifficulty = allQuestions.reduce(
  (acc, q) => {
    const diff = q.difficulty || 'UNKNOWN';
    acc[diff] = (acc[diff] || 0) + 1;
    return acc;
  },
  {} as Record<string, number>
);

console.log('\nQuestions by difficulty:');
Object.entries(byDifficulty).forEach(([difficulty, count]) => {
  console.log(`  ${difficulty}: ${count}`);
});

// Check for duplicates by question text
const textMap = new Map<string, number>();
allQuestions.forEach((q) => {
  const fingerprint = q.questionText.substring(0, 100);
  textMap.set(fingerprint, (textMap.get(fingerprint) || 0) + 1);
});

const duplicates = Array.from(textMap.values()).filter((count) => count > 1).length;
console.log(`\nPotential duplicates (by first 100 chars): ${duplicates}`);
console.log(`Unique questions: ${textMap.size}`);

// Save combined file
fs.writeFileSync(outputFile, JSON.stringify(allQuestions, null, 2));
console.log(`\n✅ Saved ${allQuestions.length} questions to ${outputFile}`);
console.log('='.repeat(60));
