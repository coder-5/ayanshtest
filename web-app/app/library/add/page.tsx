'use client';

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function AddQuestionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [diagramFile, setDiagramFile] = useState<File | null>(null);
  const [diagramPreview, setDiagramPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    questionText: '',
    examName: '',
    examYear: '',
    topic: '',
    difficulty: 'MEDIUM',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    optionE: '',
    correctAnswer: '',
    solution: '',
    videoUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // CLIENT-SIDE VALIDATION
      if (!formData.questionText.trim()) {
        alert('Please enter a question text');
        setLoading(false);
        return;
      }

      const options = [
        { optionLabel: 'A', optionText: formData.optionA, isCorrect: formData.correctAnswer === 'A' },
        { optionLabel: 'B', optionText: formData.optionB, isCorrect: formData.correctAnswer === 'B' },
        { optionLabel: 'C', optionText: formData.optionC, isCorrect: formData.correctAnswer === 'C' },
        { optionLabel: 'D', optionText: formData.optionD, isCorrect: formData.correctAnswer === 'D' },
        { optionLabel: 'E', optionText: formData.optionE, isCorrect: formData.correctAnswer === 'E' },
      ].filter(opt => opt.optionText.trim() !== '');

      // Validate at least 2 options
      if (options.length < 2) {
        alert('Please provide at least 2 answer options');
        setLoading(false);
        return;
      }

      // Validate correct answer is selected
      if (!formData.correctAnswer) {
        alert('Please select the correct answer');
        setLoading(false);
        return;
      }

      // Validate correct answer option has text
      const correctOption = options.find(opt => opt.isCorrect);
      if (!correctOption) {
        alert('Please provide text for the correct answer option');
        setLoading(false);
        return;
      }

      // Prepare request body
      const requestBody: {
        questionText: string;
        difficulty: string;
        options: Array<{ optionLabel: string; optionText: string; isCorrect: boolean }>;
        examName?: string;
        examYear?: number;
        topic?: string;
        solution?: string;
        videoUrl?: string;
      } = {
        questionText: formData.questionText,
        difficulty: formData.difficulty,
        options,
      };

      // Only add optional fields if they have values
      if (formData.examName?.trim()) {
        requestBody.examName = formData.examName.trim();
      }

      if (formData.examYear?.trim()) {
        const yearNum = parseInt(formData.examYear);
        if (!isNaN(yearNum)) {
          requestBody.examYear = yearNum;
        }
      }

      if (formData.topic?.trim()) {
        requestBody.topic = formData.topic.trim();
      }

      if (formData.solution?.trim()) {
        requestBody.solution = formData.solution.trim();
      }

      if (formData.videoUrl?.trim()) {
        requestBody.videoUrl = formData.videoUrl.trim();
      }

      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        const questionId = result.question.id;

        // Upload diagram if provided
        if (diagramFile && questionId) {
          try {
            const diagramFormData = new FormData();
            diagramFormData.append('file', diagramFile);
            diagramFormData.append('questionId', questionId);

            const diagramResponse = await fetch('/api/diagrams', {
              method: 'POST',
              body: diagramFormData,
            });

            if (!diagramResponse.ok) {
              const diagramError = await diagramResponse.json();
              alert(`Question added but diagram upload failed: ${diagramError.error || 'Unknown error'}`);
              router.push('/library');
              return;
            }
          } catch (diagramError) {
            console.error('Error uploading diagram:', diagramError);
            alert(`Question added but diagram upload failed: ${diagramError}`);
            router.push('/library');
            return;
          }
        }

        alert('Question added successfully!');
        router.push('/library');
      } else {
        const error = await response.json();

        // Show detailed validation errors if available
        if (error.details) {
          let errorMessage = 'Validation errors:\n\n';

          // Parse Zod error details
          const details = error.details;
          if (details.questionText?._errors?.length) {
            errorMessage += `• Question Text: ${details.questionText._errors.join(', ')}\n`;
          }
          if (details.options?._errors?.length) {
            errorMessage += `• Options: ${details.options._errors.join(', ')}\n`;
          }
          if (details.examYear?._errors?.length) {
            errorMessage += `• Exam Year: ${details.examYear._errors.join(', ')}\n`;
          }
          if (details.topic?._errors?.length) {
            errorMessage += `• Topic: ${details.topic._errors.join(', ')}\n`;
          }
          if (details.difficulty?._errors?.length) {
            errorMessage += `• Difficulty: ${details.difficulty._errors.join(', ')}\n`;
          }

          alert(errorMessage || `Failed to add question: ${error.error || 'Unknown error'}`);
        } else {
          alert(`Failed to add question: ${error.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error adding question');
    } finally {
      setLoading(false);
    }
  };

  const handleDiagramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('File size exceeds 10MB limit');
        e.target.value = '';
        return;
      }

      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        alert('Invalid file type. Only PNG, JPG, and GIF are allowed.');
        e.target.value = '';
        return;
      }

      setDiagramFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setDiagramPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveDiagram = () => {
    setDiagramFile(null);
    setDiagramPreview(null);
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
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Question ✏️</h1>
          <p className="text-gray-600">Create a new math question for your library</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Question Text */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Question Text
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                rows={4}
                placeholder="Enter the question text..."
                value={formData.questionText}
                onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                required
              />
            </div>

            {/* Exam Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Exam Type
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  value={formData.examName}
                  onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                >
                  <option value="">Select exam type</option>
                  <option value="AMC8">AMC 8</option>
                  <option value="MOEMS">MOEMS</option>
                  <option value="MATHKANGAROO">Math Kangaroo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Year (optional)
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  placeholder="e.g., 2024"
                  value={formData.examYear}
                  onChange={(e) => setFormData({ ...formData, examYear: e.target.value })}
                />
              </div>
            </div>

            {/* Topic and Difficulty */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Topic
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  placeholder="e.g., Algebra, Geometry"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>

            {/* Answer Options */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Answer Options
              </label>
              <div className="space-y-2">
                {['A', 'B', 'C', 'D', 'E'].map((letter) => (
                  <div key={letter} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct"
                      className="w-4 h-4 text-indigo-600"
                      value={letter}
                      checked={formData.correctAnswer === letter}
                      onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                      required={letter === 'A'}
                    />
                    <span className="w-8 font-semibold">{letter}.</span>
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                      placeholder={`Option ${letter}`}
                      value={formData[`option${letter}` as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [`option${letter}`]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Select the radio button for the correct answer
              </p>
            </div>

            {/* Solution */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Solution Explanation (optional)
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                rows={4}
                placeholder="Explain how to solve this problem..."
                value={formData.solution}
                onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
              />
            </div>

            {/* YouTube Video URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                YouTube Video URL (optional)
              </label>
              <input
                type="url"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Add a YouTube link for video solution/explanation
              </p>
            </div>

            {/* Diagram Upload */}
            <div>
              <div className="block text-sm font-semibold text-gray-700 mb-2">
                Diagram/Image (optional)
              </div>
              {diagramPreview ? (
                <div className="border-2 border-gray-300 rounded-lg p-4">
                  <div className="relative w-full h-64 mb-4">
                    <Image
                      src={diagramPreview}
                      alt="Diagram preview"
                      fill
                      className="object-contain rounded"
                      unoptimized
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRemoveDiagram}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      🗑️ Remove Diagram
                    </button>
                    <label
                      htmlFor="diagram-upload"
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer text-sm text-center"
                    >
                      🔄 Replace Diagram
                    </label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif"
                      className="hidden"
                      id="diagram-upload"
                      onChange={handleDiagramChange}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {diagramFile?.name} ({(diagramFile!.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-2">🖼️</div>
                  <p className="text-sm text-gray-600 mb-2">Upload a diagram for this question</p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif"
                    className="hidden"
                    id="diagram-upload"
                    onChange={handleDiagramChange}
                  />
                  <label
                    htmlFor="diagram-upload"
                    className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer text-sm"
                  >
                    📤 Choose Image
                  </label>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF (max 10MB)</p>
                </div>
              )}
            </div>

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
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Question'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
