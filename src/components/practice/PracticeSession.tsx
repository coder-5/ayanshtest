'use client';

import { useState, useEffect } from "react";
import { QuestionCard } from "./QuestionCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, BarChart3, ChevronLeft, ChevronRight, SkipForward, Trash2, Edit3, Save, X, ArrowLeft } from "lucide-react";
import { PracticeQuestion } from "@/types";
import { QuestionTracker, QuestionStatus } from "./QuestionTracker";

interface SessionResult {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

interface PracticeSessionProps {
  questions: PracticeQuestion[];
  sessionType: string;
  onComplete: (results: SessionResult[]) => void;
  onBack?: () => void;
  competitionType?: 'kangaroo' | 'moems' | 'amc8';
}

export function PracticeSession({ questions, sessionType, onComplete, onBack, competitionType = 'kangaroo' }: PracticeSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState<any>(null);
  const [, setSkippedQuestions] = useState<Set<number>>(new Set());
  const [questionStatuses, setQuestionStatuses] = useState<QuestionStatus[]>(
    questions.map(q => ({
      questionId: q.id,
      status: 'unanswered' as const,
      isFlagged: false
    }))
  );

  // Track skipped questions during session

  const currentQuestion = questions[currentQuestionIndex];

  // Question tracker functions
  const handleQuestionSelect = (index: number) => {
    setCurrentQuestionIndex(index);
    setQuestionStartTime(Date.now());
    setTimeElapsed(0);
    setShowSolution(false);
  };

  const handleToggleFlag = (index: number) => {
    setQuestionStatuses(prev =>
      prev.map((status, i) =>
        i === index
          ? { ...status, isFlagged: !status.isFlagged }
          : status
      )
    );
  };

  // Timer effect
  useEffect(() => {
    if (!showSolution && !isSessionComplete) {
      const interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - questionStartTime) / 1000));
      }, 1000);

      return () => clearInterval(interval);
    }
    return () => {}; // Always return a cleanup function
  }, [questionStartTime, showSolution, isSessionComplete]);

  const handleAnswer = async (answer: string, excludeFromScoring: boolean = false) => {
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    // Determine if answer is correct
    let isCorrect = false;
    if (currentQuestion.type === 'multiple-choice' && currentQuestion.options) {
      const correctOption = currentQuestion.options.find(opt => opt.isCorrect);
      isCorrect = answer === correctOption?.label;
    }

    const result: SessionResult = {
      questionId: currentQuestion.id,
      userAnswer: answer,
      isCorrect,
      timeSpent
    };

    // Log for competition-specific analysis
    if (competitionType) {
      console.log(`${competitionType} question answered:`, result);
    }

    setSessionResults(prev => [...prev, result]);

    // Update question status
    setQuestionStatuses(prev =>
      prev.map((status, index) =>
        index === currentQuestionIndex
          ? { ...status, status: isCorrect ? 'correct' : 'incorrect', userAnswer: answer, timeSpent }
          : status
      )
    );

    setShowSolution(true);

    // Save progress to database
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          isCorrect,
          timeSpent,
          userAnswer: answer,
          excludeFromScoring
        })
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowSolution(false);
      setQuestionStartTime(Date.now());
      setTimeElapsed(0);
      setIsEditMode(false);
    } else {
      setIsSessionComplete(true);
      onComplete(sessionResults);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setShowSolution(false);
      setQuestionStartTime(Date.now());
      setTimeElapsed(0);
      setIsEditMode(false);
    }
  };

  const handleSkip = () => {
    setSkippedQuestions(prev => new Set(prev).add(currentQuestionIndex));

    const result: SessionResult = {
      questionId: currentQuestion.id,
      userAnswer: 'SKIPPED',
      isCorrect: false,
      timeSpent: Math.floor((Date.now() - questionStartTime) / 1000)
    };

    setSessionResults(prev => [...prev, result]);

    // Update question status for skipped
    setQuestionStatuses(prev =>
      prev.map((status, index) =>
        index === currentQuestionIndex
          ? { ...status, status: 'skipped', userAnswer: 'SKIPPED', timeSpent: result.timeSpent }
          : status
      )
    );

    handleNext();
  };

  const handleDeleteQuestion = async () => {
    if (confirm('Are you sure you want to delete this question permanently?')) {
      try {
        const response = await fetch(`/api/questions/${currentQuestion.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          // Remove question from current session
          const updatedQuestions = questions.filter((_, index) => index !== currentQuestionIndex);

          if (updatedQuestions.length === 0) {
            setIsSessionComplete(true);
            onComplete(sessionResults);
          } else {
            // Adjust current index if necessary
            if (currentQuestionIndex >= updatedQuestions.length) {
              setCurrentQuestionIndex(updatedQuestions.length - 1);
            }
            handleNext();
          }
        }
      } catch (error) {
        console.error('Failed to delete question:', error);
        alert('Failed to delete question. Please try again.');
      }
    }
  };

  const handleEditQuestion = () => {
    setEditedQuestion({ ...currentQuestion });
    setIsEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!editedQuestion) return;

    try {
      const response = await fetch(`/api/questions/${editedQuestion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: editedQuestion.text,
          difficulty: editedQuestion.difficulty,
          topic: editedQuestion.topic,
          subtopic: editedQuestion.subtopic || 'Problem Solving',
          hasImage: editedQuestion.hasImage || false,
          imageUrl: editedQuestion.imageUrl || ''
        })
      });

      if (response.ok) {
        // Update the current questions array
        questions[currentQuestionIndex] = editedQuestion;
        setIsEditMode(false);
        setEditedQuestion(null);
      }
    } catch (error) {
      console.error('Failed to update question:', error);
      alert('Failed to update question. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedQuestion(null);
  };

  const calculateStats = () => {
    const correct = sessionResults.filter(r => r.isCorrect).length;
    const total = sessionResults.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const totalTime = Math.floor((Date.now() - sessionStartTime) / 1000);
    const avgTime = total > 0 ? Math.round(sessionResults.reduce((sum, r) => sum + r.timeSpent, 0) / total) : 0;

    return { correct, total, accuracy, totalTime, avgTime };
  };

  if (isSessionComplete) {
    const stats = calculateStats();

    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Trophy className="h-16 w-16 text-yellow-500" />
            </div>
            <CardTitle className="text-3xl">Session Complete!</CardTitle>
            <CardDescription className="text-lg">
              Great job completing your {sessionType} practice session
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.correct}/{stats.total}</div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.accuracy}%</div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{Math.floor(stats.totalTime / 60)}m</div>
                <div className="text-sm text-gray-600">Total Time</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.avgTime}s</div>
                <div className="text-sm text-gray-600">Avg per Question</div>
              </div>
            </div>

            {/* Question Breakdown */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Question Breakdown</h3>
              {sessionResults.map((result, index) => (
                <div key={result.questionId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                      result.isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">Question {index + 1}</div>
                      <div className="text-sm text-gray-600">
                        Answer: {result.userAnswer} • Time: {result.timeSpent}s
                      </div>
                    </div>
                  </div>
                  <Badge variant={result.isCorrect ? 'default' : 'destructive'}>
                    {result.isCorrect ? 'Correct' : 'Incorrect'}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <a href="/practice">Start New Session</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/progress">View Progress</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/">Back to Dashboard</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {/* Session Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">{sessionType} Practice Session</h1>
                <p className="text-gray-600">Question {currentQuestionIndex + 1} of {questions.length}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">{sessionResults.filter(r => r.isCorrect).length} correct</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{sessionResults.length > 0 ? Math.round((sessionResults.filter(r => r.isCorrect).length / sessionResults.length) * 100) : 0}% accuracy</span>
                </div>
              </div>
            </div>

            <Progress value={((currentQuestionIndex + (showSolution ? 1 : 0)) / questions.length) * 100} className="h-2" />
          </div>

          {/* Navigation Controls */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 justify-between items-center">
              {/* Back to Practice */}
              {onBack && (
                <Button variant="ghost" onClick={onBack} className="flex items-center gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Practice
                </Button>
              )}

              {/* Question Navigation */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSkip}
                  className="flex items-center gap-1"
                >
                  <SkipForward className="h-4 w-4" />
                  Skip
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentQuestionIndex === questions.length - 1 && !showSolution}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Question Management */}
              <div className="flex gap-2">
                {!isEditMode ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditQuestion}
                      className="flex items-center gap-1"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteQuestion}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Question Card */}
          <QuestionCard
            question={isEditMode && editedQuestion ? editedQuestion : currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            timeElapsed={timeElapsed}
            onAnswer={handleAnswer}
            onNext={handleNext}
            showSolution={showSolution}
            userAnswer={sessionResults[sessionResults.length - 1]?.userAnswer}
            isEditMode={isEditMode}
            editedQuestion={editedQuestion}
            onQuestionEdit={setEditedQuestion}
          />
        </div>

        {/* Question Tracker Sidebar */}
        <div className="lg:col-span-1">
          <QuestionTracker
            questions={questions}
            currentQuestionIndex={currentQuestionIndex}
            questionStatuses={questionStatuses}
            onQuestionSelect={handleQuestionSelect}
            onToggleFlag={handleToggleFlag}
          />
        </div>
      </div>
    </div>
  );
}