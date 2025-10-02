'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, BookOpen, Clock } from "lucide-react";
import Link from "next/link";
import { PracticeSession } from "@/components/practice/PracticeSession";
import { EXAM_CONFIGS, type ExamType } from "@/constants/examConfig";
import { handleClientResponse, ClientError } from "@/lib/error-handler";
import { PracticeQuestion } from "@/types";

// Simple toast helper (can be replaced with proper toast library later)
const showErrorToast = (_message: string) => {
  // TODO: Replace with proper toast library
};

const apiRequest = async (url: string, options?: RequestInit): Promise<any> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  return await handleClientResponse(response);
};

const handleClientError = (error: unknown): string => {
  if (error instanceof ClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

interface ExamPracticeProps {
  examType: ExamType;
}

export default function ExamPractice({ examType }: ExamPracticeProps) {
  const examConfig = EXAM_CONFIGS[examType];
  const [availableYears, setAvailableYears] = useState<{examYear: number, _count: {id: number}}[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [inPracticeMode, setInPracticeMode] = useState(false);

  // Fetch available years on component mount
  useEffect(() => {
    fetchAvailableYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examType]);

  const fetchAvailableYears = async () => {
    try {
      const response = await apiRequest(`/api/questions/exam/${examConfig.id}/years`);
      const years = response.data || response; // Handle both wrapped and unwrapped responses
      const yearData = years.map((year: number) => ({
        examYear: year,
        _count: { id: 0 } // Will be populated with actual count later
      }));
      setAvailableYears(yearData.sort((a: any, b: any) => b.examYear - a.examYear));
    } catch (error) {
      const errorMessage = handleClientError(error);
      showErrorToast(`Failed to fetch available years: ${errorMessage}`);
    }
  };

  const fetchQuestionsByYear = async (year: number) => {
    setLoading(true);
    try {
      const response = await apiRequest(`/api/questions/exam/${examConfig.id}?year=${year}`);
      const data = response.data || response; // Handle both wrapped and unwrapped responses

      // Fetch solutions for each question
      const questionsWithSolutions = await Promise.all(
        data.map(async (q: any) => {
          let solution = null;
          try {
            const solutionResponse = await apiRequest(`/api/solutions?questionId=${q.id}`);
            solution = solutionResponse.data || solutionResponse;
          } catch (error) {
            // No solution found, that's okay
          }

          return {
            id: q.id,
            text: q.questionText,
            type: q.options && q.options.length > 0 ? 'multiple-choice' as const : 'open-ended' as const,
            competition: `${examConfig.displayName} ${q.examYear}`,
            topic: q.topic,
            difficulty: q.difficulty.toLowerCase(),
            hasImage: q.hasImage,
            imageUrl: q.imageUrl,
            options: q.options?.map((opt: any) => ({
              id: opt.id,
              label: opt.optionLetter,
              text: opt.optionText,
              isCorrect: opt.isCorrect
            })) || [],
            solution: solution
          };
        })
      );

      setQuestions(questionsWithSolutions);
      setInPracticeMode(true);
    } catch (error) {
      const errorMessage = handleClientError(error);
      showErrorToast(`Failed to fetch questions: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePracticeComplete = () => {
    setInPracticeMode(false);
    setSelectedYear(null);
  };

  const handleBackToPractice = () => {
    setInPracticeMode(false);
    setSelectedYear(null);
  };

  if (inPracticeMode && questions.length > 0) {
    return (
      <PracticeSession
        questions={questions}
        sessionType={`${examConfig.displayName} ${selectedYear}`}
        onComplete={handlePracticeComplete}
        competitionType={examType as 'kangaroo' | 'moems' | 'amc8'}
        onBack={handleBackToPractice}
      />
    );
  }

  const IconComponent = examConfig.icon === 'Target' ? Target :
                      examConfig.icon === 'BookOpen' ? BookOpen : Clock;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`p-3 rounded-full bg-${examConfig.color}-100`}>
              <IconComponent className={`h-8 w-8 text-${examConfig.color}-600`} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{examConfig.displayName} Practice</h1>
              <p className="text-gray-600 mt-2">{examConfig.description}</p>
            </div>
          </div>

          <div className="flex justify-center gap-2 mb-6">
            <Link href="/practice">
              <Button variant="outline" size="sm">
                ← Back to Practice
              </Button>
            </Link>
          </div>
        </div>

        {/* Year Selection */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Select Practice Year
              </CardTitle>
              <CardDescription>
                Choose a specific year to practice questions from past {examConfig.displayName} competitions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {availableYears.map((yearData) => (
                  <Button
                    key={yearData.examYear}
                    variant={selectedYear === yearData.examYear ? "default" : "outline"}
                    className="w-full"
                    onClick={() => {
                      setSelectedYear(yearData.examYear);
                      fetchQuestionsByYear(yearData.examYear);
                    }}
                    disabled={loading}
                  >
                    {yearData.examYear}
                  </Button>
                ))}
              </div>

              {availableYears.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No practice years available yet. Check back soon!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Practice Options */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick Practice */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className={`h-5 w-5 text-${examConfig.color}-600`} />
                Quick Practice
              </CardTitle>
              <CardDescription>
                Practice random questions from all years
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Questions:</span>
                  <Badge variant="secondary">Random Mix</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Time:</span>
                  <Badge variant="outline">No Limit</Badge>
                </div>
                <Link href="/practice/quick">
                  <Button className="w-full mt-4">Start Quick Practice</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Weak Areas */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className={`h-5 w-5 text-${examConfig.color}-600`} />
                Weak Areas
              </CardTitle>
              <CardDescription>
                Focus on topics you need to improve
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Focus:</span>
                  <Badge variant="destructive">Needs Work</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Adaptive:</span>
                  <Badge variant="outline">Yes</Badge>
                </div>
                <Link href="/practice/weak-areas">
                  <Button className="w-full mt-4">Practice Weak Areas</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Full Simulation (only for AMC8) */}
          {examConfig.hasSimulation && (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className={`h-5 w-5 text-${examConfig.color}-600`} />
                  Full Simulation
                </CardTitle>
                <CardDescription>
                  Complete timed practice exam
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Questions:</span>
                    <Badge variant="secondary">{examConfig.totalQuestions}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Time:</span>
                    <Badge variant="outline">{examConfig.totalQuestions! * examConfig.timePerQuestion!} min</Badge>
                  </div>
                  <Link href={`/practice/${examConfig.id}/simulation`}>
                    <Button className="w-full mt-4">Start Full Simulation</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Solutions */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className={`h-5 w-5 text-${examConfig.color}-600`} />
                Detailed Solutions
              </CardTitle>
              <CardDescription>
                Browse questions with complete solutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Mode:</span>
                  <Badge variant="secondary">Study Mode</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Solutions:</span>
                  <Badge variant="outline">Full Details</Badge>
                </div>
                <Link href={`/practice/${examConfig.id}/solutions`}>
                  <Button className="w-full mt-4">View Solutions</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}