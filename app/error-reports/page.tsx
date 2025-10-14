'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchJsonSafe } from '@/lib/fetchJson';

interface ErrorReport {
  id: string;
  questionId: string;
  reportType: string;
  description: string;
  severity: string;
  status: string;
  createdAt: string;
  question?: {
    questionText: string;
    examName: string | null;
    topic: string | null;
  };
}

export default function ErrorReportsPage() {
  const [reports, setReports] = useState<ErrorReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'CONFIRMED' | 'FIXED'>('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const data = await fetchJsonSafe<{ reports: ErrorReport[] }>('/api/error-reports');
      setReports(data?.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      await fetch(`/api/error-reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchReports(); // Refresh the list
    } catch (error) {
      console.error('Error updating report:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'INVESTIGATING':
        return 'bg-blue-100 text-blue-800';
      case 'CONFIRMED':
        return 'bg-orange-100 text-orange-800';
      case 'FIXED':
        return 'bg-green-100 text-green-800';
      case 'DISMISSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredReports = reports.filter((report) => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

  const pendingCount = reports.filter((r) => r.status === 'PENDING').length;
  const confirmedCount = reports.filter((r) => r.status === 'CONFIRMED').length;
  const fixedCount = reports.filter((r) => r.status === 'FIXED').length;

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🐛 Error Reports</h1>
          <p className="text-gray-600">Review and manage reported question issues</p>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading error reports...</div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Total Reports</div>
                <div className="text-3xl font-bold text-indigo-600">{reports.length}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Pending</div>
                <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Confirmed</div>
                <div className="text-3xl font-bold text-orange-600">{confirmedCount}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Fixed</div>
                <div className="text-3xl font-bold text-green-600">{fixedCount}</div>
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
                All ({reports.length})
              </button>
              <button
                onClick={() => setFilter('PENDING')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'PENDING'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setFilter('CONFIRMED')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'CONFIRMED'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Confirmed ({confirmedCount})
              </button>
              <button
                onClick={() => setFilter('FIXED')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'FIXED'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Fixed ({fixedCount})
              </button>
            </div>

            {/* Reports List */}
            {filteredReports.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500">No error reports match this filter</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(report.severity)}`}
                            >
                              {report.severity}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}
                            >
                              {report.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(report.createdAt)}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {report.reportType.replace('_', ' ')}
                          </h3>
                          <p className="text-sm text-gray-700 mb-3">{report.description}</p>
                          {report.question && (
                            <div className="bg-gray-50 border border-gray-200 rounded p-3">
                              <p className="text-sm font-medium text-gray-900 mb-1">Question:</p>
                              <p className="text-sm text-gray-700 line-clamp-2">
                                {report.question.questionText}
                              </p>
                              {(report.question.examName || report.question.topic) && (
                                <div className="flex gap-2 mt-2">
                                  {report.question.examName && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                      {report.question.examName}
                                    </span>
                                  )}
                                  {report.question.topic && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                      {report.question.topic}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t border-gray-200">
                        <Link
                          href={`/library/edit/${report.questionId}`}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                        >
                          Edit Question
                        </Link>
                        {report.status !== 'CONFIRMED' && (
                          <button
                            onClick={() => updateReportStatus(report.id, 'CONFIRMED')}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                          >
                            Confirm Issue
                          </button>
                        )}
                        {report.status !== 'FIXED' && (
                          <button
                            onClick={() => updateReportStatus(report.id, 'FIXED')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            Mark as Fixed
                          </button>
                        )}
                        {report.status !== 'DISMISSED' && (
                          <button
                            onClick={() => updateReportStatus(report.id, 'DISMISSED')}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Back Button */}
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
