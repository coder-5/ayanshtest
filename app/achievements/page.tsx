'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: string | null;
  points: number;
  tier: string | null;
  earned: boolean;
  earnedAt?: Date;
  progress: number;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [earnedCount, setEarnedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'earned' | 'unearned'>('all');

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const response = await fetch('/api/achievements');
      const data = await response.json();
      setAchievements(data.achievements || []);
      setTotalPoints(data.totalPoints || 0);
      setEarnedCount(data.earnedCount || 0);
      setTotalCount(data.totalCount || 0);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = achievements.filter((a) => {
    if (filter === 'earned') return a.earned;
    if (filter === 'unearned') return !a.earned;
    return true;
  });

  const getTierColor = (tier: string | null) => {
    switch (tier) {
      case 'BRONZE':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'SILVER':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'GOLD':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'PLATINUM':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
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
            <Link href="/library" className="text-gray-600 hover:text-indigo-600">
              Library
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Achievements 🏆</h1>
          <p className="text-gray-600">Track your progress and unlock rewards</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-2">🏅</div>
            <div className="text-3xl font-bold text-indigo-600">{earnedCount}</div>
            <div className="text-gray-600">Achievements Earned</div>
            <div className="text-sm text-gray-500 mt-1">
              {totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0}% Complete
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-2">⭐</div>
            <div className="text-3xl font-bold text-yellow-600">{totalPoints}</div>
            <div className="text-gray-600">Total Points</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-2">🎯</div>
            <div className="text-3xl font-bold text-green-600">{totalCount - earnedCount}</div>
            <div className="text-gray-600">Remaining</div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilter('earned')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'earned'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Earned ({earnedCount})
          </button>
          <button
            onClick={() => setFilter('unearned')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'unearned'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Locked ({totalCount - earnedCount})
          </button>
        </div>

        {/* Achievements Grid */}
        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading achievements...</div>
        ) : filteredAchievements.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-500">
            No achievements to display
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`bg-white rounded-lg shadow-md p-6 border-2 transition ${
                  achievement.earned ? 'border-green-300' : 'border-gray-200 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{achievement.icon || '🏆'}</div>
                  {achievement.tier && (
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded border ${getTierColor(achievement.tier)}`}
                    >
                      {achievement.tier}
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">{achievement.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{achievement.description}</p>

                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{achievement.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        achievement.earned ? 'bg-green-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${achievement.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-yellow-600 font-semibold">
                    <span>⭐</span>
                    <span>{achievement.points} pts</span>
                  </div>
                  {achievement.earned && achievement.earnedAt && (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <span>✓</span>
                      <span>Earned</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

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
