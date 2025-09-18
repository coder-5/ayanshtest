'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, BookOpen, Star } from "lucide-react";
import Link from "next/link";
import { PracticeSession } from "@/components/practice/PracticeSession";

interface Question {
  id: string;
  questionText: string;
  examName: string;
  examYear: number;
  questionNumber: string;
  difficulty: string;
  topic: string;
  subtopic: string;
  hasImage: boolean;
  timeLimit: number | null;
}

export default function KangarooPracticePage() {
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [inPracticeMode, setInPracticeMode] = useState(false);

  // Fetch available years on component mount
  useEffect(() => {
    fetchAvailableYears();
  }, []);

  const fetchAvailableYears = async () => {
    try {
      const response = await fetch('/api/questions/kangaroo/years');
      if (response.ok) {
        const years = await response.json();
        setAvailableYears(years.sort((a: number, b: number) => b - a));
      }
    } catch (error) {
      console.error('Failed to fetch available years:', error);
    }
  };

  const fetchQuestionsByYear = async (year: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/questions/kangaroo?year=${year}`);
      if (response.ok) {
        const data = await response.json();
        const transformedQuestions = data.map((q: Question) => ({
          id: q.id,
          text: q.questionText,
          type: 'multiple-choice' as const,
          competition: `Math Kangaroo ${q.examYear}`,
          topic: q.topic,
          difficulty: q.difficulty.toLowerCase(),
          hasImage: q.hasImage,
          imageUrl: q.imageUrl,
          options: [
            { id: 'A', label: 'A', text: 'Option A', isCorrect: false },
            { id: 'B', label: 'B', text: 'Option B', isCorrect: false },
            { id: 'C', label: 'C', text: 'Option C', isCorrect: true },
            { id: 'D', label: 'D', text: 'Option D', isCorrect: false },
            { id: 'E', label: 'E', text: 'Option E', isCorrect: false }
          ]
        }));
        setQuestions(transformedQuestions);
        setInPracticeMode(true);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePracticeComplete = (results: any[]) => {
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
        sessionType={`Math Kangaroo ${selectedYear}`}
        onComplete={handlePracticeComplete}
        onBack={handleBackToPractice}
        competitionType="kangaroo"
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Math Kangaroo Practice 🦘
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          International mathematical competition fostering mathematical thinking and problem-solving
        </p>
      </div>

      {/* Math Kangaroo Info */}
      <Card className="mb-8 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <Zap className="h-5 w-5" />
            About Math Kangaroo
          </CardTitle>
          <CardDescription>
            Math Kangaroo is an international mathematical competition with over 6 million participants worldwide. Problems are designed to be engaging and promote mathematical reasoning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">24</div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">75</div>
              <div className="text-sm text-gray-600">Minutes</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">A-E</div>
              <div className="text-sm text-gray-600">Multiple Choice</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">5-6</div>
              <div className="text-sm text-gray-600">Grade Level</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Practice Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

        {/* Quick Practice */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              Quick Practice
            </CardTitle>
            <CardDescription>
              Practice with 10 random Math Kangaroo problems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Questions:</span>
                <Badge variant="secondary">10 problems</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Grade Level:</span>
                <Badge variant="secondary">5-6</Badge>
              </div>
              <Button className="w-full" asChild>
                <Link href="/practice/quick">Start Quick Practice</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Full Contest */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-600" />
              Full Contest
            </CardTitle>
            <CardDescription>
              Complete 24-question Math Kangaroo simulation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Questions:</span>
                <Badge variant="secondary">24 problems</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Time:</span>
                <Badge variant="secondary">75 minutes</Badge>
              </div>
              <Button className="w-full" variant="outline" disabled>
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Problem Categories */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Problem Categories</CardTitle>
          <CardDescription>Math Kangaroo problems are categorized by point value and difficulty</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20" disabled>
              <div className="text-center">
                <div className="font-semibold text-green-600">3-Point Problems</div>
                <div className="text-xs text-gray-500">Easy Level</div>
                <div className="text-xs text-gray-500">Foundation Level</div>
              </div>
            </Button>
            <Button variant="outline" className="h-20" disabled>
              <div className="text-center">
                <div className="font-semibold text-yellow-600">4-Point Problems</div>
                <div className="text-xs text-gray-500">Medium Level</div>
                <div className="text-xs text-gray-500">Intermediate Level</div>
              </div>
            </Button>
            <Button variant="outline" className="h-20" disabled>
              <div className="text-center">
                <div className="font-semibold text-red-600">5-Point Problems</div>
                <div className="text-xs text-gray-500">Hard Level</div>
                <div className="text-xs text-gray-500">Challenge Level</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grade Levels */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Available Grade Levels</CardTitle>
          <CardDescription>Choose problems appropriate for your grade level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" disabled>
              <div className="text-center">
                <div className="font-semibold">Grade 3-4</div>
                <div className="text-xs text-gray-500">92 problems</div>
              </div>
            </Button>
            <Button variant="outline" className="border-orange-300 bg-orange-50">
              <div className="text-center">
                <div className="font-semibold text-orange-700">Grade 5-6</div>
                <div className="text-xs text-gray-500">156 problems</div>
              </div>
            </Button>
            <Button variant="outline" disabled>
              <div className="text-center">
                <div className="font-semibold">Grade 7-8</div>
                <div className="text-xs text-gray-500">134 problems</div>
              </div>
            </Button>
            <Button variant="outline" disabled>
              <div className="text-center">
                <div className="font-semibold">Grade 9-10</div>
                <div className="text-xs text-gray-500">118 problems</div>
              </div>
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Currently optimized for Grade 5-6 level. Other levels coming soon.
          </p>
        </CardContent>
      </Card>

      {/* Available Years */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Available Contest Years
          </CardTitle>
          <CardDescription>Practice with problems from past Math Kangaroo competitions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {availableYears.length > 0 ? (
              availableYears.map(year => (
                <Button
                  key={year}
                  variant={selectedYear === year ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedYear(year);
                    fetchQuestionsByYear(year);
                  }}
                  disabled={loading}
                >
                  {loading && selectedYear === year ? 'Loading...' : year}
                </Button>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No Math Kangaroo questions available yet</p>
                <Button variant="outline" asChild className="mt-2">
                  <Link href="/upload">Upload Questions</Link>
                </Button>
              </div>
            )}
          </div>
          {availableYears.length > 0 && (
            <p className="text-sm text-gray-500 mt-4">
              {availableYears.length} years available • Click a year to start practicing
            </p>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="text-center space-x-4">
        <Button variant="ghost" asChild>
          <Link href="/practice">← Back to Practice</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/upload">Upload Kangaroo Documents</Link>
        </Button>
      </div>
    </div>
  );
}