'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ErrorReportProps {
  questionId: string;
  userId?: string;
  onClose?: () => void;
}

const reportTypes = [
  { value: 'WRONG_ANSWER', label: 'Wrong Answer' },
  { value: 'INCORRECT_SOLUTION', label: 'Incorrect Solution' },
  { value: 'UNCLEAR_QUESTION', label: 'Unclear Question' },
  { value: 'MISSING_DIAGRAM', label: 'Missing Diagram' },
  { value: 'BROKEN_IMAGE', label: 'Broken Image' },
  { value: 'TYPO', label: 'Typo/Grammar Error' },
  { value: 'INAPPROPRIATE_DIFFICULTY', label: 'Inappropriate Difficulty' },
  { value: 'DUPLICATE_QUESTION', label: 'Duplicate Question' },
  { value: 'COPYRIGHT_ISSUE', label: 'Copyright Issue' }
];

const severityLevels = [
  { value: 'CRITICAL', label: 'Critical', description: 'Answer is definitely wrong' },
  { value: 'HIGH', label: 'High', description: 'Solution has major issues' },
  { value: 'MEDIUM', label: 'Medium', description: 'Clarity problems' },
  { value: 'LOW', label: 'Low', description: 'Minor typos/formatting' }
];

export default function ErrorReport({ questionId, userId, onClose }: ErrorReportProps) {
  const [formData, setFormData] = useState({
    reportType: '',
    description: '',
    severity: '',
    evidence: '',
    suggestedFix: '',
    confidence: 5
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          userId,
          ...formData
        })
      });

      if (response.ok) {
        setIsSubmitted(true);
        setTimeout(() => {
          onClose?.();
        }, 2000);
      } else {
        throw new Error('Failed to submit error report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit error report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Report Submitted</h3>
          <p className="text-gray-600">
            Thank you for helping improve our content quality. We'll review your report soon.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Report Issue
        </CardTitle>
        <CardDescription>
          Help us improve content quality by reporting any errors or issues you've found.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="reportType">Issue Type *</Label>
            <Select
              value={formData.reportType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, reportType: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="severity">Severity *</Label>
            <Select
              value={formData.severity}
              onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select severity level" />
              </SelectTrigger>
              <SelectContent>
                {severityLevels.map((severity) => (
                  <SelectItem key={severity.value} value={severity.value}>
                    <div>
                      <div className="font-medium">{severity.label}</div>
                      <div className="text-sm text-gray-500">{severity.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Please describe the issue in detail (minimum 10 characters)"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
              minLength={10}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="evidence">Evidence (Optional)</Label>
            <Textarea
              id="evidence"
              placeholder="Any additional information, screenshots, or supporting evidence"
              value={formData.evidence}
              onChange={(e) => setFormData(prev => ({ ...prev, evidence: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="suggestedFix">Suggested Fix (Optional)</Label>
            <Textarea
              id="suggestedFix"
              placeholder="If you know how to fix this issue, please share your suggestion"
              value={formData.suggestedFix}
              onChange={(e) => setFormData(prev => ({ ...prev, suggestedFix: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="confidence">Confidence Level: {formData.confidence}/10</Label>
            <Input
              id="confidence"
              type="range"
              min="1"
              max="10"
              value={formData.confidence}
              onChange={(e) => setFormData(prev => ({ ...prev, confidence: parseInt(e.target.value) }))}
              className="w-full"
            />
            <div className="text-sm text-gray-500 mt-1">
              How confident are you that this is actually an issue?
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !formData.reportType || !formData.severity || formData.description.length < 10}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}