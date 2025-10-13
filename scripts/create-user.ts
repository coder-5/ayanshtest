import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating default user...');

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { id: 'ayansh' },
  });

  if (existingUser) {
    console.log('✓ User "ayansh" already exists');
    return;
  }

  // Create the default user
  const user = await prisma.user.create({
    data: {
      id: 'ayansh',
      name: 'Ayansh',
      grade: 5,
      updatedAt: new Date(),
      preferences: {
        targetExams: ['AMC8', 'MOEMS', 'MATHKANGAROO'],
        school: 'Local School',
      },
    },
  });

  console.log('✓ Created user:', user.name);
  console.log('  ID:', user.id);
  console.log('  Grade:', user.grade);
}

main()
  .catch((e) => {
    console.error('Error creating user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
