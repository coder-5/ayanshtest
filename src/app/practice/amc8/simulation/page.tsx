'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, Circle, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Question {
  id: string;
  questionText: string;
  examYear: number;
  questionNumber: string;
  topic: string;
  options: {
    id: string;
    optionLetter: string;
    optionText: string;
    isCorrect: boolean;
  }[];
}

interface SimulationState {
  questions: Question[];
  currentQuestionIndex: number;
  answers: { [questionId: string]: string };
  timeLeft: number;
  isStarted: boolean;
  isFinished: boolean;
}

export default function AMC8SimulationPage() {
  const [simulation, setSimulation] = useState<SimulationState>({
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
    timeLeft: 40 * 60, // 40 minutes in seconds
    isStarted: false,
    isFinished: false
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSimulationQuestions();
  }, []);

  useEffect(() => {
    if (simulation.isStarted && !simulation.isFinished && simulation.timeLeft > 0) {
      const timer = setInterval(() => {
        setSimulation(prev => {
          if (prev.timeLeft <= 1) {
            return { ...prev, timeLeft: 0, isFinished: true };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [simulation.isStarted, simulation.isFinished, simulation.timeLeft]);

  const fetchSimulationQuestions = async () => {
    try {
      const response = await fetch('/api/questions?examName=AMC 8&limit=25&random=true');
      const data = await response.json();

      if (data.questions && data.questions.length >= 25) {
        setSimulation(prev => ({
          ...prev,
          questions: data.questions.slice(0, 25)
        }));
      }
    } catch (error) {
      console.error('Failed to fetch simulation questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSimulation = () => {
    setSimulation(prev => ({ ...prev, isStarted: true }));
  };

  const selectAnswer = (questionId: string, optionLetter: string) => {
    setSimulation(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: optionLetter }
    }));
  };

  const nextQuestion = () => {
    setSimulation(prev => ({
      ...prev,
      currentQuestionIndex: Math.min(prev.currentQuestionIndex + 1, prev.questions.length - 1)
    }));
  };

  const previousQuestion = () => {
    setSimulation(prev => ({
      ...prev,
      currentQuestionIndex: Math.max(prev.currentQuestionIndex - 1, 0)
    }));
  };

  const finishSimulation = async () => {
    setSimulation(prev => ({ ...prev, isFinished: true }));

    // Submit answers to database
    for (const question of simulation.questions) {
      const userAnswer = simulation.answers[question.id];
      if (userAnswer) {
        const correctOption = question.options.find(opt => opt.isCorrect);
        const isCorrect = userAnswer === correctOption?.optionLetter;

        try {
          await fetch('/api/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questionId: question.id,
              isCorrect,
              timeSpent: 0, // We don't track individual question time in simulation
              userAnswer
            })
          });
        } catch (error) {
          console.error('Failed to save progress:', error);
        }
      }
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const calculateScore = () => {
    let correct = 0;
    simulation.questions.forEach(question => {
      const userAnswer = simulation.answers[question.id];
      const correctOption = question.options.find(opt => opt.isCorrect);
      if (userAnswer === correctOption?.optionLetter) {
        correct++;
      }
    });
    return correct;
  };

  const progress = ((simulation.currentQuestionIndex + 1) / simulation.questions.length) * 100;
  const currentQuestion = simulation.questions[simulation.currentQuestionIndex];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Loading AMC 8 Simulation...</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (simulation.questions.length < 25) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Insufficient Questions</CardTitle>
            <CardDescription>
              We need at least 25 AMC 8 questions to run a full simulation, but only found {simulation.questions.length}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/upload">Upload More AMC 8 Documents</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!simulation.isStarted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-blue-600">AMC 8 Full Simulation</CardTitle>
            <CardDescription className="text-lg">
              Complete 25-question AMC 8 exam with 40-minute timer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">25</div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">40</div>
                <div className="text-sm text-gray-600">Minutes</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">A-E</div>
                <div className="text-sm text-gray-600">Multiple Choice</div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="text-gray-600">
                This simulation closely mimics the real AMC 8 exam experience.
                You'll have 40 minutes to complete 25 multiple choice questions.
              </p>
              <Button onClick={startSimulation} size="lg" className="px-8">
                Start Simulation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (simulation.isFinished) {
    const score = calculateScore();
    const percentage = Math.round((score / 25) * 100);

    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-green-600">Simulation Complete!</CardTitle>
            <CardDescription>Your AMC 8 simulation results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-blue-600 mb-2">{score}/25</div>
              <div className="text-xl text-gray-600">{percentage}% Correct</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{score}</div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{25 - score}</div>
                <div className="text-sm text-gray-600">Incorrect</div>
              </div>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/practice/amc8/simulation">Try Another Simulation</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/progress">View Detailed Progress</Link>
              </Button>
              <Button variant="ghost" asChild className="w-full">
                <Link href="/practice/amc8">← Back to AMC 8 Practice</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Timer and Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-lg px-3 py-1">
              AMC 8 Simulation
            </Badge>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className={`text-xl font-bold ${simulation.timeLeft < 300 ? 'text-red-600' : 'text-blue-600'}`}>
                {formatTime(simulation.timeLeft)}
              </span>
            </div>
          </div>
          <Button onClick={finishSimulation} variant="outline">
            Finish Simulation
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Question {simulation.currentQuestionIndex + 1} of 25</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Question Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">
                Question {simulation.currentQuestionIndex + 1}
              </CardTitle>
              <CardDescription>
                {currentQuestion?.topic} • AMC 8 {currentQuestion?.examYear}
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {currentQuestion?.questionNumber}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-lg mb-6 leading-relaxed">
            {currentQuestion?.questionText}
          </p>

          <div className="space-y-3">
            {currentQuestion?.options.map((option) => (
              <button
                key={option.id}
                onClick={() => selectAnswer(currentQuestion.id, option.optionLetter)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  simulation.answers[currentQuestion.id] === option.optionLetter
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    simulation.answers[currentQuestion.id] === option.optionLetter
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {simulation.answers[currentQuestion.id] === option.optionLetter && (
                      <CheckCircle className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <span className="font-semibold text-blue-600 mr-2">
                    {option.optionLetter}.
                  </span>
                  <span>{option.optionText}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          onClick={previousQuestion}
          variant="outline"
          disabled={simulation.currentQuestionIndex === 0}
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {simulation.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setSimulation(prev => ({ ...prev, currentQuestionIndex: index }))}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                index === simulation.currentQuestionIndex
                  ? 'bg-blue-600 text-white'
                  : simulation.answers[simulation.questions[index]?.id]
                  ? 'bg-green-100 text-green-600 border border-green-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <Button
          onClick={nextQuestion}
          disabled={simulation.currentQuestionIndex === simulation.questions.length - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
}