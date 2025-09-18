import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [totalQuestions, amc8Questions, moemsQuestions, kangarooQuestions] = await Promise.all([
      prisma.question.count(),
      prisma.question.count({
        where: { examName: { contains: 'AMC 8', mode: 'insensitive' } }
      }),
      prisma.question.count({
        where: { examName: { contains: 'MOEMS', mode: 'insensitive' } }
      }),
      prisma.question.count({
        where: { examName: { contains: 'Kangaroo', mode: 'insensitive' } }
      })
    ]);

    return NextResponse.json({
      total: totalQuestions,
      amc8: amc8Questions,
      moems: moemsQuestions,
      kangaroo: kangarooQuestions
    });
  } catch (error) {
    console.error('Failed to get question counts:', error);
    return NextResponse.json(
      { error: 'Failed to get question counts' },
      { status: 500 }
    );
  }
}