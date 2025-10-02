'use client';

import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { formatTime } from "@/utils/timeUtils";

interface QuestionHeaderProps {
  questionNumber: number;
  totalQuestions: number;
  timeElapsed: number;
  examName?: string | null;
  difficulty?: string;
  topic?: string;
}

export function QuestionHeader({
  questionNumber,
  totalQuestions,
  timeElapsed,
  examName,
  difficulty,
  topic
}: QuestionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        <Badge variant="outline">
          Question {questionNumber} of {totalQuestions}
        </Badge>
        {examName && (
          <Badge variant="secondary">{examName}</Badge>
        )}
        {difficulty && (
          <Badge
            variant={
              difficulty === 'EASY' ? 'default' :
              difficulty === 'MEDIUM' ? 'secondary' :
              'destructive'
            }
          >
            {difficulty}
          </Badge>
        )}
        {topic && (
          <Badge variant="outline">{topic}</Badge>
        )}
      </div>
      <div className="flex items-center text-gray-600">
        <Clock className="h-4 w-4 mr-1" />
        <span className="text-sm">{formatTime(timeElapsed)}</span>
      </div>
    </div>
  );
}