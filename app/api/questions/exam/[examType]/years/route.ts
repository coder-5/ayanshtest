import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler, successResponse } from '@/lib/error-handler';

export const GET = withErrorHandler(
  async (request: Request, { params }: { params: Promise<{ examType: string }> }) => {
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

    return successResponse({ years: yearList });
  }
);
