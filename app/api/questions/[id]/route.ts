import { NextResponse } from 'next/server';
import { questionUpdateSchema, validatePayloadSize } from '@/lib/validation';
import { QuestionService } from '@/lib/services/questionService';
import { withErrorHandler, successResponse } from '@/lib/error-handler';

export const GET = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const question = await QuestionService.getById(id);

    if (!question) {
      return successResponse({ error: 'Question not found' }, 404);
    }

    return successResponse({ question });});

export const PUT = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
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
      return successResponse({ error: 'Invalid input', details: validationResult.error.format() }, 400);
    }

    const question = await QuestionService.update(id, validationResult.data);

    return successResponse({ success: true, question });});

export const DELETE = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const question = await QuestionService.delete(id);

    return successResponse({ success: true, question });});
