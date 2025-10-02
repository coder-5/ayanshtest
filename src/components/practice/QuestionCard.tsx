import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, AlertTriangle, Upload, X } from "lucide-react";
import { useState, memo, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { cleanupOptionText, parseLatexAnswers } from "@/utils/textCleanup";
import { PracticeQuestion, Question } from "@/types";
import SolutionVisualizer from "./SolutionVisualizer";
import QuickIssueReport from "@/components/QuickIssueReport";
import DiagramUpload from "@/components/diagrams/DiagramUpload";
import { AdvancedMathRenderer } from "@/components/math/AdvancedMathRenderer";
import { useUserDiagrams } from "@/hooks/useUserDiagrams";
import { QuestionHeader } from "./QuestionHeader";
import { QuestionContent } from "./QuestionContent";

interface QuestionCardProps {
  question: PracticeQuestion;
  questionNumber: number;
  totalQuestions: number;
  timeElapsed: number;
  onAnswer: (answer: string) => void;
  onNext?: () => void;
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
  const [showDiagramUpload, setShowDiagramUpload] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [, setImageLoadError] = useState<boolean>(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [latexInput, setLatexInput] = useState<string>('');
  const [showSolutionManually, setShowSolutionManually] = useState<boolean>(false);

  // Fetch user-uploaded diagrams
  const {
    diagrams,
    loading: diagramsLoading,
    refetch: refetchDiagrams
  } = useUserDiagrams(question.id);

  // Debug logging

  // Determine if this question has been submitted (either internally or externally tracked)
  const questionSubmitted = isSubmitted || isQuestionSubmitted;

  // Reset submission state when question changes
  useEffect(() => {
    setIsSubmitted(false);
    setSelectedOption(userAnswer || '');
    setOpenEndedAnswer(userAnswer || '');
    setImageLoadError(false);
    setShowSolutionManually(false);
  }, [question.id, userAnswer]);

  // Using centralized formatTime utility

  const handleSubmit = useCallback(() => {
    if (questionSubmitted) return;

    const answer = selectedOption || openEndedAnswer;
    setIsSubmitted(true);
    onAnswer(answer);
  }, [questionSubmitted, selectedOption, openEndedAnswer, onAnswer]);

  const handleDiagramUploadSuccess = useCallback(() => {
    setShowDiagramUpload(false);
    refetchDiagrams();
  }, [refetchDiagrams]);

  const getCorrectAnswer = useMemo(() => {
    if (question.options && question.options.length > 0) {
      const correctOption = question.options.find(opt => opt.isCorrect);
      return correctOption?.label || (correctOption as any)?.optionLetter || '';
    }
    return question.solution?.solutionText || '';
  }, [question.options, question.solution?.solutionText]);

  const isCorrect = () => {
    // Normalize both values for comparison
    const normalizeValue = (value: any): string => {
      if (value == null) return '';
      let normalized = String(value).trim().toLowerCase();
      // Remove "Answer: " prefix if it exists
      normalized = normalized.replace(/^answer:\s*/i, '');
      return normalized;
    };

    if (question.options && question.options.length > 0) {
      // Multiple choice question
      const correctOption = question.options?.find(opt => opt.isCorrect);
      const correctValue = correctOption?.label || (correctOption as any)?.optionLetter;

      const normalizedUserAnswer = normalizeValue(userAnswer);
      const normalizedCorrectValue = normalizeValue(correctValue);


      return normalizedUserAnswer === normalizedCorrectValue;
    } else if (question.solution?.solutionText) {
      // Text/numerical question - check against solution text
      const normalizedUserAnswer = normalizeValue(userAnswer);
      const normalizedCorrectAnswer = normalizeValue(question.solution.solutionText);


      return normalizedUserAnswer === normalizedCorrectAnswer;
    }

    return false; // No correct answer available
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <QuestionHeader
          questionNumber={questionNumber}
          totalQuestions={totalQuestions}
          timeElapsed={timeElapsed}
          examName={question.examName}
          difficulty={question.difficulty}
          topic={question.topic}
        />
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
                      difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD'
                    })}
                    className="w-full p-2 border border-gray-200 rounded-md"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
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
                        <Image
                          src={editedQuestion.imageUrl}
                          alt="Preview"
                          width={0}
                          height={0}
                          sizes="(max-width: 300px) 100vw, 300px"
                          className="w-auto h-auto max-w-xs object-contain border border-gray-200 rounded cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ width: 'auto', height: 'auto', maxWidth: '300px' }}
                          onClick={() => setFullScreenImage(editedQuestion.imageUrl!)}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Diagram Upload Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Diagram Management:
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDiagramUpload(true)}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload/Replace Diagram
                  </Button>
                </div>
                <p className="text-xs text-gray-600">
                  Upload a diagram if this question needs visual aids or replace existing diagrams.
                </p>
              </div>

              {/* Answer Options Editing Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Answer Options:
                  </label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newOptions = [...(editedQuestion.options || [])];
                        const nextLetter = String.fromCharCode(65 + newOptions.length); // A, B, C, D, etc.
                        newOptions.push({
                          id: `temp-${Date.now()}`,
                          questionId: editedQuestion.id,
                          optionLetter: nextLetter,
                          optionText: '',
                          isCorrect: false
                        });
                        onQuestionEdit && onQuestionEdit({
                          ...editedQuestion,
                          options: newOptions
                        });
                      }}
                      className="text-xs"
                    >
                      Add Option
                    </Button>
                  </div>
                </div>

                {/* LaTeX Answer Parser */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="text-sm font-medium text-blue-700 mb-2 block">
                    Quick Fill from LaTeX Format:
                  </label>
                  <Textarea
                    placeholder="Paste LaTeX answers like: $\textbf{(A)}\ 40 \qquad \textbf{(B)}\ 50 \qquad \textbf{(C)}\ 60 \qquad \textbf{(D)}\ 75 \qquad \textbf{(E)}\ 80$"
                    className="mb-2 bg-white"
                    rows={2}
                    value={latexInput}
                    onChange={(e) => setLatexInput(e.target.value)}
                  />

                  {latexInput.trim() && (() => {
                    const parsedOptions = parseLatexAnswers(latexInput);
                    return parsedOptions.length > 0 ? (
                      <div className="mt-3 p-3 bg-white border border-blue-300 rounded">
                        <div className="text-sm font-medium text-blue-700 mb-2">Preview parsed options:</div>
                        <div className="space-y-1 mb-3">
                          {parsedOptions.map((opt, index) => (
                            <div key={index} className="text-sm text-gray-700">
                              <span className="font-medium text-blue-600">({opt.letter})</span> {opt.text}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              const newOptions = parsedOptions.map((opt, index) => ({
                                id: `temp-${Date.now()}-${index}`,
                                questionId: editedQuestion.id,
                                optionLetter: opt.letter,
                                optionText: opt.text,
                                isCorrect: false
                              }));
                              onQuestionEdit && onQuestionEdit({
                                ...editedQuestion,
                                options: newOptions
                              });
                              setLatexInput('');
                            }}
                            className="text-xs"
                          >
                            Apply These Options
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setLatexInput('')}
                            className="text-xs"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : latexInput.includes('textbf') ? (
                      <div className="mt-2 text-xs text-red-600">
                        Could not parse the LaTeX format. Please check the format.
                      </div>
                    ) : null;
                  })()}

                  <p className="text-xs text-blue-600 mt-2">
                    Paste LaTeX answer format above to preview, then click &quot;Apply&quot; to fill in the options.
                  </p>
                </div>

                <div className="space-y-3">
                  {(editedQuestion.options || []).map((option, index) => (
                    <div key={option.id || index} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full border-2 border-gray-400 flex items-center justify-center text-sm font-bold bg-white">
                            {option.optionLetter}
                          </div>
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={option.isCorrect}
                            onChange={() => {
                              // Only one option can be correct
                              const updatedOptions = editedQuestion.options?.map((opt, i) => ({
                                ...opt,
                                isCorrect: i === index
                              })) || [];
                              onQuestionEdit && onQuestionEdit({
                                ...editedQuestion,
                                options: updatedOptions
                              });
                            }}
                            className="w-4 h-4 text-green-600"
                          />
                          <label className="text-xs text-gray-600">Correct</label>
                        </div>
                        <Input
                          value={option.optionText}
                          onChange={(e) => {
                            const updatedOptions = editedQuestion.options?.map((opt, i) =>
                              i === index ? {
                                ...opt,
                                optionText: e.target.value,
                                text: e.target.value  // Keep both formats for compatibility
                              } : opt
                            ) || [];
                            onQuestionEdit && onQuestionEdit({
                              ...editedQuestion,
                              options: updatedOptions
                            });
                          }}
                          placeholder={`Option ${option.optionLetter} text...`}
                          className="flex-1"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const updatedOptions = editedQuestion.options?.filter((_, i) => i !== index) || [];
                          // Re-label remaining options
                          const relabeledOptions = updatedOptions.map((opt, i) => ({
                            ...opt,
                            optionLetter: String.fromCharCode(65 + i),
                            label: String.fromCharCode(65 + i)  // Keep both formats for compatibility
                          }));
                          onQuestionEdit && onQuestionEdit({
                            ...editedQuestion,
                            options: relabeledOptions
                          });
                        }}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {(!editedQuestion.options || editedQuestion.options.length === 0) && (
                    <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      No answer options. Click &quot;Add Option&quot; to create multiple choice answers.
                    </div>
                  )}
                </div>
              </div>

              {/* Correct Answer Section for Text/Open-ended Questions */}
              {(!editedQuestion.options || editedQuestion.options.length === 0) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <label className="text-sm font-medium text-green-700 mb-2 block">
                    Correct Answer (for text/numerical questions):
                  </label>
                  <Input
                    value={editedQuestion.solution?.solutionText || ''}
                    onChange={(e) => {
                      const updatedSolution = {
                        ...editedQuestion.solution,
                        id: editedQuestion.solution?.id || `solution-${editedQuestion.id}`,
                        questionId: editedQuestion.id,
                        solutionText: e.target.value,
                        difficulty: editedQuestion.difficulty,
                        approach: editedQuestion.solution?.approach || null,
                        timeEstimate: editedQuestion.solution?.timeEstimate || null,
                        keyInsights: editedQuestion.solution?.keyInsights || null,
                        commonMistakes: editedQuestion.solution?.commonMistakes || null,
                        alternativeApproaches: editedQuestion.solution?.alternativeApproaches || null,
                        successRate: editedQuestion.solution?.successRate || null,
                        createdAt: editedQuestion.solution?.createdAt || new Date(),
                        updatedAt: editedQuestion.solution?.updatedAt || new Date()
                      };
                      onQuestionEdit && onQuestionEdit({
                        ...editedQuestion,
                        solution: updatedSolution
                      });
                    }}
                    placeholder="Enter the correct answer (e.g., 42, 3.14, π, etc.)"
                    className="bg-white"
                  />
                  <p className="text-xs text-green-600 mt-1">
                    This will be used to validate answers for text/numerical questions.
                    For multiple choice questions, mark the correct option above instead.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <QuestionContent
              question={question}
              diagrams={diagrams}
              diagramsLoading={diagramsLoading}
              onImageError={setImageLoadError}
              onFullScreenImage={setFullScreenImage}
            />
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
        {!questionSubmitted ? (
          <div className="space-y-4">
            {question.options && question.options.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-base font-medium text-gray-800 mb-3">Choose your answer:</h4>
                <div className="grid grid-cols-2 gap-3">
                  {question.options.sort((a, b) => (a.label || '').localeCompare(b.label || '')).map((option) => (
                    <div
                      key={option.id}
                      className={`p-3 border-2 rounded-lg transition-all duration-200 cursor-pointer hover:border-gray-400 hover:shadow-sm ${
                        selectedOption === option.label
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-300'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedOption(option.label);
                      }}
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
                          <AdvancedMathRenderer
                            expression={cleanupOptionText(option.text)}
                            config={{ displayMode: false, interactive: false }}
                          />
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
                  onChange={(e) => {
                    e.stopPropagation();
                    setOpenEndedAnswer(e.target.value);
                  }}
                  placeholder="Enter your numerical answer..."
                  className="text-base p-3"
                />
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <div className="space-y-2">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSubmit();
                  }}
                  disabled={question.options && question.options.length > 0 ? !selectedOption : !openEndedAnswer}
                  className="w-full py-3 text-lg font-semibold"
                  size="lg"
                >
                  Submit Answer
                </Button>

                {/* Help/Hint button for when Ayansh gets stuck - Always show if solution exists */}
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowSolutionManually(true);
                  }}
                  variant="outline"
                  className="w-full py-2 text-base font-medium border-yellow-300 text-yellow-600 hover:bg-yellow-50 cursor-pointer"
                  size="lg"
                  style={{ pointerEvents: 'auto' }}
                  disabled={!question.solution}
                >
                  {question.solution ? '🤔 Need Help? Show Solution' : '❌ No Solution Available'}
                </Button>
              </div>
            </div>
          </div>
        ) : !showSolutionManually ? (
          /* Simple feedback after submission */
          <div className="space-y-4">
            {/* Answer Status Header */}
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
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              {question.solution && (
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowSolutionManually(true);
                  }}
                  variant="outline"
                  className="w-full py-2 text-base font-medium border-blue-300 text-blue-600 hover:bg-blue-50"
                  size="lg"
                >
                  💡 Show Detailed Solution
                </Button>
              )}

              {!isCorrect() && (
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowSolutionManually(true);
                  }}
                  variant="outline"
                  className="w-full py-2 text-base font-medium border-green-300 text-green-600 hover:bg-green-50"
                  size="lg"
                >
                  ✓ Show Correct Answer
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Solution Section */
          <div className="space-y-4">
            {/* Answer Review Section */}
            <div className="space-y-4">
              {/* Answer Status Header */}
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
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-700">
                      💡 Click &quot;Show Detailed Solution&quot; below to see the correct answer and explanation.
                    </p>
                  </div>
                )}
              </div>

              {/* Answer Choices Review - Show all options with indicators */}
              {question.options && question.options.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-base font-medium text-gray-800">Answer Choices:</h4>
                  <div className="space-y-2">
                    {question.options.sort((a, b) => (a.label || '').localeCompare(b.label || '')).map((option) => {
                      const normalizeValue = (value: any): string => {
                        if (value == null) return '';
                        return String(value).trim().toLowerCase();
                      };
                      const isUserChoice = normalizeValue(userAnswer) === normalizeValue(option.label || (option as any).optionLetter);
                      const isCorrectChoice = option.isCorrect;

                      let bgColor = 'bg-gray-50';
                      let borderColor = 'border-gray-300';
                      let textColor = 'text-gray-700';

                      if (isCorrectChoice) {
                        bgColor = 'bg-green-100';
                        borderColor = 'border-green-400';
                        textColor = 'text-green-800';
                      } else if (isUserChoice && !isCorrectChoice) {
                        bgColor = 'bg-red-100';
                        borderColor = 'border-red-400';
                        textColor = 'text-red-800';
                      }

                      return (
                        <div
                          key={option.id}
                          className={`p-3 border-2 rounded-lg ${bgColor} ${borderColor}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                              isCorrectChoice
                                ? 'border-green-500 bg-green-500 text-white'
                                : isUserChoice
                                ? 'border-red-500 bg-red-500 text-white'
                                : 'border-gray-400 text-gray-600 bg-white'
                            }`}>
                              {option.label}
                            </div>
                            <div className="flex-1">
                              <span className={`text-base leading-relaxed ${textColor}`}>
                                <AdvancedMathRenderer
                            expression={cleanupOptionText(option.text)}
                            config={{ displayMode: false, interactive: false }}
                          />
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                {isCorrectChoice && (
                                  <Badge variant="default" className="bg-green-600 text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Correct Answer
                                  </Badge>
                                )}
                                {isUserChoice && !isCorrectChoice && (
                                  <Badge variant="destructive" className="text-xs">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Your Choice
                                  </Badge>
                                )}
                                {isUserChoice && isCorrectChoice && (
                                  <Badge variant="default" className="bg-green-600 text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Your Correct Choice
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
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

            {/* Show correct answer for incorrect responses */}
            {!isCorrect() && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  ✓ Correct Answer
                </h4>
                <p className="text-green-700">
                  <strong>{getCorrectAnswer}</strong>
                </p>
              </div>
            )}

            {/* Enhanced Solution Visualization */}
            {question.solution && (
              <SolutionVisualizer
                solution={{
                  solutionText: question.solution.solutionText,
                  approach: question.solution.approach || '',
                  keyInsights: question.solution.keyInsights || '',
                  timeEstimate: question.solution.timeEstimate || 0,
                  commonMistakes: question.solution.commonMistakes || '',
                  alternativeApproaches: question.solution.alternativeApproaches || ''
                }}
                questionText={question.text || ''}
                className="mt-4"
              />
            )}

            {/* Hide Solution Button */}
            <div className="flex justify-center">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowSolutionManually(false);
                }}
                variant="outline"
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
                size="sm"
              >
                Hide Solution
              </Button>
            </div>

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

      {/* Full Screen Image Modal */}
      {fullScreenImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setFullScreenImage(null)}
        >
          <div className="max-w-full max-h-full overflow-auto">
            <Image
              src={fullScreenImage}
              alt="Full size image"
              width={0}
              height={0}
              sizes="100vw"
              className="w-auto h-auto max-w-full max-h-full object-contain"
              style={{ width: 'auto', height: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <button
            onClick={() => setFullScreenImage(null)}
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 transition-colors"
            aria-label="Close full screen view"
          >
            ✕
          </button>
        </div>
      )}

      {/* Diagram Upload Modal */}
      {showDiagramUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <DiagramUpload
            questionId={question.id}
            userId="ayansh"
            onUploadSuccess={handleDiagramUploadSuccess}
            onClose={() => setShowDiagramUpload(false)}
          />
        </div>
      )}
    </Card>
  );
});

export { QuestionCard };