'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Target, Zap, Brain, Trophy, Loader2 } from "lucide-react";
import Link from "next/link";

interface QuestionCounts {
  total: number;
  amc8: number;
  moems: number;
  kangaroo: number;
}

export default function PracticePage() {
  const [counts, setCounts] = useState<QuestionCounts>({ total: 0, amc8: 0, moems: 0, kangaroo: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestionCounts();
  }, []);

  const fetchQuestionCounts = async () => {
    try {
      const response = await fetch('/api/question-counts');
      const data = await response.json();
      setCounts(data);
    } catch (error) {
      console.error('Failed to fetch question counts:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Practice Mode 🎯
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Choose your practice style and start solving math competition problems!
        </p>
      </div>

      {/* Quick Stats */}
      <div className="text-center py-8 text-gray-500 mb-8">
        <p>Your practice statistics will appear here</p>
        <p className="text-sm">Start practicing to see your progress and achievements</p>
      </div>

      {/* Practice Modes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Quick Practice */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Quick Practice
            </CardTitle>
            <CardDescription>
              Jump into random problems from your level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Questions:</span>
                <Badge variant="secondary">Random selection</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Difficulty:</span>
                <Badge variant="secondary">Mixed levels</Badge>
              </div>
              <Button className="w-full" asChild>
                <Link href="/practice/quick">Start Quick Practice</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AMC 8 Practice */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              AMC 8 Practice
            </CardTitle>
            <CardDescription>
              Focus on AMC 8 competition problems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Available:</span>
                {loading ? (
                  <Badge variant="secondary"><Loader2 className="h-3 w-3 animate-spin" /></Badge>
                ) : (
                  <Badge variant="secondary">{counts.amc8} problems</Badge>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Format:</span>
                <Badge variant="secondary">Multiple Choice</Badge>
              </div>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/practice/amc8">Practice AMC 8</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* MOEMS Practice */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              MOEMS Practice
            </CardTitle>
            <CardDescription>
              Mathematical Olympiad problems with detailed solutions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Available:</span>
                {loading ? (
                  <Badge variant="secondary"><Loader2 className="h-3 w-3 animate-spin" /></Badge>
                ) : (
                  <Badge variant="secondary">{counts.moems} problems</Badge>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Format:</span>
                <Badge variant="secondary">Open-ended</Badge>
              </div>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/practice/moems">Practice MOEMS</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Math Kangaroo Practice */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-orange-600" />
              Math Kangaroo
            </CardTitle>
            <CardDescription>
              Grade-appropriate Math Kangaroo problems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Available:</span>
                {loading ? (
                  <Badge variant="secondary"><Loader2 className="h-3 w-3 animate-spin" /></Badge>
                ) : (
                  <Badge variant="secondary">{counts.kangaroo} problems</Badge>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Level:</span>
                <Badge variant="secondary">Grade 5-6</Badge>
              </div>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/practice/kangaroo">Practice Kangaroo</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Timed Challenge */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-600" />
              Timed Challenge
            </CardTitle>
            <CardDescription>
              Real competition timing with full simulations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">AMC 8:</span>
                <Badge variant="secondary">40 minutes</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">MOEMS:</span>
                <Badge variant="secondary">30 minutes</Badge>
              </div>
              <Button className="w-full" variant="outline" disabled>
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Weak Areas */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Improve Weak Areas
            </CardTitle>
            <CardDescription>
              Focus on topics where you need more practice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Topics:</span>
                <Badge variant="secondary">Based on performance</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Focus:</span>
                <Badge variant="secondary">Improvement areas</Badge>
              </div>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/practice/weak-areas">Target Weak Areas</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Recent Activity */}
      <Card className="mt-12">
        <CardHeader>
          <CardTitle>Continue Where You Left Off</CardTitle>
          <CardDescription>Resume your recent practice sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No recent practice sessions</p>
            <p className="text-sm">Start practicing to see your recent activity here</p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-8 text-center">
        <Button variant="ghost" asChild>
          <Link href="/">← Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}