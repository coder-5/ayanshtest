const data = require('./mathcon-all-questions.json');

const q1s = data.filter((q) => q.questionNumber === '1');

console.log(`Found ${q1s.length} questions with questionNumber='1'\n`);

q1s.forEach((q, i) => {
  console.log(`[${i + 1}/${q1s.length}] Question #1:`);
  console.log(`  Text: ${q.questionText.substring(0, 100)}...`);
  console.log(`  Topic: ${q.topic || 'None'}`);
  console.log(`  Points: ${q.points || 'None'}`);
  console.log(`  Options: ${q.options.length}`);
  console.log('');
});

// Check if they're the same question
const uniqueTexts = new Set(q1s.map((q) => q.questionText));
console.log(`Unique question texts: ${uniqueTexts.size}`);
console.log(`Are they all different questions? ${uniqueTexts.size === q1s.length ? 'YES' : 'NO'}`);
