'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SafeHtml } from '@/lib/sanitize';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';

interface QuestionWithStats {
  id: string;
  questionText: string;
  examName: string | null;
  topic: string | null;
  difficulty: string;
  stats: {
    totalAttempts: number;
    wrongAttempts: number;
    correctAttempts: number;
    lastAttemptedAt: string;
    neverCorrect: boolean;
    priority: number;
  };
}

interface Summary {
  totalFailed: number;
  neverCorrect: number;
  highPriority: number;
}

function WrongQuestionsPageContent() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionWithStats[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high-priority' | 'never-correct'>('all');

  useEffect(() => {
    fetchWrongQuestions();

    // Refetch when page regains focus (user returns from practice)
    const handleFocus = () => {
      fetchWrongQuestions();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchWrongQuestions = async () => {
    try {
      const response = await fetch('/api/questions/failed');
      const data = await response.json();
      setQuestions(data.questions || []);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching wrong questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (filter === 'high-priority') return q.stats.wrongAttempts >= 3;
    if (filter === 'never-correct') return q.stats.neverCorrect;
    return true;
  });

  const startPractice = (mode: 'all' | 'high-priority' | 'never-correct') => {
    // Store filter in session storage for practice page to use
    sessionStorage.setItem('practiceMode', 'retry-failed');
    sessionStorage.setItem('retryFilter', mode);
    router.push('/practice/quick?mode=retry');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
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
            <Link href="/library" className="text-gray-600 hover:text-indigo-600">
              Library
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🔄 Retry Wrong Questions</h1>
          <p className="text-xl text-gray-600">
            Practice questions you got wrong before and improve your mastery
          </p>
          {!loading && questions.length > 0 && (
            <button
              onClick={() => {
                setLoading(true);
                fetchWrongQuestions();
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
            >
              🔄 Refresh Data
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading wrong questions...</div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Perfect Record!</h2>
            <p className="text-gray-600 mb-6">
              You haven&apos;t gotten any questions wrong yet. Keep up the great work!
            </p>
            <Link
              href="/practice"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Continue Practicing
            </Link>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Total Wrong Questions</div>
                <div className="text-4xl font-bold text-red-600 mb-4">{summary?.totalFailed}</div>
                <button
                  onClick={() => startPractice('all')}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Practice All
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">High Priority (3+ wrong)</div>
                <div className="text-4xl font-bold text-orange-600 mb-4">
                  {summary?.highPriority}
                </div>
                <button
                  onClick={() => startPractice('high-priority')}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  disabled={summary?.highPriority === 0}
                >
                  Practice These First
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Never Gotten Right</div>
                <div className="text-4xl font-bold text-purple-600 mb-4">
                  {summary?.neverCorrect}
                </div>
                <button
                  onClick={() => startPractice('never-correct')}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  disabled={summary?.neverCorrect === 0}
                >
                  Focus on These
                </button>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                All Questions ({questions.length})
              </button>
              <button
                onClick={() => setFilter('high-priority')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'high-priority'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                High Priority ({summary?.highPriority})
              </button>
              <button
                onClick={() => setFilter('never-correct')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'never-correct'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Never Correct ({summary?.neverCorrect})
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                    question.stats.neverCorrect
                      ? 'border-purple-500'
                      : question.stats.wrongAttempts >= 3
                        ? 'border-orange-500'
                        : 'border-red-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Question Tags */}
                      <div className="flex gap-2 mb-3">
                        {question.examName && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {question.examName}
                          </span>
                        )}
                        {question.topic && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            {question.topic}
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            question.difficulty === 'EASY'
                              ? 'bg-green-100 text-green-800'
                              : question.difficulty === 'MEDIUM'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {question.difficulty}
                        </span>
                        {question.stats.neverCorrect && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                            ⚠️ Never Correct
                          </span>
                        )}
                      </div>

                      {/* Question Text */}
                      <SafeHtml
                        html={question.questionText}
                        className="text-gray-900 mb-3 line-clamp-2"
                      />

                      {/* Stats */}
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>❌ Wrong: {question.stats.wrongAttempts}</span>
                        <span>✓ Correct: {question.stats.correctAttempts}</span>
                        <span>📅 Last: {formatDate(question.stats.lastAttemptedAt)}</span>
                      </div>
                    </div>

                    {/* Priority Badge */}
                    <div className="text-center">
                      <div
                        className={`text-3xl font-bold ${
                          question.stats.priority >= 6
                            ? 'text-purple-600'
                            : question.stats.priority >= 4
                              ? 'text-orange-600'
                              : 'text-red-600'
                        }`}
                      >
                        {question.stats.wrongAttempts}x
                      </div>
                      <div className="text-xs text-gray-600">attempts</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredQuestions.length === 0 && (
              <div className="text-center text-gray-500 py-12">No questions match this filter</div>
            )}
          </>
        )}

        {/* Back Button */}
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

export default function WrongQuestionsPage() {
  return (
    <ErrorBoundary>
      <WrongQuestionsPageContent />
    </ErrorBoundary>
  );
}
