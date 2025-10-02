'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { EXAM_CONFIGS, type ExamType } from "@/constants/examConfig";
import { isValidExamType } from "@/constants/examTypes";
import { notFound } from "next/navigation";
import SolutionVisualizer from "@/components/practice/SolutionVisualizer";
import { handleClientResponse } from "@/lib/error-handler";

interface Question {
  id: string;
  questionText: string;
  examYear: number;
  questionNumber: string;
  topic: string;
  difficulty: string;
  options: {
    id: string;
    optionLetter: string;
    optionText: string;
    isCorrect: boolean;
  }[];
  solution?: {
    solutionText: string;
    approach?: string;
    keyInsights?: string;
    timeEstimate?: number;
    commonMistakes?: string;
    alternativeApproaches?: string;
  };
}

interface Props {
  params: Promise<{
    examType: string;
  }>;
}

export default function SolutionsPage({ params }: Props) {
  const [resolvedParams, setResolvedParams] = useState<{ examType: string } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Resolve params
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const examType = resolvedParams?.examType;

  // Validate exam type
  if (examType && !isValidExamType(examType)) {
    notFound();
  }

  const examConfig = examType ? EXAM_CONFIGS[examType as ExamType] : null;

  useEffect(() => {
    if (examConfig) {
      fetchAvailableYears();
    }
  }, [examConfig]);

  useEffect(() => {
    if (examConfig) {
      fetchQuestions();
    }
  }, [examConfig, selectedYear]);

  const apiRequest = async (url: string): Promise<any> => {
    const response = await fetch(url);
    return await handleClientResponse(response);
  };


  const fetchAvailableYears = async () => {
    try {
      const response = await apiRequest(`/api/questions/exam/${examConfig!.id}/years`);
      const years = response.data || response;
      setAvailableYears(years.sort((a: number, b: number) => b - a));
    } catch (error) {
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const yearParam = selectedYear === 'all' ? '' : `?year=${selectedYear}`;
      const response = await apiRequest(`/api/questions/exam/${examConfig!.id}${yearParam}`);
      const data = response.data || response;

      // Transform questions and add mock solutions for demonstration
      const transformedQuestions = data.map((q: any) => ({
        id: q.id,
        questionText: q.questionText,
        examYear: q.examYear,
        questionNumber: q.questionNumber,
        topic: q.topic,
        difficulty: q.difficulty,
        options: q.options || [],
        solution: generateMockSolution(q) // Generate demo solutions
      }));

      setQuestions(transformedQuestions);
      setCurrentQuestionIndex(0);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Generate mock solutions for demonstration
  const generateMockSolution = (question: any) => {
    const correctOption = question.options?.find((opt: any) => opt.isCorrect);

    return {
      solutionText: `Step 1: Analyze the problem carefully.

Step 2: Identify the key information given in the problem.

Step 3: Apply the appropriate mathematical concepts and formulas.

Step 4: Calculate the result step by step.

Step 5: Verify the answer makes sense in context.

The correct answer is ${correctOption?.optionLetter || 'provided'}: ${correctOption?.optionText || 'See detailed explanation above'}.`,
      approach: `This is a ${question.topic.toLowerCase()} problem that requires understanding of fundamental concepts. The key is to break down the problem systematically.`,
      keyInsights: `Look for patterns in the given information. Pay attention to units and constraints. Double-check calculations.`,
      timeEstimate: question.difficulty === 'EASY' ? 2 : question.difficulty === 'MEDIUM' ? 4 : 6,
      commonMistakes: `Rushing through calculations, Misreading the problem statement, Forgetting to check units`,
      alternativeApproaches: `Visual approach using diagrams, Algebraic manipulation, Working backwards from answer choices`
    };
  };

  if (!resolvedParams) {
    return <div>Loading...</div>;
  }

  if (!examConfig) {
    notFound();
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`p-3 rounded-full bg-${examConfig.color}-100`}>
              <BookOpen className={`h-8 w-8 text-${examConfig.color}-600`} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{examConfig.displayName} Detailed Solutions</h1>
              <p className="text-gray-600 mt-2">Study complete solutions with explanations</p>
            </div>
          </div>

          <div className="flex justify-center gap-2 mb-6">
            <Link href={`/practice/${examConfig.id}`}>
              <Button variant="outline" size="sm">
                ← Back to Practice
              </Button>
            </Link>
          </div>
        </div>

        {/* Year Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter by Year</CardTitle>
            <CardDescription>
              Select a specific year or view all available questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <span className="ml-2">Loading solutions...</span>
            </CardContent>
          </Card>
        ) : questions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No questions found for the selected criteria.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Question Navigation */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </h2>
                    <Badge variant="secondary">
                      {currentQuestion?.topic}
                    </Badge>
                    <Badge variant={
                      currentQuestion?.difficulty === 'EASY' ? 'default' :
                      currentQuestion?.difficulty === 'MEDIUM' ? 'secondary' : 'destructive'
                    }>
                      {currentQuestion?.difficulty}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNext}
                      disabled={currentQuestionIndex === questions.length - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Question Tracker */}
                <div className="flex gap-1 overflow-x-auto pb-2">
                  {questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`min-w-[2rem] h-8 rounded text-sm font-medium transition-colors ${
                        index === currentQuestionIndex
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Current Question */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Question {currentQuestion?.questionNumber}</span>
                  <Badge variant="outline">
                    {examConfig.displayName} {currentQuestion?.examYear}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none mb-6">
                  <p className="text-lg leading-relaxed">
                    {currentQuestion?.questionText}
                  </p>
                </div>

                {/* Answer Choices */}
                {currentQuestion?.options && currentQuestion.options.length > 0 && (
                  <div className="space-y-3 mb-6">
                    <h4 className="font-semibold text-gray-900">Answer Choices:</h4>
                    <div className="grid gap-2">
                      {currentQuestion.options.map((option) => (
                        <div
                          key={option.id}
                          className={`p-3 rounded-lg border ${
                            option.isCorrect
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`font-semibold ${
                              option.isCorrect ? 'text-green-600' : 'text-gray-600'
                            }`}>
                              {option.optionLetter}.
                            </span>
                            <span className={option.isCorrect ? 'text-green-700' : 'text-gray-700'}>
                              {option.optionText}
                            </span>
                            {option.isCorrect && (
                              <Badge variant="default" className="ml-auto">
                                Correct Answer
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detailed Solution */}
            {currentQuestion?.solution && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-blue-800">Detailed Solution</CardTitle>
                  <CardDescription>
                    Complete step-by-step explanation with insights and tips
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SolutionVisualizer
                    solution={currentQuestion.solution}
                    questionText={currentQuestion.questionText}
                  />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}