'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { deduplicatedFetch } from '@/lib/request-deduplication';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3
} from 'lucide-react';
import { Loading } from '@/components/ui/loading';
import { ErrorDisplay } from '@/components/ui/error-display';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface PerformanceData {
  daily: Array<{
    date: string;
    questionsAttempted: number;
    correctAnswers: number;
    accuracy: number;
    avgTimePerQuestion: number;
  }>;
  topicBreakdown: Array<{
    topic: string;
    attempted: number;
    correct: number;
    accuracy: number;
    avgTime: number;
    trend: 'improving' | 'declining' | 'stable';
  }>;
  difficultyBreakdown: Array<{
    difficulty: string;
    attempted: number;
    correct: number;
    accuracy: number;
  }>;
  overallStats: {
    totalQuestions: number;
    totalCorrect: number;
    overallAccuracy: number;
    avgTimePerQuestion: number;
    practiceStreak: number;
    weakestTopics: string[];
    strongestTopics: string[];
  };
}

interface PerformanceDashboardProps {
  userId?: string;
}

const PerformanceDashboardComponent = ({ userId = 'ayansh' }: PerformanceDashboardProps) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30'); // days

  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch comprehensive data from existing progress endpoint
      const progressResponse = await deduplicatedFetch(`/api/progress?userId=${userId}&timeRange=${timeRange}&force=true`);

      // Extract the actual data from the API response structure
      const progressData = progressResponse?.data || progressResponse;

      // Process and combine the data from single endpoint
      const combined: PerformanceData = {
        daily: progressData.recentSessions || [],
        topicBreakdown: Object.entries(progressData.topicBreakdown || {}).map(([topicName, data]: [string, any]) => ({
          topic: topicName,
          attempted: data.attempted || 0,
          correct: data.correct || 0,
          accuracy: data.accuracy || 0,
          avgTime: data.avgTime || 0,
          trend: data.trend || 'stable'
        })),
        difficultyBreakdown: Object.entries(progressData.difficultyBreakdown || {}).map(([difficulty, data]: [string, any]) => ({
          difficulty,
          attempted: data.attempted || 0,
          correct: data.correct || 0,
          accuracy: data.accuracy || 0
        })),
        overallStats: {
          totalQuestions: progressData.totalAttempts || 0,
          totalCorrect: progressData.correctAnswers || 0,
          overallAccuracy: progressData.accuracy || 0,
          avgTimePerQuestion: progressData.averageTime || 0,
          practiceStreak: progressData.streakData?.currentStreak || 0,
          weakestTopics: [],
          strongestTopics: []
        }
      };

      setPerformanceData(combined);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  }, [userId, timeRange]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  // Refresh data when page becomes visible (user returns from practice)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchPerformanceData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also refresh when component mounts
    const handleFocus = () => {
      fetchPerformanceData();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchPerformanceData]);

  // Periodic refresh every 2 minutes to ensure data stays fresh
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if page is visible to avoid unnecessary API calls
      if (!document.hidden) {
        fetchPerformanceData();
      }
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [fetchPerformanceData]);

  if (loading) {
    return <Loading text="Loading performance analytics..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Analytics Unavailable"
        message={error}
        onRetry={fetchPerformanceData}
      />
    );
  }

  if (!performanceData) {
    return (
      <ErrorDisplay
        title="No Data Available"
        message="Start practicing to see your performance analytics."
        type="info"
        showRetry={false}
      />
    );
  }

  const { daily, topicBreakdown, difficultyBreakdown, overallStats } = performanceData;


  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Performance Analytics</h2>
          <p className="text-gray-600">Track your math competition preparation progress</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchPerformanceData} variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalQuestions}</div>
            <div className="text-sm text-gray-600">
              {overallStats.totalCorrect} correct
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Overall Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(overallStats.overallAccuracy)}%
            </div>
            <div className="text-sm text-gray-600">
              {overallStats.overallAccuracy >= 80 ? 'Excellent!' : overallStats.overallAccuracy >= 60 ? 'Good' : 'Needs improvement'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Time per Question</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(overallStats.avgTimePerQuestion)}s
            </div>
            <div className="text-sm text-gray-600">
              {overallStats.avgTimePerQuestion <= 60 ? 'Fast' : overallStats.avgTimePerQuestion <= 120 ? 'Moderate' : 'Slow'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Practice Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {overallStats.practiceStreak}
            </div>
            <div className="text-sm text-gray-600">
              {overallStats.practiceStreak > 0 ? 'days in a row' : 'Start your streak!'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="progress" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="progress">Progress Trend</TabsTrigger>
          <TabsTrigger value="topics">Topic Analysis</TabsTrigger>
          <TabsTrigger value="difficulty">Difficulty Breakdown</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Progress Trend</CardTitle>
              <CardDescription>Your accuracy and question volume over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Accuracy (%)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="questionsAttempted"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      name="Questions Attempted"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Topic Performance Analysis</CardTitle>
              <CardDescription>Your strength and weakness by math topic</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topicBreakdown.map((topic) => (
                  <div key={topic.topic} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(topic.trend)}
                        <span className="font-medium">{topic.topic}</span>
                      </div>
                      <Badge
                        variant={topic.accuracy >= 80 ? 'default' : topic.accuracy >= 60 ? 'secondary' : 'destructive'}
                      >
                        {Math.round(topic.accuracy)}% accuracy
                      </Badge>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <div>{topic.attempted} attempted</div>
                      <div>{Math.round(topic.avgTime)}s avg</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="difficulty" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Difficulty Level Performance</CardTitle>
              <CardDescription>How you perform across different difficulty levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={difficultyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="difficulty" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="accuracy" fill="#8884d8" name="Accuracy %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Strongest Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {overallStats.strongestTopics.length > 0 ? (
                  <div className="space-y-2">
                    {overallStats.strongestTopics.map((topic, index) => (
                      <div key={topic} className="flex items-center gap-2">
                        <Badge variant="default">{index + 1}</Badge>
                        <span>{topic}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Complete more questions to see your strongest topics</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {overallStats.weakestTopics.length > 0 ? (
                  <div className="space-y-2">
                    {overallStats.weakestTopics.map((topic, index) => (
                      <div key={topic} className="flex items-center gap-2">
                        <Badge variant="destructive">{index + 1}</Badge>
                        <span>{topic}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Great job! No weak areas identified yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Personalized Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overallStats.overallAccuracy < 70 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="font-medium text-yellow-800">Focus on Accuracy</div>
                    <div className="text-sm text-yellow-700">
                      Your accuracy is below 70%. Take your time and review solutions carefully.
                    </div>
                  </div>
                )}

                {overallStats.avgTimePerQuestion > 120 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="font-medium text-blue-800">Work on Speed</div>
                    <div className="text-sm text-blue-700">
                      Try timed practice sessions to improve your problem-solving speed.
                    </div>
                  </div>
                )}

                {overallStats.practiceStreak === 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="font-medium text-purple-800">Build Consistency</div>
                    <div className="text-sm text-purple-700">
                      Try to practice a little bit every day to build momentum.
                    </div>
                  </div>
                )}

                {overallStats.weakestTopics.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="font-medium text-red-800">Target Weak Areas</div>
                    <div className="text-sm text-red-700">
                      Focus on {overallStats.weakestTopics[0]} to improve your overall performance.
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const PerformanceDashboard = memo(PerformanceDashboardComponent);