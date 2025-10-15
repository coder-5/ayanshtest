'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MathContent } from '@/components/MathContent';
import { fetchJsonSafe } from '@/lib/fetchJson';

interface Bookmark {
  id: string;
  questionId: string;
  note: string | null;
  createdAt: string;
  question: {
    id: string;
    questionText: string;
    topic: string | null;
    difficulty: string;
    examName: string | null;
    questionNumber: string | null;
    hasImage: boolean;
    imageUrl: string | null;
    options: Array<{
      id: string;
      optionLetter: string;
      optionText: string;
      isCorrect: boolean;
    }>;
  };
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const data = await fetchJsonSafe<{ bookmarks: Bookmark[] }>('/api/bookmarks');
      setBookmarks(data?.bookmarks || []);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBookmark = async (questionId: string) => {
    if (!confirm('Remove this bookmark?')) return;

    try {
      await fetch(`/api/bookmarks?questionId=${questionId}`, {
        method: 'DELETE',
      });
      setBookmarks(bookmarks.filter((b) => b.questionId !== questionId));
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      alert('Failed to delete bookmark');
    }
  };

  const handleSaveNote = async (questionId: string) => {
    try {
      await fetch('/api/bookmarks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          note: noteText,
        }),
      });

      setBookmarks(
        bookmarks.map((b) => (b.questionId === questionId ? { ...b, note: noteText } : b))
      );
      setEditingNote(null);
      setNoteText('');
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Failed to update note');
    }
  };

  const toggleExpand = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toUpperCase()) {
      case 'EASY':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HARD':
        return 'bg-orange-100 text-orange-800';
      case 'EXPERT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              Ayansh Math Prep
            </Link>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-gray-600">Loading bookmarks...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
            <Link href="/formulas" className="text-gray-600 hover:text-indigo-600">
              Formulas
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookmarks</h1>
          <p className="text-gray-600">
            {bookmarks.length} {bookmarks.length === 1 ? 'question' : 'questions'} saved
          </p>
        </div>

        {bookmarks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No bookmarks yet</h2>
            <p className="text-gray-600 mb-6">
              Start bookmarking questions while practicing to save them for later review
            </p>
            <Link
              href="/practice"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Start Practicing
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((bookmark) => {
              const isExpanded = expandedQuestions.has(bookmark.questionId);
              return (
                <div key={bookmark.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {bookmark.question.examName && (
                          <span className="text-sm font-semibold text-indigo-600">
                            {bookmark.question.examName}
                            {bookmark.question.questionNumber &&
                              ` #${bookmark.question.questionNumber}`}
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-1 rounded ${getDifficultyColor(
                            bookmark.question.difficulty
                          )}`}
                        >
                          {bookmark.question.difficulty}
                        </span>
                        {bookmark.question.topic && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {bookmark.question.topic}
                          </span>
                        )}
                      </div>

                      <MathContent
                        content={bookmark.question.questionText}
                        className="text-gray-900 mb-3"
                      />

                      {isExpanded && (
                        <>
                          {bookmark.question.hasImage && bookmark.question.imageUrl && (
                            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-4">
                              <Image
                                src={bookmark.question.imageUrl}
                                alt="Question diagram"
                                width={600}
                                height={400}
                                className="w-full h-auto object-contain rounded"
                                unoptimized
                              />
                            </div>
                          )}

                          <div className="space-y-2 mb-4">
                            {bookmark.question.options.map((option) => (
                              <div
                                key={option.id}
                                className={`p-3 rounded-lg border ${
                                  option.isCorrect
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200'
                                }`}
                              >
                                <span className="font-semibold text-indigo-600 mr-2">
                                  {option.optionLetter}.
                                </span>
                                <MathContent
                                  content={option.optionText}
                                  className="inline text-gray-900"
                                />
                                {option.isCorrect && (
                                  <span className="ml-2 text-green-600 font-semibold">
                                    ✓ Correct
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      <button
                        onClick={() => toggleExpand(bookmark.questionId)}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      >
                        {isExpanded ? '▲ Show less' : '▼ Show solution'}
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteBookmark(bookmark.questionId)}
                      className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Note Section */}
                  <div className="border-t pt-4 mt-4">
                    {editingNote === bookmark.questionId ? (
                      <div>
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Add a note about this question..."
                          className="w-full border border-gray-300 rounded-lg p-3 mb-2 min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveNote(bookmark.questionId)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                          >
                            Save Note
                          </button>
                          <button
                            onClick={() => {
                              setEditingNote(null);
                              setNoteText('');
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {bookmark.note ? (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
                            <p className="text-sm text-gray-800">{bookmark.note}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic mb-2">No note added</p>
                        )}
                        <button
                          onClick={() => {
                            setEditingNote(bookmark.questionId);
                            setNoteText(bookmark.note || '');
                          }}
                          className="text-sm text-indigo-600 hover:text-indigo-700"
                        >
                          {bookmark.note ? 'Edit note' : 'Add note'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 mt-4">
                    Bookmarked on {new Date(bookmark.createdAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/practice"
            className="inline-block px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Back to Practice
          </Link>
        </div>
      </main>
    </div>
  );
}
