import { PrismaClient, AchievementType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Create default user (Ayansh)
  console.log('👤 Creating default user...');
  const user = await prisma.user.upsert({
    where: { id: 'user-ayansh' },
    update: {},
    create: {
      id: 'user-ayansh',
      name: 'Ayansh',
      email: 'manish.agrawal446@gmail.com',
      grade: 5,
      preferences: {
        theme: 'light',
        notifications: true,
      },
    },
  });
  console.log(`✅ User created: ${user.name} (${user.email})\n`);

  // Create achievements
  console.log('🏆 Creating achievements...');

  const existingAchievements = await prisma.achievement.count();

  if (existingAchievements > 0) {
    console.log(`ℹ️  Skipping achievements (${existingAchievements} already exist)\n`);
  } else {
    const achievements = [
      // Streak Achievements
      {
        id: 'streak-3-days',
        name: 'Getting Started',
        description: 'Practice 3 days in a row',
        type: AchievementType.STREAK,
        icon: '🔥',
        criteria: { streakDays: 3 },
        points: 10,
        tier: 'BRONZE',
      },
      {
        id: 'streak-7-days',
        name: 'Week Warrior',
        description: 'Practice 7 days in a row',
        type: AchievementType.STREAK,
        icon: '⚡',
        criteria: { streakDays: 7 },
        points: 25,
        tier: 'SILVER',
      },
      {
        id: 'streak-30-days',
        name: 'Month Master',
        description: 'Practice 30 days in a row',
        type: AchievementType.STREAK,
        icon: '👑',
        criteria: { streakDays: 30 },
        points: 100,
        tier: 'GOLD',
      },
      {
        id: 'streak-100-days',
        name: 'Century Achiever',
        description: 'Practice 100 days in a row',
        type: AchievementType.STREAK,
        icon: '💎',
        criteria: { streakDays: 100 },
        points: 500,
        tier: 'DIAMOND',
      },

      // Accuracy Achievements
      {
        id: 'accuracy-50-perfect',
        name: 'Precision Starter',
        description: 'Get 50 questions correct in a row',
        type: AchievementType.ACCURACY,
        icon: '🎯',
        criteria: { consecutiveCorrect: 50 },
        points: 50,
        tier: 'BRONZE',
      },
      {
        id: 'accuracy-100-perfect',
        name: 'Accuracy Expert',
        description: 'Get 100 questions correct in a row',
        type: AchievementType.ACCURACY,
        icon: '🏹',
        criteria: { consecutiveCorrect: 100 },
        points: 150,
        tier: 'SILVER',
      },
      {
        id: 'accuracy-90-percent',
        name: 'High Scorer',
        description: 'Maintain 90% accuracy over 100 questions',
        type: AchievementType.ACCURACY,
        icon: '⭐',
        criteria: { accuracy: 90, minQuestions: 100 },
        points: 75,
        tier: 'GOLD',
      },

      // Questions Achievements
      {
        id: 'questions-100',
        name: 'Century Club',
        description: 'Solve 100 questions',
        type: AchievementType.QUESTIONS,
        icon: '💯',
        criteria: { totalQuestions: 100 },
        points: 20,
        tier: 'BRONZE',
      },
      {
        id: 'questions-500',
        name: 'Problem Solver',
        description: 'Solve 500 questions',
        type: AchievementType.QUESTIONS,
        icon: '🎓',
        criteria: { totalQuestions: 500 },
        points: 75,
        tier: 'SILVER',
      },
      {
        id: 'questions-1000',
        name: 'Math Enthusiast',
        description: 'Solve 1000 questions',
        type: AchievementType.QUESTIONS,
        icon: '🚀',
        criteria: { totalQuestions: 1000 },
        points: 200,
        tier: 'GOLD',
      },
      {
        id: 'questions-5000',
        name: 'Math Legend',
        description: 'Solve 5000 questions',
        type: AchievementType.QUESTIONS,
        icon: '🏅',
        criteria: { totalQuestions: 5000 },
        points: 1000,
        tier: 'DIAMOND',
      },

      // Topic Mastery Achievements
      {
        id: 'topic-algebra-master',
        name: 'Algebra Master',
        description: 'Score 90% or higher on 50 Algebra questions',
        type: AchievementType.TOPIC_MASTERY,
        icon: '📐',
        criteria: { topic: 'Algebra', accuracy: 90, minQuestions: 50 },
        points: 100,
        tier: 'GOLD',
      },
      {
        id: 'topic-geometry-master',
        name: 'Geometry Master',
        description: 'Score 90% or higher on 50 Geometry questions',
        type: AchievementType.TOPIC_MASTERY,
        icon: '📏',
        criteria: { topic: 'Geometry', accuracy: 90, minQuestions: 50 },
        points: 100,
        tier: 'GOLD',
      },
      {
        id: 'topic-counting-master',
        name: 'Counting Master',
        description: 'Score 90% or higher on 50 Counting questions',
        type: AchievementType.TOPIC_MASTERY,
        icon: '🔢',
        criteria: { topic: 'Counting', accuracy: 90, minQuestions: 50 },
        points: 100,
        tier: 'GOLD',
      },
      {
        id: 'topic-number-theory-master',
        name: 'Number Theory Master',
        description: 'Score 90% or higher on 50 Number Theory questions',
        type: AchievementType.TOPIC_MASTERY,
        icon: '🧮',
        criteria: { topic: 'Number Theory', accuracy: 90, minQuestions: 50 },
        points: 100,
        tier: 'GOLD',
      },

      // Speed Achievements
      {
        id: 'speed-fast-solver',
        name: 'Quick Thinker',
        description: 'Solve 20 questions correctly in under 30 seconds each',
        type: AchievementType.SPEED,
        icon: '⚡',
        criteria: { questionsUnderTime: 20, timeLimit: 30 },
        points: 50,
        tier: 'SILVER',
      },
      {
        id: 'speed-lightning',
        name: 'Lightning Fast',
        description: 'Solve 50 questions correctly in under 20 seconds each',
        type: AchievementType.SPEED,
        icon: '⚡⚡',
        criteria: { questionsUnderTime: 50, timeLimit: 20 },
        points: 150,
        tier: 'GOLD',
      },
    ];

    for (const achievement of achievements) {
      await prisma.achievement.upsert({
        where: { id: achievement.id },
        update: {
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          criteria: achievement.criteria,
          points: achievement.points,
          tier: achievement.tier,
        },
        create: achievement,
      });
    }

    console.log(`✅ Created ${achievements.length} achievements\n`);
  }

  console.log('✅ Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - User: ${user.name}`);
  console.log(`   - Achievements: ${await prisma.achievement.count()}`);
  console.log(`   - Questions: ${await prisma.question.count()}`);
  console.log(`   - Options: ${await prisma.option.count()}`);
  console.log(`   - Solutions: ${await prisma.solution.count()}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
