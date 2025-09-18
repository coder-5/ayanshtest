import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), 'uploads');
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      message: 'File uploaded successfully',
      fileName,
      filePath,
      fileSize: file.size,
      fileType: file.type
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      supportedFormats: ['.docx', '.pdf', '.png', '.jpg', '.jpeg'],
      maxFileSize: '10MB',
      uploadDirectory: 'uploads/'
    });
  } catch (error) {
    console.error('Error getting upload info:', error);
    return NextResponse.json(
      { error: 'Failed to get upload info' },
      { status: 500 }
    );
  }
}