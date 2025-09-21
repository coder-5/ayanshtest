'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertTriangle,
  XCircle,
  Target,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface QualityDashboardData {
  summary: {
    totalQuestions: number;
    questionsWithSolutions: number;
    solutionCoverage: number;
    pendingReviews: number;
    criticalIssues: number;
  };
  qualityDistribution: Array<{
    difficulty: string;
    _count: number;
  }>;
  topicQuality: Array<{
    topic: string;
    _count: number;
  }>;
  recentActivity: Array<{
    id: string;
    questionText: string;
    examName: string;
    topic: string;
    difficulty: string;
    updatedAt: string;
  }>;
  errorReports: Record<string, number>;
}

interface QualityMetrics {
  totalQuestions: number;
  withSolutions: number;
  averageAccuracy: number;
  averageTime: number;
  errorReportRate: number;
  qualityScores: {
    high: number;
    medium: number;
    low: number;
  };
}

export default function QualityDashboard() {
  const [data, setData] = useState<QualityDashboardData | null>(null);
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedExamType, setSelectedExamType] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (selectedExamType !== 'all' || selectedTopic !== 'all') {
      fetchMetrics();
    }
  }, [selectedExamType, selectedTopic]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quality?action=dashboard');
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const params = new URLSearchParams({ action: 'metrics' });
      if (selectedExamType !== 'all') params.set('examType', selectedExamType);
      if (selectedTopic !== 'all') params.set('topic', selectedTopic);

      const response = await fetch(`/api/quality?${params}`);
      if (response.ok) {
        const metricsData = await response.json();
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading quality dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Content Quality Dashboard</h1>
          <p className="text-gray-600">Monitor and track educational content quality</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Exam Type</label>
              <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  <SelectItem value="AMC8">AMC8</SelectItem>
                  <SelectItem value="Kangaroo">Kangaroo</SelectItem>
                  <SelectItem value="MOEMS">MOEMS</SelectItem>
                  <SelectItem value="MathCounts">MathCounts</SelectItem>
                  <SelectItem value="CML">CML</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Topic</label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  <SelectItem value="Algebra">Algebra</SelectItem>
                  <SelectItem value="Geometry">Geometry</SelectItem>
                  <SelectItem value="Number Theory">Number Theory</SelectItem>
                  <SelectItem value="Combinatorics">Combinatorics</SelectItem>
                  <SelectItem value="Probability">Probability</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalQuestions}</div>
            <p className="text-xs text-muted-foreground">
              In the question bank
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solution Coverage</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.summary.solutionCoverage * 100).toFixed(1)}%
            </div>
            <Progress value={data.summary.solutionCoverage * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {data.summary.questionsWithSolutions} of {data.summary.totalQuestions} questions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.summary.criticalIssues}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Questions by Difficulty</CardTitle>
            <CardDescription>Distribution of questions across difficulty levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.qualityDistribution.map((item) => (
                <div key={item.difficulty} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Badge
                      variant={
                        item.difficulty === 'easy' ? 'default' :
                        item.difficulty === 'medium' ? 'secondary' : 'destructive'
                      }
                      className="capitalize mr-2"
                    >
                      {item.difficulty}
                    </Badge>
                  </div>
                  <div className="text-sm font-medium">{item._count} questions</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Topic Quality */}
        <Card>
          <CardHeader>
            <CardTitle>Top Topics</CardTitle>
            <CardDescription>Questions by topic area</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topicQuality.slice(0, 5).map((item, index) => (
                <div key={item.topic} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center mr-3">
                      {index + 1}
                    </div>
                    <span className="text-sm">{item.topic}</span>
                  </div>
                  <span className="text-sm font-medium">{item._count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtered Metrics */}
      {metrics && (selectedExamType !== 'all' || selectedTopic !== 'all') && (
        <Card>
          <CardHeader>
            <CardTitle>Filtered Quality Metrics</CardTitle>
            <CardDescription>
              Quality metrics for {selectedExamType !== 'all' && selectedExamType}
              {selectedTopic !== 'all' && ` - ${selectedTopic}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.averageAccuracy.toFixed(1)}%</div>
                <p className="text-sm text-gray-600">Average Accuracy</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.round(metrics.averageTime)}s</div>
                <p className="text-sm text-gray-600">Average Time</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.errorReportRate.toFixed(2)}</div>
                <p className="text-sm text-gray-600">Error Report Rate</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.withSolutions}</div>
                <p className="text-sm text-gray-600">With Solutions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Recently updated questions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentActivity.slice(0, 5).map((question) => (
              <div key={question.id} className="flex items-center justify-between border-b pb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">
                    {question.questionText.slice(0, 100)}...
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {question.examName}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {question.topic}
                    </Badge>
                    <Badge
                      variant={
                        question.difficulty === 'easy' ? 'default' :
                        question.difficulty === 'medium' ? 'secondary' : 'destructive'
                      }
                      className="text-xs"
                    >
                      {question.difficulty}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(question.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Reports Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Error Reports Status</CardTitle>
          <CardDescription>Current status of error reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(data.errorReports).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className="text-xl font-bold">{count}</div>
                <p className="text-sm text-gray-600 capitalize">{status.toLowerCase()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}