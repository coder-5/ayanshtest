import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export async function POST(request: Request) {

  try {
    const body = await request.json();
    const { questions } = body;

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Invalid input: questions array is required' },
        { status: 400 }
      );
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      try {
        // Validate required fields
        if (!q.questionText || !q.questionText.trim()) {
          errors.push({ index: i, error: 'Question text is required' });
          errorCount++;
          continue;
        }

        // Allow questions with 0 options (will have blank options)
        if (q.options && !Array.isArray(q.options)) {
          errors.push({ index: i, error: 'Options must be an array' });
          errorCount++;
          continue;
        }

        // Check if at least one correct answer (only if options exist)
        if (q.options && q.options.length > 0) {
          const hasCorrect = q.options.some((opt: { isCorrect: boolean }) => opt.isCorrect);
          if (!hasCorrect) {
            errors.push({
              index: i,
              error: 'At least one correct answer required when options are provided',
            });
            errorCount++;
            continue;
          }
        }

        // Create question with options and solution
        await prisma.question.create({
          data: {
            id: `q-${nanoid(21)}`,
            questionText: q.questionText,
            examName: q.examName || null,
            examYear: q.examYear ? parseInt(q.examYear) : null,
            questionNumber: q.questionNumber || null,
            topic: q.topic || null,
            difficulty: q.difficulty || 'MEDIUM',
            hasImage: q.hasImage || false,
            imageUrl: q.imageUrl || q.diagramPath || null,
            updatedAt: new Date(),
            ...(q.options &&
              q.options.length > 0 && {
                options: {
                  create: q.options.map(
                    (opt: {
                      optionLabel?: string;
                      optionLetter?: string;
                      optionText: string;
                      isCorrect: boolean;
                    }) => ({
                      id: `opt-${nanoid(21)}`,
                      optionLetter: opt.optionLabel || opt.optionLetter || 'A',
                      optionText: opt.optionText,
                      isCorrect: opt.isCorrect,
                    })
                  ),
                },
              }),
            ...((q.solution || q.videoLinks) && {
              solution: {
                create: {
                  id: `sol-${nanoid(21)}`,
                  solutionText: q.solution || 'No detailed solution available.',
                  videoLinks: q.videoLinks || null,
                  updatedAt: new Date(),
                },
              },
            }),
          },
        });

        successCount++;
      } catch (error) {
        console.error(`Error uploading question ${i}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ index: i, error: errorMessage });
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      uploaded: successCount,
      failed: errorCount,
      total: questions.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to process upload' }, { status: 500 });
  }
}
