import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Generate a unique ID
function generateId() {
  return randomBytes(16).toString('base64url');
}

interface QuestionData {
  examName: string;
  examYear: number;
  questionNumber: number | string;
  questionText: string;
  correctAnswer?: string; // For fill-in-the-blank (MOEMS)
  options?: Array<{
    letter: string;
    text: string;
    isCorrect: boolean;
  }>;
  solution?: string;
  videoLinks?: string[];
  imageUrl?: string;
  hasImage?: boolean;
  topic?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
}

async function importQuestions(jsonFilePath: string) {
  console.log('📤 UNIVERSAL QUESTION IMPORTER');
  console.log('='.repeat(70));
  console.log(`📁 File: ${jsonFilePath}\n`);

  if (!fs.existsSync(jsonFilePath)) {
    console.error(`❌ File not found: ${jsonFilePath}`);
    process.exit(1);
  }

  const questions: QuestionData[] = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
  console.log(`📊 Found ${questions.length} questions to import\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const progress = `[${i + 1}/${questions.length}]`;
    const qNumber =
      typeof q.questionNumber === 'number' ? q.questionNumber.toString() : q.questionNumber;

    try {
      // Determine question type
      const isFillIn = !q.options || q.options.length === 0;
      const hasCorrectAnswer =
        q.correctAnswer || (q.options && q.options.some((opt) => opt.isCorrect));

      // Skip questions without proper structure (but allow questions without correct answers)
      if (!isFillIn && (!q.options || q.options.length < 2)) {
        console.log(
          `${progress} ⏭️  Skipping ${q.examName} ${q.examYear} #${qNumber} (invalid structure)`
        );
        skipped++;
        continue;
      }

      // Check if question already exists
      const existing = await prisma.question.findFirst({
        where: {
          examName: q.examName,
          examYear: q.examYear,
          questionNumber: qNumber,
          deletedAt: null,
        },
        include: {
          options: true,
          solution: true,
        },
      });

      const questionData = {
        questionText: q.questionText,
        imageUrl: q.imageUrl || null,
        hasImage: q.hasImage || false,
        topic: q.topic || 'General',
        difficulty: q.difficulty || 'MEDIUM',
        correctAnswer: isFillIn ? q.correctAnswer : null,
      };

      if (existing) {
        // Update existing question
        await prisma.question.update({
          where: { id: existing.id },
          data: questionData,
        });

        // Handle options (only for multiple choice)
        if (!isFillIn && q.options) {
          // Delete old options and create new ones
          await prisma.option.deleteMany({
            where: { questionId: existing.id },
          });

          await prisma.option.createMany({
            data: q.options.map((opt) => ({
              id: generateId(),
              questionId: existing.id,
              optionLetter: opt.letter,
              optionText: opt.text,
              isCorrect: opt.isCorrect,
            })),
          });
        }

        // Update or create solution
        if (q.solution) {
          if (existing.solution) {
            await prisma.solution.update({
              where: { id: existing.solution.id },
              data: {
                solutionText: q.solution,
                videoLinks: q.videoLinks || [],
              },
            });
          } else {
            await prisma.solution.create({
              data: {
                id: generateId(),
                questionId: existing.id,
                solutionText: q.solution,
                videoLinks: q.videoLinks || [],
              },
            });
          }
        }

        console.log(`${progress} ✏️  Updated ${q.examName} ${q.examYear} #${qNumber}`);
        updated++;
      } else {
        // Create new question
        const newQuestion = await prisma.question.create({
          data: {
            id: generateId(),
            examName: q.examName,
            examYear: q.examYear,
            questionNumber: qNumber,
            ...questionData,
            options:
              !isFillIn && q.options
                ? {
                    create: q.options.map((opt) => ({
                      id: generateId(),
                      optionLetter: opt.letter,
                      optionText: opt.text,
                      isCorrect: opt.isCorrect,
                    })),
                  }
                : undefined,
          },
        });

        // Create solution if exists
        if (q.solution) {
          await prisma.solution.create({
            data: {
              id: generateId(),
              questionId: newQuestion.id,
              solutionText: q.solution,
              videoLinks: q.videoLinks || [],
            },
          });
        }

        const typeLabel = isFillIn ? 'fill-in' : `${q.options?.length} options`;
        console.log(
          `${progress} ✅ Created ${q.examName} ${q.examYear} #${qNumber} (${typeLabel})`
        );
        created++;
      }
    } catch (error) {
      console.error(
        `${progress} ❌ Error processing ${q.examName} ${q.examYear} #${qNumber}:`,
        error
      );
      errors++;
    }

    // Add a small delay to avoid overwhelming the database
    if (i % 50 === 0 && i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 IMPORT SUMMARY');
  console.log('─'.repeat(70));
  console.log(`✅ Created: ${created}`);
  console.log(`✏️  Updated: ${updated}`);
  console.log(`⏭️  Skipped: ${skipped} (no correct answer)`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📈 Total processed: ${created + updated + skipped} / ${questions.length}`);
  console.log('='.repeat(70));

  // Get unique exam types from imported data
  const examTypes = [...new Set(questions.map((q) => q.examName))];
  console.log('\n📊 DATABASE STATS BY EXAM TYPE');
  console.log('─'.repeat(70));

  for (const examType of examTypes) {
    const count = await prisma.question.count({
      where: { examName: examType, deletedAt: null },
    });
    console.log(`${examType}: ${count} questions`);
  }

  const totalQuestions = await prisma.question.count({ where: { deletedAt: null } });
  console.log('─'.repeat(70));
  console.log(`Total questions in database: ${totalQuestions}`);
  console.log('='.repeat(70));

  if (errors === 0 && skipped < questions.length * 0.5) {
    console.log('\n✅ IMPORT COMPLETE! Questions are ready for practice.');
  } else if (errors > 0) {
    console.log(`\n⚠️  Import completed with ${errors} errors. Check logs above.`);
  } else {
    console.log(`\n⚠️  Import completed, but ${skipped} questions were skipped.`);
  }
}

// Get filename from command line argument
const filename = process.argv[2];

if (!filename) {
  console.error('❌ Usage: npx tsx scripts/import-questions-universal.ts <json-file>');
  console.error('   Example: npx tsx scripts/import-questions-universal.ts amc8-questions.json');
  console.error('   Example: npx tsx scripts/import-questions-universal.ts moems-questions.json');
  console.error('   Example: npx tsx scripts/import-questions-universal.ts mathcon-grade5.json');
  process.exit(1);
}

const jsonFilePath = path.isAbsolute(filename) ? filename : path.join(__dirname, '..', filename);

importQuestions(jsonFilePath)
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
