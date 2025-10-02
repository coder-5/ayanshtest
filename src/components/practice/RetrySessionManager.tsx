'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RefreshCw, Filter, Play, Clock, Target, AlertCircle, CheckCircle } from "lucide-react";
import { PracticeSession } from "./PracticeSession";
import { RetryQuestion, Question } from "@/types";

interface RetrySessionManagerProps {
  questions: RetryQuestion[];
  summary: {
    totalFailedQuestions: number;
    totalFailedAttempts: number;
    topicBreakdown: Record<string, number>;
    examBreakdown: Record<string, number>;
  };
}

export function RetrySessionManager({ questions, summary: _ }: RetrySessionManagerProps) {
  const [filteredQuestions, setFilteredQuestions] = useState(questions);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedExam, setSelectedExam] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get unique values for filters
  const topics = Array.from(new Set(questions.map(q => q.question.topic))).sort();
  const exams = Array.from(new Set(questions.map(q => q.question.examName).filter((name): name is string => Boolean(name)))).sort();
  const difficulties = Array.from(new Set(questions.map(q => q.question.difficulty))).sort();

  // Apply filters
  const applyFilters = () => {
    let filtered = questions;

    if (selectedTopic !== 'all') {
      filtered = filtered.filter(q => q.question.topic === selectedTopic);
    }

    if (selectedExam !== 'all') {
      filtered = filtered.filter(q => q.question.examName === selectedExam);
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(q => q.question.difficulty === selectedDifficulty);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q =>
        q.question.questionText.toLowerCase().includes(query) ||
        q.question.topic.toLowerCase().includes(query) ||
        (q.question.examName && q.question.examName.toLowerCase().includes(query))
      );
    }

    setFilteredQuestions(filtered);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedTopic('all');
    setSelectedExam('all');
    setSelectedDifficulty('all');
    setSearchQuery('');
    setFilteredQuestions(questions);
  };

  // Start retry session
  const startRetrySession = async (selectedQuestions: RetryQuestion[] = filteredQuestions) => {
    if (selectedQuestions.length === 0) {
      alert('No questions selected for retry session');
      return;
    }

    setLoading(true);
    try {
      const questionIds = selectedQuestions.map(q => q.question.id);

      const response = await fetch('/api/failed-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds })
      });

      if (response.ok) {
        const sessionData = await response.json();
        setPracticeQuestions(sessionData.questions);
        setIsSessionActive(true);
      } else {
        alert('Failed to start retry session');
      }
    } catch (error) {
      alert('Error starting retry session');
    } finally {
      setLoading(false);
    }
  };

  // Handle session completion
  const handleSessionComplete = (results: Array<{questionId: string; isCorrect: boolean}>) => {
    setIsSessionActive(false);
    setPracticeQuestions([]);

    // Update the filtered questions to remove successfully completed ones
    const completedQuestionIds = results
      .filter(result => result.isCorrect)
      .map(result => result.questionId);

    if (completedQuestionIds.length > 0) {
      // Remove successfully completed questions from the current list
      const updatedQuestions = filteredQuestions.filter(
        item => !completedQuestionIds.includes(item.question.id)
      );
      setFilteredQuestions(updatedQuestions);
    }

    // Show success message
    if (completedQuestionIds.length > 0) {
      alert(`Great job! You successfully answered ${completedQuestionIds.length} questions that you previously struggled with.`);
    }
  };

  if (isSessionActive) {
    return (
      <PracticeSession
        questions={practiceQuestions.map(q => ({
          ...q,
          type: 'multiple-choice' as const,
          options: q.options?.map(opt => ({
            id: opt.id,
            questionId: opt.questionId,
            label: opt.optionLetter,
            text: opt.optionText,
            isCorrect: opt.isCorrect
          })) || []
        }))}
        sessionType="Retry Failed Questions"
        onComplete={handleSessionComplete}
        onBack={() => setIsSessionActive(false)}
        competitionType="kangaroo"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Filter Questions
          </CardTitle>
          <CardDescription>
            Narrow down your retry session to focus on specific areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Topic Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Topic</label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="All Topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {topics.map(topic => (
                    <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Exam Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Competition</label>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger>
                  <SelectValue placeholder="All Competitions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Competitions</SelectItem>
                  {exams.map(exam => (
                    <SelectItem key={exam} value={exam}>{exam}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Difficulty</label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="All Difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  {difficulties.map(difficulty => (
                    <SelectItem key={difficulty} value={difficulty}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={applyFilters} size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
            <Button variant="outline" onClick={clearFilters} size="sm">
              Clear All
            </Button>
            <div className="ml-auto flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {filteredQuestions.length} of {questions.length} questions
              </span>
              <Button
                onClick={() => startRetrySession()}
                disabled={filteredQuestions.length === 0 || loading}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                {loading ? 'Starting...' : `Retry ${filteredQuestions.length} Questions`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>Failed Questions ({filteredQuestions.length})</CardTitle>
          <CardDescription>
            Questions you&apos;ve struggled with in the past - time to master them!
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredQuestions.length > 0 ? (
            <div className="space-y-4">
              {filteredQuestions.map((item) => (
                <div key={item.question.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {item.question.examName && <Badge variant="secondary">{item.question.examName}</Badge>}
                        <Badge variant="outline">{item.question.topic}</Badge>
                        <Badge variant={
                          item.question.difficulty === 'EASY' ? 'default' :
                          item.question.difficulty === 'MEDIUM' ? 'secondary' : 'destructive'
                        }>
                          {item.question.difficulty}
                        </Badge>
                        {item.attemptCount > 1 && (
                          <Badge variant="destructive">
                            Failed {item.attemptCount} times
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-medium mb-2">
                        {item.question.examName && item.question.examYear ? `${item.question.examName} ${item.question.examYear}` : ''} {item.question.questionNumber ? `#${item.question.questionNumber}` : ''}
                      </h3>

                      <p className="text-sm text-gray-600 mb-3">
                        {item.question.questionText.length > 150
                          ? item.question.questionText.substring(0, 150) + '...'
                          : item.question.questionText
                        }
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last attempt: {new Date(item.lastAttempt.attemptedAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Your answer: {item.lastAttempt.selectedAnswer || 'No answer'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          Time spent: {item.lastAttempt.timeSpent}s
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startRetrySession([item])}
                        disabled={loading}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry This
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-gray-600">No questions match your current filters.</p>
              <Button variant="ghost" onClick={clearFilters} className="mt-2">
                Clear filters to see all questions
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Retry Sessions</CardTitle>
          <CardDescription>
            Start focused retry sessions based on your weak areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* By Topic */}
            {topics.slice(0, 3).map(topic => {
              const topicQuestions = questions.filter(q => q.question.topic === topic);
              return (
                <div key={topic} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">{topic}</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {topicQuestions.length} failed questions
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startRetrySession(topicQuestions)}
                    disabled={loading}
                    className="w-full"
                  >
                    Retry {topic} Questions
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}