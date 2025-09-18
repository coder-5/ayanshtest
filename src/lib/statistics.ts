// Centralized statistics calculation utilities

export interface SessionResult {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

export interface SessionStats {
  correct: number;
  total: number;
  accuracy: number;
  totalTime: number;
  avgTime: number;
}

export interface TopicStats {
  topic: string;
  correct: number;
  total: number;
  accuracy: number;
}

export class StatisticsCalculator {
  /**
   * Calculate basic session statistics
   */
  static calculateSessionStats(results: SessionResult[], sessionStartTime: number): SessionStats {
    const correct = results.filter(r => r.isCorrect).length;
    const total = results.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const totalTime = Math.floor((Date.now() - sessionStartTime) / 1000);
    const avgTime = total > 0 ? Math.round(results.reduce((sum, r) => sum + r.timeSpent, 0) / total) : 0;

    return { correct, total, accuracy, totalTime, avgTime };
  }

  /**
   * Calculate accuracy percentage safely
   */
  static calculateAccuracy(correct: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  }

  /**
   * Calculate average time spent per question
   */
  static calculateAverageTime(results: SessionResult[]): number {
    if (results.length === 0) return 0;
    const totalTime = results.reduce((sum, r) => sum + r.timeSpent, 0);
    return Math.round(totalTime / results.length);
  }

  /**
   * Format time in human-readable format
   */
  static formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  /**
   * Calculate statistics by topic
   */
  static calculateTopicStats(results: SessionResult[], questionTopics: Record<string, string>): TopicStats[] {
    const topicData: Record<string, { correct: number; total: number }> = {};

    results.forEach(result => {
      const topic = questionTopics[result.questionId] || 'Unknown';

      if (!topicData[topic]) {
        topicData[topic] = { correct: 0, total: 0 };
      }

      topicData[topic].total++;
      if (result.isCorrect) {
        topicData[topic].correct++;
      }
    });

    return Object.entries(topicData).map(([topic, data]) => ({
      topic,
      correct: data.correct,
      total: data.total,
      accuracy: this.calculateAccuracy(data.correct, data.total)
    }));
  }

  /**
   * Determine performance level based on accuracy
   */
  static getPerformanceLevel(accuracy: number): 'excellent' | 'good' | 'needs-improvement' | 'poor' {
    if (accuracy >= 90) return 'excellent';
    if (accuracy >= 75) return 'good';
    if (accuracy >= 60) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Get performance color for UI display
   */
  static getPerformanceColor(accuracy: number): string {
    const level = this.getPerformanceLevel(accuracy);
    const colorMap = {
      'excellent': 'text-green-600 bg-green-50',
      'good': 'text-blue-600 bg-blue-50',
      'needs-improvement': 'text-yellow-600 bg-yellow-50',
      'poor': 'text-red-600 bg-red-50'
    };
    return colorMap[level];
  }

  /**
   * Calculate improvement over time
   */
  static calculateImprovement(previousAccuracy: number, currentAccuracy: number): {
    change: number;
    direction: 'up' | 'down' | 'same';
    percentage: number;
  } {
    const change = currentAccuracy - previousAccuracy;
    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'same';
    const percentage = previousAccuracy > 0 ? Math.round((change / previousAccuracy) * 100) : 0;

    return { change, direction, percentage };
  }

  /**
   * Identify weak areas that need improvement
   */
  static identifyWeakAreas(topicStats: TopicStats[], threshold: number = 75): TopicStats[] {
    return topicStats
      .filter(topic => topic.accuracy < threshold && topic.total >= 3) // At least 3 questions attempted
      .sort((a, b) => a.accuracy - b.accuracy); // Sort by lowest accuracy first
  }

  /**
   * Generate practice recommendations
   */
  static generateRecommendations(topicStats: TopicStats[]): string[] {
    const recommendations: string[] = [];
    const weakAreas = this.identifyWeakAreas(topicStats);

    if (weakAreas.length === 0) {
      recommendations.push("Great job! Continue practicing all topics to maintain your performance.");
    } else {
      weakAreas.slice(0, 2).forEach(topic => { // Focus on top 2 weak areas
        recommendations.push(`Focus on ${topic.topic} - currently at ${topic.accuracy}% accuracy`);
      });

      if (weakAreas.length > 2) {
        recommendations.push(`Also work on ${weakAreas.slice(2).map(t => t.topic).join(', ')}`);
      }
    }

    return recommendations;
  }
}