'use client';

import { useState, useEffect } from "react";
import { PracticeSession } from "@/components/practice/PracticeSession";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'open-ended';
  competition: string;
  topic: string;
  difficulty: string;
  options?: Array<{
    id: string;
    label: string;
    text: string;
    isCorrect: boolean;
  }>;
  solutions?: Array<{
    id: string;
    text: string;
    type: string;
  }>;
}

interface SessionResult {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

export default function QuickPracticePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/questions?limit=25');

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      // Map API response to frontend interface
      const mappedQuestions = (data.questions || []).map((q: any) => ({
        id: q.id,
        text: q.questionText,
        type: q.type === 'open-ended' ? 'open-ended' : 'multiple-choice',
        competition: q.examName,
        topic: q.topic,
        difficulty: q.difficulty,
        options: q.options?.map((opt: any) => ({
          id: opt.id,
          label: opt.optionLetter,
          text: opt.optionText,
          isCorrect: opt.isCorrect
        })),
        solutions: q.solution ? [{
          id: q.solution.id,
          text: q.solution.solutionText,
          type: q.solution.type
        }] : []
      }));
      setQuestions(mappedQuestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionComplete = (results: SessionResult[]) => {
    console.log('Session completed with results:', results);
    // Results are already saved to database via the PracticeSession component
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading questions...</p>
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
          <CardContent>
            <Button onClick={fetchQuestions} className="w-full">
              Try Again
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
              There are no questions in the database yet. Please upload some documents first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/upload">Upload Documents</a>
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
            <CardTitle className="text-3xl">Quick Practice Session</CardTitle>
            <CardDescription className="text-lg">
              Ready to practice random math problems?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
                <div className="text-sm text-gray-600">Questions Ready</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">Mixed</div>
                <div className="text-sm text-gray-600">Difficulty Levels</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">What to expect:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Mix of multiple choice and open-ended questions</li>
                <li>• Questions from AMC 8, MOEMS, and Math Kangaroo</li>
                <li>• Immediate feedback after each question</li>
                <li>• Progress tracking and performance analytics</li>
              </ul>
            </div>

            <Button
              onClick={() => setSessionStarted(true)}
              className="w-full"
              size="lg"
            >
              Start Practice Session
            </Button>

            <div className="text-center">
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
      questions={questions}
      sessionType="Quick Practice"
      onComplete={handleSessionComplete}
    />
  );
}