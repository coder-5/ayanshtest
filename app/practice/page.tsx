'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { fetchJsonSafe } from '@/lib/fetchJson';

interface ExamYearOption {
  examName: string;
  examYear: number;
  count: number;
}

interface QuestionCounts {
  total: number;
  amc8: number;
  moems: number;
  kangaroo: number;
}

export default function PracticePage() {
  const [examName, setExamName] = useState<string>('');
  const [examYear, setExamYear] = useState<string>('');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [examOptions, setExamOptions] = useState<ExamYearOption[]>([]);
  const [counts, setCounts] = useState<QuestionCounts>({
    total: 0,
    amc8: 0,
    moems: 0,
    kangaroo: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExamOptions();
    fetchQuestionCounts();
  }, []);

  useEffect(() => {
    if (examName) {
      fetchAvailableYears();
    } else {
      setAvailableYears([]);
      setExamYear('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examName]);

  const fetchExamOptions = async () => {
    try {
      const data = await fetchJsonSafe<{
        questions: Array<{ examName: string | null; examYear: number | null }>;
      }>('/api/questions?limit=1000');

      if (data?.questions) {
        const examMap = new Map<string, ExamYearOption>();

        data.questions.forEach((q: { examName: string | null; examYear: number | null }) => {
          if (q.examName && q.examYear) {
            const key = `${q.examName}-${q.examYear}`;
            if (examMap.has(key)) {
              examMap.get(key)!.count++;
            } else {
              examMap.set(key, {
                examName: q.examName,
                examYear: q.examYear,
                count: 1,
              });
            }
          }
        });

        const options = Array.from(examMap.values()).sort((a, b) => {
          if (a.examName !== b.examName) {
            return a.examName.localeCompare(b.examName);
          }
          return b.examYear - a.examYear;
        });

        setExamOptions(options);
      }
    } catch (error) {
      console.error('Error fetching exam options:', error);
    }
  };

  const fetchAvailableYears = async () => {
    try {
      const data = await fetchJsonSafe<{ years: number[] }>(
        `/api/questions/exam/${encodeURIComponent(examName)}/years`
      );

      if (data?.years) {
        setAvailableYears(data.years);
      }
    } catch (error) {
      console.error('Error fetching years:', error);
    }
  };

  const fetchQuestionCounts = async () => {
    try {
      setLoading(true);
      const data = await fetchJsonSafe<QuestionCounts>('/api/question-counts');

      if (data) {
        setCounts(data);
      }
    } catch (error) {
      console.error('Error fetching question counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildPracticeUrl = (mode: string) => {
    const params = new URLSearchParams();
    if (examName) params.append('examName', examName);
    if (examYear) params.append('examYear', examYear);
    return `/practice/${mode}${params.toString() ? `?${params.toString()}` : ''}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-indigo-600">🎓 Ayansh Math Prep</h1>
            <nav className="flex gap-6">
              <Link href="/practice" className="text-indigo-600 font-semibold">
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
        {/* Page Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Practice Mode 🎯</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your practice style and start solving math competition problems!
          </p>
        </motion.div>

        {/* Exam Filters */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Filter by Exam</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Exam Type</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  value={examName}
                  onChange={(e) => {
                    setExamName(e.target.value);
                    setExamYear('');
                  }}
                >
                  <option value="">All Exams</option>
                  <option value="AMC8">AMC 8</option>
                  <option value="MOEMS Division E">MOEMS Division E</option>
                  <option value="MATHKANGAROO">Math Kangaroo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 disabled:bg-gray-100"
                  value={examYear}
                  onChange={(e) => setExamYear(e.target.value)}
                  disabled={!examName}
                >
                  <option value="">All Years</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {examName && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-indigo-600">
                  ✓ Practicing: {examName} {examYear || '(All Years)'}
                </p>
                <Link
                  href={buildPracticeUrl('quick')}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
                >
                  Start Practice →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Available Exams Section */}
        {!examName && examOptions.length > 0 && (
          <div className="max-w-6xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              📝 Practice by Exam
            </h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              {examOptions.map((option) => (
                <Link
                  key={`${option.examName}-${option.examYear}`}
                  href={`/practice/quick?examName=${encodeURIComponent(option.examName)}&examYear=${option.examYear}`}
                  className="bg-white rounded-lg p-4 border shadow-sm hover:shadow-md transition-all hover:scale-105 border-transparent hover:border-indigo-400"
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">📚</div>
                    <h3 className="font-semibold text-gray-900">{option.examName}</h3>
                    <p className="text-indigo-600 font-bold text-lg">{option.examYear}</p>
                    <p className="text-sm text-gray-500 mt-1">{option.count} questions</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Practice Modes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href={buildPracticeUrl('quick')}
            className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow border-blue-200"
          >
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-600 text-2xl">⚡</span>
                <h3 className="text-lg font-semibold text-gray-900">Quick Practice</h3>
              </div>
              <p className="text-sm text-gray-600">Jump into random problems from your level</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Questions:</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Random selection</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Difficulty:</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Mixed levels</span>
              </div>
            </div>
          </Link>

          <Link
            href={buildPracticeUrl('timed')}
            className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow border-red-200"
          >
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-600 text-2xl">⏱️</span>
                <h3 className="text-lg font-semibold text-gray-900">Timed Challenge</h3>
              </div>
              <p className="text-sm text-gray-600">Real competition timing with full simulations</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">AMC 8:</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">40 minutes</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">MOEMS:</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">30 minutes</span>
              </div>
            </div>
          </Link>

          <Link
            href={buildPracticeUrl('topics')}
            className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow border-indigo-200"
          >
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-indigo-600 text-2xl">📚</span>
                <h3 className="text-lg font-semibold text-gray-900">Practice by Topic</h3>
              </div>
              <p className="text-sm text-gray-600">Choose specific math topics to practice</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Topics:</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">All subjects</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Source:</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">All competitions</span>
              </div>
            </div>
          </Link>

          <Link
            href="/practice/amc8"
            className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow border-green-200"
          >
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-600 text-2xl">🎯</span>
                <h3 className="text-lg font-semibold text-gray-900">AMC 8 Practice</h3>
              </div>
              <p className="text-sm text-gray-600">Focus on AMC 8 competition problems</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Available:</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                  {loading ? '...' : `${counts.amc8} problems`}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Format:</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Multiple Choice</span>
              </div>
            </div>
          </Link>

          <Link
            href="/practice/moems"
            className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow border-purple-200"
          >
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-purple-600 text-2xl">🧠</span>
                <h3 className="text-lg font-semibold text-gray-900">MOEMS Practice</h3>
              </div>
              <p className="text-sm text-gray-600">Mathematical Olympiad problems with solutions</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Available:</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                  {loading ? '...' : `${counts.moems} problems`}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Format:</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Open-ended</span>
              </div>
            </div>
          </Link>

          <Link
            href="/practice/kangaroo"
            className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow border-orange-200"
          >
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-orange-600 text-2xl">🦘</span>
                <h3 className="text-lg font-semibold text-gray-900">Math Kangaroo</h3>
              </div>
              <p className="text-sm text-gray-600">Grade-appropriate Math Kangaroo problems</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Available:</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                  {loading ? '...' : `${counts.kangaroo} problems`}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Level:</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Grade 5-6</span>
              </div>
            </div>
          </Link>

          <Link
            href="/practice/retry"
            className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow border-red-200"
          >
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-600 text-2xl">🔄</span>
                <h3 className="text-lg font-semibold text-gray-900">Retry Failed Questions</h3>
              </div>
              <p className="text-sm text-gray-600">
                Master the questions you struggled with before
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Purpose:</span>
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                  Fix mistakes
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Focus:</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Failed attempts</span>
              </div>
            </div>
          </Link>

          <Link
            href="/practice/weak-areas"
            className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow border-yellow-200"
          >
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-600 text-2xl">🏆</span>
                <h3 className="text-lg font-semibold text-gray-900">Improve Weak Areas</h3>
              </div>
              <p className="text-sm text-gray-600">Focus on topics where you need more practice</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Topics:</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Based on performance</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Focus:</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Improvement areas</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-block px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back to Dashboard
          </Link>
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
