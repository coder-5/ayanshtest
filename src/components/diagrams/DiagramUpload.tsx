'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  X,
  FileImage,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DiagramUploadProps {
  questionId: string;
  userId?: string;
  onUploadSuccess?: (diagramData: any) => void;
  onClose?: () => void;
  className?: string;
  mode?: 'add' | 'replace'; // Whether to add additional or replace existing diagrams
}

interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  message: string;
  diagramData?: any;
}

export const DiagramUpload: React.FC<DiagramUploadProps> = ({
  questionId,
  userId = 'ayansh',
  onUploadSuccess,
  onClose,
  className = '',
  mode = 'add'
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploadMode, setUploadMode] = useState<'add' | 'replace'>(mode);
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    message: ''
  });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const validateFile = (selectedFile: File): string | null => {
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      return `Invalid file type. Please upload: ${ALLOWED_TYPES.map(t => t.split('/')[1]).join(', ')}`;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      return `File size exceeds 5MB limit. Current size: ${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB`;
    }

    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
    const error = validateFile(selectedFile);
    if (error) {
      setUploadState({
        status: 'error',
        message: error
      });
      return;
    }

    setFile(selectedFile);
    setUploadState({
      status: 'idle',
      message: ''
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadState({
        status: 'error',
        message: 'Please select a file to upload'
      });
      return;
    }

    setUploadState({
      status: 'uploading',
      message: 'Uploading diagram...'
    });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('questionId', questionId);
      formData.append('userId', userId);
      formData.append('description', description);
      formData.append('replaceExisting', uploadMode === 'replace' ? 'true' : 'false');

      const response = await fetch('/api/diagrams/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadState({
          status: 'success',
          message: result.message || 'Diagram uploaded successfully!',
          diagramData: result.data
        });

        onUploadSuccess?.(result.data);

        // Auto-close after 3 seconds
        setTimeout(() => {
          onClose?.();
        }, 3000);
      } else {
        setUploadState({
          status: 'error',
          message: result.error || 'Upload failed'
        });
      }
    } catch (error) {
      setUploadState({
        status: 'error',
        message: 'Network error. Please try again.'
      });
    }
  };

  const handleReset = () => {
    setFile(null);
    setDescription('');
    setUploadState({
      status: 'idle',
      message: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-blue-600" />
              Upload Diagram
            </CardTitle>
            <CardDescription>
              Replace the current diagram with a better image
            </CardDescription>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Upload Status Alert */}
        {uploadState.status !== 'idle' && (
          <Alert className={`${
            uploadState.status === 'success' ? 'border-green-200 bg-green-50' :
            uploadState.status === 'error' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          }`}>
            <div className="flex items-center gap-2">
              {uploadState.status === 'uploading' && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              )}
              {uploadState.status === 'success' && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              {uploadState.status === 'error' && (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={`${
                uploadState.status === 'success' ? 'text-green-800' :
                uploadState.status === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {uploadState.message}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* File Upload Area */}
        <div className="space-y-2">
          <Label htmlFor="diagram-file">Choose Image File</Label>

          {/* Drag & Drop Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              id="diagram-file"
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              onChange={handleFileInputChange}
              className="hidden"
            />

            {!file ? (
              <div className="space-y-2">
                <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF, WebP up to 5MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <FileImage className="h-8 w-8 text-blue-600 mx-auto" />
                <div>
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  className="text-xs"
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mode Selection */}
        <div className="space-y-3">
          <Label>Upload Mode</Label>
          <div className="grid grid-cols-2 gap-2">
            <div
              className={`cursor-pointer border-2 rounded-lg p-3 transition-all ${
                uploadMode === 'add'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setUploadMode('add')}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  uploadMode === 'add' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}>
                  {uploadMode === 'add' && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-sm">Add Additional</div>
                  <div className="text-xs text-gray-500">Keep existing diagrams</div>
                </div>
              </div>
            </div>

            <div
              className={`cursor-pointer border-2 rounded-lg p-3 transition-all ${
                uploadMode === 'replace'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setUploadMode('replace')}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  uploadMode === 'replace' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}>
                  {uploadMode === 'replace' && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-sm">Replace All</div>
                  <div className="text-xs text-gray-500">Remove existing diagrams</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Describe what this diagram shows..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[60px] resize-none"
            maxLength={200}
          />
          <p className="text-xs text-gray-500">
            {description.length}/200 characters
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleUpload}
            disabled={!file || uploadState.status === 'uploading'}
            className="flex-1"
          >
            {uploadState.status === 'uploading' ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {uploadState.status === 'uploading'
              ? 'Uploading...'
              : uploadMode === 'replace'
                ? 'Replace All Diagrams'
                : 'Add Diagram'}
          </Button>

          <Button
            variant="outline"
            onClick={handleReset}
            disabled={uploadState.status === 'uploading'}
          >
            Reset
          </Button>
        </div>

        {/* Upload Guidelines */}
        <div className="text-xs text-gray-500 space-y-1 border-t pt-3">
          <p className="font-medium">Guidelines:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Ensure the diagram is clear and readable</li>
            <li>Include all relevant labels and measurements</li>
            <li>Uploads require admin approval before becoming visible</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DiagramUpload;