import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const years = await prisma.question.findMany({
      where: {
        examName: 'Math Kangaroo'
      },
      select: {
        examYear: true
      },
      distinct: ['examYear']
    });

    const availableYears = years.map(y => y.examYear).sort((a, b) => b - a);

    return NextResponse.json(availableYears);
  } catch (error) {
    console.error('Error fetching Math Kangaroo years:', error);
    return NextResponse.json({ error: 'Failed to fetch years' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}