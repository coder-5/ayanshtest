import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log('💾 Starting backup...\n');

  try {
    // Backup questions with options and solutions
    console.log('📚 Backing up questions...');
    const questions = await prisma.question.findMany({
      where: { deletedAt: null },
      include: {
        options: true,
        solution: true,
      },
    });

    const questionsFile = path.join(backupDir, `questions-${timestamp}.json`);
    fs.writeFileSync(questionsFile, JSON.stringify(questions, null, 2));
    console.log(`✅ Backed up ${questions.length} questions to ${path.basename(questionsFile)}`);

    // Backup user attempts
    console.log('\n📊 Backing up user attempts...');
    const attempts = await prisma.userAttempt.findMany({
      where: { deletedAt: null },
    });

    const attemptsFile = path.join(backupDir, `attempts-${timestamp}.json`);
    fs.writeFileSync(attemptsFile, JSON.stringify(attempts, null, 2));
    console.log(`✅ Backed up ${attempts.length} attempts to ${path.basename(attemptsFile)}`);

    // Backup user progress
    console.log('\n📈 Backing up progress data...');
    const dailyProgress = await prisma.dailyProgress.findMany();
    const weeklyAnalysis = await prisma.weeklyAnalysis.findMany();
    const topicPerformance = await prisma.topicPerformance.findMany();

    const progressData = {
      dailyProgress,
      weeklyAnalysis,
      topicPerformance,
    };

    const progressFile = path.join(backupDir, `progress-${timestamp}.json`);
    fs.writeFileSync(progressFile, JSON.stringify(progressData, null, 2));
    console.log(`✅ Backed up progress data to ${path.basename(progressFile)}`);

    // Backup achievements
    console.log('\n🏆 Backing up achievements...');
    const achievements = await prisma.achievement.findMany();
    const userAchievements = await prisma.userAchievement.findMany();

    const achievementsData = {
      achievements,
      userAchievements,
    };

    const achievementsFile = path.join(backupDir, `achievements-${timestamp}.json`);
    fs.writeFileSync(achievementsFile, JSON.stringify(achievementsData, null, 2));
    console.log(
      `✅ Backed up ${achievements.length} achievements to ${path.basename(achievementsFile)}`
    );

    // Create summary
    const summary = {
      timestamp: new Date().toISOString(),
      questions: questions.length,
      attempts: attempts.length,
      dailyProgress: dailyProgress.length,
      weeklyAnalysis: weeklyAnalysis.length,
      topicPerformance: topicPerformance.length,
      achievements: achievements.length,
      userAchievements: userAchievements.length,
      files: [
        path.basename(questionsFile),
        path.basename(attemptsFile),
        path.basename(progressFile),
        path.basename(achievementsFile),
      ],
    };

    const summaryFile = path.join(backupDir, `backup-summary-${timestamp}.json`);
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

    console.log('\n✅ Backup completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Questions: ${questions.length}`);
    console.log(`   - Attempts: ${attempts.length}`);
    console.log(`   - Progress records: ${dailyProgress.length}`);
    console.log(`   - Achievements: ${achievements.length}`);
    console.log(`\n📁 Backup location: ${backupDir}`);
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

async function restore(backupFile: string) {
  console.log(`📥 Restoring from ${backupFile}...\n`);

  try {
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    const data = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

    if (Array.isArray(data)) {
      // Restore questions
      console.log(`📚 Restoring ${data.length} questions...`);

      for (const question of data) {
        const { options, solution, ...questionData } = question;

        await prisma.question.upsert({
          where: { id: questionData.id },
          update: questionData,
          create: {
            ...questionData,
            options: {
              create: options || [],
            },
            solution: solution
              ? {
                  create: solution,
                }
              : undefined,
          },
        });
      }

      console.log(`✅ Restored ${data.length} questions`);
    }

    console.log('\n✅ Restore completed successfully!');
  } catch (error) {
    console.error('❌ Restore failed:', error);
    throw error;
  }
}

// CLI
const command = process.argv[2];
const arg = process.argv[3];

async function main() {
  if (command === 'backup') {
    await backup();
  } else if (command === 'restore' && arg) {
    await restore(arg);
  } else {
    console.log('Usage:');
    console.log('  npm run backup         - Create a backup');
    console.log('  npm run restore <file> - Restore from backup');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
