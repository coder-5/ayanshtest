'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface Topic {
  name: string;
  icon: string;
  count: number;
}

export default function TopicPracticePage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await fetch('/api/topics');
      const data = await response.json();
      setTopics(data.topics || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePracticeTopic = (topicName: string) => {
    // Navigate to quick practice with topic filter
    router.push(`/practice/quick?topic=${encodeURIComponent(topicName)}`);
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
            <Link href="/library" className="text-gray-600 hover:text-indigo-600">
              Library
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Practice by Topic 📚</h1>
          <p className="text-gray-600">Choose a topic to focus your practice</p>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading topics...</div>
        ) : topics.length === 0 ? (
          <div className="bg-white rounded-lg p-12 shadow-md text-center">
            <p className="text-gray-500 mb-2">No topics available yet</p>
            <p className="text-sm text-gray-400">
              Topics will appear here once questions are added to the library
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {topics.map((topic) => (
              <div
                key={topic.name}
                className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="text-4xl mb-3">{topic.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{topic.name}</h3>
                <p className="text-gray-600 mb-4">{topic.count} questions</p>
                <button
                  onClick={() => handlePracticeTopic(topic.name)}
                  disabled={topic.count === 0}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  Practice
                </button>
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
