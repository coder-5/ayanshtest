'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchJsonSafe } from '@/lib/fetchJson';

interface TopicData {
  topic: string;
  accuracy: number;
  totalAttempts: number;
  strengthLevel: string;
  needsPractice: boolean;
}

interface SessionData {
  id: string;
  startedAt: string;
  completedAt: string | null;
  totalQuestions: number;
  correctAnswers: number;
  totalTime: number | null;
}

interface ExamData {
  examName: string;
  examDate: string;
  status: string;
}

interface DashboardData {
  student: {
    name: string;
    grade: number;
  };
  overview: {
    totalQuestions: number;
    accuracy: number;
    streakDays: number;
    totalTimeSpent: number;
    lastActive: string;
  };
  topicPerformance: Array<{
    topic: string;
    accuracy: number;
    totalAttempts: number;
    strengthLevel: string;
    needsPractice: boolean;
  }>;
  recentSessions: Array<{
    id: string;
    date: string;
    questionsAttempted: number;
    correctAnswers: number;
    accuracy: number;
    duration: number;
  }>;
  weakAreas: Array<{
    topic: string;
    accuracy: number;
    attempts: number;
  }>;
  upcomingExams: Array<{
    examName: string;
    examDate: string;
    daysUntil: number;
  }>;
}

export default function TutorDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareLink, setShareLink] = useState('');

  useEffect(() => {
    fetchDashboardData();
    generateShareLink();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Use Promise.allSettled to handle partial failures gracefully
      const results = await Promise.allSettled([
        fetchJsonSafe<{ user?: { name?: string; grade?: number } }>('/api/user'),
        fetchJsonSafe<{
          stats?: {
            totalQuestions?: number;
            accuracy?: number;
            streakDays?: number;
            timeSpent?: number;
          };
        }>('/api/progress'),
        fetchJsonSafe<{ topicPerformance?: TopicData[] }>('/api/topic-performance'),
        fetchJsonSafe<{ sessions?: SessionData[] }>('/api/sessions'),
        fetchJsonSafe<{ exams?: ExamData[] }>('/api/exams'),
      ]);

      // Extract successful results or use defaults
      const userData =
        results[0].status === 'fulfilled' && results[0].value ? results[0].value : { user: {} };
      const progressData =
        results[1].status === 'fulfilled' && results[1].value ? results[1].value : { stats: {} };
      const topicData =
        results[2].status === 'fulfilled' && results[2].value
          ? results[2].value
          : { topicPerformance: [] };
      const sessionsData =
        results[3].status === 'fulfilled' && results[3].value ? results[3].value : { sessions: [] };
      const examsData =
        results[4].status === 'fulfilled' && results[4].value ? results[4].value : { exams: [] };

      // Log any failures for debugging
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const apiNames = ['user', 'progress', 'topic-performance', 'sessions', 'exams'];
          console.error(`Failed to fetch ${apiNames[index]}:`, result.reason);
        }
      });

      // Compile dashboard data
      const dashboardData: DashboardData = {
        student: {
          name: userData.user?.name || 'Student',
          grade: userData.user?.grade || 0,
        },
        overview: {
          totalQuestions: progressData.stats?.totalQuestions || 0,
          accuracy: Math.round(progressData.stats?.accuracy || 0),
          streakDays: progressData.stats?.streakDays || 0,
          totalTimeSpent: Math.round((progressData.stats?.timeSpent || 0) * 60), // Convert to minutes
          lastActive: new Date().toLocaleDateString(),
        },
        topicPerformance: (topicData.topicPerformance || [])
          .sort((a: TopicData, b: TopicData) => a.accuracy - b.accuracy)
          .slice(0, 10),
        recentSessions: (sessionsData.sessions || [])
          .filter((s: SessionData) => s.completedAt !== null && s.totalQuestions > 0)
          .slice(0, 10)
          .map((s: SessionData) => ({
            id: s.id,
            date: new Date(s.startedAt).toLocaleDateString(),
            questionsAttempted: s.totalQuestions,
            correctAnswers: s.correctAnswers,
            accuracy:
              s.totalQuestions > 0 ? Math.round((s.correctAnswers / s.totalQuestions) * 100) : 0,
            duration: s.totalTime || 0,
          })),
        weakAreas: (topicData.topicPerformance || [])
          .filter((t: TopicData) => t.needsPractice)
          .sort((a: TopicData, b: TopicData) => a.accuracy - b.accuracy)
          .slice(0, 5)
          .map((t: TopicData) => ({
            topic: t.topic,
            accuracy: t.accuracy,
            attempts: t.totalAttempts,
          })),
        upcomingExams: (examsData.exams || [])
          .filter((e: ExamData) => e.status === 'UPCOMING' || e.status === 'REGISTERED')
          .map((e: ExamData) => {
            const examDate = new Date(e.examDate);
            const today = new Date();
            const daysUntil = Math.ceil(
              (examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            return {
              examName: e.examName,
              examDate: examDate.toLocaleDateString(),
              daysUntil,
            };
          })
          .slice(0, 3),
      };

      setData(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateShareLink = () => {
    const url = window.location.origin + '/tutor-dashboard';
    setShareLink(url);
  };

  const copyShareLink = async () => {
    // Feature detection for clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareLink);
        alert('Dashboard link copied! Share this with your tutor.');
      } catch (err) {
        console.error('Failed to copy:', err);
        fallbackCopyText(shareLink);
      }
    } else {
      fallbackCopyText(shareLink);
    }
  };

  const fallbackCopyText = (text: string) => {
    // Fallback for browsers without clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      alert('Dashboard link copied! Share this with your tutor.');
    } catch (_err) {
      alert('Failed to copy link. Please copy manually: ' + text);
    }
    document.body.removeChild(textArea);
  };

  const exportToPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-xl text-gray-600">Loading tutor dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">No data available</p>
          <Link
            href="/"
            className="mt-4 inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm print:shadow-none">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">Tutor Dashboard 👨‍🏫</h1>
            <p className="text-sm text-gray-600">View-only access for tutors and parents</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button
              onClick={copyShareLink}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              📋 Copy Share Link
            </button>
            <button
              onClick={exportToPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              📥 Export PDF
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
            >
              ← Back to App
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Student Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {data.student.name}&apos;s Progress Report
              </h2>
              <p className="text-gray-600">
                Grade {data.student.grade} | Last updated: {data.overview.lastActive}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600">{data.overview.accuracy}%</div>
              <div className="text-sm text-gray-600">Overall Accuracy</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Questions Practiced</div>
            <div className="text-3xl font-bold text-indigo-600">{data.overview.totalQuestions}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Current Streak</div>
            <div className="text-3xl font-bold text-green-600">{data.overview.streakDays} days</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Time Spent</div>
            <div className="text-3xl font-bold text-purple-600">
              {data.overview.totalTimeSpent} min
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Sessions</div>
            <div className="text-3xl font-bold text-orange-600">{data.recentSessions.length}</div>
          </div>
        </div>

        {/* Weak Areas - Priority for Tutor */}
        {data.weakAreas.length > 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-red-900 mb-4">🎯 Areas Needing Attention</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {data.weakAreas.map((area) => (
                <div key={area.topic} className="bg-white rounded-lg p-4 shadow">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-900">{area.topic}</h4>
                    <span className="text-red-600 font-bold">{Math.round(area.accuracy)}%</span>
                  </div>
                  <div className="text-sm text-gray-600">{area.attempts} attempts</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${area.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
              <p className="text-sm text-yellow-900">
                <strong>Recommendation:</strong> Focus tutoring sessions on these topics. Student
                needs additional support in these areas.
              </p>
            </div>
          </div>
        )}

        {/* Upcoming Exams */}
        {data.upcomingExams.length > 0 && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-blue-900 mb-4">📅 Upcoming Exams</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {data.upcomingExams.map((exam, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 shadow">
                  <h4 className="font-semibold text-gray-900 mb-1">{exam.examName}</h4>
                  <p className="text-sm text-gray-600">{exam.examDate}</p>
                  <div className="mt-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        exam.daysUntil <= 7
                          ? 'bg-red-100 text-red-800'
                          : exam.daysUntil <= 30
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {exam.daysUntil} days away
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topic Performance */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Topic-by-Topic Performance</h3>
          <div className="space-y-4">
            {data.topicPerformance.map((topic) => (
              <div key={topic.topic} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{topic.topic}</h4>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        topic.strengthLevel === 'EXPERT'
                          ? 'bg-purple-100 text-purple-800'
                          : topic.strengthLevel === 'ADVANCED'
                            ? 'bg-green-100 text-green-800'
                            : topic.strengthLevel === 'INTERMEDIATE'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {topic.strengthLevel}
                    </span>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-lg font-bold ${
                        topic.accuracy >= 80
                          ? 'text-green-600'
                          : topic.accuracy >= 60
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {Math.round(topic.accuracy)}%
                    </div>
                    <div className="text-xs text-gray-600">{topic.totalAttempts} attempts</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
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
            ))}
          </div>
        </div>

        {/* Recent Practice Sessions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📝 Recent Practice Sessions</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                    Questions
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                    Correct
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                    Accuracy
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.recentSessions.map((session) => (
                  <tr key={session.id} className="border-b border-gray-200">
                    <td className="px-4 py-3 text-sm text-gray-900">{session.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {session.questionsAttempted}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{session.correctAnswers}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          session.accuracy >= 80
                            ? 'bg-green-100 text-green-800'
                            : session.accuracy >= 60
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {session.accuracy}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{session.duration}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tutor Notes Section */}
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mt-6 print:break-before-page">
          <h3 className="text-xl font-bold text-yellow-900 mb-4">📝 Notes for Tutor</h3>
          <div className="bg-white rounded-lg p-4 min-h-[200px] border-2 border-dashed border-yellow-300">
            <p className="text-sm text-gray-600 italic">
              This section can be used by the tutor to add observations and recommendations during
              review sessions.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white mt-12 py-6 print:hidden">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p>Generated from Ayansh Math Prep System</p>
          <p className="text-sm mt-1">
            This is a read-only dashboard. Login to app for full features.
          </p>
        </div>
      </footer>
    </div>
  );
}
