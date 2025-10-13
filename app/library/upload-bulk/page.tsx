'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function BulkUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    uploaded: number;
    failed: number;
    total: number;
    errors?: Array<{ index: number; error: string }>;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (50MB limit to prevent browser crashes)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        alert('File size exceeds 50MB limit. Please use a smaller file.');
        e.target.value = ''; // Reset file input
        return;
      }
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      // Safely read file content with error handling
      let text: string;
      try {
        text = await selectedFile.text();
      } catch (readError) {
        console.error('File read error:', readError);
        alert('Failed to read file. File may be corrupted or too large.');
        setUploading(false);
        return;
      }

      let questions;

      // Parse JSON
      try {
        questions = JSON.parse(text);
      } catch {
        alert('Invalid JSON format. Please check your file.');
        setUploading(false);
        return;
      }

      // Ensure it's an array
      if (!Array.isArray(questions)) {
        questions = [questions];
      }

      // Upload to API
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading file');
    } finally {
      setUploading(false);
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
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Upload Questions 📄</h1>
          <p className="text-gray-600">Upload multiple questions at once using JSON format</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-6">
            <div className="text-6xl mb-4">📤</div>
            <h3 className="text-xl font-semibold mb-2">
              {selectedFile ? selectedFile.name : 'Choose your JSON file'}
            </h3>
            <p className="text-gray-600 mb-4">Click to browse</p>
            <input
              type="file"
              accept=".json"
              className="hidden"
              id="file-upload"
              onChange={handleFileChange}
            />
            <label
              htmlFor="file-upload"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
            >
              Choose File
            </label>
            <p className="text-sm text-gray-500 mt-4">Supported format: JSON</p>
          </div>

          {/* Format Instructions */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">JSON Format Example:</h3>
            <pre className="bg-white p-4 rounded border text-xs overflow-x-auto">
              {`[
  {
    "questionText": "What is 2 + 2?",
    "examName": "AMC8",
    "examYear": 2024,
    "topic": "Algebra",
    "difficulty": "EASY",
    "options": [
      { "optionLabel": "A", "optionText": "3", "isCorrect": false },
      { "optionLabel": "B", "optionText": "4", "isCorrect": true },
      { "optionLabel": "C", "optionText": "5", "isCorrect": false }
    ],
    "solution": "2 + 2 = 4"
  }
]`}
            </pre>
          </div>

          {/* Result */}
          {result && (
            <div
              className={`p-4 rounded-lg mb-6 ${
                result.failed === 0
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}
            >
              <h3 className="font-semibold mb-2">Upload Results:</h3>
              <p>✅ Successfully uploaded: {result.uploaded}</p>
              <p>❌ Failed: {result.failed}</p>
              <p>📊 Total: {result.total}</p>

              {result.errors && result.errors.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold mb-2">Errors:</p>
                  <div className="max-h-40 overflow-y-auto">
                    {result.errors.map((err, idx) => (
                      <p key={idx} className="text-sm text-red-600">
                        Question {err.index + 1}: {err.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
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
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload Questions'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
