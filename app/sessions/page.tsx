'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchJsonSafe } from '@/lib/fetchJson';

interface Session {
  id: string;
  sessionType: string;
  startedAt: string;
  completedAt: string | null;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  averageAccuracy: number;
  isCompleted: boolean;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'QUICK' | 'TIMED' | 'TOPIC_FOCUSED'>('all');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const data = await fetchJsonSafe<{ sessions: Session[] }>('/api/sessions');
      setSessions(data?.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSessionIcon = (type: string) => {
    switch (type) {
      case 'QUICK':
        return '⚡';
      case 'TIMED':
        return '⏱️';
      case 'TOPIC_FOCUSED':
        return '📚';
      case 'WEAK_AREAS':
        return '🎯';
      case 'RETRY_FAILED':
        return '🔄';
      default:
        return '📝';
    }
  };

  const getSessionColor = (type: string) => {
    switch (type) {
      case 'QUICK':
        return 'bg-blue-100 text-blue-800';
      case 'TIMED':
        return 'bg-orange-100 text-orange-800';
      case 'TOPIC_FOCUSED':
        return 'bg-green-100 text-green-800';
      case 'WEAK_AREAS':
        return 'bg-purple-100 text-purple-800';
      case 'RETRY_FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const filteredSessions = sessions.filter((session) => {
    if (filter === 'all') return true;
    return session.sessionType === filter;
  });

  const completedSessions = sessions.filter((s) => s.isCompleted);
  const totalQuestions = completedSessions.reduce((sum, s) => sum + s.totalQuestions, 0);
  const totalCorrect = completedSessions.reduce((sum, s) => sum + s.correctAnswers, 0);
  const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

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
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📝 Practice Sessions</h1>
          <p className="text-gray-600">Review your practice session history</p>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 mb-4">No practice sessions yet</p>
            <p className="text-sm text-gray-400 mb-6">Complete a practice session to see it here</p>
            <Link
              href="/practice"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Start Practicing
            </Link>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Total Sessions</div>
                <div className="text-3xl font-bold text-indigo-600">{completedSessions.length}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Total Questions</div>
                <div className="text-3xl font-bold text-blue-600">{totalQuestions}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Overall Accuracy</div>
                <div className="text-3xl font-bold text-green-600">
                  {Math.round(overallAccuracy)}%
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Avg per Session</div>
                <div className="text-3xl font-bold text-purple-600">
                  {completedSessions.length > 0
                    ? Math.round(totalQuestions / completedSessions.length)
                    : 0}
                </div>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                All Sessions ({sessions.length})
              </button>
              <button
                onClick={() => setFilter('QUICK')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'QUICK'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                ⚡ Quick Practice
              </button>
              <button
                onClick={() => setFilter('TIMED')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'TIMED'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                ⏱️ Timed Challenge
              </button>
              <button
                onClick={() => setFilter('TOPIC_FOCUSED')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'TOPIC_FOCUSED'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                📚 Topic Practice
              </button>
            </div>

            {/* Sessions List */}
            <div className="space-y-4">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{getSessionIcon(session.sessionType)}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {session.sessionType.replace('_', ' ')}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatDate(session.startedAt)}
                            {session.completedAt && ` - ${formatDate(session.completedAt)}`}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getSessionColor(session.sessionType)}`}
                      >
                        {session.sessionType}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900">
                          {session.totalQuestions}
                        </div>
                        <div className="text-xs text-gray-600">Questions</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-green-600">
                          {session.correctAnswers}
                        </div>
                        <div className="text-xs text-gray-600">Correct</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div
                          className={`text-xl font-bold ${
                            session.averageAccuracy >= 80
                              ? 'text-green-600'
                              : session.averageAccuracy >= 60
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          {Math.round(session.averageAccuracy)}%
                        </div>
                        <div className="text-xs text-gray-600">Accuracy</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-indigo-600">
                          {formatDuration(session.timeSpent)}
                        </div>
                        <div className="text-xs text-gray-600">Duration</div>
                      </div>
                    </div>

                    {!session.isCompleted && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          ⚠️ Session in progress or incomplete
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredSessions.length === 0 && (
              <div className="text-center text-gray-500 py-12 bg-white rounded-lg">
                No sessions match this filter
              </div>
            )}
          </>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link
            href="/progress"
            className="inline-block px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            ← Back to Progress
          </Link>
        </div>
      </main>
    </div>
  );
}
