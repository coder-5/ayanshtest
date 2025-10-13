import { PrismaClient, AchievementType, DifficultyLevel } from '@prisma/client';

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
      email: 'ayansh@example.com',
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

  // Check if we should create sample questions
  const existingQuestions = await prisma.question.count();

  if (existingQuestions === 0) {
    console.log('📚 Creating sample questions...');

    const sampleQuestions = [
      {
        id: 'sample-q1',
        questionText: 'What is 7 + 5?',
        examName: 'Sample',
        examYear: 2024,
        questionNumber: '1',
        difficulty: DifficultyLevel.EASY,
        topic: 'Arithmetic',
        hasImage: false,
        qualityScore: 100,
        options: {
          create: [
            { id: 'sample-q1-a', optionLetter: 'A', optionText: '10', isCorrect: false },
            { id: 'sample-q1-b', optionLetter: 'B', optionText: '11', isCorrect: false },
            { id: 'sample-q1-c', optionLetter: 'C', optionText: '12', isCorrect: true },
            { id: 'sample-q1-d', optionLetter: 'D', optionText: '13', isCorrect: false },
            { id: 'sample-q1-e', optionLetter: 'E', optionText: '14', isCorrect: false },
          ],
        },
        solution: {
          create: {
            id: 'sample-sol1',
            solutionText: 'Simply add: 7 + 5 = 12',
            approach: 'Direct addition',
            keyInsights: 'Basic arithmetic',
          },
        },
      },
      {
        id: 'sample-q2',
        questionText: 'If a rectangle has length 8 and width 3, what is its perimeter?',
        examName: 'Sample',
        examYear: 2024,
        questionNumber: '2',
        difficulty: DifficultyLevel.EASY,
        topic: 'Geometry',
        hasImage: false,
        qualityScore: 100,
        options: {
          create: [
            { id: 'sample-q2-a', optionLetter: 'A', optionText: '11', isCorrect: false },
            { id: 'sample-q2-b', optionLetter: 'B', optionText: '22', isCorrect: true },
            { id: 'sample-q2-c', optionLetter: 'C', optionText: '24', isCorrect: false },
            { id: 'sample-q2-d', optionLetter: 'D', optionText: '16', isCorrect: false },
            { id: 'sample-q2-e', optionLetter: 'E', optionText: '32', isCorrect: false },
          ],
        },
        solution: {
          create: {
            id: 'sample-sol2',
            solutionText: 'Perimeter = 2(length + width) = 2(8 + 3) = 2(11) = 22',
            approach: 'Use perimeter formula',
            keyInsights: 'Remember: perimeter is the sum of all sides',
          },
        },
      },
      {
        id: 'sample-q3',
        questionText: 'What is 3 × 4 × 5?',
        examName: 'Sample',
        examYear: 2024,
        questionNumber: '3',
        difficulty: DifficultyLevel.EASY,
        topic: 'Arithmetic',
        hasImage: false,
        qualityScore: 100,
        options: {
          create: [
            { id: 'sample-q3-a', optionLetter: 'A', optionText: '12', isCorrect: false },
            { id: 'sample-q3-b', optionLetter: 'B', optionText: '15', isCorrect: false },
            { id: 'sample-q3-c', optionLetter: 'C', optionText: '20', isCorrect: false },
            { id: 'sample-q3-d', optionLetter: 'D', optionText: '60', isCorrect: true },
            { id: 'sample-q3-e', optionLetter: 'E', optionText: '35', isCorrect: false },
          ],
        },
        solution: {
          create: {
            id: 'sample-sol3',
            solutionText: '3 × 4 = 12, then 12 × 5 = 60',
            approach: 'Multiply step by step',
            keyInsights: 'Multiplication is associative',
          },
        },
      },
      {
        id: 'sample-q4',
        questionText: 'How many sides does a hexagon have?',
        examName: 'Sample',
        examYear: 2024,
        questionNumber: '4',
        difficulty: DifficultyLevel.EASY,
        topic: 'Geometry',
        hasImage: false,
        qualityScore: 100,
        options: {
          create: [
            { id: 'sample-q4-a', optionLetter: 'A', optionText: '4', isCorrect: false },
            { id: 'sample-q4-b', optionLetter: 'B', optionText: '5', isCorrect: false },
            { id: 'sample-q4-c', optionLetter: 'C', optionText: '6', isCorrect: true },
            { id: 'sample-q4-d', optionLetter: 'D', optionText: '7', isCorrect: false },
            { id: 'sample-q4-e', optionLetter: 'E', optionText: '8', isCorrect: false },
          ],
        },
        solution: {
          create: {
            id: 'sample-sol4',
            solutionText: 'A hexagon has 6 sides (hexa = 6 in Greek)',
            approach: 'Recall polygon names',
            keyInsights: 'Remember: triangle=3, quadrilateral=4, pentagon=5, hexagon=6',
          },
        },
      },
      {
        id: 'sample-q5',
        questionText: 'What is 100 - 37?',
        examName: 'Sample',
        examYear: 2024,
        questionNumber: '5',
        difficulty: DifficultyLevel.EASY,
        topic: 'Arithmetic',
        hasImage: false,
        qualityScore: 100,
        options: {
          create: [
            { id: 'sample-q5-a', optionLetter: 'A', optionText: '53', isCorrect: false },
            { id: 'sample-q5-b', optionLetter: 'B', optionText: '63', isCorrect: true },
            { id: 'sample-q5-c', optionLetter: 'C', optionText: '73', isCorrect: false },
            { id: 'sample-q5-d', optionLetter: 'D', optionText: '67', isCorrect: false },
            { id: 'sample-q5-e', optionLetter: 'E', optionText: '83', isCorrect: false },
          ],
        },
        solution: {
          create: {
            id: 'sample-sol5',
            solutionText: '100 - 37 = 100 - 30 - 7 = 70 - 7 = 63',
            approach: 'Break down subtraction',
            keyInsights: 'Can subtract in parts: subtract tens, then ones',
          },
        },
      },
    ];

    for (const question of sampleQuestions) {
      await prisma.question.create({
        data: question,
      });
    }

    console.log(`✅ Created ${sampleQuestions.length} sample questions\n`);
  } else {
    console.log(`ℹ️  Skipping sample questions (${existingQuestions} already exist)\n`);
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
