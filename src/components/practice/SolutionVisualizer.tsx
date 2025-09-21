'use client';

import React from 'react';
import { DiagramService } from '@/services/diagramService';

interface SolutionVisualizerProps {
  solution: {
    solutionText: string;
    approach?: string;
    keyInsights?: string;
    timeEstimate?: number;
    commonMistakes?: string;
    alternativeApproaches?: string;
  };
  questionText: string;
  className?: string;
}

export default function SolutionVisualizer({
  solution,
  questionText,
  className = ''
}: SolutionVisualizerProps) {

  // Generate step-by-step visual explanation
  const generateStepByStepDiagram = () => {
    const steps = solution.solutionText.split(/step \d+:/i);
    if (steps.length <= 1) return null;

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-blue-800 flex items-center gap-2">
          🎯 Step-by-Step Visual Solution
        </h4>
        <div className="grid gap-4">
          {steps.slice(1).map((step, index) => (
            <div key={index} className="flex gap-4 p-3 bg-white rounded border">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">{step.trim()}</p>
                {generateMiniDiagramForStep(step, questionText)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Generate mini diagrams for specific steps
  const generateMiniDiagramForStep = (step: string, question: string) => {
    const lowerStep = step.toLowerCase();
    const lowerQuestion = question.toLowerCase();

    // For geometry problems
    if (lowerQuestion.includes('rectangle') && lowerStep.includes('area')) {
      return (
        <div className="mt-2">
          <svg width="120" height="80" viewBox="0 0 120 80" className="border rounded">
            <rect x="10" y="20" width="80" height="40" fill="none" stroke="#3b82f6" strokeWidth="2"/>
            <text x="50" y="15" textAnchor="middle" fontSize="10" fill="#374151">length</text>
            <text x="5" y="45" textAnchor="middle" fontSize="10" fill="#374151" transform="rotate(-90 5 45)">width</text>
            <text x="50" y="45" textAnchor="middle" fontSize="12" fill="#dc2626" fontWeight="bold">A = l × w</text>
          </svg>
        </div>
      );
    }

    // For circle problems
    if (lowerQuestion.includes('circle') && (lowerStep.includes('area') || lowerStep.includes('circumference'))) {
      return (
        <div className="mt-2">
          <svg width="100" height="100" viewBox="0 0 100 100" className="border rounded">
            <circle cx="50" cy="50" r="30" fill="none" stroke="#3b82f6" strokeWidth="2"/>
            <line x1="50" y1="50" x2="80" y2="50" stroke="#dc2626" strokeWidth="1" strokeDasharray="3,3"/>
            <text x="65" y="45" fontSize="10" fill="#dc2626">r</text>
            {lowerStep.includes('area') && (
              <text x="50" y="55" textAnchor="middle" fontSize="10" fill="#374151">A = πr²</text>
            )}
            {lowerStep.includes('circumference') && (
              <text x="50" y="55" textAnchor="middle" fontSize="10" fill="#374151">C = 2πr</text>
            )}
          </svg>
        </div>
      );
    }

    return null;
  };

  // Generate key insights visualization
  const generateInsightsVisualization = () => {
    if (!solution.keyInsights) return null;

    const insights = solution.keyInsights.split(/[.!]\s+/).filter(insight => insight.trim());

    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-blue-800 flex items-center gap-2">
          💡 Key Insights
        </h4>
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start gap-3 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
              <div className="w-6 h-6 bg-yellow-400 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                💡
              </div>
              <p className="text-sm text-gray-700">{insight.trim()}.</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Generate time estimation visualization
  const generateTimeVisualization = () => {
    if (!solution.timeEstimate) return null;

    const timeMinutes = solution.timeEstimate;
    const segments = Math.min(Math.ceil(timeMinutes / 0.5), 10); // Max 10 segments

    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-blue-800 flex items-center gap-2">
          ⏱️ Estimated Time: {timeMinutes} minutes
        </h4>
        <div className="flex gap-1">
          {Array.from({ length: segments }, (_, i) => (
            <div
              key={i}
              className="w-4 h-4 bg-blue-400 rounded"
              title={`${(i + 1) * 0.5} minutes`}
            />
          ))}
          {segments < 10 && Array.from({ length: 10 - segments }, (_, i) => (
            <div
              key={`empty-${i}`}
              className="w-4 h-4 bg-gray-200 rounded"
            />
          ))}
        </div>
        <p className="text-xs text-gray-600">Each block represents 30 seconds</p>
      </div>
    );
  };

  return (
    <div className={`solution-visualizer space-y-6 ${className}`}>
      {/* Original solution text */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          📝 Solution Explanation
        </h4>
        <div className="text-sm text-blue-700">
          {solution.solutionText}
        </div>
      </div>

      {/* Step-by-step visualization */}
      {generateStepByStepDiagram()}

      {/* Key insights */}
      {generateInsightsVisualization()}

      {/* Approach visualization */}
      {solution.approach && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
            🎯 Approach
          </h4>
          <div className="text-sm text-green-700">
            {solution.approach}
          </div>
        </div>
      )}

      {/* Time estimation */}
      {generateTimeVisualization()}

      {/* Common Mistakes */}
      {solution.commonMistakes && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
            ⚠️ Common Mistakes to Avoid
          </h4>
          <div className="space-y-2">
            {solution.commonMistakes.split(',').map((mistake, index) => (
              <div key={index} className="flex items-start gap-3 p-2 bg-red-100 rounded">
                <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  ✗
                </div>
                <p className="text-sm text-red-700">{mistake.trim()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternative Approaches */}
      {solution.alternativeApproaches && (
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
            🔄 Alternative Solution Methods
          </h4>
          <div className="space-y-2">
            {solution.alternativeApproaches.split(',').map((approach, index) => (
              <div key={index} className="flex items-start gap-3 p-2 bg-orange-100 rounded">
                <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-sm text-orange-700">{approach.trim()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related diagram */}
      {DiagramService.needsDiagram(questionText) && (
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
            📐 Problem Visualization
          </h4>
          <div
            className="flex justify-center"
            dangerouslySetInnerHTML={{
              __html: DiagramService.generateDiagram(questionText) || ''
            }}
          />
        </div>
      )}
    </div>
  );
}