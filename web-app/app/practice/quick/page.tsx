'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

// Force dynamic rendering - this page cannot be statically generated
export const dynamic = 'force-dynamic';

// Inline utility function to avoid import issues during build
function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    let videoId: string | null = null;
    if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1).split('?')[0];
    } else if (
      urlObj.hostname === 'www.youtube.com' ||
      urlObj.hostname === 'youtube.com' ||
      urlObj.hostname === 'm.youtube.com'
    ) {
      if (urlObj.pathname === '/watch') {
        videoId = urlObj.searchParams.get('v');
      } else if (urlObj.pathname.startsWith('/embed/')) {
        videoId = urlObj.pathname.split('/embed/')[1]?.split('?')[0];
      } else if (urlObj.pathname.startsWith('/v/')) {
        videoId = urlObj.pathname.split('/v/')[1]?.split('?')[0];
      }
    }
    if (videoId && videoId.length === 11) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return null;
  } catch {
    if (url.includes('watch?v=')) {
      return url.replace('watch?v=', 'embed/').split('&')[0];
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

interface Question {
  id: string;
  questionText: string;
  examName: string | null;
  examYear: number | null;
  topic: string;
  difficulty: string;
  hasImage: boolean;
  imageUrl: string | null;
  videoUrl: string | null;
  options: Option[];
}

export default function QuickPracticePage() {
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

  useEffect(() => {
    fetchQuestions();
    createSession();
  }, []);

  const createSession = async () => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionType: 'QUICK',
          userId: 'ayansh',
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session.id);
      } else {
        toast.error('Failed to create practice session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create practice session');
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const topic = params.get('topic');
      const examName = params.get('examName');
      const examYear = params.get('examYear');

      const queryParams: string[] = [];
      if (topic) queryParams.push(`topic=${encodeURIComponent(topic)}`);
      if (examName) queryParams.push(`examName=${encodeURIComponent(examName)}`);
      if (examYear) queryParams.push(`examYear=${examYear}`);

      const url = queryParams.length > 0
        ? `/api/questions?${queryParams.join('&')}`
        : '/api/questions';

      const response = await fetch(url);
      const data = await response.json();
      setQuestions(data.questions || []);

      setCurrentIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setScore(0);
    } catch (error) {
      console.error('Error fetching questions:', error);
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
    if (!selectedAnswer || submitting) return;

    setSubmitting(true);
    const correct = currentQuestion.options.find(opt => opt.optionLetter === selectedAnswer)?.isCorrect || false;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000); // in seconds

    // Save attempt to database
    try {
      const response = await fetch('/api/user-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selectedAnswer,
          isCorrect: correct,
          timeSpent,
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        toast.error('Failed to save answer');
        setSubmitting(false);
        return;
      }

      setShowResult(true);
      if (correct) {
        setScore(score + 1);
        toast.success('Correct! 🎉');
      } else {
        toast.error('Incorrect. Try the next one!');
      }
    } catch (error) {
      console.error('Error saving attempt:', error);
      toast.error('Failed to save answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    // If this was the last question, complete the session
    if (currentIndex === questions.length - 1 && sessionId) {
      try {
        await fetch(`/api/sessions/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            totalQuestions: questions.length,
            correctAnswers: score,
          }),
        });
      } catch (error) {
        console.error('Error completing session:', error);
      }
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setStartTime(Date.now()); // Reset timer for next question
    }
  };

  const handleReportIssue = async () => {
    if (!reportDescription.trim()) {
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
    } catch (error) {
      console.error('Error reporting issue:', error);
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
              <p className="text-gray-500 mb-4">
                No questions available yet
              </p>
              <Link
                href="/library/add"
                className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add Your First Question
              </Link>
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Question {currentIndex + 1} of {questions.length}</span>
                  <span>Score: {score}/{currentIndex + (showResult ? 1 : 0)}</span>
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
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {currentQuestion.examName}
                    </span>
                  )}
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                    {currentQuestion.topic}
                  </span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    currentQuestion.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                    currentQuestion.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {currentQuestion.difficulty}
                  </span>
                </div>
                <p className="text-lg text-gray-900 font-medium mb-4 whitespace-pre-wrap">{currentQuestion.questionText}</p>

                {/* Display diagram if available */}
                {currentQuestion.hasImage && currentQuestion.imageUrl && (
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
                            parent.innerHTML = '<p class="text-red-600 text-center py-4">⚠️ Diagram not available</p>';
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {currentQuestion.options.map((option) => (
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

              {/* Video Solution */}
              {showResult && currentQuestion.videoUrl && (() => {
                const embedUrl = getYouTubeEmbedUrl(currentQuestion.videoUrl);
                return embedUrl ? (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">📺 Video Solution</h3>
                    <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        className="absolute top-0 left-0 w-full h-full"
                        src={embedUrl}
                        title="Video solution"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                ) : null;
              })()}

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
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      Practice Complete! 🎉
                    </p>
                    <p className="text-gray-600 mb-4">
                      Final Score: {score}/{questions.length} ({Math.round((score / questions.length) * 100)}%)
                    </p>
                    <Link
                      href="/practice"
                      className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Back to Practice
                    </Link>
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
              <p className="text-sm text-gray-600 mb-4">
                Describe the problem with this question:
              </p>
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
