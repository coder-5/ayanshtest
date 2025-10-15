import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { USER_ID } from '@/lib/constants';
import { withErrorHandler, successResponse, errorResponse } from '@/lib/error-handler';

// Magic number validation for image files
function validateImageMagicNumber(buffer: Buffer): boolean {
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return true;
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }
  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return true;
  }
  return false;
}

function sanitizeFilename(filename: string): string {
  // Remove any path traversal attempts and special characters
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .slice(0, 100); // Limit filename length
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const userId = USER_ID;
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const questionId = formData.get('questionId') as string;

  if (!file) {
    return errorResponse('No file uploaded', 400);
  }

  if (!questionId) {
    return errorResponse('Question ID is required', 400);
  }

  // Validate file size FIRST to prevent processing large files
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return errorResponse('File size exceeds 10MB limit', 400);
  }

  // Validate file type (MIME type check)
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return errorResponse('Invalid file type. Only PNG, JPG, and GIF are allowed.', 400);
  }

  // Read file buffer for magic number validation
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Validate magic number (actual file content)
  if (!validateImageMagicNumber(buffer)) {
    return errorResponse('File content does not match declared type', 400);
  }

  // Generate secure filename
  const randomId = randomBytes(16).toString('hex');
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const allowedExtensions = ['png', 'jpg', 'jpeg', 'gif'];
  const safeExt = allowedExtensions.includes(ext) ? ext : 'png';
  const filename = `question-${sanitizeFilename(questionId)}-${randomId}.${safeExt}`;
  const imageUrl = `/images/questions/${filename}`;

  // TRANSACTION: Create DB records FIRST, then write file
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create diagram record
    const diagram = await tx.userDiagram.create({
      data: {
        id: `diagram-${randomId}`,
        questionId,
        userId,
        imageUrl,
        filename,
        fileSize: file.size,
        mimeType: file.type,
        status: 'ACTIVE',
        isApproved: true,
        isPreferred: true,
      },
    });

    // 2. Update question to mark it has an image
    await tx.question.update({
      where: { id: questionId },
      data: {
        hasImage: true,
        imageUrl,
        updatedAt: new Date(),
      },
    });

    return diagram;
  });

  // 3. Write file ONLY after DB transaction succeeds
  const dir = join(process.cwd(), 'public', 'images', 'questions');
  await mkdir(dir, { recursive: true }); // Ensure directory exists
  const filepath = join(dir, filename);
  await writeFile(filepath, buffer);

  return successResponse({
    success: true,
    diagram: result,
    imageUrl,
  });
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const questionId = searchParams.get('questionId');

  if (!questionId) {
    return errorResponse('Question ID is required', 400);
  }

  const diagrams = await prisma.userDiagram.findMany({
    where: {
      questionId,
      status: 'ACTIVE',
    },
    orderBy: {
      uploadedAt: 'desc',
    },
  });

  return successResponse({ diagrams });
});

export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const questionId = searchParams.get('questionId');

  if (!questionId) {
    return errorResponse('Question ID is required', 400);
  }

  // Use transaction to update both diagram and question
  await prisma.$transaction(async (tx) => {
    // Mark diagram as deleted (soft delete)
    await tx.userDiagram.updateMany({
      where: { questionId, status: 'ACTIVE' },
      data: { status: 'DELETED' },
    });

    // Update question to remove image reference
    await tx.question.update({
      where: { id: questionId },
      data: {
        hasImage: false,
        imageUrl: null,
        updatedAt: new Date(),
      },
    });
  });

  return successResponse({ success: true, message: 'Diagram deleted successfully' });
});
