import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { getCurrentUserId } from '@/lib/userContext';
import { examScheduleSchema } from '@/lib/validations';

export async function GET() {
  try {
    const userId = getCurrentUserId();
    const exams = await prisma.examSchedule.findMany({
      where: {
        userId,
        deletedAt: null, // Only return active exams
      },
      orderBy: {
        examDate: 'asc',
      },
    });

    return NextResponse.json({ exams });
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validated = examScheduleSchema.parse(body);

    const userId = getCurrentUserId();

    const exam = await prisma.examSchedule.create({
      data: {
        id: `exam-${nanoid(21)}`,
        userId,
        examName: validated.examName,
        examDate: new Date(validated.examDate),
        location: validated.location,
        notes: validated.notes,
        status: 'UPCOMING',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, exam });
  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 });
  }
}
