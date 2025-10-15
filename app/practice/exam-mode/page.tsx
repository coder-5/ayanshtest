'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import toast from 'react-hot-toast';
import { USER_ID } from '@/lib/constants';
import { fetchJsonSafe } from '@/lib/fetchJson';

export const dynamic = 'force-dynamic';

// Exam configurations
const EXAM_CONFIGS = {
  AMC8: {
    name: 'AMC8',
    questionsCount: 25,
    timeMinutes: 40,
    description: 'Full AMC 8 Competition Format',
  },
  MOEMS: {
    name: 'MOEMS Division E',
    questionsCount: 5,
    timeMinutes: 30,
    description: 'Full MOEMS Competition Format',
  },
};

interface ExamYear {
  year: number;
  available: boolean;
}

function ExamModeContent() {
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [availableYears, setAvailableYears] = useState<ExamYear[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch available years when exam is selected
  useEffect(() => {
    if (selectedExam) {
      fetchAvailableYears(selectedExam);
    }
  }, [selectedExam]);

  const fetchAvailableYears = async (examType: string) => {
    try {
      const data = await fetchJsonSafe<{ years: number[] }>(
        `/api/questions/exam/${encodeURIComponent(examType)}/years`
      );
      if (data) {
        const years = data.years.map((year: number) => ({
          year,
          available: true,
        }));
        setAvailableYears(years);
      }
    } catch (error) {
      console.error('Failed to fetch years:', error);
      toast.error('Failed to load available years');
    }
  };

  const startExam = async () => {
    if (!selectedExam || !selectedYear) {
      toast.error('Please select an exam and year');
      return;
    }

    setLoading(true);

    try {
      // Validate that we have enough questions
      const config = EXAM_CONFIGS[selectedExam as keyof typeof EXAM_CONFIGS];
      const data = await fetchJsonSafe<{ questions: unknown[] }>(
        `/api/questions?examName=${encodeURIComponent(selectedExam)}&examYear=${selectedYear}&limit=100`
      );

      if (!data) {
        throw new Error('Failed to fetch questions');
      }

      if (data.questions.length < config.questionsCount) {
        toast.error(
          `Not enough questions available. Found ${data.questions.length}, need ${config.questionsCount}`
        );
        setLoading(false);
        return;
      }

      // Navigate to timed practice with exam mode
      const params = new URLSearchParams({
        examName: selectedExam,
        examYear: selectedYear,
        examMode: 'true',
        timeLimit: config.timeMinutes.toString(),
        questionCount: config.questionsCount.toString(),
      });

      window.location.href = `/practice/timed?${params.toString()}`;
    } catch (error) {
      console.error('Failed to start exam:', error);
      toast.error('Failed to start exam simulation');
      setLoading(false);
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
              Back to Practice
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Full Exam Simulation 📝</h1>
            <p className="text-gray-600">Practice complete exams under timed conditions</p>
          </div>

          {/* Exam Selection */}
          <div className="space-y-6">
            {/* Select Exam Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Competition
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(EXAM_CONFIGS).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedExam(key);
                      setSelectedYear('');
                    }}
                    className={`p-6 rounded-lg border-2 transition text-left ${
                      selectedExam === key
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-300 hover:border-indigo-300'
                    }`}
                  >
                    <div className="font-bold text-lg text-gray-900 mb-2">{config.name}</div>
                    <div className="text-sm text-gray-600 mb-3">{config.description}</div>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>📝 {config.questionsCount} questions</span>
                      <span>⏱️ {config.timeMinutes} minutes</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Select Year */}
            {selectedExam && availableYears.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Year</label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {availableYears.map(({ year, available }) => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year.toString())}
                      disabled={!available}
                      className={`p-3 rounded-lg border-2 transition ${
                        selectedYear === year.toString()
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                          : available
                            ? 'border-gray-300 hover:border-indigo-300 text-gray-700'
                            : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Exam Details */}
            {selectedExam && selectedYear && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4">Exam Details</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span className="font-medium">Competition:</span>
                    <span>{EXAM_CONFIGS[selectedExam as keyof typeof EXAM_CONFIGS].name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Year:</span>
                    <span>{selectedYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Questions:</span>
                    <span>
                      {EXAM_CONFIGS[selectedExam as keyof typeof EXAM_CONFIGS].questionsCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Time Limit:</span>
                    <span>
                      {EXAM_CONFIGS[selectedExam as keyof typeof EXAM_CONFIGS].timeMinutes} minutes
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-300">
                  <h4 className="font-semibold text-gray-900 mb-2">Instructions:</h4>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                    <li>Timer starts immediately when you begin</li>
                    <li>Cannot pause once started</li>
                    <li>Submit early to see results</li>
                    <li>Questions presented in original exam order</li>
                    <li>Scoring matches official competition format</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Start Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={startExam}
                disabled={!selectedExam || !selectedYear || loading}
                className="px-8 py-4 text-lg font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
              >
                {loading ? 'Loading...' : 'Start Exam Simulation →'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ExamModePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-xl text-gray-600">Loading exam mode...</p>
          </div>
        </div>
      }
    >
      <ExamModeContent />
    </Suspense>
  );
}
