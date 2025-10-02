import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from '@/lib/api-response';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public/uploads/diagrams');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const questionId = formData.get('questionId') as string;
    const userId = formData.get('userId') as string || 'ayansh'; // Default user
    const description = formData.get('description') as string || '';
    const replaceExisting = formData.get('replaceExisting') === 'true'; // Whether to replace all existing diagrams

    // Validation
    if (!file) {
      return ApiResponse.validationError('No file provided');
    }

    if (!questionId?.trim()) {
      return ApiResponse.validationError('Question ID is required');
    }

    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return ApiResponse.notFound('Question not found');
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return ApiResponse.validationError(
        `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return ApiResponse.validationError(
        `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
      );
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `${questionId}_${timestamp}.${fileExtension}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Save file to disk
    const buffer = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(buffer));

    // Create public URL
    const imageUrl = `/uploads/diagrams/${filename}`;

    // Get the next sequence number for multiple diagrams
    const existingDiagrams = await prisma.userDiagram.findMany({
      where: {
        questionId,
        status: 'ACTIVE'
      },
      orderBy: {
        sequence: 'desc'
      },
      take: 1
    });

    const nextSequence = existingDiagrams.length > 0 ? existingDiagrams[0].sequence + 1 : 1;

    // Mark existing user diagrams as replaced (only if explicitly requested)
    if (replaceExisting) {
      await prisma.userDiagram.updateMany({
        where: {
          questionId,
          status: 'ACTIVE'
        },
        data: {
          status: 'REPLACED',
          isPreferred: false
        }
      });
    } else {
      // When adding additional diagrams, remove preferred status from existing ones
      await prisma.userDiagram.updateMany({
        where: {
          questionId,
          status: 'ACTIVE',
          isPreferred: true
        },
        data: {
          isPreferred: false
        }
      });
    }

    // Save diagram metadata to database
    const userDiagram = await prisma.userDiagram.create({
      data: {
        questionId,
        userId,
        imageUrl,
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type,
        description,
        source: 'user_upload',
        status: 'ACTIVE',
        isPreferred: true,
        isApproved: true, // Auto-approve all uploads
        moderatedBy: 'system',
        moderatedAt: new Date(),
        sequence: replaceExisting ? 1 : nextSequence
      }
    });

    // Update question to indicate it has a user-uploaded image
    await prisma.question.update({
      where: { id: questionId },
      data: {
        hasImage: true,
        updatedAt: new Date()
      }
    });

    return ApiResponse.successWithStatus(
      {
        diagramId: userDiagram.id,
        imageUrl: userDiagram.imageUrl,
        filename: userDiagram.filename,
        fileSize: userDiagram.fileSize,
        status: userDiagram.status,
        isApproved: userDiagram.isApproved,
        message: 'Diagram uploaded and approved successfully!'
      },
      201,
      'Diagram uploaded and approved successfully'
    );

  } catch (error) {
    return ApiResponse.serverError('Failed to upload diagram. Please try again.');
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');

    if (!questionId) {
      return ApiResponse.validationError('Question ID is required');
    }

    const diagrams = await prisma.userDiagram.findMany({
      where: {
        questionId,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        imageUrl: true,
        filename: true,
        fileSize: true,
        isApproved: true,
        isPreferred: true,
        description: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { sequence: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    return ApiResponse.success(diagrams);

  } catch (error) {
    return ApiResponse.serverError('Failed to fetch diagrams');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const diagramId = searchParams.get('diagramId');
    const userId = searchParams.get('userId') || 'ayansh';

    if (!diagramId) {
      return ApiResponse.validationError('Diagram ID is required');
    }

    const diagram = await prisma.userDiagram.findUnique({
      where: { id: diagramId }
    });

    if (!diagram) {
      return ApiResponse.notFound('Diagram not found');
    }

    // Only allow the uploader to delete (or admin)
    if (diagram.userId !== userId) {
      return ApiResponse.unauthorized('You can only delete your own diagrams');
    }

    // Mark as deleted instead of actually deleting
    await prisma.userDiagram.update({
      where: { id: diagramId },
      data: {
        status: 'DELETED',
        isPreferred: false
      }
    });

    return ApiResponse.success({ message: 'Diagram deleted successfully' });

  } catch (error) {
    return ApiResponse.serverError('Failed to delete diagram');
  }
}