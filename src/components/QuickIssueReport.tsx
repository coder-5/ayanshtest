'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ImageOff,
  HelpCircle,
  AlertTriangle,
  Eye,
  CheckCircle,
  X
} from 'lucide-react';

interface QuickIssueReportProps {
  questionId: string;
  userId?: string;
  onClose?: () => void;
  onReported?: () => void;
}

const quickIssues = [
  {
    id: 'MISSING_DIAGRAM',
    icon: ImageOff,
    title: "Missing Picture",
    description: "This question needs a diagram but I don't see one",
    severity: 'HIGH',
    color: 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700'
  },
  {
    id: 'BROKEN_IMAGE',
    icon: Eye,
    title: "Can't See Picture",
    description: "There's supposed to be a picture but it's broken or won't load",
    severity: 'HIGH',
    color: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700'
  },
  {
    id: 'UNCLEAR_QUESTION',
    icon: HelpCircle,
    title: "Don't Understand",
    description: "The question is confusing or doesn't make sense",
    severity: 'MEDIUM',
    color: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700'
  },
  {
    id: 'WRONG_ANSWER',
    icon: AlertTriangle,
    title: "Wrong Answer",
    description: "I think the correct answer is wrong",
    severity: 'CRITICAL',
    color: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
  }
];

export default function QuickIssueReport({
  questionId,
  userId = 'ayansh',
  onClose,
  onReported
}: QuickIssueReportProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);

  const handleQuickReport = async (issueType: string, severity: string, description: string) => {
    setIsSubmitting(true);
    setSelectedIssue(issueType);

    try {
      const response = await fetch('/api/error-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          userId,
          reportType: issueType,
          description,
          severity,
          evidence: '',
          suggestedFix: '',
          confidence: 8 // High confidence for quick reports
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        onReported?.();

        // Auto-close after 2 seconds
        setTimeout(() => {
          onClose?.();
        }, 2000);
      } else {
        throw new Error('Failed to submit report');
      }
    } catch (error) {
      setIsSubmitting(false);
      setSelectedIssue(null);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Thanks for helping! 🎉
            </h3>
            <p className="text-sm text-green-700">
              Your report helps make this question better for everyone.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Something wrong with this question?
          </CardTitle>
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
        <p className="text-sm text-gray-600">
          Click on what&apos;s wrong and we&apos;ll fix it! 😊
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {quickIssues.map((issue) => {
          const Icon = issue.icon;
          const isSelected = selectedIssue === issue.id;
          const isSubmittingThis = isSubmitting && isSelected;

          return (
            <Button
              key={issue.id}
              variant="outline"
              onClick={() => handleQuickReport(issue.id, issue.severity, issue.description)}
              disabled={isSubmitting}
              className={`w-full h-auto p-4 justify-start ${issue.color} ${
                isSubmittingThis ? 'opacity-75' : ''
              }`}
            >
              <div className="flex items-start gap-3 text-left">
                <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                  isSubmittingThis ? 'animate-pulse' : ''
                }`} />
                <div>
                  <div className="font-medium text-sm">
                    {isSubmittingThis ? 'Reporting...' : issue.title}
                  </div>
                  <div className="text-xs opacity-80 mt-1">
                    {issue.description}
                  </div>
                </div>
              </div>
            </Button>
          );
        })}

        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500 text-center">
            Need to report something else?
            <button
              className="text-blue-600 hover:underline ml-1"
              onClick={() => {
                // This would open the full error report form
              }}
            >
              Use detailed form
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}