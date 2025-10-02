'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { QuestionCard } from "./QuestionCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, BarChart3, ChevronLeft, ChevronRight, SkipForward, Trash2, Edit3, X, ArrowLeft, EyeOff, Eye } from "lucide-react";
import { PracticeQuestion, OptionInput, EditableQuestion, NormalizableValue, SaveQueue } from "@/types";
import { QuestionTracker, QuestionStatus } from "./QuestionTracker";

interface SessionResult {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
  excludeFromScoring?: boolean;
}

interface PracticeSessionProps {
  questions: PracticeQuestion[];
  sessionType: string;
  onComplete: (results: SessionResult[]) => void;
  onBack?: () => void;
  competitionType?: 'kangaroo' | 'moems' | 'amc8';
}

export function PracticeSession({ questions, sessionType, onComplete, onBack }: PracticeSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState<EditableQuestion | null>(null);
  const [, setSkippedQuestions] = useState<Set<number>>(new Set());
  const [excludedQuestions, setExcludedQuestions] = useState<Set<string>>(new Set());

  // Auto-save functionality with race condition protection
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeSaveRequestRef = useRef<AbortController | null>(null);
  const saveQueueRef = useRef<SaveQueue>(new Map());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveRetryCount, setSaveRetryCount] = useState(0);
  const [progressSaveStatus, setProgressSaveStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [progressSaveError, setProgressSaveError] = useState<string | null>(null);

  // Calculate included questions count
  const includedQuestionsCount = questions.length - excludedQuestions.size;
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

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      // Cleanup timers and abort controllers on unmount
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      if (activeSaveRequestRef.current) {
        activeSaveRequestRef.current.abort();
      }
      // Clear save queue
      const saveQueue = saveQueueRef.current;
      saveQueue.clear();
    };
  }, []);

  const handleAnswer = async (answer: string) => {
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const isExcluded = excludedQuestions.has(currentQuestion.id);

    // Determine if answer is correct
    let isCorrect = false;
    const normalizeValue = (value: NormalizableValue): string => {
      if (value == null) return '';
      let normalized = String(value).trim().toLowerCase();
      // Remove "Answer: " prefix if it exists
      normalized = normalized.replace(/^answer:\s*/i, '');
      return normalized;
    };

    if (currentQuestion.type === 'multiple-choice' && currentQuestion.options) {
      // Multiple choice question
      const correctOption = currentQuestion.options.find(opt => opt.isCorrect);
      isCorrect = normalizeValue(answer) === normalizeValue(correctOption?.label || (correctOption as any)?.optionLetter);
    } else if (currentQuestion.solution?.solutionText) {
      // Text/numerical question - check against solution text
      isCorrect = normalizeValue(answer) === normalizeValue(currentQuestion.solution.solutionText);
    }

    const result: SessionResult = {
      questionId: currentQuestion.id,
      userAnswer: answer,
      isCorrect,
      timeSpent
    };

    setSessionResults(prev => [...prev, result]);

    // Update question status
    setQuestionStatuses(prev =>
      prev.map((status, index) =>
        index === currentQuestionIndex
          ? { ...status, status: isCorrect ? 'correct' : 'incorrect', userAnswer: answer, timeSpent }
          : status
      )
    );

    // Solution is now shown only when user requests it
    setShowSolution(false);

    // Save progress to database with error handling and user notification
    try {
      setProgressSaveStatus('saving');
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          isCorrect,
          timeSpent,
          userAnswer: answer,
          excludeFromScoring: isExcluded
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

        if (response.status === 404) {
          // Question was deleted, don't save progress but don't show error to user
          setProgressSaveStatus('idle');
          setProgressSaveError(null);
          return;
        }

        throw new Error(`Failed to save progress: ${response.status} ${response.statusText} - ${errorData.error || ''}`);
      }

      setProgressSaveStatus('idle');
      setProgressSaveError(null);
    } catch (error: unknown) {
      setProgressSaveStatus('error');
      setProgressSaveError(error instanceof Error ? error.message : 'Failed to save progress');
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setProgressSaveStatus('idle');
        setProgressSaveError(null);
      }, 5000);
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
        alert('Failed to delete question. Please try again.');
      }
    }
  };

  // Auto-save function with debouncing
  const autoSaveQuestion = useCallback(async (question: EditableQuestion, retryCount = 0) => {
    if (!question || !question.id) return;

    const questionId = question.id;
    const maxRetries = 3;
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff

    // Cancel any existing request for this question
    if (activeSaveRequestRef.current) {
      activeSaveRequestRef.current.abort();
    }

    // Check if there's already a save in progress for this question
    if (saveQueueRef.current.has(questionId)) {
      return; // Skip if already saving
    }

    try {
      setSaveStatus('saving');
      setSaveRetryCount(retryCount);

      // Create new AbortController for this request
      const abortController = new AbortController();
      activeSaveRequestRef.current = abortController;

      // Format options for the API (filter out empty ones)
      const formattedOptions = question.options?.filter((option) => {
        // Handle both old (label/text) and new (optionLetter/optionText) formats
        const letter = option.optionLetter || option.label;
        const text = option.optionText || option.text;
        return letter &&
               text &&
               typeof letter === 'string' &&
               typeof text === 'string' &&
               letter.trim().length > 0 &&
               text.trim().length > 0;
      }).map((option): OptionInput => ({
        optionLetter: option.optionLetter || option.label,
        optionText: option.optionText || option.text,
        isCorrect: option.isCorrect || false
      })) || [];

      // Prepare request body
      const requestBody = {
        questionText: question.questionText,
        examName: question.examName,
        examYear: question.examYear,
        topic: question.topic,
        difficulty: question.difficulty,
        options: formattedOptions,
        solution: question.solution, // Include solution data
        // version: question.version || 1 // Include version for optimistic locking
      };


      // Add to save queue
      const savePromise = fetch(`/api/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: abortController.signal
      });

      saveQueueRef.current.set(questionId, savePromise);
      const response = await savePromise;

      if (response.ok) {
        const updatedQuestion = await response.json();
        // Update the current questions array
        questions[currentQuestionIndex] = updatedQuestion;
        setSaveStatus('saved');
        setSaveRetryCount(0);
        // Reset status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else if (response.status === 404) {
        // Question was deleted, stop trying to save it
        setSaveStatus('idle');
        setSaveRetryCount(0);
        return; // Don't retry for deleted questions
      } else if (response.status === 409) {
        // Handle conflict - question was edited by another user
        const conflictData = await response.json();
        setSaveStatus('error');
        setSaveRetryCount(0);
        // Show error for longer time for conflicts
        setTimeout(() => setSaveStatus('idle'), 8000);
        throw new Error(`Conflict: ${conflictData.message}`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: unknown) {
      // Don't retry if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      // Retry logic with exponential backoff
      if (retryCount < maxRetries) {
        setTimeout(() => {
          autoSaveQuestion(question, retryCount + 1);
        }, retryDelay);
      } else {
        setSaveStatus('error');
        setSaveRetryCount(0);
        // Keep error state longer for critical failures
        setTimeout(() => setSaveStatus('idle'), 5000);
      }
    } finally {
      // Clean up
      saveQueueRef.current.delete(questionId);
      if (activeSaveRequestRef.current) {
        activeSaveRequestRef.current = null;
      }
    }
  }, [questions, currentQuestionIndex]);

  // Debounced question edit handler with improved race condition handling
  const handleQuestionEdit = useCallback((updatedQuestion: EditableQuestion) => {
    setEditedQuestion(updatedQuestion);

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Reset retry count for new edits
    setSaveRetryCount(0);

    // Set new timeout for auto-save (2 seconds after user stops typing)
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveQuestion(updatedQuestion);
    }, 2000);
  }, [autoSaveQuestion]);

  const handleEditQuestion = () => {
    // Normalize option format to use optionLetter/optionText consistently
    const normalizedQuestion: EditableQuestion = {
      ...currentQuestion,
      type: currentQuestion.type || 'multiple-choice',
      options: currentQuestion.options?.map((option) => ({
        ...option,
        optionLetter: option.label || (option as any).optionLetter || '',
        optionText: option.text || (option as any).optionText || ''
      })) || []
    };
    setEditedQuestion(normalizedQuestion);
    setIsEditMode(true);
  };


  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedQuestion(null);
  };

  const handleToggleExclude = async () => {
    const questionId = currentQuestion.id;
    const wasExcluded = excludedQuestions.has(questionId);
    const willBeExcluded = !wasExcluded;

    // Update local state immediately for responsiveness
    setExcludedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });

    // Update the database record with proper error handling
    try {
      const response = await fetch('/api/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          excludeFromScoring: willBeExcluded
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update question exclusion: ${response.status}`);
      }
    } catch (error: unknown) {
      // Revert the local state change if API call failed
      setExcludedQuestions(prev => {
        const newSet = new Set(prev);
        if (wasExcluded) {
          newSet.add(questionId);
        } else {
          newSet.delete(questionId);
        }
        return newSet;
      });
      // Show error notification
      setProgressSaveError(`Failed to ${willBeExcluded ? 'exclude' : 'include'} question from scoring`);
      setTimeout(() => setProgressSaveError(null), 3000);
    }
  };

  const calculateStats = () => {
    // Only count non-excluded questions
    const includedResults = sessionResults.filter(r => !r.excludeFromScoring);
    const correct = includedResults.filter(r => r.isCorrect).length;
    const total = includedResults.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const totalTime = Math.floor((Date.now() - sessionStartTime) / 1000);
    const avgTime = total > 0 ? Math.round(includedResults.reduce((sum, r) => sum + r.timeSpent, 0) / total) : 0;

    return { correct, total, accuracy, totalTime, avgTime, excludedCount: sessionResults.length - includedResults.length };
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
              {stats.excludedCount > 0 && (
                <span className="block text-sm text-amber-600 mt-2">
                  Note: {stats.excludedCount} question{stats.excludedCount > 1 ? 's were' : ' was'} excluded from scoring.
                </span>
              )}
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
      {/* Question Tracker - Always visible on top for mobile/tablet */}
      <div className="lg:hidden mb-6">
        <QuestionTracker
          questions={questions}
          currentQuestionIndex={currentQuestionIndex}
          questionStatuses={questionStatuses}
          onQuestionSelect={handleQuestionSelect}
          onToggleFlag={handleToggleFlag}
          className="mb-4"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {/* Session Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">{sessionType} Practice Session</h1>
                <div className="flex items-center gap-2">
                  <p className="text-gray-600">Question {currentQuestionIndex + 1} of {questions.length}</p>
                  {excludedQuestions.size > 0 && (
                    <p className="text-xs text-gray-500">({includedQuestionsCount} counting toward progress)</p>
                  )}
                  {excludedQuestions.has(currentQuestion.id) && (
                    <Badge variant="secondary" className="text-xs">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Excluded from tracking
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">{sessionResults.filter(r => r.isCorrect && !r.excludeFromScoring).length} correct</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{
                    (() => {
                      const includedResults = sessionResults.filter(r => !r.excludeFromScoring);
                      return includedResults.length > 0 ?
                        Math.round((includedResults.filter(r => r.isCorrect).length / includedResults.length) * 100) : 0;
                    })()
                  }% accuracy</span>
                </div>
              </div>
            </div>

            <Progress value={((currentQuestionIndex + (showSolution ? 1 : 0)) / Math.max(includedQuestionsCount, 1)) * 100} className="h-2" />
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
                      variant={excludedQuestions.has(currentQuestion.id) ? "default" : "outline"}
                      size="sm"
                      onClick={handleToggleExclude}
                      className="flex items-center gap-1"
                      title={excludedQuestions.has(currentQuestion.id) ? "Include in scoring" : "Exclude from scoring"}
                    >
                      {excludedQuestions.has(currentQuestion.id) ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      {excludedQuestions.has(currentQuestion.id) ? "Include" : "Exclude"}
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
                    {/* Auto-save Status Indicator */}
                    <div className="flex items-center gap-2 px-3 py-1 rounded-md text-sm">
                      {saveStatus === 'saving' && (
                        <>
                          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                          <span className="text-blue-600">
                            Saving...{saveRetryCount > 0 && ` (retry ${saveRetryCount}/3)`}
                          </span>
                        </>
                      )}
                      {saveStatus === 'saved' && (
                        <>
                          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-green-600">Saved</span>
                        </>
                      )}
                      {saveStatus === 'error' && (
                        <>
                          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-red-600">Save failed</span>
                        </>
                      )}
                      {saveStatus === 'idle' && (
                        <span className="text-gray-500">Auto-save enabled</span>
                      )}
                    </div>

                    {/* Progress Save Error Notification */}
                    {progressSaveError && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-sm mt-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-red-700">{progressSaveError}</span>
                      </div>
                    )}

                    {/* Progress Save Status */}
                    {progressSaveStatus === 'saving' && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-sm mt-2">
                        <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-blue-700">Saving progress...</span>
                      </div>
                    )}

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
            totalQuestions={includedQuestionsCount}
            timeElapsed={timeElapsed}
            onAnswer={handleAnswer}
            onNext={handleNext}
            userAnswer={sessionResults.find(r => r.questionId === currentQuestion.id)?.userAnswer || ''}
            isEditMode={isEditMode}
            editedQuestion={editedQuestion}
            onQuestionEdit={handleQuestionEdit as any}
            isQuestionSubmitted={questionStatuses[currentQuestionIndex]?.status !== 'unanswered'}
          />
        </div>

        {/* Question Tracker Sidebar - Hidden on mobile, visible on large screens */}
        <div className="hidden lg:block lg:col-span-1">
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