"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, X, CheckCircle, AlertCircle, Plus, Lightbulb } from "lucide-react";
import { Question } from "@/types";

interface QuestionEditorProps {
  question: Question;
  onSave?: (question: Question) => void;
  onCancel?: () => void;
}

export function QuestionEditor({ question, onSave, onCancel }: QuestionEditorProps) {
  const [editedQuestion, setEditedQuestion] = useState<Question>(question);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaveStatus('idle');

    try {
      // Save the question first
      const response = await fetch(`/api/questions/${question.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedQuestion),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save question');
      }

      const savedQuestion = await response.json();

      // Save the solution separately if it exists
      if (editedQuestion.solution && editedQuestion.solution.solutionText.trim()) {
        const solutionPayload = {
          questionId: editedQuestion.id,
          solutionText: editedQuestion.solution.solutionText,
          approach: editedQuestion.solution.approach || undefined,
          difficulty: editedQuestion.solution.difficulty || 'MEDIUM',
          timeEstimate: editedQuestion.solution.timeEstimate || undefined,
          keyInsights: editedQuestion.solution.keyInsights || undefined,
          commonMistakes: editedQuestion.solution.commonMistakes || undefined,
          alternativeApproaches: editedQuestion.solution.alternativeApproaches || undefined
        };

        const solutionResponse = await fetch('/api/solutions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(solutionPayload),
        });

        if (!solutionResponse.ok) {
          // Failed to save solution but question was saved successfully
          // Silently continue
        }
      }

      setSaveStatus('success');
      onSave?.(savedQuestion);

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const updateQuestion = (field: keyof Question, value: any) => {
    setEditedQuestion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateOption = (index: number, field: string, value: any) => {
    const updatedOptions = [...(editedQuestion.options || [])];
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: value
    };
    updateQuestion('options', updatedOptions);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Edit Question</span>
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              disabled={saving}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Save Status */}
        {saveStatus === 'success' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Question saved successfully!
            </AlertDescription>
          </Alert>
        )}

        {saveStatus === 'error' && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Question Text */}
        <div className="space-y-2">
          <Label htmlFor="questionText">Question Text</Label>
          <Textarea
            id="questionText"
            value={editedQuestion.questionText}
            onChange={(e) => updateQuestion('questionText', e.target.value)}
            className="min-h-32"
            placeholder="Enter the question text (LaTeX supported)"
          />
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="examName">Exam</Label>
            <Input
              id="examName"
              value={editedQuestion.examName || ''}
              onChange={(e) => updateQuestion('examName', e.target.value)}
              placeholder="AMC8, MOEMS, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="examYear">Year</Label>
            <Input
              id="examYear"
              type="number"
              value={editedQuestion.examYear || ''}
              onChange={(e) => updateQuestion('examYear', parseInt(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              value={editedQuestion.topic}
              onChange={(e) => updateQuestion('topic', e.target.value)}
              placeholder="Algebra, Geometry, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Input
              id="difficulty"
              value={editedQuestion.difficulty}
              onChange={(e) => updateQuestion('difficulty', e.target.value)}
              placeholder="easy, medium, hard"
            />
          </div>
        </div>

        {/* Answer Options */}
        <div className="space-y-4">
          <Label>Answer Options</Label>
          {editedQuestion.options?.map((option, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                value={option.optionLetter || ''}
                onChange={(e) => updateOption(index, 'optionLetter', e.target.value)}
                className="w-16"
                placeholder="A"
              />
              <Textarea
                value={option.optionText || ''}
                onChange={(e) => updateOption(index, 'optionText', e.target.value)}
                className="flex-1 min-h-12"
                placeholder="Option text"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={option.isCorrect}
                  onChange={(e) => updateOption(index, 'isCorrect', e.target.checked)}
                />
                Correct
              </label>
            </div>
          ))}
        </div>

        {/* Solution Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Detailed Solution
            </Label>
            {!editedQuestion.solution && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => updateQuestion('solution', {
                  id: `solution-${editedQuestion.id}`,
                  questionId: editedQuestion.id,
                  solutionText: '',
                  approach: '',
                  difficulty: 'MEDIUM',
                  timeEstimate: null,
                  keyInsights: '',
                  commonMistakes: '',
                  alternativeApproaches: '',
                  successRate: null,
                  createdAt: new Date(),
                  updatedAt: new Date()
                })}
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Solution
              </Button>
            )}
          </div>

          {editedQuestion.solution && (
            <div className="space-y-4 p-4 border border-blue-200 rounded-lg bg-blue-50/50">
              {/* Solution Text */}
              <div className="space-y-2">
                <Label htmlFor="solutionText">Solution Text *</Label>
                <Textarea
                  id="solutionText"
                  value={editedQuestion.solution.solutionText || ''}
                  onChange={(e) => updateQuestion('solution', {
                    ...editedQuestion.solution,
                    solutionText: e.target.value
                  })}
                  className="min-h-32 bg-white"
                  placeholder="Step-by-step solution explanation (LaTeX supported)"
                />
              </div>

              {/* Approach and Time Estimate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="approach">Approach</Label>
                  <Input
                    id="approach"
                    value={editedQuestion.solution.approach || ''}
                    onChange={(e) => updateQuestion('solution', {
                      ...editedQuestion.solution,
                      approach: e.target.value
                    })}
                    placeholder="e.g., Algebraic, Geometric, etc."
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeEstimate">Time Estimate (minutes)</Label>
                  <Input
                    id="timeEstimate"
                    type="number"
                    value={editedQuestion.solution.timeEstimate || ''}
                    onChange={(e) => updateQuestion('solution', {
                      ...editedQuestion.solution,
                      timeEstimate: e.target.value ? parseInt(e.target.value) : null
                    })}
                    placeholder="5"
                    className="bg-white"
                  />
                </div>
              </div>

              {/* Solution Difficulty */}
              <div className="space-y-2">
                <Label htmlFor="solutionDifficulty">Solution Difficulty</Label>
                <select
                  id="solutionDifficulty"
                  value={editedQuestion.solution.difficulty || 'MEDIUM'}
                  onChange={(e) => updateQuestion('solution', {
                    ...editedQuestion.solution,
                    difficulty: e.target.value
                  })}
                  className="w-full p-2 border border-gray-200 rounded-md bg-white"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>

              {/* Key Insights */}
              <div className="space-y-2">
                <Label htmlFor="keyInsights">Key Insights</Label>
                <Textarea
                  id="keyInsights"
                  value={editedQuestion.solution.keyInsights || ''}
                  onChange={(e) => updateQuestion('solution', {
                    ...editedQuestion.solution,
                    keyInsights: e.target.value
                  })}
                  className="min-h-20 bg-white"
                  placeholder="Important concepts, tricks, or patterns to remember..."
                />
              </div>

              {/* Common Mistakes */}
              <div className="space-y-2">
                <Label htmlFor="commonMistakes">Common Mistakes</Label>
                <Textarea
                  id="commonMistakes"
                  value={editedQuestion.solution.commonMistakes || ''}
                  onChange={(e) => updateQuestion('solution', {
                    ...editedQuestion.solution,
                    commonMistakes: e.target.value
                  })}
                  className="min-h-20 bg-white"
                  placeholder="Typical errors students make on this problem..."
                />
              </div>

              {/* Alternative Approaches */}
              <div className="space-y-2">
                <Label htmlFor="alternativeApproaches">Alternative Approaches</Label>
                <Textarea
                  id="alternativeApproaches"
                  value={editedQuestion.solution.alternativeApproaches || ''}
                  onChange={(e) => updateQuestion('solution', {
                    ...editedQuestion.solution,
                    alternativeApproaches: e.target.value
                  })}
                  className="min-h-20 bg-white"
                  placeholder="Other ways to solve this problem..."
                />
              </div>

              {/* Remove Solution Button */}
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateQuestion('solution', null)}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove Solution
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}