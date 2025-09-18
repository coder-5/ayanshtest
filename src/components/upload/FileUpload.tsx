'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Image, CheckCircle, AlertCircle, Clock, X } from 'lucide-react';

interface UploadedFile {
  id: string;
  file: File;
  competition: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: {
    questionsCount: number;
    message: string;
  };
  error?: string;
}

interface FileUploadProps {
  onUploadComplete?: (files: UploadedFile[]) => void;
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const competitions = [
    { value: 'amc8', label: 'AMC 8' },
    { value: 'moems', label: 'MOEMS' },
    { value: 'kangaroo', label: 'Math Kangaroo' },
    { value: 'other', label: 'Other' }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/jpg'
      ];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB limit
    });

    const uploadFiles: UploadedFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      competition: 'amc8', // Default
      status: 'pending',
      progress: 0
    }));

    setFiles(prev => [...prev, ...uploadFiles]);
  };

  const updateFileCompetition = (fileId: string, competition: string) => {
    setFiles(prev => prev.map(file =>
      file.id === fileId ? { ...file, competition } : file
    ));
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const processFile = async (uploadFile: UploadedFile) => {
    setFiles(prev => prev.map(file =>
      file.id === uploadFile.id
        ? { ...file, status: 'processing', progress: 10 }
        : file
    ));

    try {
      const formData = new FormData();
      formData.append('file', uploadFile.file);
      formData.append('competition', uploadFile.competition);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(file =>
          file.id === uploadFile.id && file.progress < 90
            ? { ...file, progress: file.progress + 10 }
            : file
        ));
      }, 500);

      const response = await fetch('/api/process-document', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Failed to process document');
      }

      const result = await response.json();

      setFiles(prev => prev.map(file =>
        file.id === uploadFile.id
          ? {
              ...file,
              status: 'completed',
              progress: 100,
              result: {
                questionsCount: result.questionsCount,
                message: result.message
              }
            }
          : file
      ));

    } catch (error) {
      setFiles(prev => prev.map(file =>
        file.id === uploadFile.id
          ? {
              ...file,
              status: 'error',
              progress: 0,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          : file
      ));
    }
  };

  const processAllFiles = async () => {
    const pendingFiles = files.filter(file => file.status === 'pending');

    for (const file of pendingFiles) {
      await processFile(file);
    }

    if (onUploadComplete) {
      onUploadComplete(files);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes('image')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Upload Competition Documents
          </CardTitle>
          <CardDescription>
            Upload Word documents, PDFs, or images containing math competition problems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supports .docx, .pdf, .png, .jpg files up to 10MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".docx,.pdf,.png,.jpg,.jpeg"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              Choose Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Files</CardTitle>
            <CardDescription>
              Configure and process your uploaded files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-2 flex-1">
                    {getFileIcon(file.file)}
                    <div className="flex-1">
                      <p className="font-medium">{file.file.name}</p>
                      <p className="text-sm text-gray-600">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Select
                      value={file.competition}
                      onValueChange={(value) => updateFileCompetition(file.id, value)}
                      disabled={file.status === 'processing'}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {competitions.map((comp) => (
                          <SelectItem key={comp.value} value={comp.value}>
                            {comp.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                      {getStatusIcon(file.status)}
                      <Badge variant={
                        file.status === 'completed' ? 'default' :
                        file.status === 'error' ? 'destructive' :
                        file.status === 'processing' ? 'secondary' : 'outline'
                      }>
                        {file.status}
                      </Badge>
                    </div>

                    {file.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Progress Bars */}
              {files.filter(f => f.status === 'processing').map((file) => (
                <div key={`progress-${file.id}`} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing {file.file.name}...</span>
                    <span>{file.progress}%</span>
                  </div>
                  <Progress value={file.progress} className="h-2" />
                </div>
              ))}

              {/* Results */}
              {files.filter(f => f.status === 'completed' || f.status === 'error').map((file) => (
                <div
                  key={`result-${file.id}`}
                  className={`p-3 rounded-lg ${
                    file.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  } border`}
                >
                  {file.status === 'completed' && file.result ? (
                    <div>
                      <p className="font-medium text-green-800">
                        ✓ {file.file.name} processed successfully
                      </p>
                      <p className="text-sm text-green-700">
                        {file.result.questionsCount} questions extracted and saved to database
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-red-800">
                        ✗ Failed to process {file.file.name}
                      </p>
                      <p className="text-sm text-red-700">{file.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {files.some(f => f.status === 'pending') && (
              <div className="mt-6 pt-4 border-t">
                <Button
                  onClick={processAllFiles}
                  className="w-full"
                  disabled={files.some(f => f.status === 'processing')}
                >
                  Process All Files
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}