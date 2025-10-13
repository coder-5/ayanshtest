import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, reviewNotes, resolvedBy } = body;

    const report = await prisma.errorReport.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(reviewNotes && { reviewNotes }),
        ...(resolvedBy && { resolvedBy }),
        ...(status === 'RESOLVED' && { resolvedAt: new Date() }),
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Error updating error report:', error);
    return NextResponse.json({ error: 'Failed to update error report' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await prisma.errorReport.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting error report:', error);
    return NextResponse.json({ error: 'Failed to delete error report' }, { status: 500 });
  }
}
