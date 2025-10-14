'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { fetchJsonSafe } from '@/lib/fetchJson';

interface ProgressStats {
  totalQuestions: number;
  accuracy: number;
  streakDays: number;
  timeSpent: number;
}

interface TopicPerformance {
  topic: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface RecentActivity {
  id: string;
  questionText: string;
  topic: string;
  difficulty: string;
  isCorrect: boolean;
  attemptedAt: string;
}

function ProgressPageContent() {
  const [stats, setStats] = useState<ProgressStats>({
    totalQuestions: 0,
    accuracy: 0,
    streakDays: 0,
    timeSpent: 0,
  });
  const [topicPerformance, setTopicPerformance] = useState<TopicPerformance[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const data = await fetchJsonSafe<{
          stats: ProgressStats;
          topicPerformance: TopicPerformance[];
          recentActivity: RecentActivity[];
        }>('/api/progress');
        if (data) {
          setStats(data.stats);
          setTopicPerformance(data.topicPerformance);
          setRecentActivity(data.recentActivity);
        } else {
          console.error('Failed to fetch progress data');
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

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
            <Link href="/progress" className="text-indigo-600 font-semibold">
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Progress 📊</h1>
          <p className="text-gray-600">Track your improvement over time</p>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Link
            href="/daily-progress"
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow"
          >
            <div className="text-3xl mb-2">📅</div>
            <div className="text-lg font-semibold">Daily Progress</div>
            <div className="text-sm opacity-90 mt-1">View daily stats</div>
          </Link>
          <Link
            href="/topic-performance"
            className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow"
          >
            <div className="text-3xl mb-2">📊</div>
            <div className="text-lg font-semibold">Topic Performance</div>
            <div className="text-sm opacity-90 mt-1">Strengths & weaknesses</div>
          </Link>
          <Link
            href="/weekly-analysis"
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow"
          >
            <div className="text-3xl mb-2">📈</div>
            <div className="text-lg font-semibold">Weekly Analysis</div>
            <div className="text-sm opacity-90 mt-1">Week-by-week trends</div>
          </Link>
          <Link
            href="/sessions"
            className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow"
          >
            <div className="text-3xl mb-2">📝</div>
            <div className="text-lg font-semibold">Practice Sessions</div>
            <div className="text-sm opacity-90 mt-1">Session history</div>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-sm text-gray-600 mb-1">Total Questions</div>
            <div className="text-3xl font-bold text-indigo-600">
              {loading ? '...' : stats.totalQuestions}
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-sm text-gray-600 mb-1">Accuracy</div>
            <div className="text-3xl font-bold text-green-600">
              {loading ? '...' : `${stats.accuracy}%`}
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-sm text-gray-600 mb-1">Streak Days</div>
            <div className="text-3xl font-bold text-purple-600">
              {loading ? '...' : stats.streakDays}
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-sm text-gray-600 mb-1">Time Spent</div>
            <div className="text-3xl font-bold text-orange-600">
              {loading ? '...' : `${stats.timeSpent}h`}
            </div>
          </div>
        </div>

        {/* Topic Performance */}
        <div className="bg-white rounded-lg p-6 shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Topic Performance</h2>
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading...</div>
          ) : topicPerformance.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No topic performance data yet. Start practicing to see your progress by topic!
            </div>
          ) : (
            <div className="space-y-4">
              {topicPerformance.map((topic) => (
                <div key={topic.topic} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-900">{topic.topic}</h3>
                    <span className="text-sm text-gray-600">
                      {topic.correct}/{topic.total} ({topic.accuracy}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${topic.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading...</div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No activity yet. Start practicing to see your progress!
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div
                    className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center ${
                      activity.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {activity.isCorrect ? '✓' : '✗'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 line-clamp-1">{activity.questionText}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                        {activity.topic}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          activity.difficulty === 'EASY'
                            ? 'bg-green-100 text-green-800'
                            : activity.difficulty === 'MEDIUM'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {activity.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <ErrorBoundary>
      <ProgressPageContent />
    </ErrorBoundary>
  );
}
