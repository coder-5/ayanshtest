'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { SafeHtml } from '@/lib/sanitize';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { fetchJsonSafe } from '@/lib/fetchJson';

interface Question {
  id: string;
  questionText: string;
  examName: string | null;
  examYear: number | null;
  questionNumber: string | null;
  topic: string;
  difficulty: string;
  hasImage: boolean;
  imageUrl: string | null;
  options: Array<{
    id: string;
    optionLetter: string;
    optionText: string;
    isCorrect: boolean;
  }>;
}

function LibraryPageContent() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [examFilter, setExamFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const fetchQuestions = async (exam = '', topic = '', difficulty = '', page = currentPage) => {
    try {
      const params = new URLSearchParams();
      if (exam) params.append('examName', exam);
      if (topic) params.append('topic', topic);
      if (difficulty) params.append('difficulty', difficulty);
      params.append('limit', ITEMS_PER_PAGE.toString());
      params.append('offset', ((page - 1) * ITEMS_PER_PAGE).toString());

      const url = `/api/questions?${params.toString()}`;
      const data = await fetchJsonSafe<{ questions: Question[]; total: number }>(url);
      setQuestions(data?.questions || []);
      setTotalQuestions(data?.total || 0);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    setLoading(true);
    fetchQuestions(examFilter, topicFilter, difficultyFilter, 1);
  };

  const handleReset = () => {
    setExamFilter('');
    setTopicFilter('');
    setDifficultyFilter('');
    setCurrentPage(1);
    setLoading(true);
    fetchQuestions('', '', '', 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(totalQuestions / ITEMS_PER_PAGE);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedQuestions = questions.filter((q) => q.id !== id);
        const newTotal = totalQuestions - 1;

        setQuestions(updatedQuestions);
        setTotalQuestions(newTotal);

        // If current page is now empty and not the first page, go to previous page
        if (updatedQuestions.length === 0 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
          setLoading(true);
          fetchQuestions(examFilter, topicFilter, difficultyFilter, currentPage - 1);
        }
      } else {
        const error = await fetchJsonSafe<{ error: string }>(`/api/questions/${id}`);
        alert(`Failed to delete question: ${error?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Error deleting question');
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
            <Link href="/achievements" className="text-gray-600 hover:text-indigo-600">
              Achievements
            </Link>
            <Link href="/library" className="text-indigo-600 font-semibold">
              Library
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Question Library 📚</h1>
          <p className="text-gray-600">Browse and manage all questions</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 shadow-md mb-6">
          <div className="grid md:grid-cols-5 gap-4">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
            >
              <option value="">All Exams</option>
              <option value="AMC8">AMC 8</option>
              <option value="MOEMS">MOEMS</option>
              <option value="MATHKANGAROO">Math Kangaroo</option>
            </select>
            <input
              type="text"
              placeholder="Filter by topic..."
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
            />
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
            >
              <option value="">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Search
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Questions ({totalQuestions} total, showing {questions.length})
            </h2>
            <div className="flex gap-2">
              <Link
                href="/library/upload-bulk"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                📄 Bulk Upload
              </Link>
              <Link
                href="/library/add"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + Add Question
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-12">Loading questions...</div>
          ) : questions.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              No questions yet. Add your first question to get started!
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Diagram Preview */}
                    {question.hasImage && question.imageUrl && (
                      <div className="flex-shrink-0">
                        <Image
                          src={question.imageUrl}
                          alt="Diagram"
                          width={100}
                          height={75}
                          className="rounded border border-gray-300 object-contain"
                          unoptimized
                        />
                      </div>
                    )}

                    <div className="flex-1">
                      <SafeHtml
                        html={question.questionText}
                        className="text-gray-900 font-medium mb-2"
                      />
                      <div className="flex gap-3 text-sm text-gray-600 mb-2 flex-wrap">
                        {question.examName && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {question.examName} {question.examYear && `(${question.examYear})`}
                            {question.questionNumber && ` #${question.questionNumber}`}
                          </span>
                        )}
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                          {question.topic}
                        </span>
                        <span
                          className={`px-2 py-1 rounded ${
                            question.difficulty === 'EASY'
                              ? 'bg-green-100 text-green-800'
                              : question.difficulty === 'MEDIUM'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {question.difficulty}
                        </span>
                        {question.hasImage && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                            📊 Has Diagram
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{question.options.length} options</div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Link
                        href={`/library/edit/${question.id}`}
                        className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(question.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
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

export default function LibraryPage() {
  return (
    <ErrorBoundary>
      <LibraryPageContent />
    </ErrorBoundary>
  );
}
