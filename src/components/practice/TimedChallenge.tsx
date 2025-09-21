'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, ArrowLeft, Flag } from 'lucide-react';
import { QuestionCard } from './QuestionCard';
import { PracticeQuestion } from '@/types';
import { formatTimeRemaining } from '@/utils/timeUtils';

interface ChallengeConfig {
  examType: string;
  duration: number; // in minutes
  questionCount: number;
  difficulty?: string;
}

interface TimedChallengeProps {
  config: ChallengeConfig;
  onComplete: (results: ChallengeResults) => void;
  onBack: () => void;
}

interface ChallengeResults {
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  accuracy: number;
  questionsPerMinute: number;
  results: Array<{
    questionId: string;
    isCorrect: boolean;
    timeSpent: number;
    userAnswer: string;
  }>;
}

export function TimedChallenge({ config, onComplete, onBack }: TimedChallengeProps) {
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(config.duration * 60); // in seconds
  const [isActive, setIsActive] = useState(false);
  const [challengeResults, setChallengeResults] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [challengeComplete, setChallengeComplete] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const startTime = useRef<number>(Date.now());
  const questionStartTime = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch questions when component mounts
  useEffect(() => {
    fetchQuestions();
  }, [config]);

  // Timer logic
  useEffect(() => {
    if (isActive && timeRemaining > 0 && !challengeComplete) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime <= 60 && newTime > 0) {
            setShowWarning(true);
          }
          if (newTime <= 0) {
            finishChallenge();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, timeRemaining, challengeComplete]);

  // Show warning when time is running low
  useEffect(() => {
    if (showWarning) {
      const timeout = setTimeout(() => setShowWarning(false), 3000);
      return () => clearTimeout(timeout);
    }
    return () => {}; // Always return a cleanup function
  }, [showWarning]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const url = config.examType === 'mixed'
        ? `/api/questions?limit=${config.questionCount}&random=true`
        : `/api/questions/exam/${config.examType}?limit=${config.questionCount}&random=true`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Handle different response formats
      let questionsArray;
      if (Array.isArray(data)) {
        questionsArray = data;
      } else if (data.data && Array.isArray(data.data)) {
        questionsArray = data.data;
      } else if (data.questions && Array.isArray(data.questions)) {
        questionsArray = data.questions;
      } else {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format: expected array of questions');
      }

      const processedQuestions = questionsArray.map((q: any) => ({
        ...q,
        type: q.options && q.options.length > 0 ? 'multiple-choice' : 'open-ended',
        text: q.questionText || q.text,
        questionText: q.questionText || q.text,
        // Ensure options are properly structured
        options: q.options || []
      }));

      setQuestions(processedQuestions);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const startChallenge = () => {
    setIsActive(true);
    startTime.current = Date.now();
    questionStartTime.current = Date.now();
  };

  const handleAnswer = async (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    const questionTime = Math.floor((Date.now() - questionStartTime.current) / 1000);

    // Determine if answer is correct
    let isCorrect = false;
    if (currentQuestion.type === 'multiple-choice' && currentQuestion.options) {
      const correctOption = currentQuestion.options.find(opt => opt.isCorrect);
      isCorrect = answer === correctOption?.label;
    }

    const result = {
      questionId: currentQuestion.id,
      isCorrect,
      timeSpent: questionTime,
      userAnswer: answer,
      excludeFromScoring: false
    };

    setChallengeResults(prev => [...prev, result]);

    // Save progress to database
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          isCorrect,
          timeSpent: questionTime,
          userAnswer: answer,
          excludeFromScoring: false
        })
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }

    // Move to next question or finish
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      questionStartTime.current = Date.now();
    } else {
      finishChallenge();
    }
  };

  const finishChallenge = () => {
    setIsActive(false);
    setChallengeComplete(true);

    const totalTimeSpent = Math.floor((Date.now() - startTime.current) / 1000);
    const correctCount = challengeResults.filter(r => r.isCorrect).length;
    const accuracy = challengeResults.length > 0 ? (correctCount / challengeResults.length) * 100 : 0;
    const questionsPerMinute = challengeResults.length > 0 ? (challengeResults.length / (totalTimeSpent / 60)) : 0;

    const results: ChallengeResults = {
      totalQuestions: challengeResults.length,
      correctAnswers: correctCount,
      timeSpent: totalTimeSpent,
      accuracy,
      questionsPerMinute,
      results: challengeResults
    };

    onComplete(results);
  };

  // Using centralized formatTimeRemaining utility

  const getTimeColor = () => {
    if (timeRemaining <= 60) return 'text-red-600';
    if (timeRemaining <= 300) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading your timed challenge...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">No Questions Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p>We couldn't find enough questions for this challenge. Please try a different exam type or reduce the number of questions.</p>
            <Button onClick={onBack} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isActive && !challengeComplete) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Ready to Start?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{config.questionCount}</div>
                <div className="text-sm text-blue-700">Questions</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{config.duration}</div>
                <div className="text-sm text-green-700">Minutes</div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Important!</span>
              </div>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Once you click start, the timer begins immediately</li>
                <li>• You cannot pause or restart the challenge</li>
                <li>• Make sure you're in a quiet environment</li>
                <li>• All questions must be attempted to get accurate results</li>
              </ul>
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={onBack} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={startChallenge} size="lg" className="bg-red-600 hover:bg-red-700">
                <Clock className="h-4 w-4 mr-2" />
                Start Challenge
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Warning Banner */}
      {showWarning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Time running out!</span>
          </div>
        </div>
      )}

      {/* Timer and Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <div className={`text-3xl font-bold ${getTimeColor()}`}>
              {formatTimeRemaining(timeRemaining)}
            </div>
            <Badge variant="outline" className="text-sm">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Correct:</span>
            <span className="font-bold text-green-600">
              {challengeResults.filter(r => r.isCorrect).length}
            </span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <QuestionCard
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        timeElapsed={Math.floor((Date.now() - questionStartTime.current) / 1000)}
        onAnswer={handleAnswer}
        showSolution={false}
        hideNextButton={true}
      />

      {/* Emergency Exit */}
      <div className="mt-6 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={finishChallenge}
          className="text-red-600 hover:text-red-700"
        >
          <Flag className="h-4 w-4 mr-2" />
          End Challenge Early
        </Button>
      </div>
    </div>
  );
}