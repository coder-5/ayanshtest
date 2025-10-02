import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    // Fetch all questions with their solutions and options
    const questions = await prisma.question.findMany({
      include: {
        solution: true,
        options: true,
        attempts: {
          select: {
            isCorrect: true
          }
        }
      },
      orderBy: [
        { examName: 'asc' },
        { examYear: 'asc' },
        { questionNumber: 'asc' }
      ]
    });

    // Transform data for export
    const exportData = questions.map(question => {
      const correctAttempts = question.attempts.filter(a => a.isCorrect).length;
      const totalAttempts = question.attempts.length;
      const successRate = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

      return {
        examName: question.examName,
        examYear: question.examYear,
        questionNumber: question.questionNumber,
        topic: question.topic,
        subtopic: question.subtopic,
        difficulty: question.difficulty,
        questionText: question.questionText,
        hasImage: question.hasImage,
        imageUrl: question.imageUrl,
        timeLimit: question.timeLimit,
        options: question.options.map(opt => ({
          letter: opt.optionLetter,
          text: opt.optionText,
          isCorrect: opt.isCorrect
        })),
        solution: question.solution ? {
          solutionText: question.solution.solutionText,
          approach: question.solution.approach,
          difficulty: question.solution.difficulty,
          keyInsights: question.solution.keyInsights,
          timeEstimate: question.solution.timeEstimate
        } : null,
        stats: {
          totalAttempts,
          correctAttempts,
          successRate: `${successRate}%`
        },
        createdAt: question.createdAt.toISOString()
      };
    });

    // Generate CSV content
    const csvHeaders = [
      'Exam Name',
      'Exam Year',
      'Question Number',
      'Topic',
      'Subtopic',
      'Difficulty',
      'Question Text',
      'Has Image',
      'Image URL',
      'Time Limit',
      'Option A',
      'Option B',
      'Option C',
      'Option D',
      'Option E',
      'Correct Answer',
      'Solution Text',
      'Solution Approach',
      'Key Insights',
      'Time Estimate',
      'Total Attempts',
      'Correct Attempts',
      'Success Rate',
      'Created At'
    ];

    const csvRows = exportData.map(q => {
      const options = ['A', 'B', 'C', 'D', 'E'].map(letter => {
        const option = q.options.find(opt => opt.letter === letter);
        return option ? option.text : '';
      });

      const correctAnswer = q.options.find(opt => opt.isCorrect)?.letter || '';

      return [
        q.examName,
        q.examYear,
        q.questionNumber,
        q.topic,
        q.subtopic,
        q.difficulty,
        `"${q.questionText.replace(/"/g, '""')}"`, // Escape quotes in CSV
        q.hasImage,
        q.imageUrl || '',
        q.timeLimit || '',
        `"${options[0].replace(/"/g, '""')}"`,
        `"${options[1].replace(/"/g, '""')}"`,
        `"${options[2].replace(/"/g, '""')}"`,
        `"${options[3].replace(/"/g, '""')}"`,
        `"${options[4].replace(/"/g, '""')}"`,
        correctAnswer,
        q.solution ? `"${q.solution.solutionText.replace(/"/g, '""')}"` : '',
        q.solution ? q.solution.approach : '',
        q.solution ? `"${q.solution.keyInsights?.replace(/"/g, '""') || ''}"` : '',
        q.solution ? q.solution.timeEstimate : '',
        q.stats.totalAttempts,
        q.stats.correctAttempts,
        q.stats.successRate,
        q.createdAt
      ].join(',');
    });

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="math-competition-library-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to export library' },
      { status: 500 }
    );
  }
}