import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Clock, CheckCircle, XCircle, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { useState, memo } from "react";
import { useImageGenerator } from "@/hooks/useImageGenerator";
import { cleanupQuestionText, cleanupOptionText } from "@/utils/textCleanup";
import { formatTime } from "@/utils/timeUtils";
import { PracticeQuestion, Question } from "@/types";
import DiagramDisplay from "./DiagramDisplay";
import SolutionVisualizer from "./SolutionVisualizer";
import ErrorReport from "@/components/ErrorReport";

interface QuestionCardProps {
  question: PracticeQuestion;
  questionNumber: number;
  totalQuestions: number;
  timeElapsed: number;
  onAnswer: (answer: string, excludeFromScoring?: boolean) => void;
  onNext?: () => void;
  showSolution?: boolean;
  userAnswer?: string;
  isEditMode?: boolean;
  editedQuestion?: Question | null;
  onQuestionEdit?: (question: Question) => void;
  hideNextButton?: boolean;
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
  hideNextButton = false
}: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [openEndedAnswer, setOpenEndedAnswer] = useState<string>('');
  const [showErrorReport, setShowErrorReport] = useState(false);
  const [excludeFromScoring, setExcludeFromScoring] = useState<boolean>(false);
  const { generateImageUrl } = useImageGenerator();

  // Using centralized formatTime utility

  const handleSubmit = () => {
    const answer = selectedOption || openEndedAnswer;
    onAnswer(answer, excludeFromScoring);
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
{cleanupQuestionText(question.questionText || question.text || '')}
              </div>

              {/* Question Image/Diagram */}
              {question.hasImage && (
                <div className="flex justify-center">
                  <div className="max-w-full border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    {question.imageUrl ? (
                      <img
                        src={question.imageUrl}
                        alt="Question diagram"
                        className="max-w-full h-auto max-h-96 object-contain"
                        onError={(e) => {
                          // Fallback to generated image if original fails
                          const fallbackUrl = generateImageUrl(
                            `${question.examName} Question ${questionNumber}`,
                            'diagram',
                            500,
                            300
                          );
                          e.currentTarget.src = fallbackUrl;
                        }}
                      />
                    ) : (
                      <div className="relative">
                        <img
                          src={generateImageUrl(
                            `${question.examName} Question ${questionNumber}`,
                            'diagram',
                            500,
                            300
                          )}
                          alt="Generated question diagram"
                          className="max-w-full h-auto max-h-96 object-contain"
                        />
                        <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" />
                          Auto-generated
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Auto-generated Diagram */}
              <DiagramDisplay
                questionText={question.questionText || question.text || ''}
                className="mt-4"
              />
            </div>
          )}
        </div>

        {/* Answer Section - Clear separation from question */}
        <div className="border-t-4 border-blue-200 bg-blue-50 p-6 rounded-lg mt-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">Answer Section</h2>
        {!showSolution ? (
          <div className="space-y-6">
            {question.options && question.options.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Choose your answer:</h3>
                <div className="space-y-3">
                  {question.options.map((option) => (
                    <div
                      key={option.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedOption === option.label
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
                      }`}
                      onClick={() => setSelectedOption(option.label)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-base font-bold flex-shrink-0 ${
                          selectedOption === option.label
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-400 text-gray-600 bg-white'
                        }`}>
                          {option.label}
                        </div>
                        <span className="text-lg leading-relaxed pt-1">{cleanupOptionText(option.text)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Enter your answer:</h3>
                <Input
                  value={openEndedAnswer}
                  onChange={(e) => setOpenEndedAnswer(e.target.value)}
                  placeholder="Enter your numerical answer..."
                  className="text-lg p-4"
                />
              </div>
            )}

            <div className="pt-6 border-t border-gray-200">
              {/* Exclude from scoring option */}
              <div className="mb-4 flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <input
                  type="checkbox"
                  id="excludeFromScoring"
                  checked={excludeFromScoring}
                  onChange={(e) => setExcludeFromScoring(e.target.checked)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="excludeFromScoring" className="text-sm text-gray-700">
                  <span className="font-medium">Exclude from scoring</span>
                  <div className="text-xs text-gray-600 mt-1">
                    Check this if the question has issues or is incomplete. This won't count against your score.
                  </div>
                </label>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={question.options && question.options.length > 0 ? !selectedOption : !openEndedAnswer}
                className="w-full py-4 text-xl font-semibold"
                size="lg"
              >
                Submit Answer
              </Button>
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

            {/* Error Reporting Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowErrorReport(true)}
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report Issue
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

      {/* Error Report Modal */}
      {showErrorReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ErrorReport
              questionId={question.id}
              userId="user123" // TODO: Get from auth context
              onClose={() => setShowErrorReport(false)}
            />
          </div>
        </div>
      )}
    </Card>
  );
});

export { QuestionCard };