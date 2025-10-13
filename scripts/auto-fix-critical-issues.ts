import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function autoFixCriticalIssues() {
  console.log('🔧 Starting automated fixes for critical data quality issues...\n');
  console.log('This script will:');
  console.log('1. Delete empty options automatically');
  console.log('2. Fix questions with multiple correct options (keep first)');
  console.log('3. Generate report for manual review items\n');
  console.log('='.repeat(80));

  let totalFixed = 0;

  // FIX 1: Delete all empty options
  console.log('\n🔧 FIX 1: Deleting empty options...');

  const deleteResult = await prisma.option.deleteMany({
    where: {
      optionText: '',
    },
  });

  console.log(`✅ Deleted ${deleteResult.count} empty options`);
  totalFixed += deleteResult.count;

  // FIX 2: Fix multiple correct options - keep only first correct option
  console.log('\n🔧 FIX 2: Fixing questions with multiple correct options...');

  const questionsWithOptions = await prisma.question.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      options: {
        orderBy: {
          optionLetter: 'asc',
        },
      },
    },
  });

  let multipleCorrectFixed = 0;

  for (const question of questionsWithOptions) {
    const correctOptions = question.options.filter((opt) => opt.isCorrect);

    if (correctOptions.length > 1) {
      // Keep the first correct option, mark others as incorrect
      for (let i = 1; i < correctOptions.length; i++) {
        await prisma.option.update({
          where: { id: correctOptions[i].id },
          data: { isCorrect: false },
        });
        multipleCorrectFixed++;
      }
    }
  }

  console.log(
    `✅ Fixed ${multipleCorrectFixed} options in questions with multiple correct answers`
  );
  totalFixed += multipleCorrectFixed;

  // REPORT: Generate list of issues that need manual review
  console.log('\n📋 Generating report for manual review...');

  const manualReviewIssues = [];

  // Issue 1: Questions with no correct option
  const questionsNoCorrect = questionsWithOptions.filter((q) => {
    if (q.options.length > 0) {
      return !q.options.some((opt) => opt.isCorrect);
    }
    return false;
  });

  console.log(`\n⚠️  Found ${questionsNoCorrect.length} questions with NO correct option marked`);
  if (questionsNoCorrect.length > 0) {
    manualReviewIssues.push({
      type: 'NO_CORRECT_OPTION',
      count: questionsNoCorrect.length,
      questionIds: questionsNoCorrect.map((q) => q.id),
    });
  }

  // Issue 2: Fill-in questions with no answer
  const fillInNoAnswer = await prisma.question.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      options: true,
    },
  });

  const fillInMissingAnswer = fillInNoAnswer.filter(
    (q) => q.options.length === 0 && (!q.correctAnswer || q.correctAnswer.trim() === '')
  );

  console.log(`⚠️  Found ${fillInMissingAnswer.length} fill-in questions with NO answer`);
  if (fillInMissingAnswer.length > 0) {
    manualReviewIssues.push({
      type: 'FILL_IN_NO_ANSWER',
      count: fillInMissingAnswer.length,
      questionIds: fillInMissingAnswer.map((q) => q.id),
    });
  }

  // Issue 3: Suspicious answers
  const suspiciousPatterns = [/^(lenny|john|mary|alice|bob|sarah|mike|tom|jane|david)$/i];

  const suspiciousAnswers = fillInNoAnswer.filter((q) => {
    if (!q.correctAnswer) return false;
    return suspiciousPatterns.some((pattern) => pattern.test(q.correctAnswer!));
  });

  console.log(`⚠️  Found ${suspiciousAnswers.length} questions with suspicious answers`);
  if (suspiciousAnswers.length > 0) {
    manualReviewIssues.push({
      type: 'SUSPICIOUS_ANSWER',
      count: suspiciousAnswers.length,
      details: suspiciousAnswers.map((q) => ({
        id: q.id,
        answer: q.correctAnswer,
        questionPreview: q.questionText.substring(0, 100),
      })),
    });
  }

  // Save manual review report
  const fs = require('fs');
  const reportPath = './manual-review-required.json';
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        summary: {
          questionsNoCorrectOption: questionsNoCorrect.length,
          fillInNoAnswer: fillInMissingAnswer.length,
          suspiciousAnswers: suspiciousAnswers.length,
        },
        issues: manualReviewIssues,
        questionIdsNeedingReview: [
          ...questionsNoCorrect.map((q) => q.id),
          ...fillInMissingAnswer.map((q) => q.id),
          ...suspiciousAnswers.map((q) => q.id),
        ],
      },
      null,
      2
    )
  );

  console.log(`\n✅ Manual review report saved to: ${reportPath}`);

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 AUTO-FIX SUMMARY\n');
  console.log(`✅ Automatically fixed: ${totalFixed} issues`);
  console.log(`   - Empty options deleted: ${deleteResult.count}`);
  console.log(`   - Multiple correct options fixed: ${multipleCorrectFixed}`);
  console.log(
    `\n⚠️  Manual review required: ${questionsNoCorrect.length + fillInMissingAnswer.length + suspiciousAnswers.length} questions`
  );
  console.log(`   - No correct option: ${questionsNoCorrect.length}`);
  console.log(`   - Fill-in with no answer: ${fillInMissingAnswer.length}`);
  console.log(`   - Suspicious answers: ${suspiciousAnswers.length}`);
  console.log('\n💡 Next steps:');
  console.log('   1. Review manual-review-required.json');
  console.log('   2. Fix remaining issues using the web interface or database');
  console.log('   3. Re-run audit-question-quality.ts to verify fixes\n');
  console.log('='.repeat(80));
}

autoFixCriticalIssues()
  .catch((error) => {
    console.error('❌ Error during auto-fix:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
