'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchJsonSafe } from '@/lib/fetchJson';
// import DiagramManager from "@/components/DiagramManager"; // TODO: Create DiagramManager component

interface Option {
  id: string;
  optionLetter: string;
  optionText: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  questionText: string;
  examName: string | null;
  examYear: number | null;
  topic: string | null;
  difficulty: string;
  hasImage: boolean;
  imageUrl: string | null;
  options: Option[];
}

export default function EditQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const questionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    questionText: '',
    examName: '',
    examYear: '',
    topic: '',
    difficulty: 'MEDIUM',
  });
  const [options, setOptions] = useState<
    Array<{
      optionLetter: string;
      optionText: string;
      isCorrect: boolean;
    }>
  >([
    { optionLetter: 'A', optionText: '', isCorrect: false },
    { optionLetter: 'B', optionText: '', isCorrect: false },
    { optionLetter: 'C', optionText: '', isCorrect: false },
    { optionLetter: 'D', optionText: '', isCorrect: false },
    { optionLetter: 'E', optionText: '', isCorrect: false },
  ]);

  useEffect(() => {
    fetchQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  const fetchQuestion = async () => {
    try {
      const data = await fetchJsonSafe<{ question: Question }>(`/api/questions/${questionId}`);
      if (!data) {
        throw new Error('Question not found');
      }
      const question: Question = data.question;

      setFormData({
        questionText: question.questionText,
        examName: question.examName || '',
        examYear: question.examYear?.toString() || '',
        topic: question.topic || '',
        difficulty: question.difficulty,
      });

      // Set image URL
      setImageUrl(question.imageUrl || null);

      // Update options
      const updatedOptions = [...options];
      question.options.forEach((opt) => {
        const index = updatedOptions.findIndex((o) => o.optionLetter === opt.optionLetter);
        if (index !== -1) {
          updatedOptions[index] = {
            optionLetter: opt.optionLetter,
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
          };
        }
      });
      setOptions(updatedOptions);
    } catch (error) {
      console.error('Error fetching question:', error);
      alert('Failed to load question');
      router.push('/library');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (
    index: number,
    field: 'optionText' | 'isCorrect',
    value: string | boolean
  ) => {
    const newOptions = [...options];
    const currentOption = newOptions[index];
    if (currentOption) {
      newOptions[index] = { ...currentOption, [field]: value };
      setOptions(newOptions);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Filter out empty options
      const validOptions = options.filter((opt) => opt.optionText.trim() !== '');

      if (validOptions.length < 2) {
        alert('Please provide at least 2 options');
        setSaving(false);
        return;
      }

      if (!validOptions.some((opt) => opt.isCorrect)) {
        alert('Please mark at least one option as correct');
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: formData.questionText,
          examName: formData.examName || undefined,
          examYear: formData.examYear ? parseInt(formData.examYear) : undefined,
          topic: formData.topic || undefined,
          difficulty: formData.difficulty,
          options: validOptions.map((opt) => ({
            optionLabel: opt.optionLetter,
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
          })),
        }),
      });

      if (response.ok) {
        alert('Question updated successfully!');
        router.push('/library');
      } else {
        let errorMessage = 'Unknown error';
        try {
          const data = await response.json();
          errorMessage = data.error || 'Unknown error';
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || 'Unknown error';
        }
        alert(`Failed to update question: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error updating question:', error);
      alert('Error updating question');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading question...</div>
      </div>
    );
  }

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
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Question ✏️</h1>
          <p className="text-gray-600">Update the question details</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {/* Question Text */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Question Text *</label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
              rows={4}
              placeholder="Enter the question..."
              value={formData.questionText}
              onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
              required
            />
          </div>

          {/* Exam Details */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Exam Name</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                value={formData.examName}
                onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
              >
                <option value="">Select Exam</option>
                <option value="AMC8">AMC 8</option>
                <option value="MOEMS">MOEMS</option>
                <option value="MATHKANGAROO">Math Kangaroo</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Year</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                placeholder="e.g., 2024"
                value={formData.examYear}
                onChange={(e) => setFormData({ ...formData, examYear: e.target.value })}
              />
            </div>
          </div>

          {/* Topic and Difficulty */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Topic</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                placeholder="e.g., Algebra, Geometry"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Difficulty *</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                required
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          {/* Options */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Answer Options * (at least 2 required)
            </label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="font-semibold text-indigo-600 w-8">{option.optionLetter}.</span>
                  <input
                    type="text"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                    placeholder={`Option ${option.optionLetter}`}
                    value={option.optionText}
                    onChange={(e) => handleOptionChange(index, 'optionText', e.target.value)}
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={option.isCorrect}
                      onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span className="text-sm text-gray-600">Correct</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Diagram Manager - TODO: Implement */}
          {imageUrl && (
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">Current Diagram</label>
              <div className="relative max-w-md">
                <Image
                  src={imageUrl}
                  alt="Question diagram"
                  width={400}
                  height={300}
                  className="border rounded"
                  style={{ width: 'auto', height: 'auto' }}
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-between pt-4">
            <Link
              href="/library"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Update Question'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
