'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, BookOpen, Clock } from "lucide-react";
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

export default function AMC8PracticePage() {
  const [availableYears, setAvailableYears] = useState<{examYear: number, _count: {id: number}}[]>([]);
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
      const response = await fetch('/api/questions/amc8/years');
      if (response.ok) {
        const years = await response.json();
        const yearData = years.map((year: number) => ({
          examYear: year,
          _count: { id: 0 } // Will be populated with actual count later
        }));
        setAvailableYears(yearData.sort((a: any, b: any) => b.examYear - a.examYear));
      }
    } catch (error) {
      console.error('Failed to fetch available years:', error);
    }
  };

  const fetchQuestionsByYear = async (year: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/questions/amc8?year=${year}`);
      if (response.ok) {
        const data = await response.json();
        const transformedQuestions = data.map((q: Question) => ({
          id: q.id,
          text: q.questionText,
          type: 'multiple-choice' as const,
          competition: `AMC 8 ${q.examYear}`,
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
        sessionType={`AMC 8 ${selectedYear}`}
        onComplete={handlePracticeComplete}
        onBack={handleBackToPractice}
        competitionType="amc8"
      />
    );
  }
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          AMC 8 Practice 🎯
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Practice with real AMC 8 problems and master middle school mathematics competition
        </p>
      </div>

      {/* AMC 8 Info */}
      <Card className="mb-8 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Target className="h-5 w-5" />
            About AMC 8
          </CardTitle>
          <CardDescription>
            The AMC 8 is a 25-question, 40-minute, multiple choice examination in middle school mathematics designed to promote the development of problem-solving skills.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">25</div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">40</div>
              <div className="text-sm text-gray-600">Minutes</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">A-E</div>
              <div className="text-sm text-gray-600">Multiple Choice</div>
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
              <Target className="h-5 w-5 text-green-600" />
              Quick Practice
            </CardTitle>
            <CardDescription>
              Practice with random AMC 8 questions
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

        {/* Full Simulation */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Full Simulation
            </CardTitle>
            <CardDescription>
              Complete 25-question AMC 8 simulation with timer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Questions:</span>
                <Badge variant="secondary">25 problems</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Time:</span>
                <Badge variant="secondary">40 minutes</Badge>
              </div>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/practice/amc8/simulation">Start Full Simulation</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Topic-based Practice */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Practice by Topic</CardTitle>
          <CardDescription>Focus on specific mathematical areas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-16" disabled>
              <div className="text-center">
                <div className="font-semibold">Algebra</div>
                <div className="text-xs text-gray-500">Coming soon</div>
              </div>
            </Button>
            <Button variant="outline" className="h-16" disabled>
              <div className="text-center">
                <div className="font-semibold">Geometry</div>
                <div className="text-xs text-gray-500">Coming soon</div>
              </div>
            </Button>
            <Button variant="outline" className="h-16" disabled>
              <div className="text-center">
                <div className="font-semibold">Number Theory</div>
                <div className="text-xs text-gray-500">Coming soon</div>
              </div>
            </Button>
            <Button variant="outline" className="h-16" disabled>
              <div className="text-center">
                <div className="font-semibold">Combinatorics</div>
                <div className="text-xs text-gray-500">Coming soon</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Years */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Available Years
          </CardTitle>
          <CardDescription>Practice with problems from specific AMC 8 years</CardDescription>
        </CardHeader>
        <CardContent>
          {availableYears.length > 0 ? (
            <>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {availableYears.map(yearData => (
                  <Button
                    key={yearData.examYear}
                    variant={selectedYear === yearData.examYear ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedYear(yearData.examYear);
                      fetchQuestionsByYear(yearData.examYear);
                    }}
                    disabled={loading}
                  >
                    <div className="text-center">
                      <div className="font-semibold">
                        {loading && selectedYear === yearData.examYear ? 'Loading...' : yearData.examYear}
                      </div>
                      <div className="text-xs text-gray-500">Click to practice</div>
                    </div>
                  </Button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Click on any year to practice problems from that specific AMC 8 exam
              </p>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No AMC 8 Years Available</p>
              <p className="text-sm mb-4">Upload AMC 8 documents to see available years here</p>
              <Button asChild>
                <Link href="/upload">Upload AMC 8 Documents</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="text-center space-x-4">
        <Button variant="ghost" asChild>
          <Link href="/practice">← Back to Practice</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/library">Browse Question Library</Link>
        </Button>
      </div>
    </div>
  );
}