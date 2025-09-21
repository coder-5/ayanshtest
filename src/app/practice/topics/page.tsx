'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Play, RefreshCw } from "lucide-react";
import { LoadingSkeleton } from "@/components/ui/loading";
import { InlineError } from "@/components/ui/error-display";
import Link from "next/link";

interface TopicCount {
  topic: string;
  count: number;
}

export default function TopicPracticePage() {
  const [topics, setTopics] = useState<TopicCount[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/topics');

      if (!response.ok) {
        throw new Error('Failed to fetch topics');
      }

      const data = await response.json();
      setTopics(data);
    } catch (error) {
      console.error('Failed to fetch topics:', error);
      setError(error instanceof Error ? error.message : 'Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = () => {
    if (!selectedTopic) return;

    const searchParams = new URLSearchParams({
      topic: selectedTopic,
      difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : ''
    });

    window.location.href = `/practice/session?${searchParams.toString()}`;
  };

  const getTopicDescription = (topic: string) => {
    const descriptions: Record<string, string> = {
      'Algebra': 'Linear equations, quadratic equations, polynomials, and algebraic manipulation',
      'Geometry': 'Shapes, angles, area, perimeter, volume, and geometric theorems',
      'Number Theory': 'Prime numbers, divisibility, modular arithmetic, and number properties',
      'Combinatorics': 'Counting principles, permutations, combinations, and probability',
      'Arithmetic': 'Basic operations, fractions, decimals, and percentages',
      'Logic': 'Logical reasoning, patterns, and problem-solving strategies',
      'Mixed': 'Various topics combined in a single problem'
    };
    return descriptions[topic] || 'Practice problems in this mathematical topic';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Practice by Topic</h1>
          <LoadingSkeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <LoadingSkeleton className="h-6 w-32" />
                <LoadingSkeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <LoadingSkeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Practice by Topic 📚
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Choose a specific math topic to focus your practice on. Questions come from all competitions in our database.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-8">
          <InlineError
            message={error}
            type="error"
          />
          <div className="text-center mt-4">
            <Button onClick={fetchTopics} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Quick Practice Section */}
      {!error && (
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-600" />
              Quick Topic Practice
            </CardTitle>
            <CardDescription>
              Select a topic and difficulty to start practicing immediately
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Choose Topic
                </label>
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a topic..." />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((topic) => (
                      <SelectItem key={topic.topic} value={topic.topic}>
                        {topic.topic} ({topic.count} questions)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Difficulty Level
                </label>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleStartPractice}
                disabled={!selectedTopic}
                className="w-full"
              >
                Start Practice
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Topics Grid */}
      {!error && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topicData) => (
              <Card key={topicData.topic} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      {topicData.topic}
                    </span>
                    <Badge variant="secondary">{topicData.count}</Badge>
                  </CardTitle>
                  <CardDescription className="min-h-[3rem]">
                    {getTopicDescription(topicData.topic)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Questions:</span>
                      <Badge variant="outline">{topicData.count} available</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Source:</span>
                      <Badge variant="outline">All competitions</Badge>
                    </div>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => {
                        setSelectedTopic(topicData.topic);
                        setSelectedDifficulty('all');
                        handleStartPractice();
                      }}
                    >
                      Practice {topicData.topic}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 text-center">
        <Button variant="ghost" asChild>
          <Link href="/practice">← Back to Practice</Link>
        </Button>
      </div>
    </div>
  );
}