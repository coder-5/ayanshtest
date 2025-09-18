import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Clock, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { useState } from "react";

interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'open-ended';
  competition: string;
  topic: string;
  difficulty: string;
  subtopic?: string;
  hasImage?: boolean;
  imageUrl?: string;
  options?: Array<{
    id: string;
    label: string;
    text: string;
    isCorrect: boolean;
  }>;
  solutions?: Array<{
    id: string;
    text: string;
    type: string;
  }>;
}

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  timeElapsed: number;
  onAnswer: (answer: string) => void;
  onNext: () => void;
  showSolution: boolean;
  userAnswer?: string;
  isEditMode?: boolean;
  editedQuestion?: Question | null;
  onQuestionEdit?: (question: Question) => void;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  timeElapsed,
  onAnswer,
  onNext,
  showSolution,
  userAnswer,
  isEditMode = false,
  editedQuestion,
  onQuestionEdit
}: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [openEndedAnswer, setOpenEndedAnswer] = useState<string>('');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    const answer = question.type === 'multiple-choice' ? selectedOption : openEndedAnswer;
    onAnswer(answer);
  };

  const getCorrectAnswer = () => {
    if (question.type === 'multiple-choice' && question.options) {
      const correctOption = question.options.find(opt => opt.isCorrect);
      return correctOption?.label || '';
    }
    return question.solutions?.[0]?.text || '';
  };

  const isCorrect = () => {
    if (question.type === 'multiple-choice') {
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
              <Badge variant="secondary">{question.competition}</Badge>
              <Badge variant="outline">{question.topic}</Badge>
              <Badge variant={
                question.difficulty === 'easy' ? 'default' :
                question.difficulty === 'medium' ? 'secondary' : 'destructive'
              }>
                {question.difficulty}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            {formatTime(timeElapsed)}
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
                  value={editedQuestion.text}
                  onChange={(e) => onQuestionEdit && onQuestionEdit({
                    ...editedQuestion,
                    text: e.target.value
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
                      difficulty: e.target.value
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
                {question.text}
              </div>

              {/* Question Image/Diagram */}
              {question.hasImage && question.imageUrl && (
                <div className="flex justify-center">
                  <div className="max-w-full border border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={question.imageUrl}
                      alt="Question diagram"
                      className="max-w-full h-auto max-h-96 object-contain"
                      onError={(e) => {
                        // Hide image if it fails to load
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Answer Section */}
        {!showSolution ? (
          <div className="space-y-6">
            {question.type === 'multiple-choice' && question.options ? (
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
                        <span className="text-lg leading-relaxed pt-1">{option.text}</span>
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
              <Button
                onClick={handleSubmit}
                disabled={question.type === 'multiple-choice' ? !selectedOption : !openEndedAnswer}
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

            {/* Solution Explanation */}
            {question.solutions && question.solutions.length > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">Explanation</span>
                </div>
                <div className="text-sm text-blue-700">
                  {question.solutions[0].text}
                </div>
              </div>
            )}

            <Button onClick={onNext} className="w-full py-4 text-xl font-semibold" size="lg">
              {questionNumber === totalQuestions ? 'Finish Session' : 'Next Question'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}