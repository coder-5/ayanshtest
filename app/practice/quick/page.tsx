'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { calculatePercentile } from '@/lib/examCutoffs';
import { getClientUserId } from '@/lib/userContext';
import { useVideoTracking } from '@/hooks/useVideoTracking';
import { SafeHtml } from '@/lib/sanitize';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';

// Force dynamic rendering - this page cannot be statically generated
export const dynamic = 'force-dynamic';

// Inline utility function to avoid import issues during build
function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    let videoId: string | null | undefined = null;
    if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1).split('?')[0] || null;
    } else if (
      urlObj.hostname === 'www.youtube.com' ||
      urlObj.hostname === 'youtube.com' ||
      urlObj.hostname === 'm.youtube.com'
    ) {
      if (urlObj.pathname === '/watch') {
        videoId = urlObj.searchParams.get('v');
      } else if (urlObj.pathname.startsWith('/embed/')) {
        videoId = urlObj.pathname.split('/embed/')[1]?.split('?')[0] || null;
      } else if (urlObj.pathname.startsWith('/v/')) {
        videoId = urlObj.pathname.split('/v/')[1]?.split('?')[0] || null;
      }
    }
    if (videoId && videoId.length === 11) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return null;
  } catch {
    if (url.includes('watch?v=')) {
      return url.replace('watch?v=', 'embed/').split('&')[0] || null;
    }
    return null;
  }
}

interface Option {
  id: string;
  optionLetter: string;
  optionText: string;
  isCorrect: boolean;
}

interface Solution {
  id: string;
  solutionText: string;
  videoLinks: string[] | null;
}

interface Question {
  id: string;
  questionText: string;
  examName: string | null;
  examYear: number | null;
  questionNumber?: string;
  topic: string;
  difficulty: string;
  hasImage: boolean;
  imageUrl: string | null;
  videoUrl: string | null;
  options: Option[];
  solution?: Solution | null;
  correctAnswer: string | null;
}

// Video Player Component with tracking
function VideoPlayer({
  embedUrl,
  videoLink,
  questionId,
  videoIndex,
}: {
  embedUrl: string;
  videoLink: string;
  questionId: string;
  videoIndex: number;
}) {
  // Use video tracking hook
  useVideoTracking({
    questionId,
    videoUrl: videoLink,
    onComplete: () => {
      // Video completion tracked via useVideoTracking hook
    },
  });

  return (
    <div>
      <p className="text-sm text-gray-600 mb-2">Video {videoIndex + 1}</p>
      <div
        className="relative w-full bg-gray-100 rounded-lg overflow-hidden"
        style={{ paddingBottom: '56.25%' }}
      >
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={embedUrl}
          title={`Video solution ${videoIndex + 1}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

function QuickPracticePageContent() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDescription, setReportDescription] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Load saved state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('quickPracticeState');
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          setQuestions(parsed.questions || []);
          setCurrentIndex(parsed.currentIndex || 0);
          setScore(parsed.score || 0);
          setSessionId(parsed.sessionId || null);
          setStartTime(parsed.startTime || Date.now());
          setLoading(false); // Set loading to false when restoring from cache
          toast.success('Session restored! 📚');
        } catch (_error) {
          // Failed to parse saved state - will fetch fresh questions
          fetchQuestions();
          createSession();
        }
      } else {
        fetchQuestions();
        createSession();
      }
    } catch (_error) {
      // localStorage not available (incognito mode, quota exceeded, etc.)
      fetchQuestions();
      createSession();
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (questions.length > 0 && sessionId) {
      try {
        const stateToSave = {
          questions,
          currentIndex,
          score,
          sessionId,
          startTime,
          savedAt: Date.now(),
        };
        localStorage.setItem('quickPracticeState', JSON.stringify(stateToSave));
      } catch (_error) {
        // localStorage quota exceeded or not available - fail silently
        // Error is intentionally not logged to avoid console noise
      }
    }
  }, [questions, currentIndex, score, sessionId, startTime]);

  // Cleanup: Complete session on component unmount or navigation away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentIndex > 0 && currentIndex < questions.length - 1) {
        e.preventDefault();
        e.returnValue = 'You have unsaved progress. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Complete session synchronously on cleanup
      if (sessionId && currentIndex > 0) {
        // Fire and forget - send beacon for cleanup
        const data = JSON.stringify({
          totalQuestions: currentIndex + (showResult ? 1 : 0),
          correctAnswers: score,
        });

        // Use sendBeacon for guaranteed delivery even when page unloads
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            `/api/sessions/${sessionId}`,
            new Blob([data], { type: 'application/json' })
          );
        }

        // Clean up localStorage
        try {
          localStorage.removeItem('quickPracticeState');
        } catch (_error) {
          // localStorage not available - non-critical
        }
      }
    };
  }, [sessionId, currentIndex, score, showResult, questions.length]);

  const createSession = async () => {
    try {
      const userId = getClientUserId();
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionType: 'QUICK',
          userId,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session.id);
      } else {
        toast.error('Failed to create practice session');
      }
    } catch (_error) {
      toast.error('Failed to create practice session');
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const topic = params.get('topic') ?? undefined;
      const examName = params.get('examName') ?? undefined;
      const examYear = params.get('examYear') ?? undefined;

      const queryParams: string[] = [];
      if (topic) queryParams.push(`topic=${encodeURIComponent(topic)}`);
      if (examName) queryParams.push(`examName=${encodeURIComponent(examName)}`);
      if (examYear) queryParams.push(`examYear=${examYear}`);

      const url =
        queryParams.length > 0 ? `/api/questions?${queryParams.join('&')}` : '/api/questions';

      const response = await fetch(url);
      const data = await response.json();
      setQuestions(data?.questions || []);

      setCurrentIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setScore(0);
    } catch (_error) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (optionLetter: string) => {
    if (showResult) return;
    setSelectedAnswer(optionLetter);
  };

  const handleSubmit = async () => {
    if (!selectedAnswer || submitting || !currentQuestion) return;

    // Prevent rapid double-clicks
    setSubmitting(true);

    // Note: Correctness is now calculated server-side for security
    // This local check is kept for potential future client-side UX improvements

    const timeSpent = Math.floor((Date.now() - startTime) / 1000); // in seconds

    // Save attempt to database (server will calculate correctness)
    try {
      const response = await fetch('/api/user-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selectedAnswer,
          timeSpent,
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        toast.error('Failed to save answer');
        setSubmitting(false);
        return;
      }

      // Get server response with correct answer validation
      const result = await response.json();
      const serverIsCorrect = result.attempt?.isCorrect || false;

      setShowResult(true);
      if (serverIsCorrect) {
        setScore(score + 1);
        toast.success('Correct! 🎉');
      } else {
        toast.error('Incorrect. Try the next one!');
      }

      // Trigger achievement check
      window.dispatchEvent(new Event('question-completed'));
    } catch (_error) {
      toast.error('Failed to save answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    // If this was the last question, complete the session
    if (currentIndex === questions.length - 1 && sessionId) {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            totalQuestions: questions.length,
            correctAnswers: score,
          }),
        });

        // Only clear localStorage if session completion succeeds
        if (response.ok) {
          try {
            localStorage.removeItem('quickPracticeState');
          } catch (_error) {
            // localStorage not available - non-critical
          }
        } else {
          toast.error('Failed to save session. Progress kept for retry.');
        }
      } catch (_error) {
        toast.error('Failed to save session. Progress kept for retry.');
      }
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowSolution(false);
      setImageError(false); // Reset image error state
      setStartTime(Date.now()); // Reset timer for next question
    }
  };

  const handleReportIssue = async () => {
    if (!reportDescription.trim() || !currentQuestion) {
      toast.error('Please describe the issue');
      return;
    }

    setReporting(true);
    try {
      const response = await fetch('/api/error-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          reportType: 'INCORRECT_ANSWER',
          description: reportDescription,
          severity: 'MEDIUM',
        }),
      });

      if (response.ok) {
        setShowReportModal(false);
        setReportDescription('');
        toast.success('Issue reported successfully!');
      } else {
        toast.error('Failed to report issue');
      }
    } catch (_error) {
      toast.error('Failed to report issue');
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
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

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quick Practice ⚡</h1>
            <p className="text-gray-600">Answer random questions to sharpen your skills</p>
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-12">Loading questions...</div>
          ) : questions.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <p className="text-gray-500 mb-4">No questions available yet</p>
              <Link
                href="/library/add"
                className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add Your First Question
              </Link>
            </div>
          ) : !currentQuestion ? (
            <div className="text-center text-gray-500 py-12">Loading question...</div>
          ) : (
            <>
              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span>
                    Score: {score}/{currentIndex + (showResult ? 1 : 0)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question */}
              <div className="mb-6">
                <div className="flex gap-2 mb-4">
                  {currentQuestion.examName && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-semibold">
                      {currentQuestion.examName}
                      {currentQuestion.questionNumber && ` #${currentQuestion.questionNumber}`}
                    </span>
                  )}
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                    {currentQuestion.topic}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      currentQuestion.difficulty === 'EASY'
                        ? 'bg-green-100 text-green-800'
                        : currentQuestion.difficulty === 'MEDIUM'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {currentQuestion.difficulty}
                  </span>
                  {currentQuestion.hasImage && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm font-semibold">
                      📷 Has Diagram
                    </span>
                  )}
                </div>
                <SafeHtml
                  html={currentQuestion.questionText}
                  className="text-lg text-gray-900 font-medium mb-4 whitespace-pre-wrap"
                />

                {/* Display diagram if available */}
                {currentQuestion.hasImage && currentQuestion.imageUrl && (
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-4">
                    {!imageError ? (
                      <div className="relative w-full max-w-2xl mx-auto">
                        <Image
                          src={currentQuestion.imageUrl}
                          alt="Question diagram"
                          width={800}
                          height={600}
                          className="w-full h-auto object-contain rounded"
                          unoptimized
                          onError={() => setImageError(true)}
                        />
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                        <p className="text-yellow-800 text-center mb-3">⚠️ Diagram not available</p>
                        <div className="text-center">
                          <Link
                            href={`/library/edit/${currentQuestion.id}`}
                            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                          >
                            📤 Upload Diagram
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Options or Fill-in Input */}
              {currentQuestion.options?.length > 0 ? (
                <>
                  <div className="space-y-3 mb-6">
                    {currentQuestion.options?.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleAnswer(option.optionLetter)}
                        disabled={showResult}
                        className={`w-full text-left p-4 rounded-lg border-2 transition ${
                          selectedAnswer === option.optionLetter
                            ? showResult
                              ? option.isCorrect
                                ? 'border-green-500 bg-green-50'
                                : 'border-red-500 bg-red-50'
                              : 'border-indigo-500 bg-indigo-50'
                            : showResult && option.isCorrect
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-300 hover:border-indigo-300'
                        }`}
                      >
                        <span className="font-semibold text-gray-900">{option.optionLetter}.</span>{' '}
                        <span className="text-gray-900">{option.optionText}</span>
                      </button>
                    ))}
                  </div>

                  {/* Explicit AMC8 Answer Text Feedback */}
                  {showResult && (
                    <div className="mb-6 p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                      {(() => {
                        const correctOption = currentQuestion.options.find((opt) => opt.isCorrect);
                        const userSelectedOption = currentQuestion.options.find(
                          (opt) => opt.optionLetter === selectedAnswer
                        );
                        const isCorrect = userSelectedOption?.isCorrect;

                        return isCorrect ? (
                          <p className="text-green-700 font-semibold text-lg">
                            ✓ Correct! The answer is ({correctOption?.optionLetter})
                          </p>
                        ) : (
                          <div>
                            <p className="text-red-700 font-semibold text-lg mb-2">
                              ✗ Incorrect. The correct answer is ({correctOption?.optionLetter})
                            </p>
                            <p className="text-gray-700">
                              <span className="font-semibold">{correctOption?.optionLetter}.</span>{' '}
                              {correctOption?.optionText}
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              ) : (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Answer:
                  </label>
                  <input
                    type="text"
                    value={selectedAnswer || ''}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    disabled={showResult}
                    className={`w-full p-4 text-lg text-gray-900 rounded-lg border-2 transition ${
                      showResult
                        ? selectedAnswer?.trim().toLowerCase() ===
                          currentQuestion.correctAnswer?.trim().toLowerCase()
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                        : 'border-gray-300 focus:border-indigo-500 focus:outline-none'
                    }`}
                    placeholder="Enter your answer"
                  />
                  {showResult && (
                    <div className="mt-2">
                      {selectedAnswer?.trim().toLowerCase() ===
                      currentQuestion.correctAnswer?.trim().toLowerCase() ? (
                        <p className="text-green-700 font-medium">✓ Correct!</p>
                      ) : (
                        <p className="text-red-700 font-medium">
                          ✗ Incorrect. The correct answer is:{' '}
                          <span className="font-bold">{currentQuestion.correctAnswer}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Solution Section (Collapsible) */}
              {showResult && currentQuestion.solution && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowSolution(!showSolution)}
                    className="w-full px-4 py-3 bg-indigo-100 text-indigo-800 font-semibold rounded-lg hover:bg-indigo-200 transition flex items-center justify-between"
                  >
                    <span>📚 {showSolution ? 'Hide' : 'Show'} Detailed Solution</span>
                    <span className="text-2xl">{showSolution ? '▲' : '▼'}</span>
                  </button>

                  {showSolution && (
                    <div className="mt-4 bg-gray-50 border-2 border-indigo-200 rounded-lg p-6">
                      {/* Written Solution */}
                      {currentQuestion.solution?.solutionText && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            📝 Detailed Solution
                          </h3>
                          <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
                            {currentQuestion.solution.solutionText
                              .split('\n\n')
                              .map((paragraph, idx) => (
                                <div
                                  key={idx}
                                  className={`${paragraph.trim().startsWith('METHOD') ? 'pt-4 mt-4 border-t-2 border-gray-200' : ''}`}
                                >
                                  <p
                                    className={`text-gray-800 leading-relaxed ${paragraph.trim().startsWith('METHOD') ? 'font-semibold text-indigo-900 mb-2' : ''}`}
                                  >
                                    {paragraph.trim()}
                                  </p>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Video Solutions */}
                      {currentQuestion.solution?.videoLinks &&
                        currentQuestion.solution.videoLinks.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                              📺 Video Solutions ({currentQuestion.solution.videoLinks.length})
                            </h3>
                            <div className="space-y-4">
                              {currentQuestion.solution.videoLinks?.map((videoLink, index) => {
                                const embedUrl = getYouTubeEmbedUrl(videoLink);
                                return embedUrl ? (
                                  <VideoPlayer
                                    key={`${currentQuestion.id}-${index}`}
                                    embedUrl={embedUrl}
                                    videoLink={videoLink}
                                    questionId={currentQuestion.id}
                                    videoIndex={index}
                                  />
                                ) : (
                                  <div key={index} className="text-sm">
                                    <a
                                      href={videoLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-indigo-600 hover:underline"
                                    >
                                      📺 Video {index + 1}: {videoLink}
                                    </a>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}

              {/* Report Issue Button */}
              {showResult && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    🐛 Report Issue
                  </button>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between">
                <Link
                  href="/practice"
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  ← Back
                </Link>
                {!showResult ? (
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedAnswer || submitting}
                    className="px-6 py-3 text-lg bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {submitting ? 'Submitting...' : 'Submit Answer'}
                  </button>
                ) : currentIndex < questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-3 text-lg bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Next Question →
                  </button>
                ) : (
                  <div className="w-full">
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-8 mb-6 border-2 border-green-200">
                      <p className="text-2xl font-bold text-gray-900 mb-4 text-center">
                        Practice Complete! 🎉
                      </p>
                      <div className="bg-white rounded-lg p-6 mb-4">
                        <p className="text-lg text-gray-700 mb-2 text-center">
                          Final Score:{' '}
                          <span className="text-2xl font-bold text-indigo-600">
                            {score}/{questions.length}
                          </span>
                        </p>
                        <p className="text-md text-gray-600 text-center">
                          Accuracy: {Math.round((score / questions.length) * 100)}%
                        </p>
                      </div>

                      {/* Percentile Ranking (if exam-based questions) */}
                      {(() => {
                        // Check if this was an exam-based practice session
                        const examName = currentQuestion?.examName;
                        const examYear = currentQuestion?.examYear;

                        if (examName) {
                          const percentileData = calculatePercentile(
                            examName,
                            score,
                            examYear || undefined
                          );

                          if (percentileData) {
                            return (
                              <div className="bg-white rounded-lg p-6 border-2 border-indigo-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                                  📊 Your Estimated Ranking
                                </h3>

                                {/* Percentile Display */}
                                <div className="text-center mb-4">
                                  <div className="text-5xl font-bold text-indigo-600 mb-2">
                                    {percentileData.percentile}th
                                  </div>
                                  <div className="text-lg text-gray-700 font-semibold">
                                    {percentileData.rank}
                                  </div>
                                  {percentileData.isEstimated && (
                                    <p className="text-xs text-gray-500 mt-2">
                                      Based on historical competition data
                                    </p>
                                  )}
                                </div>

                                {/* Achievements */}
                                {percentileData.achievements?.length > 0 && (
                                  <div className="mb-4">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">
                                      🏆 Achievements Unlocked:
                                    </p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                      {percentileData.achievements?.map((achievement, idx) => (
                                        <span
                                          key={idx}
                                          className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium"
                                        >
                                          {achievement}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Next Goal */}
                                {percentileData.nextGoal && (
                                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <p className="text-sm font-semibold text-blue-900 mb-1">
                                      🎯 Next Goal:
                                    </p>
                                    <p className="text-sm text-blue-800">
                                      <span className="font-bold">
                                        {percentileData.nextGoal.name}
                                      </span>
                                      <br />
                                      Just{' '}
                                      <span className="font-bold">
                                        {percentileData.nextGoal.pointsNeeded} more point
                                        {percentileData.nextGoal.pointsNeeded !== 1 ? 's' : ''}
                                      </span>{' '}
                                      to reach the {percentileData.nextGoal.percentile}th
                                      percentile!
                                    </p>
                                  </div>
                                )}

                                <p className="text-xs text-gray-500 mt-4 text-center">
                                  💡 This ranking is based on official {examName} competition
                                  results
                                  {examYear && ` from ${examYear}`}
                                </p>
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}
                    </div>

                    <div className="text-center">
                      <Link
                        href="/practice"
                        className="inline-block px-8 py-4 text-lg bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-lg"
                      >
                        Back to Practice
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
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
                  disabled={reporting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  {reporting ? 'Submitting...' : 'Submit Report'}
                </button>
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportDescription('');
                  }}
                  disabled={reporting}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
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

export default function QuickPracticePage() {
  return (
    <ErrorBoundary>
      <QuickPracticePageContent />
    </ErrorBoundary>
  );
}
