'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, Calendar, Award, Brain, Clock, Zap } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface ProgressStats {
  totalQuestions: number;
  accuracy: number;
  streak: number;
  timePracticed: number;
}

export default function ProgressPage() {
  const [stats, setStats] = useState<ProgressStats>({
    totalQuestions: 0,
    accuracy: 0,
    streak: 0,
    timePracticed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressStats();
  }, []);

  const fetchProgressStats = async () => {
    try {
      const response = await fetch('/api/progress?userId=default-user');
      const data = await response.json();

      if (data.progress && data.stats) {
        setStats({
          totalQuestions: data.stats.totalQuestions,
          accuracy: Math.round(data.stats.accuracy),
          streak: 0, // TODO: Calculate streak from progress data
          timePracticed: Math.round(data.stats.averageTime / 60) // Convert to minutes
        });
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Your Progress 📊
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Track your math competition journey and see how much you've improved!
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalQuestions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Questions attempted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `${stats.accuracy}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall accuracy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <span className="text-orange-500">🔥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `${stats.streak} days`}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.streak > 0 ? 'Keep it up!' : 'Start practicing!'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Practiced</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `${stats.timePracticed}m`}
            </div>
            <p className="text-xs text-muted-foreground">
              Average time per question
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            This Week's Progress
          </CardTitle>
          <CardDescription>
            Your daily practice and improvement trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Weekly Progress Message */}
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 mb-2">Weekly progress tracking</p>
              <p className="text-sm text-gray-400">Start practicing to see your weekly activity here</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topic Performance */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Topic Performance
          </CardTitle>
          <CardDescription>
            See how you're doing in different math areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-2">Topic performance tracking</p>
            <p className="text-sm text-gray-400">Answer questions to see your performance by topic</p>
          </div>
        </CardContent>
      </Card>

      {/* Competition Readiness */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-600" />
            Competition Readiness
          </CardTitle>
          <CardDescription>
            How prepared are you for upcoming competitions?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Award className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-2">Competition readiness tracking</p>
            <p className="text-sm text-gray-400">Practice more questions to get competition readiness estimates</p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-600" />
            Recent Achievements
          </CardTitle>
          <CardDescription>
            Celebrate your math competition milestones!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Zap className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-2">No achievements yet</p>
            <p className="text-sm text-gray-400">Start practicing to unlock achievements and milestones</p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="text-center space-x-4">
        <Button asChild>
          <Link href="/practice">Continue Practice</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/practice/weak-areas">Work on Weak Areas</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/">← Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}