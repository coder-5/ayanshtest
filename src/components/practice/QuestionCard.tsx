import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useState, memo, useEffect } from "react";
import { cleanupQuestionText, cleanupOptionText } from "@/utils/textCleanup";
import { formatTime } from "@/utils/timeUtils";
import { PracticeQuestion, Question } from "@/types";
import DiagramDisplay from "./DiagramDisplay";
import SolutionVisualizer from "./SolutionVisualizer";
import QuickIssueReport from "@/components/QuickIssueReport";
import MissingDiagramAlert from "@/components/MissingDiagramAlert";
import { MathRenderer } from "@/components/math/MathRenderer";

interface QuestionCardProps {
  question: PracticeQuestion;
  questionNumber: number;
  totalQuestions: number;
  timeElapsed: number;
  onAnswer: (answer: string) => void;
  onNext?: () => void;
  showSolution?: boolean;
  userAnswer?: string;
  isEditMode?: boolean;
  editedQuestion?: Question | null;
  onQuestionEdit?: (question: Question) => void;
  hideNextButton?: boolean;
  isQuestionSubmitted?: boolean;
}

const QuestionCard = memo(function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  timeElapsed,
  onAnswer,
  onNext,
  showSolution = false,
  userAnswer,
  isEditMode = false,
  editedQuestion,
  onQuestionEdit,
  hideNextButton = false,
  isQuestionSubmitted = false
}: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [openEndedAnswer, setOpenEndedAnswer] = useState<string>('');
  const [showErrorReport, setShowErrorReport] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);

  // Determine if this question has been submitted (either internally or externally tracked)
  const questionSubmitted = isSubmitted || isQuestionSubmitted;

  // Reset submission state when question changes
  useEffect(() => {
    setIsSubmitted(false);
    setSelectedOption(userAnswer || '');
    setOpenEndedAnswer(userAnswer || '');
    setImageLoadError(false);
  }, [question.id, userAnswer]);

  // Using centralized formatTime utility

  const handleSubmit = () => {
    if (questionSubmitted) return; // Prevent multiple submissions

    const answer = selectedOption || openEndedAnswer;
    setIsSubmitted(true);
    onAnswer(answer);
  };

  const getCorrectAnswer = () => {
    if (question.options && question.options.length > 0) {
      const correctOption = question.options.find(opt => opt.isCorrect);
      return correctOption?.label || '';
    }
    return question.solution?.solutionText || '';
  };

  const isCorrect = () => {
    if (question.options && question.options.length > 0) {
      const correctOption = question.options?.find(opt => opt.isCorrect);
      return userAnswer === correctOption?.label;
    }
    return false; // For open-ended, this would need manual review
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg">
              Question {questionNumber} of {totalQuestions}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{question.examName}</Badge>
              <Badge variant="outline">{question.topic}</Badge>
              <Badge variant={
                question.difficulty === 'easy' ? 'default' :
                question.difficulty === 'medium' ? 'secondary' : 'destructive'
              }>
                {question.difficulty}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {formatTime(timeElapsed)}
            </div>
            {question.timeLimit && (
              <div className="flex items-center gap-2 text-blue-600">
                <span>Time Limit:</span>
                <span className="font-medium">{question.timeLimit}min</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Question Text Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          {isEditMode && editedQuestion ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Question Text:
                </label>
                <Textarea
                  value={editedQuestion.questionText}
                  onChange={(e) => onQuestionEdit && onQuestionEdit({
                    ...editedQuestion,
                    questionText: e.target.value
                  })}
                  className="min-h-24"
                  placeholder="Enter question text..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Difficulty:
                  </label>
                  <select
                    value={editedQuestion.difficulty}
                    onChange={(e) => onQuestionEdit && onQuestionEdit({
                      ...editedQuestion,
                      difficulty: e.target.value as 'easy' | 'medium' | 'hard'
                    })}
                    className="w-full p-2 border border-gray-200 rounded-md"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Topic:
                  </label>
                  <Input
                    value={editedQuestion.topic}
                    onChange={(e) => onQuestionEdit && onQuestionEdit({
                      ...editedQuestion,
                      topic: e.target.value
                    })}
                    placeholder="Topic"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Subtopic:
                  </label>
                  <Input
                    value={editedQuestion.subtopic || ''}
                    onChange={(e) => onQuestionEdit && onQuestionEdit({
                      ...editedQuestion,
                      subtopic: e.target.value
                    })}
                    placeholder="Subtopic"
                  />
                </div>
              </div>

              {/* Image URL Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasImage"
                    checked={editedQuestion.hasImage || false}
                    onChange={(e) => onQuestionEdit && onQuestionEdit({
                      ...editedQuestion,
                      hasImage: e.target.checked,
                      imageUrl: e.target.checked ? editedQuestion.imageUrl : ''
                    })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="hasImage" className="text-sm font-medium text-gray-700">
                    Question has image/diagram
                  </label>
                </div>

                {editedQuestion.hasImage && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Image URL:
                    </label>
                    <Input
                      value={editedQuestion.imageUrl || ''}
                      onChange={(e) => onQuestionEdit && onQuestionEdit({
                        ...editedQuestion,
                        imageUrl: e.target.value
                      })}
                      placeholder="https://example.com/image.png"
                    />
                    {editedQuestion.imageUrl && (
                      <div className="mt-2 flex justify-center">
                        <img
                          src={editedQuestion.imageUrl}
                          alt="Preview"
                          className="max-w-xs h-auto max-h-32 object-contain border border-gray-200 rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xl font-medium leading-relaxed text-gray-900">
                <MathRenderer content={cleanupQuestionText(question.questionText || question.text || '')} />
              </div>

              {/* Question Image/Diagram - Fixed Logic */}
              {question.hasImage && question.imageUrl && !imageLoadError ? (
                <div className="flex justify-center">
                  <div className="max-w-full border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <img
                      src={question.imageUrl}
                      alt="Question diagram"
                      className="max-w-full h-auto max-h-96 object-contain"
                      onError={() => {
                        console.log(`Image failed to load for question ${question.id}: ${question.imageUrl}`);
                        setImageLoadError(true);
                      }}
                    />
                  </div>
                </div>
              ) : (
                /* Show auto-generated diagram if no original image exists or it failed to load */
                <DiagramDisplay
                  questionText={question.questionText || question.text || ''}
                  className="mt-4"
                />
              )}

              {/* Smart Missing Diagram Detection */}
              {!question.hasImage && !question.imageUrl && (
                <MissingDiagramAlert
                  questionId={question.id}
                  questionText={question.questionText || question.text || ''}
                />
              )}
            </div>
          )}
        </div>

        {/* Answer Section - More compact */}
        <div className={`border-t-2 p-4 rounded-lg mt-6 ${
          questionSubmitted
            ? 'border-green-200 bg-green-50'
            : 'border-blue-200 bg-blue-50'
        }`}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <h3 className={`text-lg font-semibold ${
              questionSubmitted ? 'text-green-900' : 'text-blue-900'
            }`}>
              Your Answer
            </h3>
            {questionSubmitted && (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
          </div>
        {!showSolution ? (
          <div className="space-y-4">
            {question.options && question.options.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-base font-medium text-gray-800 mb-3">Choose your answer:</h4>
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <div
                      key={option.id}
                      className={`p-3 border-2 rounded-lg transition-all duration-200 ${
                        questionSubmitted
                          ? 'cursor-not-allowed opacity-60'
                          : 'cursor-pointer hover:border-gray-400 hover:shadow-sm'
                      } ${
                        selectedOption === option.label
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-300'
                      }`}
                      onClick={() => !questionSubmitted && setSelectedOption(option.label)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          selectedOption === option.label
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-400 text-gray-600 bg-white'
                        }`}>
                          {option.label}
                        </div>
                        <span className="text-base leading-relaxed pt-1">
                          <MathRenderer content={cleanupOptionText(option.text)} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="text-base font-medium text-gray-800">Enter your answer:</h4>
                <Input
                  value={openEndedAnswer}
                  onChange={(e) => !questionSubmitted && setOpenEndedAnswer(e.target.value)}
                  placeholder="Enter your numerical answer..."
                  className="text-base p-3"
                  disabled={questionSubmitted}
                />
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <div className="space-y-2">
                <Button
                  onClick={handleSubmit}
                  disabled={questionSubmitted || (question.options && question.options.length > 0 ? !selectedOption : !openEndedAnswer)}
                  className="w-full py-3 text-lg font-semibold"
                  size="lg"
                >
                  {questionSubmitted ? 'Answer Submitted' : 'Submit Answer'}
                </Button>

              </div>
            </div>
          </div>
        ) : (
          /* Solution Section */
          <div className="space-y-4">
            {/* User's Answer Status */}
            <div className={`p-4 rounded-lg border ${
              isCorrect() ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {isCorrect() ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-semibold">
                  {isCorrect() ? 'Correct!' : 'Incorrect'}
                </span>
              </div>
              <p className="text-sm">
                Your answer: <strong>{userAnswer}</strong>
              </p>
              {!isCorrect() && (
                <p className="text-sm">
                  Correct answer: <strong>{getCorrectAnswer()}</strong>
                </p>
              )}
            </div>

            {/* Error Reporting Button - Kid-friendly */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowErrorReport(true)}
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Something Wrong? 🤔
              </Button>
            </div>

            {/* Enhanced Solution Visualization */}
            {question.solution && (
              <SolutionVisualizer
                solution={{
                  solutionText: question.solution.solutionText,
                  approach: question.solution.approach || '',
                  keyInsights: question.solution.keyInsights || '',
                  timeEstimate: question.solution.timeEstimate || 0
                }}
                questionText={question.text || ''}
                className="mt-4"
              />
            )}

            {!hideNextButton && onNext && (
              <Button onClick={onNext} className="w-full py-4 text-xl font-semibold" size="lg">
                {questionNumber === totalQuestions ? 'Finish Session' : 'Next Question'}
              </Button>
            )}
          </div>
        )}
        </div>
      </CardContent>

      {/* Quick Issue Report Modal - Kid-friendly */}
      {showErrorReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg">
            <QuickIssueReport
              questionId={question.id}
              userId="ayansh"
              onClose={() => setShowErrorReport(false)}
              onReported={() => {
                // Optional: Show a brief confirmation or refresh quality data
              }}
            />
          </div>
        </div>
      )}
    </Card>
  );
});

export { QuestionCard };