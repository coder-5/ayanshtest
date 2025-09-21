'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Flag, Clock, SkipForward } from "lucide-react";

export interface QuestionStatus {
  questionId: string;
  status: 'unanswered' | 'correct' | 'incorrect' | 'skipped' | 'flagged';
  userAnswer?: string;
  timeSpent?: number;
  isFlagged?: boolean;
}

interface QuestionTrackerProps {
  questions: any[];
  currentQuestionIndex: number;
  questionStatuses: QuestionStatus[];
  onQuestionSelect: (index: number) => void;
  onToggleFlag: (index: number) => void;
  className?: string;
}

export function QuestionTracker({
  questions,
  currentQuestionIndex,
  questionStatuses,
  onQuestionSelect,
  onToggleFlag,
  className = ""
}: QuestionTrackerProps) {

  const getQuestionIcon = (status: QuestionStatus['status'], isFlagged: boolean = false) => {
    if (isFlagged) {
      return <Flag className="h-3 w-3 text-yellow-500 fill-current" />;
    }

    switch (status) {
      case 'correct':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'incorrect':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'skipped':
        return <SkipForward className="h-3 w-3 text-gray-500" />;
      case 'unanswered':
        return <Clock className="h-3 w-3 text-gray-300" />;
      default:
        return <Clock className="h-3 w-3 text-gray-300" />;
    }
  };

  const getQuestionColor = (status: QuestionStatus['status'], isFlagged: boolean = false, isCurrentQuestion: boolean = false) => {
    if (isCurrentQuestion) {
      return 'border-blue-500 bg-blue-50 shadow-md';
    }

    if (isFlagged) {
      return 'border-yellow-400 bg-yellow-50';
    }

    switch (status) {
      case 'correct':
        return 'border-green-300 bg-green-50';
      case 'incorrect':
        return 'border-red-300 bg-red-50';
      case 'skipped':
        return 'border-gray-300 bg-gray-50';
      case 'unanswered':
        return 'border-gray-200 bg-white';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getStatusCounts = () => {
    const counts = {
      answered: 0,
      correct: 0,
      incorrect: 0,
      skipped: 0,
      flagged: 0,
      remaining: 0
    };

    questionStatuses.forEach(status => {
      if (status.isFlagged) counts.flagged++;

      switch (status.status) {
        case 'correct':
          counts.answered++;
          counts.correct++;
          break;
        case 'incorrect':
          counts.answered++;
          counts.incorrect++;
          break;
        case 'skipped':
          counts.answered++;
          counts.skipped++;
          break;
        case 'unanswered':
          counts.remaining++;
          break;
      }
    });

    return counts;
  };

  const counts = getStatusCounts();

  return (
    <Card className={`${className} sticky top-4`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Question Tracker</span>
          <Badge variant="outline">{currentQuestionIndex + 1}/{questions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>Correct: {counts.correct}</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="h-3 w-3 text-red-500" />
            <span>Wrong: {counts.incorrect}</span>
          </div>
          <div className="flex items-center gap-1">
            <Flag className="h-3 w-3 text-yellow-500 fill-current" />
            <span>Flagged: {counts.flagged}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-gray-400" />
            <span>Left: {counts.remaining}</span>
          </div>
        </div>

        {/* Question Grid */}
        <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto">
          {questions.map((_, index) => {
            const status = questionStatuses[index] || { status: 'unanswered', isFlagged: false };
            const isCurrentQuestion = index === currentQuestionIndex;

            return (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className={`h-10 w-10 p-0 border-2 ${getQuestionColor(
                  status.status,
                  status.isFlagged,
                  isCurrentQuestion
                )} hover:scale-105 transition-all relative`}
                onClick={() => onQuestionSelect(index)}
              >
                <div className="flex flex-col items-center">
                  <div className="text-xs font-semibold">{index + 1}</div>
                  <div className="absolute -top-1 -right-1">
                    {getQuestionIcon(status.status, status.isFlagged)}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Flag Current Question */}
        <div className="pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleFlag(currentQuestionIndex)}
            className="w-full text-xs"
          >
            <Flag className="h-3 w-3 mr-1" />
            {questionStatuses[currentQuestionIndex]?.isFlagged ? 'Unflag' : 'Flag'} Question {currentQuestionIndex + 1}
          </Button>
        </div>

        {/* Legend */}
        <div className="text-xs text-gray-600 space-y-1 pt-2 border-t">
          <div className="font-medium">Legend:</div>
          <div className="grid grid-cols-1 gap-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 bg-blue-50 rounded"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Correct</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-3 w-3 text-red-500" />
              <span>Wrong</span>
            </div>
            <div className="flex items-center gap-2">
              <Flag className="h-3 w-3 text-yellow-500 fill-current" />
              <span>Flagged</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}