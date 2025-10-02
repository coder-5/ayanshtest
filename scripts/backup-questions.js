#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function backupQuestions() {
  try {
    console.log('Starting database backup...');

    // Get all questions with their related data
    const questions = await prisma.question.findMany({
      include: {
        options: true,
        solution: true,
        userDiagrams: true
      }
    });

    const backup = {
      timestamp: new Date().toISOString(),
      questions: questions
    };

    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Save backup file
    const filename = `questions-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(backupDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

    console.log(`✅ Backup saved to: ${filepath}`);
    console.log(`📊 Backed up ${questions.length} questions`);

  } catch (error) {
    console.error('❌ Backup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function restoreQuestions(backupFile) {
  try {
    console.log(`Starting restore from: ${backupFile}`);

    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    console.log(`📅 Backup timestamp: ${backup.timestamp}`);
    console.log(`📊 Found ${backup.questions.length} questions to restore`);

    let restoredCount = 0;
    let updatedCount = 0;

    for (const questionData of backup.questions) {
      const { options, solution, userDiagrams, ...questionFields } = questionData;

      // Check if question exists
      const existing = await prisma.question.findUnique({
        where: { id: questionFields.id }
      });

      if (existing) {
        // Update existing question
        await prisma.question.update({
          where: { id: questionFields.id },
          data: {
            ...questionFields,
            options: {
              deleteMany: {},
              create: options.map(({ id, ...option }) => option)
            },
            solution: solution ? {
              upsert: {
                create: { ...solution, id: undefined },
                update: { ...solution, id: undefined }
              }
            } : undefined
          }
        });
        updatedCount++;
      } else {
        // Create new question
        await prisma.question.create({
          data: {
            ...questionFields,
            options: {
              create: options.map(({ id, ...option }) => option)
            },
            solution: solution ? {
              create: { ...solution, id: undefined }
            } : undefined
          }
        });
        restoredCount++;
      }
    }

    console.log(`✅ Restore completed!`);
    console.log(`🆕 New questions: ${restoredCount}`);
    console.log(`🔄 Updated questions: ${updatedCount}`);

  } catch (error) {
    console.error('❌ Restore failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Command line interface
const command = process.argv[2];
const argument = process.argv[3];

if (command === 'backup') {
  backupQuestions();
} else if (command === 'restore' && argument) {
  restoreQuestions(argument);
} else {
  console.log(`
📦 Question Backup/Restore Tool

Usage:
  node backup-questions.js backup                    - Create a backup
  node backup-questions.js restore <backup-file>     - Restore from backup

Examples:
  node backup-questions.js backup
  node backup-questions.js restore backups/questions-backup-2024-01-01T12-00-00-000Z.json
  `);
}