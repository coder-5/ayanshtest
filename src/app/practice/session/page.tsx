'use client';

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PracticeSession } from "@/components/practice/PracticeSession";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen } from "lucide-react";
import { usePracticeProgress } from "@/hooks/useLocalStorage";
import { PracticeQuestion } from "@/types";
import { transformQuestionForPractice } from "@/utils/questionTransforms";

interface SessionResult {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

export default function TopicSessionPage() {
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [progress, setProgress] = usePracticeProgress();

  const searchParams = useSearchParams();
  const topic = searchParams.get('topic') || '';
  const difficulty = searchParams.get('difficulty') || '';

  useEffect(() => {
    if (topic) {
      fetchQuestions();
    }
  }, [topic, difficulty]);

  // Memoize shuffled questions to avoid re-shuffling on re-renders
  const shuffledQuestions = useMemo(() => {
    if (questions.length === 0) return [];

    // Fisher-Yates shuffle algorithm
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 15); // Take first 15 for topic practice
  }, [questions]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        topic: topic,
        limit: '50' // Fetch more so we have a good pool to shuffle from
      });

      if (difficulty && difficulty !== 'all') {
        params.append('difficulty', difficulty);
      }

      const response = await fetch(`/api/questions?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error('Invalid response format');
      }

      // Map API response to frontend interface
      const mappedQuestions = (data.data || []).map(transformQuestionForPractice);

      setQuestions(mappedQuestions);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionComplete = (results: SessionResult[]) => {

    // Update local progress tracking
    const correctAnswers = results.filter(r => r.isCorrect).length;
    const totalTime = results.reduce((sum, r) => sum + r.timeSpent, 0);

    setProgress(prev => ({
      ...prev,
      sessionsCompleted: prev.sessionsCompleted + 1,
      totalQuestionsAnswered: prev.totalQuestionsAnswered + results.length,
      correctAnswers: prev.correctAnswers + correctAnswers,
      averageTimePerQuestion: (prev.averageTimePerQuestion * prev.totalQuestionsAnswered + totalTime) /
                             (prev.totalQuestionsAnswered + results.length),
      lastSessionDate: new Date().toISOString()
    }));
  };

  if (!topic) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Missing Topic</CardTitle>
            <CardDescription>No topic was specified for this practice session.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/practice/topics">← Choose a Topic</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading {topic} questions...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={fetchQuestions} className="w-full">
              Try Again
            </Button>
            <Button variant="ghost" asChild className="w-full">
              <a href="/practice/topics">← Choose Different Topic</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>No Questions Available</CardTitle>
            <CardDescription>
              There are no {topic} questions{difficulty && difficulty !== 'all' ? ` at ${difficulty} difficulty` : ''} available yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <a href="/upload">Upload More Documents</a>
            </Button>
            <Button variant="ghost" asChild className="w-full">
              <a href="/practice/topics">← Choose Different Topic</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sessionStarted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl flex items-center justify-center gap-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              {topic.replace(' Practice', '')} Practice Session
            </CardTitle>
            <CardDescription className="text-lg">
              Ready to practice {topic.replace(' Practice', '')} problems{difficulty && difficulty !== 'all' ? ` at ${difficulty} difficulty` : ''}?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Session Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Session Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="font-medium">Topic:</span>
                  <Badge variant="secondary" className="ml-2">{topic}</Badge>
                </div>
                <div>
                  <span className="font-medium">Difficulty:</span>
                  <Badge variant="secondary" className="ml-2">
                    {difficulty && difficulty !== 'all' ? difficulty : 'All Levels'}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Questions:</span>
                  <Badge variant="secondary" className="ml-2">{shuffledQuestions.length}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{shuffledQuestions.length}</div>
                <div className="text-sm text-gray-600">Questions Ready</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{progress.sessionsCompleted}</div>
                <div className="text-sm text-gray-600">Sessions Completed</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {progress.totalQuestionsAnswered > 0 ?
                    Math.round((progress.correctAnswers / progress.totalQuestionsAnswered) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">Overall Accuracy</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">What to expect:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Topic-focused practice:</strong> All questions are about {topic}</li>
                <li>• Mix of multiple choice and open-ended questions</li>
                <li>• Questions from various competitions (AMC 8, MOEMS, Math Kangaroo, etc.)</li>
                <li>• Immediate feedback after each question</li>
                <li>• Detailed solutions to help you learn</li>
              </ul>
            </div>

            <Button
              onClick={() => setSessionStarted(true)}
              className="w-full"
              size="lg"
            >
              Start {topic} Practice
            </Button>

            <div className="text-center space-y-2">
              <Button variant="ghost" asChild>
                <a href="/practice/topics">← Choose Different Topic</a>
              </Button>
              <br />
              <Button variant="ghost" asChild>
                <a href="/practice">← Back to Practice Options</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PracticeSession
      questions={shuffledQuestions}
      sessionType={`${topic} Practice`}
      onComplete={handleSessionComplete}
    />
  );
}