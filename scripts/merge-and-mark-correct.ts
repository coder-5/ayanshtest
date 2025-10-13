import * as fs from 'fs';

/**
 * Merge parsed questions with manually verified ones
 * and mark correct answers
 */

// Correct answers from manual verification
const correctAnswers: Record<string, string> = {
  '1': 'B', // 0.32
  '2': 'D', // (3, 2)
  '3': 'B', // 400
  '4': 'E', // None of the preceding (should be 24)
  '5': 'A', // 4/3
  '6': 'D', // 27
  '7': 'C', // (3a+b)/3
  '8': 'A', // 17
  '9': 'B', // 200°
  '10': 'B', // 729
};

function markCorrectAnswers(questions: any[], answers: Record<string, string>) {
  return questions.map((q) => {
    const correctLetter = answers[q.questionNumber];

    if (correctLetter) {
      q.options = q.options.map((opt: any) => ({
        ...opt,
        isCorrect: opt.letter === correctLetter,
      }));
    }

    return q;
  });
}

async function main() {
  const parsedFile = 'mathcon-parsed-auto.json';
  const manualFile = 'mathcon-questions.json';
  const outputFile = 'mathcon-merged-verified.json';

  console.log('\n🔄 MERGING AND MARKING CORRECT ANSWERS');
  console.log('='.repeat(70));

  // Load parsed questions
  const parsed = JSON.parse(fs.readFileSync(parsedFile, 'utf-8'));
  console.log(`📄 Loaded ${parsed.length} parsed questions`);

  // Mark correct answers
  const marked = markCorrectAnswers(parsed, correctAnswers);
  console.log(`✅ Marked correct answers for ${parsed.length} questions\n`);

  // Load manual questions
  let manual: any[] = [];
  if (fs.existsSync(manualFile)) {
    manual = JSON.parse(fs.readFileSync(manualFile, 'utf-8'));
    console.log(`📄 Loaded ${manual.length} manual questions`);
  }

  // Remove duplicates (keep manual version if exists)
  const manualNumbers = new Set(manual.map((q) => q.questionNumber));
  const unique = marked.filter((q) => !manualNumbers.has(q.questionNumber));

  console.log(`🔍 Found ${marked.length - unique.length} duplicates (keeping manual versions)`);
  console.log(`✨ ${unique.length} new questions to add\n`);

  // Merge
  const merged = [...manual, ...unique].sort((a, b) => {
    if (a.examYear !== b.examYear) return a.examYear - b.examYear;
    return parseInt(a.questionNumber) - parseInt(b.questionNumber);
  });

  fs.writeFileSync(outputFile, JSON.stringify(merged, null, 2));

  console.log(`💾 Saved ${merged.length} questions to: ${outputFile}`);
  console.log(`\n📊 Summary:`);
  console.log(`  Manual: ${manual.length}`);
  console.log(`  Parsed: ${parsed.length}`);
  console.log(`  New: ${unique.length}`);
  console.log(`  Total: ${merged.length}\n`);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
