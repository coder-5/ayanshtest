'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, BookOpen, Clock } from "lucide-react";
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

export default function MOEMSPracticePage() {
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
      const response = await fetch('/api/questions/moems/years');
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
      const response = await fetch(`/api/questions/moems?year=${year}`);
      if (response.ok) {
        const data = await response.json();
        const transformedQuestions = data.map((q: Question) => ({
          id: q.id,
          text: q.questionText,
          type: 'open-ended' as const,
          competition: `MOEMS ${q.examYear}`,
          topic: q.topic,
          difficulty: q.difficulty.toLowerCase(),
          hasImage: q.hasImage,
          imageUrl: q.imageUrl,
          // MOEMS questions are typically open-ended
          options: undefined
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
        sessionType={`MOEMS ${selectedYear}`}
        onComplete={handlePracticeComplete}
        onBack={handleBackToPractice}
        competitionType="moems"
      />
    );
  }
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          MOEMS Practice 🧠
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Mathematical Olympiad for Elementary & Middle Schools - Problem solving excellence
        </p>
      </div>

      {/* MOEMS Info */}
      <Card className="mb-8 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Brain className="h-5 w-5" />
            About MOEMS
          </CardTitle>
          <CardDescription>
            MOEMS contests consist of 5 problems each designed to be solved in creative ways. Division E is for grades 6-8, emphasizing problem-solving skills and mathematical insight.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">5</div>
              <div className="text-sm text-gray-600">Problems per Contest</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">30</div>
              <div className="text-sm text-gray-600">Minutes</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">Open</div>
              <div className="text-sm text-gray-600">Answer Format</div>
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
              <Brain className="h-5 w-5 text-purple-600" />
              Quick Practice
            </CardTitle>
            <CardDescription>
              Solve random MOEMS problems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Problems:</span>
                <Badge variant="secondary">Random selection</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Format:</span>
                <Badge variant="secondary">Open-ended</Badge>
              </div>
              <Button className="w-full" asChild>
                <Link href="/practice/quick">Start Quick Practice</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contest Simulation */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Contest Simulation
            </CardTitle>
            <CardDescription>
              Full MOEMS contest with 5 problems and timer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Problems:</span>
                <Badge variant="secondary">5 problems</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Time:</span>
                <Badge variant="secondary">30 minutes</Badge>
              </div>
              <Button className="w-full" variant="outline" disabled>
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Difficulty Levels */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Practice by Difficulty</CardTitle>
          <CardDescription>MOEMS problems are typically ordered by increasing difficulty</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20" disabled>
              <div className="text-center">
                <div className="font-semibold text-green-600">Problems 1-2</div>
                <div className="text-xs text-gray-500">Beginner Level</div>
                <div className="text-xs text-gray-500">Coming soon</div>
              </div>
            </Button>
            <Button variant="outline" className="h-20" disabled>
              <div className="text-center">
                <div className="font-semibold text-yellow-600">Problems 3-4</div>
                <div className="text-xs text-gray-500">Intermediate Level</div>
                <div className="text-xs text-gray-500">Coming soon</div>
              </div>
            </Button>
            <Button variant="outline" className="h-20" disabled>
              <div className="text-center">
                <div className="font-semibold text-red-600">Problem 5</div>
                <div className="text-xs text-gray-500">Advanced Level</div>
                <div className="text-xs text-gray-500">Coming soon</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Contest Years */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Available Contest Years
          </CardTitle>
          <CardDescription>Practice with problems from specific MOEMS years and contests</CardDescription>
        </CardHeader>
        <CardContent>
          {availableYears.length > 0 ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Available Years ({availableYears.length} years)</h4>
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
              </div>
              <div className="pt-2">
                <p className="text-sm text-gray-500">
                  Click on any year to practice problems from that specific MOEMS contest year. Each year typically contains 5 contests with 5 problems each.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No MOEMS Years Available</p>
              <p className="text-sm mb-4">Upload MOEMS documents to see available years here</p>
              <Button asChild>
                <Link href="/upload">Upload MOEMS Documents</Link>
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
          <Link href="/upload">Upload MOEMS Documents</Link>
        </Button>
      </div>
    </div>
  );
}