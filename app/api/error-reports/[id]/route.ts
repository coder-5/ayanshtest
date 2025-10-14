import { prisma } from '@/lib/prisma';
import { withErrorHandler, successResponse } from '@/lib/error-handler';

export const PUT = withErrorHandler(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
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

    return successResponse({ success: true, report });
  }
);

export const DELETE = withErrorHandler(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    await prisma.errorReport.delete({
      where: { id },
    });

    return successResponse({ success: true });
  }
);
