"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Image, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [examName, setExamName] = useState('');
  const [examYear, setExamYear] = useState('');
  const [description, setDescription] = useState('');
  const [dynamicExamTypes, setDynamicExamTypes] = useState<string[]>([]);
  const [loadingExamTypes, setLoadingExamTypes] = useState(true);

  useEffect(() => {
    const fetchExamTypes = async () => {
      try {
        const response = await fetch('/api/competitions');
        const competitions = await response.json();
        setDynamicExamTypes([...competitions, 'Other']);
      } catch (error) {
        console.error('Failed to fetch exam types:', error);
        // Fallback to static list
        setDynamicExamTypes(['AMC 8', 'AMC 10', 'AMC 12', 'AIME', 'Math Kangaroo', 'MathCounts', 'MOEMS', 'Other']);
      } finally {
        setLoadingExamTypes(false);
      }
    };

    fetchExamTypes();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus('idle');
      setUploadMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setUploadStatus('error');
      setUploadMessage('Please select a file to upload');
      return;
    }

    if (!examName.trim()) {
      setUploadStatus('error');
      setUploadMessage('Please enter an exam name');
      return;
    }

    setUploadStatus('uploading');
    setUploadMessage('Processing your document...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('examName', examName);
    formData.append('examYear', examYear);
    formData.append('description', description);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadStatus('success');
        setUploadMessage(`Successfully processed ${result.questionsAdded || 0} questions from your document!`);
        // Reset form
        setFile(null);
        setExamName('');
        setExamYear('');
        setDescription('');
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setUploadStatus('error');
        setUploadMessage(result.error || 'Failed to process document');
      }
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage('Network error occurred. Please try again.');
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <Image className="h-5 w-5 text-blue-600" />;
    }
    return <FileText className="h-5 w-5 text-green-600" />;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Upload Documents 📄
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Upload competition questions from Word documents, PDFs, or image files.
          Our system will automatically extract and parse the questions.
        </p>
      </div>

      {/* Upload Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Document Upload
          </CardTitle>
          <CardDescription>
            Select a file containing math competition questions and provide exam details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">Select Document</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      {getFileIcon(file.name)}
                      <span className="font-medium">{file.name}</span>
                      <span className="text-sm text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium text-gray-600 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-500">
                        PDF, Word, or Image files (Max 10MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Exam Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exam-name">Exam Name *</Label>
                <Select value={examName} onValueChange={setExamName} disabled={loadingExamTypes}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingExamTypes ? "Loading..." : "Select or enter exam name"} />
                  </SelectTrigger>
                  <SelectContent>
                    {dynamicExamTypes.map((exam) => (
                      <SelectItem key={exam} value={exam}>
                        {exam}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {examName === 'Other' && (
                  <Input
                    placeholder="Enter custom exam name"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="exam-year">Exam Year</Label>
                <Input
                  id="exam-year"
                  type="number"
                  placeholder="e.g., 2024"
                  value={examYear}
                  onChange={(e) => setExamYear(e.target.value)}
                  min="1990"
                  max={new Date().getFullYear() + 1}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Additional notes about this document or question set"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Status Messages */}
            {uploadStatus !== 'idle' && (
              <Alert className={
                uploadStatus === 'success' ? 'border-green-200 bg-green-50' :
                uploadStatus === 'error' ? 'border-red-200 bg-red-50' :
                'border-blue-200 bg-blue-50'
              }>
                {uploadStatus === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                {uploadStatus === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                {uploadStatus === 'uploading' && <Upload className="h-4 w-4 text-blue-600 animate-pulse" />}
                <AlertDescription className={
                  uploadStatus === 'success' ? 'text-green-800' :
                  uploadStatus === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }>
                  {uploadMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={uploadStatus === 'uploading'}
            >
              {uploadStatus === 'uploading' ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-pulse" />
                  Processing Document...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload and Process
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upload Instructions</CardTitle>
          <CardDescription>
            Guidelines for the best results when uploading documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Supported File Types</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  PDF documents (.pdf)
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Word documents (.doc, .docx)
                </li>
                <li className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Image files (.jpg, .png, .gif)
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Text files (.txt)
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Best Practices</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Clear, high-quality scans for image files</li>
                <li>• Well-formatted text with numbered questions</li>
                <li>• Include answer keys when available</li>
                <li>• One competition per upload for better organization</li>
                <li>• Maximum file size: 10MB</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            After uploading, you can manage your questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" asChild>
              <Link href="/library">
                <BookOpen className="h-4 w-4 mr-2" />
                View Library
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/practice">
                Start Practice
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/exams">
                Schedule Exam
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-8 text-center">
        <Button variant="ghost" asChild>
          <Link href="/">← Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}