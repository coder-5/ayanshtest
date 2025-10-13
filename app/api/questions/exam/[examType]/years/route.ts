import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ examType: string }> }) {
  try {
    const { examType } = await params;

    // Get distinct years for this exam type (use exact name, don't convert to uppercase)
    const years = await prisma.question.findMany({
      where: {
        examName: examType,
        deletedAt: null,
      },
      select: {
        examYear: true,
      },
      distinct: ['examYear'],
      orderBy: {
        examYear: 'desc',
      },
    });

    const yearList = years.map((y) => y.examYear).filter((year): year is number => year !== null);

    return NextResponse.json({ years: yearList });
  } catch (error) {
    console.error('Error fetching years:', error);
    return NextResponse.json({ error: 'Failed to fetch years' }, { status: 500 });
  }
}
