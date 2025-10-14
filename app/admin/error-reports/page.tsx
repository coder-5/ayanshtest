'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { fetchJsonSafe } from '@/lib/fetchJson';

interface ErrorReport {
  id: string;
  questionId: string;
  reportType: string;
  description: string;
  severity: string;
  status: string;
  createdAt: string;
  question: {
    id: string;
    questionText: string;
    correctAnswer: string | null;
    examName: string | null;
    topic: string;
    options: Array<{
      id: string;
      optionLetter: string;
      optionText: string;
      isCorrect: boolean;
    }>;
  };
}

export default function AdminErrorReportsPage() {
  const [reports, setReports] = useState<ErrorReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('PENDING');
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null);
  const [newAnswer, setNewAnswer] = useState('');
  const [addingNotes, setAddingNotes] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const url = filter === 'ALL' ? '/api/error-reports' : `/api/error-reports?status=${filter}`;

      const data = await fetchJsonSafe<{ reports: ErrorReport[] }>(url);
      setReports(data?.reports || []);
    } catch (_error) {
      toast.error('Failed to load error reports');
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (
    reportId: string,
    newStatus: 'RESOLVED' | 'INVALID',
    notes?: string
  ) => {
    try {
      const response = await fetch(`/api/error-reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          ...(notes && { reviewNotes: notes }),
        }),
      });

      if (response.ok) {
        toast.success(`Report marked as ${newStatus.toLowerCase()}`);
        setAddingNotes(null);
        setReviewNotes('');
        fetchReports();
      } else {
        toast.error('Failed to update report');
      }
    } catch (_error) {
      toast.error('Failed to update report');
    }
  };

  const updateQuestionAnswer = async (questionId: string, answer: string) => {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correctAnswer: answer }),
      });

      if (response.ok) {
        toast.success('Answer updated successfully!');
        setEditingAnswer(null);
        setNewAnswer('');
        fetchReports();
      } else {
        toast.error('Failed to update answer');
      }
    } catch (_error) {
      toast.error('Failed to update answer');
    }
  };

  const deleteQuestion = async (questionId: string, reportId: string) => {
    if (!confirm('Are you sure you want to delete this question? This will soft-delete it.')) {
      return;
    }

    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Question deleted');
        await updateReportStatus(reportId, 'RESOLVED');
      } else {
        toast.error('Failed to delete question');
      }
    } catch (_error) {
      toast.error('Failed to delete question');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-indigo-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              Ayansh Math Prep
            </Link>
            <p className="text-sm text-gray-600">Admin: Error Reports</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Error Reports Dashboard</h1>
            <button
              onClick={fetchReports}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {['ALL', 'PENDING', 'RESOLVED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as typeof filter)}
                className={`px-4 py-2 font-medium border-b-2 transition ${
                  filter === status
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {status}
                {status === 'PENDING' &&
                  reports.filter((r) => r.status === 'PENDING').length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                      {reports.filter((r) => r.status === 'PENDING').length}
                    </span>
                  )}
              </button>
            ))}
          </div>

          {/* Reports List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading error reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-lg">
                {filter === 'PENDING'
                  ? '🎉 No pending error reports! Great job!'
                  : `No ${filter.toLowerCase()} reports found.`}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className={`border-2 rounded-lg p-6 ${
                    report.status === 'PENDING'
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  {/* Report Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-3">
                      <span
                        className={`px-3 py-1 rounded-lg font-semibold text-sm border-2 ${getSeverityColor(report.severity)}`}
                      >
                        {report.severity}
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg font-semibold text-sm">
                        {report.reportType.replace('_', ' ')}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-lg font-semibold text-sm ${
                          report.status === 'PENDING'
                            ? 'bg-yellow-200 text-yellow-900'
                            : report.status === 'RESOLVED'
                              ? 'bg-green-200 text-green-900'
                              : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(report.createdAt).toLocaleDateString()}{' '}
                      {new Date(report.createdAt).toLocaleTimeString()}
                    </p>
                  </div>

                  {/* User Description */}
                  <div className="mb-4 p-4 bg-white rounded-lg border-2 border-gray-200">
                    <p className="font-semibold text-gray-900 mb-2">User Report:</p>
                    <p className="text-gray-700">{report.description}</p>
                  </div>

                  {/* Question Details */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold text-gray-900">Question:</p>
                      {report.question.examName && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {report.question.examName}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        {report.question.topic}
                      </span>
                    </div>
                    <p className="text-gray-800 bg-white p-4 rounded-lg border border-gray-200 whitespace-pre-wrap">
                      {report.question.questionText}
                    </p>
                  </div>

                  {/* Current Answer */}
                  <div className="mb-4">
                    <p className="font-semibold text-gray-900 mb-2">Current Answer:</p>
                    {editingAnswer === report.questionId ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newAnswer}
                          onChange={(e) => setNewAnswer(e.target.value)}
                          className="flex-1 px-4 py-2 border-2 border-indigo-300 rounded-lg focus:outline-none focus:border-indigo-500"
                          placeholder="Enter correct answer"
                        />
                        <button
                          onClick={() => updateQuestionAnswer(report.questionId, newAnswer)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          ✓ Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingAnswer(null);
                            setNewAnswer('');
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="px-4 py-2 bg-indigo-100 text-indigo-900 rounded-lg font-bold text-lg">
                          {report.question.correctAnswer || '(No answer set)'}
                        </span>
                        <button
                          onClick={() => {
                            setEditingAnswer(report.questionId);
                            setNewAnswer(report.question.correctAnswer || '');
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          ✏️ Edit Answer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Options (if multiple choice) */}
                  {report.question.options.length > 0 && (
                    <div className="mb-4">
                      <p className="font-semibold text-gray-900 mb-2">Options:</p>
                      <div className="space-y-2">
                        {report.question.options.map((option) => (
                          <div
                            key={option.id}
                            className={`p-3 rounded-lg border-2 ${
                              option.isCorrect
                                ? 'bg-green-100 border-green-500'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <span className="font-bold">{option.optionLetter}.</span>{' '}
                            {option.optionText}
                            {option.isCorrect && (
                              <span className="ml-2 text-green-700 font-bold">✓ Correct</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Review Notes Input (if adding notes) */}
                  {addingNotes === report.id && (
                    <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                      <label className="block font-semibold text-gray-900 mb-2">
                        Add Review Notes (optional):
                      </label>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 min-h-[80px]"
                        placeholder="E.g., Fixed answer, updated options, removed duplicate..."
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => updateReportStatus(report.id, 'RESOLVED', reviewNotes)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          ✓ Confirm Resolution
                        </button>
                        <button
                          onClick={() => {
                            setAddingNotes(null);
                            setReviewNotes('');
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t-2 border-gray-200">
                    {report.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => setAddingNotes(report.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                        >
                          ✓ Mark as Resolved
                        </button>
                        <button
                          onClick={() => updateReportStatus(report.id, 'INVALID')}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                          Mark as Invalid
                        </button>
                        <button
                          onClick={() => deleteQuestion(report.questionId, report.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          🗑️ Delete Question
                        </button>
                      </>
                    )}
                    <Link
                      href={`/library/edit/${report.questionId}`}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      📝 Edit Question
                    </Link>
                  </div>

                  {/* Report ID (for reference) */}
                  <p className="text-xs text-gray-500 mt-4">
                    Report ID: {report.id} | Question ID: {report.questionId}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
