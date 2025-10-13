'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface WeeklyAnalysis {
  id: string;
  weekStart: string;
  weekEnd: string;
  totalQuestions: number;
  correctAnswers: number;
  averageAccuracy: number;
  totalTimeSpent: number;
  topicsStudied: string[];
  strongTopics: string[];
  weakTopics: string[];
  improvementRate: number;
  consistencyScore: number;
}

export default function WeeklyAnalysisPage() {
  const [weeklyData, setWeeklyData] = useState<WeeklyAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyAnalysis();
  }, []);

  const fetchWeeklyAnalysis = async () => {
    try {
      const response = await fetch('/api/weekly-analysis');
      const data = await response.json();
      setWeeklyData(data.weeks || []);
    } catch (error) {
      console.error('Error fetching weekly analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getConsistencyBadge = (score: number) => {
    if (score >= 80) return { text: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (score >= 60) return { text: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (score >= 40) return { text: 'Fair', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Needs Work', color: 'bg-red-100 text-red-800' };
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📈 Weekly Analysis</h1>
          <p className="text-gray-600">Review your week-by-week progress and trends</p>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading weekly analysis...</div>
        ) : weeklyData.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 mb-4">No weekly data yet</p>
            <p className="text-sm text-gray-400 mb-6">Practice for a week to see your analysis</p>
            <Link
              href="/practice"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Start Practicing
            </Link>
          </div>
        ) : (
          <>
            {/* Current Week Summary */}
            {weeklyData[0] && (
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-8 mb-8 text-white shadow-xl">
                <div className="mb-4">
                  <div className="text-sm font-semibold uppercase tracking-wide mb-2">
                    Current Week
                  </div>
                  <div className="text-xl mb-1">
                    {formatDate(weeklyData[0].weekStart)} - {formatDate(weeklyData[0].weekEnd)}
                  </div>
                </div>
                <div className="grid md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-sm opacity-90 mb-1">Questions</div>
                    <div className="text-3xl font-bold">{weeklyData[0].totalQuestions}</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90 mb-1">Accuracy</div>
                    <div className="text-3xl font-bold">
                      {Math.round(weeklyData[0].averageAccuracy)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90 mb-1">Time Spent</div>
                    <div className="text-3xl font-bold">
                      {formatTime(weeklyData[0].totalTimeSpent)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90 mb-1">Improvement</div>
                    <div className="text-3xl font-bold">
                      {weeklyData[0].improvementRate > 0 ? '+' : ''}
                      {Math.round(weeklyData[0].improvementRate)}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Weekly Cards */}
            <div className="space-y-6">
              {weeklyData.map((week, index) => {
                const consistency = getConsistencyBadge(week.consistencyScore);
                return (
                  <div key={week.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Week {weeklyData.length - index}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatDate(week.weekStart)} - {formatDate(week.weekEnd)}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${consistency.color}`}
                        >
                          {consistency.text} Consistency
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Stats Grid */}
                      <div className="grid md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {week.totalQuestions}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Questions</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {week.correctAnswers}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Correct</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {Math.round(week.averageAccuracy)}%
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Accuracy</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {formatTime(week.totalTimeSpent)}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Time</div>
                        </div>
                      </div>

                      {/* Topics */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Strong Topics */}
                        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">💪</span>
                            <h4 className="font-semibold text-gray-900">Strong Topics</h4>
                          </div>
                          {week.strongTopics && week.strongTopics.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {week.strongTopics.map((topic, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">None yet</p>
                          )}
                        </div>

                        {/* Weak Topics */}
                        <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🎯</span>
                            <h4 className="font-semibold text-gray-900">Needs Practice</h4>
                          </div>
                          {week.weakTopics && week.weakTopics.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {week.weakTopics.map((topic, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-orange-200 text-orange-800 rounded text-xs"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">All topics strong!</p>
                          )}
                        </div>
                      </div>

                      {/* Improvement Rate */}
                      {index < weeklyData.length - 1 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Improvement from previous week
                            </span>
                            <span
                              className={`text-sm font-semibold ${
                                week.improvementRate > 0
                                  ? 'text-green-600'
                                  : week.improvementRate < 0
                                    ? 'text-red-600'
                                    : 'text-gray-600'
                              }`}
                            >
                              {week.improvementRate > 0
                                ? '↑'
                                : week.improvementRate < 0
                                  ? '↓'
                                  : '→'}
                              {Math.abs(Math.round(week.improvementRate))}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
