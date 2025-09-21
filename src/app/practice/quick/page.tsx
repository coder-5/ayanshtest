'use client';

import { useState, useEffect, useMemo } from "react";
import { PracticeSession } from "@/components/practice/PracticeSession";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { usePracticeProgress } from "@/hooks/useLocalStorage";
import { PracticeQuestion } from "@/types";
import { transformQuestionForPractice } from "@/utils/questionTransforms";

interface SessionResult {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

export default function QuickPracticePage() {
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [progress, setProgress] = usePracticeProgress();
  const [roundInfo, setRoundInfo] = useState<any>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Memoize shuffled questions to avoid re-shuffling on re-renders
  const shuffledQuestions = useMemo(() => {
    if (questions.length === 0) return [];

    // Fisher-Yates shuffle algorithm
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 10); // Take first 10 for quick practice
  }, [questions]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      // Use smart selection API to ensure no repeats until all questions attempted
      const response = await fetch('/api/questions/smart-selection?examType=mixed&limit=10&sessionType=practice');

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error('Invalid response format');
      }

      // Map API response to frontend interface - fix PracticeSession data structure
      const mappedQuestions = (data.data || []).map(transformQuestionForPractice);

      setQuestions(mappedQuestions);
      setRoundInfo(data.roundInfo);

      // Log round information for user awareness
      if (data.message) {
        console.log('Round Status:', data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionComplete = (results: SessionResult[]) => {
    console.log('Session completed with results:', results);

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
            {/* Round Information */}
            {roundInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-800 mb-2">Practice Round Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Current Round:</span> {roundInfo.roundNumber}
                  </div>
                  <div>
                    <span className="font-medium">Progress:</span> {roundInfo.attemptedInRound}/{roundInfo.totalQuestionsInRound}
                  </div>
                  <div>
                    <span className="font-medium">Completed Rounds:</span> {roundInfo.completedRounds}
                  </div>
                </div>
              </div>
            )}

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
                <div className="text-sm text-gray-600">Accuracy Rate</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">What to expect:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Round-based practice:</strong> All questions attempted once before any repeats</li>
                <li>• Mix of multiple choice and open-ended questions</li>
                <li>• Questions from AMC 8, MOEMS, and Math Kangaroo</li>
                <li>• Immediate feedback after each question</li>
                <li>• Intelligent selection prioritizes unattempted questions</li>
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
      questions={shuffledQuestions}
      sessionType="Quick"
      onComplete={handleSessionComplete}
    />
  );
}