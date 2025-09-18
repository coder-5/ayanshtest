'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/upload/FileUpload";
import { Upload, FileText, Image, Link as LinkIcon, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function UploadPage() {
  const [uploadComplete, setUploadComplete] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Upload Documents 📁
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Add new math competition problems from Word documents, PDFs, or images
        </p>
      </div>

      {/* File Upload */}
      <div className="mb-12">
        <FileUpload onUploadComplete={() => setUploadComplete(true)} />
      </div>

      {/* Processing Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Processing Status</CardTitle>
          <CardDescription>
            Track the progress of your uploaded documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No processing activity yet</p>
            <p className="text-sm">Upload documents to see processing status here</p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Uploads */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recent Uploads</CardTitle>
          <CardDescription>
            Your recently processed competition documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent uploads</p>
            <p className="text-sm">Upload your first document to get started</p>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Tips for getting the best results from document processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Document Quality Tips:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use high-resolution scans (300 DPI or higher)</li>
                <li>• Ensure text is clear and readable</li>
                <li>• Include both questions and answer choices</li>
                <li>• Separate files for questions and solutions work best</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Supported Formats:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Word:</strong> .docx files with equations</li>
                <li>• <strong>PDF:</strong> Text-based or scanned documents</li>
                <li>• <strong>Images:</strong> Clear photos or scans</li>
                <li>• <strong>URLs:</strong> Direct links to competition sites</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-8 text-center">
        <Button variant="ghost" asChild>
          <a href="/">← Back to Dashboard</a>
        </Button>
      </div>
    </div>
  );
}