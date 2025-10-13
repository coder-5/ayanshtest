'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface TopicPerformance {
  id: string;
  topic: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  averageTime: number;
  strengthLevel: string;
  needsPractice: boolean;
  lastPracticed: string;
}

export default function TopicPerformancePage() {
  const [topics, setTopics] = useState<TopicPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'needs-practice' | 'strong'>('all');

  useEffect(() => {
    fetchTopicPerformance();
  }, []);

  const fetchTopicPerformance = async () => {
    try {
      const response = await fetch('/api/topic-performance');
      const data = await response.json();
      setTopics(data.topics || []);
    } catch (error) {
      console.error('Error fetching topic performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (level: string) => {
    switch (level) {
      case 'EXPERT':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'ADVANCED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'INTERMEDIATE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'BEGINNER':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStrengthIcon = (level: string) => {
    switch (level) {
      case 'EXPERT':
        return '🏆';
      case 'ADVANCED':
        return '⭐';
      case 'INTERMEDIATE':
        return '📈';
      case 'BEGINNER':
        return '🌱';
      default:
        return '📊';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredTopics = topics.filter((topic) => {
    if (filter === 'needs-practice') return topic.needsPractice;
    if (filter === 'strong') return !topic.needsPractice;
    return true;
  });

  const weakTopics = topics.filter((t) => t.needsPractice);
  const strongTopics = topics.filter((t) => !t.needsPractice);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Topic Performance</h1>
          <p className="text-gray-600">Track your strengths and identify areas for improvement</p>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading topic performance...</div>
        ) : topics.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 mb-4">No topic data yet</p>
            <p className="text-sm text-gray-400 mb-6">
              Start practicing to see your topic performance
            </p>
            <Link
              href="/practice"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Start Practicing
            </Link>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Total Topics</div>
                <div className="text-3xl font-bold text-indigo-600">{topics.length}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Strong Topics</div>
                <div className="text-3xl font-bold text-green-600">{strongTopics.length}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Needs Practice</div>
                <div className="text-3xl font-bold text-orange-600">{weakTopics.length}</div>
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
                All Topics ({topics.length})
              </button>
              <button
                onClick={() => setFilter('needs-practice')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'needs-practice'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Needs Practice ({weakTopics.length})
              </button>
              <button
                onClick={() => setFilter('strong')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'strong'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Strong ({strongTopics.length})
              </button>
            </div>

            {/* Topic Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow"
                >
                  <div className="p-6">
                    {/* Topic Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{topic.topic}</h3>
                        <div
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-medium ${getStrengthColor(topic.strengthLevel)}`}
                        >
                          <span>{getStrengthIcon(topic.strengthLevel)}</span>
                          <span>{topic.strengthLevel}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Attempts</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {topic.totalAttempts}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Correct</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {topic.correctAttempts}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Accuracy</span>
                        <span
                          className={`text-sm font-semibold ${
                            topic.accuracy >= 80
                              ? 'text-green-600'
                              : topic.accuracy >= 60
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          {Math.round(topic.accuracy)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Avg Time</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {topic.averageTime}s
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Last Practiced</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatDate(topic.lastPracticed)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            topic.accuracy >= 80
                              ? 'bg-green-500'
                              : topic.accuracy >= 60
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${topic.accuracy}%` }}
                        />
                      </div>
                    </div>

                    {/* Practice Button */}
                    <Link
                      href={`/practice/quick?topic=${encodeURIComponent(topic.topic)}`}
                      className={`block w-full text-center px-4 py-2 rounded-lg transition ${
                        topic.needsPractice
                          ? 'bg-orange-600 text-white hover:bg-orange-700'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {topic.needsPractice ? '🎯 Practice Now' : '✨ Keep Practicing'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {filteredTopics.length === 0 && (
              <div className="text-center text-gray-500 py-12">No topics match this filter</div>
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
