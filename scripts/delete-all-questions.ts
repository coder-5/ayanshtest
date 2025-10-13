/**
 * Delete ALL questions from database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Deleting ALL questions from database...\n');

  // Delete all questions (cascade will delete options and solutions)
  const result = await prisma.question.deleteMany({});

  console.log(`✅ Deleted ${result.count} questions`);
  console.log('   (Associated options and solutions also deleted via cascade)');

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Delete failed:', error);
  prisma.$disconnect();
  process.exit(1);
});
