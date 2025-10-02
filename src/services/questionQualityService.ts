import { prisma } from '@/lib/prisma';

export interface QuestionQuality {
  questionId: string;
  qualityScore: number; // 0-100, where 100 is perfect quality
  reportCount: number;
  criticalIssues: number;
  isReliable: boolean; // true if quality score >= 70
  issues: string[];
}

export class QuestionQualityService {
  /**
   * Calculate quality score for a question based on error reports
   */
  static async getQuestionQuality(questionId: string): Promise<QuestionQuality> {
    try {
      const errorReports = await prisma.errorReport.findMany({
        where: { questionId },
        select: {
          reportType: true,
          severity: true
        }
      });

      let qualityScore = 100;
      const issues: string[] = [];
      let criticalIssues = 0;

      // Deduct points based on error reports
      errorReports.forEach(report => {
        const severityWeight = this.getSeverityWeight(report.severity);
        const typeWeight = this.getTypeWeight(report.reportType);

        qualityScore -= (severityWeight * typeWeight);

        if (report.severity === 'CRITICAL') {
          criticalIssues++;
          issues.push(`Critical: ${report.reportType}`);
        } else if (report.severity === 'HIGH') {
          issues.push(`High: ${report.reportType}`);
        }
      });

      // Ensure score doesn't go below 0
      qualityScore = Math.max(0, qualityScore);

      return {
        questionId,
        qualityScore,
        reportCount: errorReports.length,
        criticalIssues,
        isReliable: qualityScore >= 70,
        issues
      };
    } catch (error) {
      // Default to reliable if we can't calculate
      return {
        questionId,
        qualityScore: 100,
        reportCount: 0,
        criticalIssues: 0,
        isReliable: true,
        issues: []
      };
    }
  }

  /**
   * Get quality scores for multiple questions
   */
  static async getBulkQuestionQuality(questionIds: string[]): Promise<Map<string, QuestionQuality>> {
    const qualityMap = new Map<string, QuestionQuality>();

    try {
      // Get all error reports for these questions
      const errorReports = await prisma.errorReport.groupBy({
        by: ['questionId', 'reportType', 'severity'],
        where: {
          questionId: { in: questionIds }
        },
        _count: {
          id: true
        }
      });

      // Calculate quality for each question
      for (const questionId of questionIds) {
        const questionReports = errorReports.filter(r => r.questionId === questionId);

        let qualityScore = 100;
        const issues: string[] = [];
        let criticalIssues = 0;
        let totalReports = 0;

        questionReports.forEach(report => {
          const count = report._count.id;
          totalReports += count;

          const severityWeight = this.getSeverityWeight(report.severity);
          const typeWeight = this.getTypeWeight(report.reportType);

          // Multiply by count to account for multiple reports of same issue
          qualityScore -= (severityWeight * typeWeight * count);

          if (report.severity === 'CRITICAL') {
            criticalIssues += count;
            issues.push(`Critical: ${report.reportType} (${count} reports)`);
          } else if (report.severity === 'HIGH') {
            issues.push(`High: ${report.reportType} (${count} reports)`);
          }
        });

        qualityScore = Math.max(0, qualityScore);

        qualityMap.set(questionId, {
          questionId,
          qualityScore,
          reportCount: totalReports,
          criticalIssues,
          isReliable: qualityScore >= 70,
          issues
        });
      }

      // For questions with no reports, assume good quality
      questionIds.forEach(id => {
        if (!qualityMap.has(id)) {
          qualityMap.set(id, {
            questionId: id,
            qualityScore: 100,
            reportCount: 0,
            criticalIssues: 0,
            isReliable: true,
            issues: []
          });
        }
      });

    } catch (error) {
      // Default all to reliable if we can't calculate
      questionIds.forEach(id => {
        qualityMap.set(id, {
          questionId: id,
          qualityScore: 100,
          reportCount: 0,
          criticalIssues: 0,
          isReliable: true,
          issues: []
        });
      });
    }

    return qualityMap;
  }

  /**
   * Calculate weighted scoring for progress tracking
   */
  static calculateWeightedScore(
    isCorrect: boolean,
    quality: QuestionQuality
  ): {
    rawScore: number;
    weightedScore: number;
    weight: number;
    shouldIncludeInStats: boolean;
  } {
    const rawScore = isCorrect ? 1 : 0;

    // Questions with quality < 50 are considered too unreliable for stats
    const shouldIncludeInStats = quality.qualityScore >= 50;

    // Weight based on quality score (0.5 to 1.0)
    const weight = Math.max(0.5, quality.qualityScore / 100);

    // Weighted score applies the quality weight
    const weightedScore = rawScore * weight;

    return {
      rawScore,
      weightedScore,
      weight,
      shouldIncludeInStats
    };
  }

  /**
   * Get questions that need quality review
   */
  static async getQuestionsNeedingReview(): Promise<Array<{
    questionId: string;
    questionText: string;
    topic: string;
    quality: QuestionQuality;
  }>> {
    try {
      // Get questions with multiple error reports
      const questionsWithIssues = await prisma.errorReport.groupBy({
        by: ['questionId'],
        _count: {
          id: true
        },
        having: {
          id: {
            _count: {
              gte: 2 // Questions with 2+ reports need review
            }
          }
        }
      });

      const questionIds = questionsWithIssues.map(q => q.questionId);

      if (questionIds.length === 0) {
        return [];
      }

      // Get question details
      const questions = await prisma.question.findMany({
        where: {
          id: { in: questionIds }
        },
        select: {
          id: true,
          questionText: true,
          topic: true
        }
      });

      // Get quality scores
      const qualityMap = await this.getBulkQuestionQuality(questionIds);

      return questions.map(q => ({
        questionId: q.id,
        questionText: q.questionText.substring(0, 100) + '...',
        topic: q.topic,
        quality: qualityMap.get(q.id)!
      })).filter(q => !q.quality.isReliable);

    } catch (error) {
      return [];
    }
  }

  /**
   * Get severity weight for scoring calculation
   */
  private static getSeverityWeight(severity: string): number {
    switch (severity) {
      case 'CRITICAL': return 30; // Major impact on quality
      case 'HIGH': return 15;
      case 'MEDIUM': return 8;
      case 'LOW': return 3;
      default: return 5;
    }
  }

  /**
   * Get report type weight for scoring calculation
   */
  private static getTypeWeight(reportType: string): number {
    switch (reportType) {
      case 'WRONG_ANSWER': return 2.0; // Serious scoring issue
      case 'INCORRECT_SOLUTION': return 2.0;
      case 'UNCLEAR_QUESTION': return 1.5;
      case 'MISSING_DIAGRAM': return 1.5;
      case 'TYPO': return 0.5;
      case 'FORMATTING': return 0.3;
      default: return 1.0;
    }
  }
}