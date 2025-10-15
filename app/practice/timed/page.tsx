'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { MathContent } from '@/components/MathContent';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { useSearchParams } from 'next/navigation';
import { fetchJsonSafe } from '@/lib/fetchJson';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface Question {
  id: string;
  questionText: string;
  examName: string | null;
  questionNumber: string | null;
  topic: string;
  difficulty: string;
  hasImage: boolean;
  imageUrl: string | null;
  options: Array<{
    id: string;
    optionLetter: string;
    optionText: string;
    isCorrect: boolean;
  }>;
}

function TimedChallengePageContent() {
  const searchParams = useSearchParams();
  const examMode = searchParams.get('examMode') === 'true';
  const queryTimeLimit = searchParams.get('timeLimit');
  const queryQuestionCount = searchParams.get('questionCount');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [totalTime, setTotalTime] = useState(10); // 10 minutes default
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [questionStartTimes, setQuestionStartTimes] = useState<Record<number, number>>({});
  const [questionTimings, setQuestionTimings] = useState<Record<number, number>>({});
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDescription, setReportDescription] = useState('');
  const [reportQuestionId, setReportQuestionId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Track time spent per question
  useEffect(() => {
    if (isRunning && !isPaused) {
      const now = Date.now();
      if (!questionStartTimes[currentIndex]) {
        setQuestionStartTimes((prev) => ({ ...prev, [currentIndex]: now }));
      }
    }
  }, [currentIndex, isRunning, isPaused, questionStartTimes]);

  // Timer effect
  useEffect(() => {
    const handleFinishCallback = async () => {
      setIsRunning(false);
      setIsFinished(true);

      const totalTimeSpent = Math.floor((Date.now() - startTime) / 1000);

      let correctCount = 0;

      // Save all attempts to database
      for (let index = 0; index < questions.length; index++) {
        const question = questions[index];
        if (!question) continue;

        const selectedAnswer = selectedAnswers[index] || null;
        const correctOption = question.options.find((opt) => opt.isCorrect);
        const isCorrect = selectedAnswer === correctOption?.optionLetter;

        if (isCorrect) {
          correctCount++;
        }

        const timeSpentOnQuestion = questionTimings[index] || 0;

        try {
          await fetch('/api/user-attempts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questionId: question.id,
              selectedAnswer,
              isCorrect,
              timeSpent: timeSpentOnQuestion,
              sessionId: sessionId,
            }),
          });
        } catch (error) {
          console.error('Error saving attempt:', error);
        }
      }

      setScore(correctCount);

      // Complete session
      if (sessionId) {
        try {
          await fetch(`/api/sessions/${sessionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              totalQuestions: questions.length,
              correctAnswers: correctCount,
              totalTime: totalTimeSpent,
            }),
          });
        } catch (error) {
          console.error('Error completing session:', error);
        }
      }
    };

    if (isRunning && !isPaused && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleFinishCallback();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [
    isRunning,
    isPaused,
    timeLeft,
    questions,
    selectedAnswers,
    startTime,
    sessionId,
    questionTimings,
  ]);

  const startChallenge = async (minutes: number, questionCount: number = 10) => {
    setLoading(true);
    try {
      // Create session first
      const sessionData = await fetchJsonSafe<{ session: { id: string } }>('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionType: 'TIMED',
          userId: 'ayansh',
        }),
      });
      if (sessionData) {
        setSessionId(sessionData.session.id);
      }

      const data = await fetchJsonSafe<{ questions: Question[] }>('/api/questions');

      if (data && data.questions) {
        let selectedQuestions = data.questions || [];

        if (examMode) {
          // In exam mode, load questions in order
          selectedQuestions = selectedQuestions.slice(0, questionCount);
        } else {
          // Regular mode: shuffle and slice
          selectedQuestions = selectedQuestions
            .sort(() => Math.random() - 0.5)
            .slice(0, questionCount);
        }

        setQuestions(selectedQuestions);
        setTotalTime(minutes);
        setTimeLeft(minutes * 60);
        setIsRunning(true);
        setIsPaused(false);
        setCurrentIndex(0);
        setSelectedAnswers({});
        setMarkedForReview(new Set());
        setQuestionStartTimes({});
        setQuestionTimings({});
        setIsFinished(false);
        setScore(0);
        setStartTime(Date.now());
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-start if query parameters are provided
    if (queryTimeLimit && queryQuestionCount) {
      const timeLimit = parseInt(queryTimeLimit);
      const questionCount = parseInt(queryQuestionCount);
      if (!isNaN(timeLimit) && !isNaN(questionCount)) {
        startChallenge(timeLimit, questionCount);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryTimeLimit, queryQuestionCount]);

  const handleAnswer = (optionLetter: string) => {
    setSelectedAnswers({ ...selectedAnswers, [currentIndex]: optionLetter });
  };

  const handleNext = () => {
    // Save time spent on current question
    if (questionStartTimes[currentIndex]) {
      const timeSpent = Math.floor((Date.now() - questionStartTimes[currentIndex]) / 1000);
      setQuestionTimings((prev) => ({
        ...prev,
        [currentIndex]: (prev[currentIndex] || 0) + timeSpent,
      }));
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    // Save time spent on current question
    if (questionStartTimes[currentIndex]) {
      const timeSpent = Math.floor((Date.now() - questionStartTimes[currentIndex]) / 1000);
      setQuestionTimings((prev) => ({
        ...prev,
        [currentIndex]: (prev[currentIndex] || 0) + timeSpent,
      }));
    }

    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const toggleMarkForReview = () => {
    const newMarked = new Set(markedForReview);
    if (newMarked.has(currentIndex)) {
      newMarked.delete(currentIndex);
    } else {
      newMarked.add(currentIndex);
    }
    setMarkedForReview(newMarked);
  };

  const togglePause = () => {
    if (examMode) return; // Cannot pause in exam mode
    setIsPaused(!isPaused);
  };

  const handleFinish = async () => {
    // Save time spent on current question
    if (questionStartTimes[currentIndex]) {
      const timeSpent = Math.floor((Date.now() - questionStartTimes[currentIndex]) / 1000);
      setQuestionTimings((prev) => ({
        ...prev,
        [currentIndex]: (prev[currentIndex] || 0) + timeSpent,
      }));
    }

    setIsRunning(false);
    setIsFinished(true);

    const totalTimeSpent = Math.floor((Date.now() - startTime) / 1000);

    let correctCount = 0;

    // Save all attempts to database
    for (let index = 0; index < questions.length; index++) {
      const question = questions[index];
      if (!question) continue;

      const selectedAnswer = selectedAnswers[index] || null;
      const correctOption = question.options.find((opt) => opt.isCorrect);
      const isCorrect = selectedAnswer === correctOption?.optionLetter;

      if (isCorrect) {
        correctCount++;
      }

      const timeSpentOnQuestion = questionTimings[index] || 0;

      try {
        await fetch('/api/user-attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: question.id,
            selectedAnswer,
            isCorrect,
            timeSpent: timeSpentOnQuestion,
            sessionId: sessionId,
          }),
        });
      } catch (error) {
        console.error('Error saving attempt:', error);
      }
    }

    setScore(correctCount);

    // Complete session
    if (sessionId) {
      try {
        await fetch(`/api/sessions/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            totalQuestions: questions.length,
            correctAnswers: correctCount,
            totalTime: totalTimeSpent,
          }),
        });
      } catch (error) {
        console.error('Error completing session:', error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    const minutes = timeLeft / 60;
    if (minutes < 1) return 'text-red-600';
    if (minutes < 5) return 'text-yellow-600';
    return 'text-gray-900';
  };

  const getPacingWarning = () => {
    if (questions.length === 0) return null;
    const avgTimePerQuestion = (totalTime * 60) / questions.length;
    const questionsAnswered = Object.keys(selectedAnswers).length;
    const elapsedTime = totalTime * 60 - timeLeft;

    if (questionsAnswered === 0 || elapsedTime === 0) return null;

    const currentAvgTime = elapsedTime / questionsAnswered;

    if (currentAvgTime > avgTimePerQuestion * 1.5 && questionsAnswered >= 3) {
      return `You're spending ${Math.round(currentAvgTime)}s per question. Try to aim for ${Math.round(avgTimePerQuestion)}s average.`;
    }

    return null;
  };

  const handleReportIssue = async () => {
    if (!reportDescription.trim()) {
      alert('Please describe the issue');
      return;
    }

    try {
      await fetch('/api/error-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: reportQuestionId,
          reportType: 'INCORRECT_ANSWER',
          description: reportDescription,
          severity: 'MEDIUM',
        }),
      });
      setShowReportModal(false);
      setReportDescription('');
      setReportQuestionId('');
      alert('Issue reported successfully!');
    } catch (error) {
      console.error('Error reporting issue:', error);
      alert('Failed to report issue');
    }
  };

  const currentQuestion = questions[currentIndex];

  if (!isRunning && !isFinished) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              Ayansh Math Prep
            </Link>
            <nav className="flex gap-4">
              <Link href="/practice" className="text-gray-600 hover:text-indigo-600">
                Practice
              </Link>
              <Link href="/progress" className="text-gray-600 hover:text-indigo-600">
                Progress
              </Link>
              <Link href="/exams" className="text-gray-600 hover:text-indigo-600">
                Exams
              </Link>
              <Link href="/achievements" className="text-gray-600 hover:text-indigo-600">
                Achievements
              </Link>
              <Link href="/library" className="text-gray-600 hover:text-indigo-600">
                Library
              </Link>
            </nav>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Timed Challenge {examMode ? '(Exam Mode)' : ''}
            </h1>
            <p className="text-gray-600">Test yourself under time pressure</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => startChallenge(5, 10)}
              disabled={loading}
              className="bg-white rounded-lg p-8 shadow-md hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Quick Challenge</h3>
              <p className="text-gray-600 mb-2">10 questions • 5 minutes</p>
              <p className="text-sm text-gray-500">30 seconds per question</p>
            </button>

            <button
              onClick={() => startChallenge(10, 10)}
              disabled={loading}
              className="bg-white rounded-lg p-8 shadow-md hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">Standard Challenge</h3>
              <p className="text-gray-600 mb-2">10 questions • 10 minutes</p>
              <p className="text-sm text-gray-500">1 minute per question</p>
            </button>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/practice"
              className="inline-block px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              ← Back to Practice
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);

    // Calculate questions that took too long
    const avgTimePerQuestion = (totalTime * 60) / questions.length;
    const slowQuestions = Object.entries(questionTimings)
      .filter(([_, time]) => time > avgTimePerQuestion * 1.5)
      .map(([idx]) => parseInt(idx) + 1);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              Ayansh Math Prep
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Challenge Complete!</h1>
            <div className="text-6xl font-bold text-indigo-600 mb-4">
              {score}/{questions.length}
            </div>
            <div className="text-2xl text-gray-600 mb-8">{percentage}% Correct</div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-sm text-gray-600">Time Limit</div>
                <div className="text-xl font-semibold">{totalTime} min</div>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-sm text-gray-600">Questions</div>
                <div className="text-xl font-semibold">{questions.length}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-sm text-gray-600">Accuracy</div>
                <div className="text-xl font-semibold">{percentage}%</div>
              </div>
            </div>

            {slowQuestions.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-yellow-800 mb-2">Pacing Note:</h3>
                <p className="text-sm text-yellow-700">
                  You spent more time than average on questions: {slowQuestions.join(', ')}
                </p>
              </div>
            )}

            {markedForReview.size > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-blue-800 mb-2">Marked for Review:</h3>
                <p className="text-sm text-blue-700">
                  Questions:{' '}
                  {Array.from(markedForReview)
                    .map((i) => i + 1)
                    .join(', ')}
                </p>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setIsFinished(false);
                  setIsRunning(false);
                }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Try Again
              </button>
              <Link
                href="/practice"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Back to Practice
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const pacingWarning = getPacingWarning();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            Ayansh Math Prep
          </Link>
          <div className="flex items-center gap-4">
            <div className={`text-2xl font-bold ${getTimerColor()}`}>{formatTime(timeLeft)}</div>
            {!examMode && (
              <button
                onClick={togglePause}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            )}
          </div>
        </div>
      </header>

      {isPaused && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Paused</h2>
            <p className="text-gray-600 mb-6">Take a break. Click Resume when ready.</p>
            <button
              onClick={togglePause}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Resume Challenge
            </button>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>
                Question{' '}
                {examMode && currentQuestion?.questionNumber
                  ? `${currentQuestion.questionNumber}`
                  : `${currentIndex + 1} of ${questions.length}`}
              </span>
              <span>{Object.keys(selectedAnswers).length} answered</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Pacing Warning */}
          {pacingWarning && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">{pacingWarning}</p>
            </div>
          )}

          {/* Question Number Grid */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap gap-2">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    // Save time on current question before jumping
                    if (questionStartTimes[currentIndex]) {
                      const timeSpent = Math.floor(
                        (Date.now() - questionStartTimes[currentIndex]) / 1000
                      );
                      setQuestionTimings((prev) => ({
                        ...prev,
                        [currentIndex]: (prev[currentIndex] || 0) + timeSpent,
                      }));
                    }
                    setCurrentIndex(idx);
                  }}
                  className={`w-10 h-10 rounded-lg font-semibold ${
                    idx === currentIndex
                      ? 'bg-indigo-600 text-white'
                      : selectedAnswers[idx]
                        ? 'bg-green-200 text-green-800'
                        : markedForReview.has(idx)
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-gray-600">
              <span>
                <span className="inline-block w-3 h-3 bg-green-200 rounded mr-1"></span>Answered
              </span>
              <span>
                <span className="inline-block w-3 h-3 bg-yellow-200 rounded mr-1"></span>Review
              </span>
              <span>
                <span className="inline-block w-3 h-3 bg-gray-200 rounded mr-1"></span>Unanswered
              </span>
            </div>
          </div>

          {/* Question */}
          <div className="mb-6">
            <MathContent
              content={currentQuestion?.questionText || ''}
              className="text-xl text-gray-900 mb-4 whitespace-pre-wrap"
            />

            {currentQuestion?.hasImage && currentQuestion?.imageUrl && (
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-4">
                <div className="relative w-full max-w-2xl mx-auto">
                  <Image
                    src={currentQuestion.imageUrl}
                    alt="Question diagram"
                    width={800}
                    height={600}
                    className="w-full h-auto object-contain rounded"
                    unoptimized
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement?.parentElement;
                      if (parent) {
                        parent.innerHTML =
                          '<p class="text-red-600 text-center py-4">Diagram not available</p>';
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Report and Mark Buttons */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => {
                setReportQuestionId(currentQuestion?.id || '');
                setShowReportModal(true);
              }}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm"
            >
              Report Issue
            </button>
            <button
              onClick={toggleMarkForReview}
              className={`px-3 py-1 rounded-lg transition text-sm ${
                markedForReview.has(currentIndex)
                  ? 'bg-yellow-200 text-yellow-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {markedForReview.has(currentIndex) ? 'Marked for Review' : 'Mark for Review'}
            </button>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {currentQuestion?.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswer(option.optionLetter)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswers[currentIndex] === option.optionLetter
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <span className="font-semibold text-indigo-600 mr-3">{option.optionLetter}.</span>
                <MathContent content={option.optionText} className="inline text-gray-900" />
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            {currentIndex === questions.length - 1 ? (
              <button
                onClick={handleFinish}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Finish Challenge
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Next →
              </button>
            )}
          </div>
        </div>

        {/* Report Issue Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Report Issue</h3>
              <p className="text-sm text-gray-600 mb-4">Describe the problem with this question:</p>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 mb-4 min-h-[100px]"
                placeholder="E.g., The correct answer is marked wrong, diagram is missing, question text has typo..."
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReportIssue}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Submit Report
                </button>
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportDescription('');
                    setReportQuestionId('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function TimedChallengePage() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">⏱️</div>
              <p className="text-xl text-gray-600">Loading timed challenge...</p>
            </div>
          </div>
        }
      >
        <TimedChallengePageContent />
      </Suspense>
    </ErrorBoundary>
  );
}
