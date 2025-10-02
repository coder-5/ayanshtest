require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createUser() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: 'ayansh' }
    });

    if (existingUser) {
      console.log('User "ayansh" already exists');
      return;
    }

    // Create the user
    const user = await prisma.user.create({
      data: {
        id: 'ayansh',
        name: 'Ayansh',
        email: 'ayansh@example.com',
        grade: 5,
        targetScore: 20
      }
    });

    console.log('Created user:', user);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();