'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
  totalQuestions: number;
  totalProgress: number;
  correctAnswers: number;
  accuracy: number;
  streak: number;
  recentProgress: Array<{
    id: string;
    isCorrect: boolean;
    timeSpent: number;
    createdAt: string;
    question: {
      id: string;
      text: string;
      topic: string;
      competition: string;
    };
  }>;
  weeklyProgress: Array<{
    date: string;
    count: number;
    correct: number;
  }>;
  topicStats: Record<string, { total: number; timeSpent: number }>;
  competitionStats: Record<string, number>;
}

export function useAnalytics(userId: string = 'default-user') {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/stats?userId=${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [userId]);

  const refreshAnalytics = () => {
    fetchAnalytics();
  };

  // Derived analytics calculations
  const getTopicProgress = () => {
    if (!data) return [];

    return Object.entries(data.topicStats).map(([topic, stats]) => {
      // Calculate accuracy based on recent progress for this topic
      const topicProgress = data.recentProgress.filter(p => p.question.topic === topic);
      const correct = topicProgress.filter(p => p.isCorrect).length;
      const total = topicProgress.length;
      const accuracy = total > 0 ? (correct / total) * 100 : 0;

      return {
        topic,
        current: Math.round(accuracy),
        previous: Math.round(accuracy - 5), // Simulated previous value
        total: stats.total,
        trend: accuracy > 75 ? 'up' as const : accuracy < 60 ? 'down' as const : 'stable' as const
      };
    });
  };

  const getWeeklyActivity = () => {
    if (!data) return [];

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return data.weeklyProgress.map(day => ({
      ...day,
      dayName: weekdays[new Date(day.date).getDay()]
    }));
  };

  const getCompetitionBreakdown = () => {
    if (!data) return [];

    return Object.entries(data.competitionStats).map(([competition, count]) => ({
      competition,
      count,
      percentage: data.totalProgress > 0 ? Math.round((count / data.totalProgress) * 100) : 0
    }));
  };

  const getRecentAchievements = () => {
    if (!data) return [];

    const achievements = [];

    // Check for streak achievements
    if (data.streak >= 7) {
      achievements.push({
        id: 'week-warrior',
        title: 'Week Warrior',
        description: `Practiced ${data.streak} days in a row`,
        icon: '🔥',
        color: 'orange'
      });
    }

    // Check for accuracy achievements
    if (data.accuracy >= 90) {
      achievements.push({
        id: 'accuracy-master',
        title: 'Accuracy Master',
        description: `${data.accuracy}% overall accuracy`,
        icon: '🎯',
        color: 'blue'
      });
    }

    // Check for volume achievements
    if (data.totalProgress >= 100) {
      achievements.push({
        id: 'century-club',
        title: 'Century Club',
        description: `Solved ${data.totalProgress} problems`,
        icon: '📚',
        color: 'green'
      });
    }

    // Check for perfect session
    const recentSession = data.recentProgress.slice(0, 10);
    if (recentSession.length >= 5 && recentSession.every(p => p.isCorrect)) {
      achievements.push({
        id: 'perfect-session',
        title: 'Perfect Session',
        description: 'Got 100% in recent practice',
        icon: '⭐',
        color: 'yellow'
      });
    }

    return achievements;
  };

  return {
    data,
    loading,
    error,
    refreshAnalytics,
    getTopicProgress,
    getWeeklyActivity,
    getCompetitionBreakdown,
    getRecentAchievements
  };
}