import React from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface QuestionQualityIndicatorProps {
  questionId: string;
  qualityScore?: number;
  reportCount?: number;
  issues?: string[];
  className?: string;
  showDetails?: boolean;
}

export const QuestionQualityIndicator: React.FC<QuestionQualityIndicatorProps> = ({
  questionId: _questionId,
  qualityScore = 100,
  reportCount = 0,
  issues = [],
  className = '',
  showDetails = false
}) => {
  const getQualityLevel = () => {
    if (qualityScore >= 90) return 'excellent';
    if (qualityScore >= 70) return 'good';
    if (qualityScore >= 50) return 'fair';
    return 'poor';
  };

  const getQualityIcon = () => {
    const level = getQualityLevel();
    switch (level) {
      case 'excellent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'good':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'fair':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'poor':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getQualityText = () => {
    const level = getQualityLevel();
    switch (level) {
      case 'excellent':
        return 'High Quality';
      case 'good':
        return 'Good Quality';
      case 'fair':
        return 'Fair Quality';
      case 'poor':
        return 'Quality Issues';
    }
  };

  const getQualityColor = () => {
    const level = getQualityLevel();
    switch (level) {
      case 'excellent':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'good':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'fair':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'poor':
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  // Don't show indicator for excellent quality questions unless details are requested
  if (qualityScore >= 90 && !showDetails) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md border text-xs ${getQualityColor()} ${className}`}>
      {getQualityIcon()}
      <span className="font-medium">{getQualityText()}</span>

      {showDetails && (
        <>
          <span className="text-xs opacity-75">
            (Score: {qualityScore.toFixed(0)})
          </span>
          {reportCount > 0 && (
            <span className="text-xs opacity-75">
              • {reportCount} report{reportCount !== 1 ? 's' : ''}
            </span>
          )}
        </>
      )}

      {qualityScore < 70 && (
        <div className="group relative">
          <Info className="h-3 w-3 cursor-help" />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
            <div className="max-w-xs">
              <div className="font-medium mb-1">Quality Issues Reported:</div>
              {issues.slice(0, 3).map((issue, index) => (
                <div key={index} className="text-xs">• {issue}</div>
              ))}
              {issues.length > 3 && (
                <div className="text-xs">• ...and {issues.length - 3} more</div>
              )}
              <div className="text-xs mt-1 opacity-75">
                Your score on this question may not fully reflect your knowledge.
              </div>
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionQualityIndicator;