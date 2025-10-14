'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Toaster } from 'sonner';
import { fetchJsonSafe } from '@/lib/fetchJson';

interface Stats {
  totalQuestions: number;
  totalAttempts: number;
  accuracy: number;
  streak: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({
    totalQuestions: 0,
    totalAttempts: 0,
    accuracy: 0,
    streak: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [questionsData, progressData] = await Promise.all([
        fetchJsonSafe<{ total: number }>('/api/questions?limit=1'),
        fetchJsonSafe<{
          dailyProgress: Array<{ questionsAttempted: number; averageAccuracy: number }>;
          currentStreak: number;
        }>('/api/daily-progress?days=1'),
      ]);

      const totalQuestions = questionsData?.total || 0;

      let totalAttempts = 0;
      let accuracy = 0;

      if (progressData?.dailyProgress && progressData.dailyProgress.length > 0) {
        const today = progressData.dailyProgress[0];
        if (today) {
          totalAttempts = today.questionsAttempted || 0;
          accuracy = Math.round(today.averageAccuracy || 0);
        }
      }

      setStats({
        totalQuestions,
        totalAttempts,
        accuracy,
        streak: progressData?.currentStreak || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-indigo-600">🎓 Ayansh Math Prep</h1>
            <nav className="flex gap-6">
              <Link
                href="/practice"
                className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
              >
                Practice
              </Link>
              <Link
                href="/progress"
                className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
              >
                Progress
              </Link>
              <Link
                href="/exams"
                className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
              >
                Exams
              </Link>
              <Link
                href="/achievements"
                className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
              >
                Achievements
              </Link>
              <Link
                href="/library"
                className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
              >
                Library
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Welcome Back, Ayansh! 🚀</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Ready to tackle some math competition problems? Let&apos;s build those problem-solving
            skills!
          </p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            {
              label: 'Total Questions',
              value: stats.totalQuestions,
              icon: '📚',
              color: 'text-gray-400',
              desc:
                stats.totalQuestions === 0
                  ? 'Upload documents to add questions'
                  : 'Available for practice',
            },
            {
              label: 'Your Progress',
              value: stats.totalAttempts,
              icon: '🎯',
              color: 'text-gray-400',
              desc: stats.totalAttempts === 0 ? 'Start practicing!' : 'Questions attempted',
            },
            {
              label: 'Accuracy',
              value: `${stats.accuracy}%`,
              icon: '📊',
              color: 'text-orange-500',
              desc: stats.totalAttempts === 0 ? 'No attempts yet' : 'Keep practicing!',
            },
            {
              label: 'Current Streak',
              value: `${stats.streak} days`,
              icon: '🔥',
              color: 'text-orange-500',
              desc: stats.streak === 0 ? 'Start your streak!' : 'Keep it up!',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">{stat.label}</h3>
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Ready to Start Card */}
        <motion.div
          className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600">🎯</span>
            <h3 className="text-lg font-semibold text-gray-900">Ready to Start?</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Ready to practice? Choose from AMC 8, MOEMS, and Math Kangaroo problems!
          </p>
          <Link
            href="/practice"
            className="inline-block px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Start Practicing
          </Link>
        </motion.div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              href: '/progress',
              icon: '📈',
              color: 'text-blue-600',
              title: 'View Progress',
              desc: 'See your progress, statistics, and performance analytics',
              action: 'View Analytics →',
            },
            {
              href: '/upload',
              icon: '📤',
              color: 'text-orange-600',
              title: 'Upload Documents',
              desc: 'Add new competition questions from Word, PDF, or image files',
              action: 'Upload Questions →',
            },
            {
              href: '/library/add',
              icon: '➕',
              color: 'text-green-600',
              title: 'Add Question',
              desc: 'Create questions directly with multiple choice or text answers',
              action: 'Add Question →',
            },
            {
              href: '/library',
              icon: '📚',
              color: 'text-indigo-600',
              title: 'Question Library',
              desc: 'Browse and search through your collection of math problems',
              action: 'Browse Library →',
            },
            {
              href: '/solutions',
              icon: '💡',
              color: 'text-yellow-600',
              title: 'Solution Management',
              desc: 'Add detailed solutions to help when you get stuck',
              action: 'Manage Solutions →',
            },
            {
              href: '/edit-questions',
              icon: '✏️',
              color: 'text-green-600',
              title: 'Edit Questions',
              desc: 'Fix question text, correct answers, and add diagrams',
              action: 'Edit Questions →',
            },
            {
              href: '/exams',
              icon: '📅',
              color: 'text-purple-600',
              title: 'Exam Schedule',
              desc: 'Track upcoming competitions and view past exam results',
              action: 'Manage Exams →',
            },
            {
              href: '/practice/wrong-questions',
              icon: '🔄',
              color: 'text-red-600',
              title: 'Retry Failed Questions',
              desc: "Master the questions you've struggled with before",
              action: 'Fix Your Mistakes →',
            },
          ].map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + index * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
            >
              <Link
                href={action.href}
                className="block bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow h-full"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={action.color}>{action.icon}</span>
                  <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">{action.desc}</p>
                <span className="text-sm text-indigo-600 font-medium">{action.action}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">Made with ❤️ for Ayansh</p>
          <p className="text-gray-500 text-sm mt-1">Keep practicing, keep growing! 🌟</p>
        </div>
      </footer>
    </div>
  );
}
