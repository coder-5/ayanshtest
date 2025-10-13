import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface QualityIssue {
  questionId: string;
  issueType: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  questionText: string;
  currentAnswer?: string;
}

async function auditQuestionQuality() {
  console.log('🔍 Starting comprehensive question quality audit...\n');

  const issues: QualityIssue[] = [];

  // Fetch all active questions with their options
  const questions = await prisma.question.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      options: true,
      solution: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`📊 Total questions to audit: ${questions.length}\n`);
  console.log('='.repeat(80));

  // Test 1: Check for questions with suspicious answers
  console.log('\n🔍 TEST 1: Checking for suspicious/invalid answers...');
  let test1Issues = 0;

  for (const q of questions) {
    const suspiciousPatterns = [
      // Names that shouldn't be answers to math questions
      /^(lenny|john|mary|alice|bob|sarah|mike|tom|jane|david)$/i,
      // Common extraction errors
      /^(the|a|an|is|are|was|were)$/i,
      // Question fragments
      /\?$/,
      // Very long answers (likely extracted wrong)
      /^.{100,}$/,
    ];

    if (q.correctAnswer) {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(q.correctAnswer)) {
          issues.push({
            questionId: q.id,
            issueType: 'SUSPICIOUS_ANSWER',
            severity: 'HIGH',
            description: `Answer "${q.correctAnswer}" looks suspicious (matches pattern: ${pattern})`,
            questionText: q.questionText.substring(0, 100) + '...',
            currentAnswer: q.correctAnswer,
          });
          test1Issues++;
          break;
        }
      }
    }
  }
  console.log(`   Found ${test1Issues} suspicious answers`);

  // Test 2: Multiple choice questions - verify exactly one correct option
  console.log('\n🔍 TEST 2: Validating multiple choice options...');
  let test2Issues = 0;

  for (const q of questions) {
    if (q.options.length > 0) {
      const correctOptions = q.options.filter((opt) => opt.isCorrect);

      if (correctOptions.length === 0) {
        issues.push({
          questionId: q.id,
          issueType: 'NO_CORRECT_OPTION',
          severity: 'HIGH',
          description: 'Multiple choice question has no correct option marked',
          questionText: q.questionText.substring(0, 100) + '...',
        });
        test2Issues++;
      } else if (correctOptions.length > 1) {
        issues.push({
          questionId: q.id,
          issueType: 'MULTIPLE_CORRECT_OPTIONS',
          severity: 'MEDIUM',
          description: `Question has ${correctOptions.length} options marked as correct`,
          questionText: q.questionText.substring(0, 100) + '...',
        });
        test2Issues++;
      }

      // Check if options are empty
      const emptyOptions = q.options.filter(
        (opt) => !opt.optionText || opt.optionText.trim() === ''
      );
      if (emptyOptions.length > 0) {
        issues.push({
          questionId: q.id,
          issueType: 'EMPTY_OPTIONS',
          severity: 'HIGH',
          description: `Question has ${emptyOptions.length} empty option(s)`,
          questionText: q.questionText.substring(0, 100) + '...',
        });
        test2Issues++;
      }
    }
  }
  console.log(`   Found ${test2Issues} option validation issues`);

  // Test 3: Fill-in-the-blank questions - must have correctAnswer
  console.log('\n🔍 TEST 3: Validating fill-in-the-blank questions...');
  let test3Issues = 0;

  for (const q of questions) {
    if (q.options.length === 0) {
      if (!q.correctAnswer || q.correctAnswer.trim() === '') {
        issues.push({
          questionId: q.id,
          issueType: 'MISSING_CORRECT_ANSWER',
          severity: 'HIGH',
          description: 'Fill-in-the-blank question has no correct answer',
          questionText: q.questionText.substring(0, 100) + '...',
        });
        test3Issues++;
      }
    }
  }
  console.log(`   Found ${test3Issues} fill-in questions missing answers`);

  // Test 4: Check for empty or very short question text
  console.log('\n🔍 TEST 4: Checking question text quality...');
  let test4Issues = 0;

  for (const q of questions) {
    if (!q.questionText || q.questionText.trim().length < 10) {
      issues.push({
        questionId: q.id,
        issueType: 'INVALID_QUESTION_TEXT',
        severity: 'HIGH',
        description: 'Question text is empty or too short',
        questionText: q.questionText || '[EMPTY]',
      });
      test4Issues++;
    }

    // Check for common OCR/extraction errors
    if (q.questionText.includes('|||') || q.questionText.includes('```')) {
      issues.push({
        questionId: q.id,
        issueType: 'MALFORMED_TEXT',
        severity: 'MEDIUM',
        description: 'Question text contains formatting artifacts',
        questionText: q.questionText.substring(0, 100) + '...',
      });
      test4Issues++;
    }
  }
  console.log(`   Found ${test4Issues} question text issues`);

  // Test 5: Check for duplicate questions
  console.log('\n🔍 TEST 5: Checking for duplicate questions...');
  let test5Issues = 0;

  const questionTexts = new Map<string, string[]>();
  for (const q of questions) {
    const normalized = q.questionText.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!questionTexts.has(normalized)) {
      questionTexts.set(normalized, []);
    }
    questionTexts.get(normalized)!.push(q.id);
  }

  for (const [text, ids] of questionTexts.entries()) {
    if (ids.length > 1) {
      issues.push({
        questionId: ids.join(', '),
        issueType: 'DUPLICATE_QUESTION',
        severity: 'LOW',
        description: `Question appears ${ids.length} times in database`,
        questionText: text.substring(0, 100) + '...',
      });
      test5Issues++;
    }
  }
  console.log(`   Found ${test5Issues} duplicate question sets`);

  // Test 6: Missing solutions for questions
  console.log('\n🔍 TEST 6: Checking for missing solutions...');
  let test6Issues = 0;

  for (const q of questions) {
    if (!q.solution) {
      // This is informational, not necessarily an error
      test6Issues++;
    }
  }
  console.log(`   Found ${test6Issues} questions without solutions (informational)`);

  // Test 7: Check numeric answers that should be numbers
  console.log('\n🔍 TEST 7: Validating numeric answer format...');
  let test7Issues = 0;

  for (const q of questions) {
    if (q.correctAnswer && q.options.length === 0) {
      // Check if question text suggests a numeric answer
      const numericKeywords = ['how many', 'what is', 'calculate', 'find the', 'compute'];
      const hasNumericQuestion = numericKeywords.some((kw) =>
        q.questionText.toLowerCase().includes(kw)
      );

      if (hasNumericQuestion) {
        // Check if answer looks like it should be numeric but isn't
        const answer = q.correctAnswer.trim();
        const isNumeric = /^-?\d+\.?\d*$/.test(answer);
        const hasNumber = /\d/.test(answer);

        if (!isNumeric && !hasNumber) {
          issues.push({
            questionId: q.id,
            issueType: 'NON_NUMERIC_ANSWER',
            severity: 'MEDIUM',
            description: `Question seems to ask for a number but answer is "${answer}"`,
            questionText: q.questionText.substring(0, 100) + '...',
            currentAnswer: answer,
          });
          test7Issues++;
        }
      }
    }
  }
  console.log(`   Found ${test7Issues} potentially incorrect numeric answers`);

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📋 AUDIT SUMMARY\n');
  console.log(`Total Questions Audited: ${questions.length}`);
  console.log(`Total Issues Found: ${issues.length}\n`);

  const highSeverity = issues.filter((i) => i.severity === 'HIGH');
  const mediumSeverity = issues.filter((i) => i.severity === 'MEDIUM');
  const lowSeverity = issues.filter((i) => i.severity === 'LOW');

  console.log(`🔴 HIGH Severity: ${highSeverity.length}`);
  console.log(`🟡 MEDIUM Severity: ${mediumSeverity.length}`);
  console.log(`🟢 LOW Severity: ${lowSeverity.length}`);

  // Print detailed issues by severity
  if (highSeverity.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('🔴 HIGH SEVERITY ISSUES (Require immediate attention)\n');
    highSeverity.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.issueType}`);
      console.log(`   Question ID: ${issue.questionId}`);
      console.log(`   Description: ${issue.description}`);
      if (issue.currentAnswer) {
        console.log(`   Current Answer: "${issue.currentAnswer}"`);
      }
      console.log(`   Question: ${issue.questionText}`);
      console.log();
    });
  }

  if (mediumSeverity.length > 0 && mediumSeverity.length <= 20) {
    console.log('='.repeat(80));
    console.log('🟡 MEDIUM SEVERITY ISSUES\n');
    mediumSeverity.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.issueType}`);
      console.log(`   Question ID: ${issue.questionId}`);
      console.log(`   Description: ${issue.description}`);
      if (issue.currentAnswer) {
        console.log(`   Current Answer: "${issue.currentAnswer}"`);
      }
      console.log(`   Question: ${issue.questionText}`);
      console.log();
    });
  } else if (mediumSeverity.length > 20) {
    console.log('\n🟡 Too many medium severity issues to display individually');
  }

  // Export issues to JSON
  const fs = require('fs');
  const outputPath = './audit-results.json';
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        auditDate: new Date().toISOString(),
        totalQuestions: questions.length,
        totalIssues: issues.length,
        issuesBySeverity: {
          high: highSeverity.length,
          medium: mediumSeverity.length,
          low: lowSeverity.length,
        },
        issues,
      },
      null,
      2
    )
  );

  console.log(`\n✅ Detailed audit results saved to: ${outputPath}`);
  console.log('\n' + '='.repeat(80));
}

auditQuestionQuality()
  .catch((error) => {
    console.error('❌ Error during audit:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
