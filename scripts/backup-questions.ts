/**
 * Question Library Backup Script
 *
 * Backs up all questions and their options to a timestamped JSON file
 * Can be run manually or scheduled for automated backups
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface BackupData {
  timestamp: string;
  version: string;
  questionCount: number;
  questions: any[];
}

async function backupQuestions() {
  console.log('🔄 Starting question backup...\n');

  try {
    // Fetch all questions with their options
    const questions = await prisma.question.findMany({
      where: {
        deletedAt: null, // Only active questions
      },
      include: {
        options: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 Found ${questions.length} questions to backup`);

    // Create backup data
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData: BackupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      questionCount: questions.length,
      questions: questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        examName: q.examName,
        examYear: q.examYear,
        topic: q.topic,
        difficulty: q.difficulty,
        hasImage: q.hasImage,
        imageUrl: q.imageUrl,
        videoUrl: q.videoUrl,
        createdAt: q.createdAt.toISOString(),
        updatedAt: q.updatedAt.toISOString(),
        options: q.options.map((o) => ({
          id: o.id,
          optionLetter: o.optionLetter,
          optionText: o.optionText,
          isCorrect: o.isCorrect,
        })),
      })),
    };

    // Create backups directory if it doesn't exist
    const backupsDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
      console.log('📁 Created backups directory');
    }

    // Save to file
    const filename = `questions-backup-${timestamp}.json`;
    const filepath = path.join(backupsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2), 'utf-8');

    console.log(`\n✅ Backup completed successfully!`);
    console.log(`📄 File: ${filename}`);
    console.log(`📍 Location: ${filepath}`);
    console.log(`📊 Questions backed up: ${questions.length}`);

    // Show summary by exam
    const byExam: { [key: string]: number } = {};
    questions.forEach((q) => {
      const examKey = q.examName || 'No Exam';
      byExam[examKey] = (byExam[examKey] || 0) + 1;
    });

    console.log('\n📈 Backup Summary:');
    Object.entries(byExam).forEach(([exam, count]) => {
      console.log(`  - ${exam}: ${count} questions`);
    });

    return filepath;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function listBackups() {
  const backupsDir = path.join(process.cwd(), 'backups');

  if (!fs.existsSync(backupsDir)) {
    console.log('📁 No backups directory found');
    return;
  }

  const files = fs
    .readdirSync(backupsDir)
    .filter((f) => f.startsWith('questions-backup-') && f.endsWith('.json'))
    .sort()
    .reverse(); // Most recent first

  if (files.length === 0) {
    console.log('📁 No backups found');
    return;
  }

  console.log(`\n📚 Available Backups (${files.length}):\n`);

  files.forEach((file, index) => {
    const filepath = path.join(backupsDir, file);
    const stats = fs.statSync(filepath);
    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    console.log(`${index + 1}. ${file}`);
    console.log(`   📅 Date: ${new Date(data.timestamp).toLocaleString()}`);
    console.log(`   📊 Questions: ${data.questionCount}`);
    console.log(`   💾 Size: ${(stats.size / 1024).toFixed(2)} KB\n`);
  });
}

async function restoreFromBackup(backupFile: string) {
  console.log(`🔄 Restoring from backup: ${backupFile}\n`);

  try {
    const backupsDir = path.join(process.cwd(), 'backups');
    const filepath = path.join(backupsDir, backupFile);

    if (!fs.existsSync(filepath)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    const backupData: BackupData = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    console.log(`📊 Backup contains ${backupData.questionCount} questions`);
    console.log(`📅 Created: ${new Date(backupData.timestamp).toLocaleString()}`);
    console.log(`\n⚠️  WARNING: This will replace existing questions with same IDs!`);
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Restore questions
    let restored = 0;
    let skipped = 0;

    for (const questionData of backupData.questions) {
      try {
        // Check if question exists
        const existing = await prisma.question.findUnique({
          where: { id: questionData.id },
        });

        if (existing) {
          // Update existing
          await prisma.question.update({
            where: { id: questionData.id },
            data: {
              questionText: questionData.questionText,
              examName: questionData.examName,
              examYear: questionData.examYear,
              topic: questionData.topic,
              difficulty: questionData.difficulty,
              hasImage: questionData.hasImage,
              imageUrl: questionData.imageUrl,
              videoUrl: questionData.videoUrl,
            },
          });

          // Update options
          await prisma.option.deleteMany({
            where: { questionId: questionData.id },
          });

          for (const optionData of questionData.options) {
            await prisma.option.create({
              data: {
                id: optionData.id,
                questionId: questionData.id,
                optionLetter: optionData.optionLetter,
                optionText: optionData.optionText,
                isCorrect: optionData.isCorrect,
              },
            });
          }

          restored++;
        } else {
          // Create new
          await prisma.question.create({
            data: {
              id: questionData.id,
              questionText: questionData.questionText,
              examName: questionData.examName,
              examYear: questionData.examYear,
              topic: questionData.topic,
              difficulty: questionData.difficulty,
              hasImage: questionData.hasImage,
              imageUrl: questionData.imageUrl,
              videoUrl: questionData.videoUrl,
              options: {
                create: questionData.options.map((o: any) => ({
                  id: o.id,
                  optionLetter: o.optionLetter,
                  optionText: o.optionText,
                  isCorrect: o.isCorrect,
                })),
              },
            },
          });

          restored++;
        }

        process.stdout.write(`\r✅ Restored ${restored} questions...`);
      } catch (error) {
        console.error(`\n⚠️  Skipped question ${questionData.id}:`, error);
        skipped++;
      }
    }

    console.log(`\n\n✅ Restore completed!`);
    console.log(`📊 Restored: ${restored} questions`);
    if (skipped > 0) {
      console.log(`⚠️  Skipped: ${skipped} questions (errors)`);
    }
  } catch (error) {
    console.error('❌ Restore failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// CLI
const command = process.argv[2];
const arg = process.argv[3];

async function main() {
  switch (command) {
    case 'backup':
      await backupQuestions();
      break;

    case 'list':
      await listBackups();
      break;

    case 'restore':
      if (!arg) {
        console.error('❌ Please specify backup file to restore');
        console.log('\nUsage: npm run backup:restore <filename>');
        console.log('\nRun "npm run backup:list" to see available backups');
        process.exit(1);
      }
      await restoreFromBackup(arg);
      break;

    default:
      console.log(`
📦 Question Backup System
========================

Usage:
  npm run backup           # Create new backup
  npm run backup:list      # List all backups
  npm run backup:restore <filename>  # Restore from backup

Examples:
  npm run backup
  npm run backup:list
  npm run backup:restore questions-backup-2025-10-08T12-30-00-000Z.json

Backup Location: ./backups/
      `);
  }
}

main().catch(console.error);
