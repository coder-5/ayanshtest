import { PrismaClient, AchievementType } from '@prisma/client';

const prisma = new PrismaClient();

const achievements = [
  // Question-based achievements
  {
    id: 'ach-first-question',
    name: 'First Steps',
    description: 'Answer your first question',
    type: 'QUESTIONS' as AchievementType,
    icon: '🎯',
    tier: 'BRONZE',
    points: 10,
    criteria: { type: 'total_questions', target: 1 },
  },
  {
    id: 'ach-10-questions',
    name: 'Getting Started',
    description: 'Answer 10 questions',
    type: 'QUESTIONS' as AchievementType,
    icon: '📝',
    tier: 'BRONZE',
    points: 25,
    criteria: { type: 'total_questions', target: 10 },
  },
  {
    id: 'ach-50-questions',
    name: 'Practice Makes Progress',
    description: 'Answer 50 questions',
    type: 'QUESTIONS' as AchievementType,
    icon: '📚',
    tier: 'SILVER',
    points: 50,
    criteria: { type: 'total_questions', target: 50 },
  },
  {
    id: 'ach-100-questions',
    name: 'Century',
    description: 'Answer 100 questions',
    type: 'QUESTIONS' as AchievementType,
    icon: '💯',
    tier: 'GOLD',
    points: 100,
    criteria: { type: 'total_questions', target: 100 },
  },
  {
    id: 'ach-500-questions',
    name: 'Question Master',
    description: 'Answer 500 questions',
    type: 'QUESTIONS' as AchievementType,
    icon: '🏆',
    tier: 'PLATINUM',
    points: 250,
    criteria: { type: 'total_questions', target: 500 },
  },

  // Accuracy-based achievements
  {
    id: 'ach-10-correct',
    name: 'On Target',
    description: 'Get 10 questions correct',
    type: 'ACCURACY' as AchievementType,
    icon: '🎯',
    tier: 'BRONZE',
    points: 20,
    criteria: { type: 'correct_answers', target: 10 },
  },
  {
    id: 'ach-25-correct',
    name: 'Sharp Shooter',
    description: 'Get 25 questions correct',
    type: 'ACCURACY' as AchievementType,
    icon: '🎪',
    tier: 'SILVER',
    points: 50,
    criteria: { type: 'correct_answers', target: 25 },
  },
  {
    id: 'ach-50-correct',
    name: 'Accuracy Expert',
    description: 'Get 50 questions correct',
    type: 'ACCURACY' as AchievementType,
    icon: '🎖️',
    tier: 'GOLD',
    points: 100,
    criteria: { type: 'correct_answers', target: 50 },
  },
  {
    id: 'ach-100-correct',
    name: 'Perfect Precision',
    description: 'Get 100 questions correct',
    type: 'ACCURACY' as AchievementType,
    icon: '⭐',
    tier: 'PLATINUM',
    points: 200,
    criteria: { type: 'correct_answers', target: 100 },
  },

  // Streak-based achievements
  {
    id: 'ach-3-day-streak',
    name: 'Three Day Warrior',
    description: 'Practice for 3 days in a row',
    type: 'STREAK' as AchievementType,
    icon: '🔥',
    tier: 'BRONZE',
    points: 30,
    criteria: { type: 'streak_days', target: 3 },
  },
  {
    id: 'ach-7-day-streak',
    name: 'Week Warrior',
    description: 'Practice for 7 days in a row',
    type: 'STREAK' as AchievementType,
    icon: '🔥',
    tier: 'SILVER',
    points: 70,
    criteria: { type: 'streak_days', target: 7 },
  },
  {
    id: 'ach-14-day-streak',
    name: 'Two Week Champion',
    description: 'Practice for 14 days in a row',
    type: 'STREAK' as AchievementType,
    icon: '🔥',
    tier: 'GOLD',
    points: 150,
    criteria: { type: 'streak_days', target: 14 },
  },
  {
    id: 'ach-30-day-streak',
    name: 'Month Master',
    description: 'Practice for 30 days in a row',
    type: 'STREAK' as AchievementType,
    icon: '🔥',
    tier: 'PLATINUM',
    points: 300,
    criteria: { type: 'streak_days', target: 30 },
  },
];

async function main() {
  console.log('Starting achievement seeding...');

  // Clear existing achievements
  await prisma.achievement.deleteMany({});
  console.log('Cleared existing achievements');

  // Insert all achievements
  for (const achievement of achievements) {
    await prisma.achievement.create({
      data: achievement,
    });
    console.log(`✓ Created: ${achievement.name}`);
  }

  console.log(`\nSuccessfully seeded ${achievements.length} achievements!`);
}

main()
  .catch((e) => {
    console.error('Error seeding achievements:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
