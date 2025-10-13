const data = require('./mathcon-all-questions.json');

// Create a map of question text -> count
const textCounts = {};
data.forEach((q) => {
  const text = q.questionText.substring(0, 100); // First 100 chars as fingerprint
  textCounts[text] = (textCounts[text] || 0) + 1;
});

// Find true duplicates
const trueDupes = Object.entries(textCounts).filter(([text, count]) => count > 1);

console.log(`Total questions: ${data.length}`);
console.log(`Unique question texts (first 100 chars): ${Object.keys(textCounts).length}`);
console.log(`True duplicates: ${data.length - Object.keys(textCounts).length}\n`);

if (trueDupes.length > 0) {
  console.log('Questions that appear multiple times:');
  trueDupes.slice(0, 10).forEach(([text, count]) => {
    console.log(`  [${count}×] ${text}...`);
  });
}

console.log(`\n✅ Actual unique questions: ${Object.keys(textCounts).length}`);
console.log(`❌ True duplicate copies: ${data.length - Object.keys(textCounts).length}`);
console.log(`\nConclusion: ${Object.keys(textCounts).length} unique questions in 180 parsed`);
