'use client';

import { CheckCircle } from "lucide-react";
import { AdvancedMathRenderer } from "@/components/math/AdvancedMathRenderer";
import DiagramDisplay from "./DiagramDisplay";
import MissingDiagramAlert from "@/components/MissingDiagramAlert";
import { Badge } from "@/components/ui/badge";
import { cleanupQuestionText } from "@/utils/textCleanup";
import { PracticeQuestion } from "@/types";
import Image from "next/image";
import { useState } from "react";

interface QuestionContentProps {
  question: PracticeQuestion;
  diagrams?: any[];
  diagramsLoading?: boolean;
  onImageError?: (hasError: boolean) => void;
  onFullScreenImage?: (imageUrl: string | null) => void;
  onShowDiagramUpload?: () => void;
}

export function QuestionContent({
  question,
  diagrams = [],
  diagramsLoading = false,
  onImageError,
  onFullScreenImage
}: QuestionContentProps) {
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);
  const cleanedText = cleanupQuestionText(question.text || question.questionText || '');

  const handleImageError = (hasError: boolean) => {
    setImageLoadError(hasError);
    onImageError?.(hasError);
  };

  const handleFullScreenImage = (imageUrl: string) => {
    onFullScreenImage?.(imageUrl);
  };

  return (
    <div className="space-y-4">
      {/* Question Text */}
      <div className="text-xl font-medium leading-relaxed text-gray-900">
        <AdvancedMathRenderer
          expression={cleanedText}
          config={{ displayMode: false, interactive: false }}
        />
      </div>

      {/* Question Image/Diagram - Enhanced Logic with User Upload Priority */}
      {diagramsLoading ? (
        /* Show loading state while fetching diagrams */
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : diagrams.length > 0 ? (
        /* Show user-uploaded diagrams if available */
        <div className="space-y-4">
          {diagrams.map((diagram, index) => (
            <div key={diagram.id} className="space-y-2">
              <div className="flex justify-center">
                <div
                  className="border border-green-200 rounded-lg overflow-hidden bg-green-50 cursor-pointer"
                  onClick={() => handleFullScreenImage(diagram.imageUrl)}
                >
                  <Image
                    src={diagram.imageUrl}
                    alt={`User-uploaded diagram ${index + 1} for ${question.examName || 'question'} ${question.questionNumber || question.id}`}
                    width={800}
                    height={600}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
                    className="w-auto h-auto max-w-full max-h-96 object-contain hover:opacity-90 transition-opacity"
                    style={{ width: 'auto', height: 'auto' }}
                    priority
                    unoptimized
                    onLoad={() => {
                      // Diagram loaded successfully
                    }}
                    onError={() => {
                      // Failed to load diagram
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-center space-x-2">
                <Badge variant="default" className={diagram.isApproved ? "bg-green-600" : "bg-yellow-600"}>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {diagram.isApproved ? "Approved user diagram" : "Pending approval"}
                  {diagrams.length > 1 && ` (${index + 1}/${diagrams.length})`}
                </Badge>
                {diagram.description && (
                  <Badge variant="outline" className="text-xs">
                    {diagram.description}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : question.hasImage && question.imageUrl && !imageLoadError ? (
        <div className="space-y-3">
          <div className="flex justify-center">
            <div
              className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 cursor-pointer"
              onClick={() => handleFullScreenImage(question.imageUrl!)}
            >
              <Image
                src={question.imageUrl}
                alt={`Question diagram for ${question.examName || 'question'} ${question.questionNumber || question.id}`}
                width={0}
                height={0}
                sizes="100vw"
                className="w-auto h-auto object-contain hover:opacity-90 transition-opacity"
                style={{ width: 'auto', height: 'auto', minHeight: '100px' }}
                onLoad={() => {
                  // Image loaded successfully
                }}
                onError={() => {
                  handleImageError(true);
                }}
              />
            </div>
          </div>
        </div>
      ) : question.hasImage && question.imageUrl && imageLoadError ? (
        /* Show error message and fallback when image fails to load */
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="text-red-700 font-medium mb-2">🖼️ Image Loading Error</div>
          <div className="text-red-600 text-sm mb-3">
            Failed to load question image: <code className="bg-red-100 px-1 rounded">{question.imageUrl}</code>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                handleImageError(false);
              }}
              className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm"
            >
              Retry Loading Image
            </button>
          </div>
          <DiagramDisplay
            questionText={question.questionText || question.text || ''}
            className="mt-4"
          />
        </div>
      ) : (
        /* Show auto-generated diagram if no original image exists */
        <div className="space-y-3">
          <DiagramDisplay
            questionText={question.questionText || question.text || ''}
            className="mt-4"
          />
        </div>
      )}

      {/* Smart Missing Diagram Detection */}
      {!question.hasImage && !question.imageUrl && (
        <MissingDiagramAlert
          questionId={question.id}
          questionText={question.questionText || question.text || ''}
        />
      )}
    </div>
  );
}