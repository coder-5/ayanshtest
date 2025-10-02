'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImageOff, CheckCircle } from 'lucide-react';

interface MissingDiagramAlertProps {
  questionId: string;
  questionText: string;
  userId?: string;
}

export const MissingDiagramAlert: React.FC<MissingDiagramAlertProps> = ({
  questionId,
  questionText,
  userId = 'ayansh'
}) => {
  const [isReporting, setIsReporting] = useState(false);
  const [isReported, setIsReported] = useState(false);

  // Simple heuristic to detect if a diagram might be needed
  const needsDiagram = () => {
    const diagramKeywords = [
      'triangle', 'circle', 'rectangle', 'square', 'polygon', 'angle',
      'figure', 'diagram', 'graph', 'coordinate', 'plot', 'line segment',
      'perpendicular', 'parallel', 'intersection', 'vertex', 'vertices',
      'shown', 'pictured', 'illustrated', 'drawn', 'image', 'picture'
    ];

    const text = questionText.toLowerCase();
    return diagramKeywords.some(keyword => text.includes(keyword));
  };

  const handleQuickReport = async () => {
    setIsReporting(true);

    try {
      const response = await fetch('/api/error-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          userId,
          reportType: 'MISSING_DIAGRAM',
          description: 'Question mentions geometric shapes or diagrams but no image is shown',
          severity: 'HIGH',
          evidence: 'Auto-detected from question text analysis',
          suggestedFix: 'Add diagram or image to clarify the question',
          confidence: 7
        }),
      });

      if (response.ok) {
        setIsReported(true);
        // Auto-hide after 3 seconds
        setTimeout(() => {
          setIsReported(false);
        }, 3000);
      }
    } catch (error) {
    } finally {
      setIsReporting(false);
    }
  };

  // Only show if the question likely needs a diagram
  if (!needsDiagram()) {
    return null;
  }

  if (isReported) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
        <CheckCircle className="h-4 w-4" />
        <span>Thanks! We&apos;ll add the missing picture. 🎨</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
      <div className="flex items-center gap-2 text-orange-800 text-sm">
        <ImageOff className="h-4 w-4" />
        <span>This question might need a picture to solve properly.</span>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleQuickReport}
        disabled={isReporting}
        className="text-orange-600 border-orange-300 hover:bg-orange-100"
      >
        {isReporting ? 'Reporting...' : 'Report Missing Picture'}
      </Button>
    </div>
  );
};

export default MissingDiagramAlert;