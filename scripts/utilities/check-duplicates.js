const data = require('./mathcon-all-questions.json');

const counts = {};
data.forEach((q) => {
  counts[q.questionNumber] = (counts[q.questionNumber] || 0) + 1;
});

const dupes = Object.entries(counts)
  .filter(([n, c]) => c > 1)
  .sort((a, b) => b[1] - a[1]);

console.log('Question numbers appearing multiple times:');
dupes.slice(0, 20).forEach(([n, c]) => {
  console.log(`  Q${n}: ${c} times`);
});

console.log(`\nTotal unique question numbers: ${Object.keys(counts).length}`);
console.log(`Total questions parsed: ${data.length}`);
console.log(`Questions with duplicate numbers: ${dupes.length}`);
