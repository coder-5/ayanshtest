'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Exam {
  id: string;
  examName: string;
  examDate: string;
  location: string | null;
  status: string;
  score: number | null;
  percentile: number | null;
  notes: string;
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    examName: '',
    examDate: '',
    location: '',
    notes: '',
  });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await fetch('/api/exams');
      const data = await response.json();
      setExams(data.exams || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Exam added successfully!');
        setFormData({ examName: '', examDate: '', location: '', notes: '' });
        setShowAddForm(false);
        fetchExams();
      } else {
        const error = await response.json();
        alert(`Failed to add exam: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding exam:', error);
      alert('Error adding exam');
    }
  };

  const handleUpdateStatus = async (examId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchExams();
      }
    } catch (error) {
      console.error('Error updating exam status:', error);
    }
  };

  const handleDelete = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;

    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchExams();
      }
    } catch (error) {
      console.error('Error deleting exam:', error);
    }
  };

  const getDaysUntil = (dateString: string) => {
    const examDate = new Date(dateString);
    const today = new Date();
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const upcomingExams = exams.filter((e) => e.status === 'UPCOMING' || e.status === 'REGISTERED');
  const pastExams = exams.filter((e) => e.status === 'COMPLETED' || e.status === 'SCORED');

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
            <Link href="/exams" className="text-indigo-600 font-semibold">
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Upcoming Exams 📅</h1>
            <p className="text-gray-600">Track and manage your competition schedule</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            {showAddForm ? 'Cancel' : '+ Add Exam'}
          </button>
        </div>

        {/* Add Exam Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New Exam</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Exam Name *
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    value={formData.examName}
                    onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                    required
                  >
                    <option value="">Select exam</option>
                    <option value="AMC 8">AMC 8</option>
                    <option value="MOEMS">MOEMS</option>
                    <option value="Math Kangaroo">Math Kangaroo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Exam Date *
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    value={formData.examDate}
                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location (optional)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  placeholder="e.g., Local High School"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  rows={3}
                  placeholder="Add any notes or reminders..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Add Exam
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading exams...</div>
        ) : (
          <>
            {/* Upcoming Exams */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Upcoming ({upcomingExams.length})</h2>
              {upcomingExams.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center text-gray-500">
                  No upcoming exams scheduled. Click &quot;+ Add Exam&quot; to add one!
                </div>
              ) : (
                <div className="grid gap-4">
                  {upcomingExams.map((exam) => (
                    <div key={exam.id} className="bg-white rounded-lg p-6 shadow-md">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900">{exam.examName}</h3>
                          <p className="text-gray-600 mt-1">
                            📅{' '}
                            {new Date(exam.examDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          {exam.location && (
                            <p className="text-gray-600 mt-1">📍 {exam.location}</p>
                          )}
                          {exam.notes && <p className="text-gray-500 text-sm mt-2">{exam.notes}</p>}
                          <div className="mt-3">
                            {getDaysUntil(exam.examDate) > 0 ? (
                              <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                                ⏰ {getDaysUntil(exam.examDate)} days left
                              </span>
                            ) : getDaysUntil(exam.examDate) === 0 ? (
                              <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                                🔥 Today!
                              </span>
                            ) : (
                              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
                                Past due
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/practice/quick?examName=${encodeURIComponent(exam.examName)}`}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            📚 Study
                          </Link>
                          <button
                            onClick={() => handleUpdateStatus(exam.id, 'COMPLETED')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            Mark Complete
                          </button>
                          <button
                            onClick={() => handleDelete(exam.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Exams */}
            {pastExams.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Past Exams ({pastExams.length})</h2>
                <div className="grid gap-4">
                  {pastExams.map((exam) => (
                    <div key={exam.id} className="bg-gray-50 rounded-lg p-6 shadow-md opacity-75">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{exam.examName}</h3>
                          <p className="text-gray-600 mt-1">
                            📅 {new Date(exam.examDate).toLocaleDateString()}
                          </p>
                          {exam.score !== null && (
                            <p className="text-green-600 font-semibold mt-2">
                              Score: {exam.score}{' '}
                              {exam.percentile && `(${exam.percentile}th percentile)`}
                            </p>
                          )}
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          ✅ Completed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
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
