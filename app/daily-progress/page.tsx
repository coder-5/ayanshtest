'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface DailyProgress {
  id: string;
  date: string;
  questionsAttempted: number;
  correctAnswers: number;
  totalTimeSpent: number;
  averageAccuracy: number;
  topicsStudied: string;
  streakDays: number;
  isStreakDay: boolean;
}

export default function DailyProgressPage() {
  const [progressData, setProgressData] = useState<DailyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    fetchDailyProgress();
  }, []);

  const fetchDailyProgress = async () => {
    try {
      const response = await fetch('/api/daily-progress');
      const data = await response.json();
      setProgressData(data.progress || []);
      if (data.progress && data.progress.length > 0) {
        setCurrentStreak(data.progress[0].streakDays || 0);
      }
    } catch (error) {
      console.error('Error fetching daily progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
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
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📅 Daily Progress</h1>
          <p className="text-gray-600">Track your daily practice and maintain your streak</p>
        </div>

        {/* Streak Banner */}
        <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide mb-1">
                Current Streak
              </div>
              <div className="text-5xl font-bold">{currentStreak} 🔥</div>
              <div className="text-sm mt-2 opacity-90">
                {currentStreak === 0
                  ? 'Start your streak today!'
                  : currentStreak === 1
                    ? 'Keep it going!'
                    : currentStreak < 7
                      ? 'Great momentum!'
                      : currentStreak < 14
                        ? 'On fire!'
                        : 'Incredible dedication!'}
              </div>
            </div>
            <div className="text-6xl">🏆</div>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading progress data...</div>
        ) : progressData.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 mb-4">No practice data yet</p>
            <Link
              href="/practice"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Start Practicing
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Total Days</div>
                <div className="text-3xl font-bold text-indigo-600">{progressData.length}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Total Questions</div>
                <div className="text-3xl font-bold text-green-600">
                  {progressData.reduce((sum, day) => sum + day.questionsAttempted, 0)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Avg Accuracy</div>
                <div className="text-3xl font-bold text-blue-600">
                  {Math.round(
                    progressData.reduce((sum, day) => sum + day.averageAccuracy, 0) /
                      progressData.length
                  )}
                  %
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Total Time</div>
                <div className="text-3xl font-bold text-purple-600">
                  {Math.round(progressData.reduce((sum, day) => sum + day.totalTimeSpent, 0) / 60)}{' '}
                  min
                </div>
              </div>
            </div>

            {/* Daily Progress Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Daily Activity</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Questions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Correct
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Accuracy
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Topics
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Streak
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {progressData.map((day) => (
                      <tr key={day.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatDate(day.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {day.questionsAttempted}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {day.correctAnswers}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 rounded ${
                              day.averageAccuracy >= 80
                                ? 'bg-green-100 text-green-800'
                                : day.averageAccuracy >= 60
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {Math.round(day.averageAccuracy)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatTime(day.totalTimeSpent)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {day.topicsStudied || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {day.isStreakDay ? (
                            <span className="text-orange-600 font-semibold">
                              {day.streakDays} 🔥
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
