import { NextResponse } from 'next/server';
import { questionUpdateSchema, validatePayloadSize } from '@/lib/validation';
import { QuestionService } from '@/lib/services/questionService';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const question = await QuestionService.getById(id);

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate payload size to prevent DoS attacks (max 1MB)
    try {
      validatePayloadSize(body, 1024);
    } catch (sizeError) {
      return NextResponse.json(
        { error: (sizeError as Error).message },
        { status: 413 } // 413 Payload Too Large
      );
    }

    // Validate input
    const validationResult = questionUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const question = await QuestionService.update(id, validationResult.data);

    return NextResponse.json({ success: true, question });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const question = await QuestionService.delete(id);

    return NextResponse.json({ success: true, question });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
