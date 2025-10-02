'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit3, Save, X, BookOpen, Lightbulb } from "lucide-react";
import { handleClientResponse, ClientError } from "@/lib/error-handler";

interface Question {
  id: string;
  questionText: string;
  examName: string;
  examYear: number;
  questionNumber: string;
  topic: string;
  difficulty: string;
}

interface Solution {
  id: string;
  questionId: string;
  solutionText: string;
  approach?: string;
  difficulty: string;
  timeEstimate?: number;
  keyInsights?: string;
  commonMistakes?: string;
  alternativeApproaches?: string;
  question: Question;
}

export default function SolutionsManagementPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [editingSolution, setEditingSolution] = useState<Solution | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [examFilter, setExamFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    solutionText: '',
    approach: '',
    difficulty: 'MEDIUM',
    timeEstimate: '',
    keyInsights: '',
    commonMistakes: '',
    alternativeApproaches: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const apiRequest = async (url: string, options?: RequestInit): Promise<any> => {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    return await handleClientResponse(response);
  };

  const handleClientError = (error: unknown): string => {
    if (error instanceof ClientError) {
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unexpected error occurred';
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [questionsResponse, solutionsResponse] = await Promise.all([
        apiRequest('/api/questions'),
        apiRequest('/api/solutions')
      ]);

      const questionsData = questionsResponse.data || questionsResponse;
      const solutionsData = solutionsResponse.data || solutionsResponse;

      setQuestions(questionsData);
      setSolutions(solutionsData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = (question: Question) => {
    setSelectedQuestion(question);
    setIsCreatingNew(true);
    setEditingSolution(null);
    setFormData({
      solutionText: '',
      approach: '',
      difficulty: 'MEDIUM',
      timeEstimate: '',
      keyInsights: '',
      commonMistakes: '',
      alternativeApproaches: ''
    });
  };

  const handleEdit = (solution: Solution) => {
    setSelectedQuestion(solution.question);
    setEditingSolution(solution);
    setIsCreatingNew(false);
    setFormData({
      solutionText: solution.solutionText,
      approach: solution.approach || '',
      difficulty: solution.difficulty,
      timeEstimate: solution.timeEstimate?.toString() || '',
      keyInsights: solution.keyInsights || '',
      commonMistakes: solution.commonMistakes || '',
      alternativeApproaches: solution.alternativeApproaches || ''
    });
  };

  const handleSave = async () => {
    if (!selectedQuestion) return;

    // Validate required fields
    if (!formData.solutionText.trim()) {
      alert('Solution text is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        questionId: selectedQuestion.id,
        solutionText: formData.solutionText.trim(),
        approach: formData.approach.trim() || undefined,
        difficulty: formData.difficulty,
        timeEstimate: formData.timeEstimate ? parseInt(formData.timeEstimate) : undefined,
        keyInsights: formData.keyInsights.trim() || undefined,
        commonMistakes: formData.commonMistakes.trim() || undefined,
        alternativeApproaches: formData.alternativeApproaches.trim() || undefined
      };

      await apiRequest('/api/solutions', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Refresh data
      await fetchData();

      // Reset form
      setSelectedQuestion(null);
      setEditingSolution(null);
      setIsCreatingNew(false);
      setFormData({
        solutionText: '',
        approach: '',
        difficulty: 'MEDIUM',
        timeEstimate: '',
        keyInsights: '',
        commonMistakes: '',
        alternativeApproaches: ''
      });

      alert('Solution saved successfully!');
    } catch (error) {
      alert('Failed to save solution: ' + handleClientError(error));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedQuestion(null);
    setEditingSolution(null);
    setIsCreatingNew(false);
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this solution?')) return;

    try {
      await apiRequest(`/api/solutions?questionId=${questionId}`, {
        method: 'DELETE'
      });

      await fetchData();
      alert('Solution deleted successfully!');
    } catch (error) {
      alert('Failed to delete solution: ' + handleClientError(error));
    }
  };

  // Filter questions and solutions
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         q.questionNumber.includes(searchTerm) ||
                         q.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExam = examFilter === 'all' || q.examName === examFilter;
    return matchesSearch && matchesExam;
  });

  const filteredSolutions = solutions.filter(s => {
    const matchesSearch = s.question.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.question.questionNumber.includes(searchTerm) ||
                         s.question.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExam = examFilter === 'all' || s.question.examName === examFilter;
    return matchesSearch && matchesExam;
  });

  const questionsWithoutSolutions = filteredQuestions.filter(q =>
    !solutions.some(s => s.questionId === q.id)
  );

  const examNames = [...new Set(questions.map(q => q.examName))];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Loading Solutions...</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Solution Management</h1>
        <p className="text-gray-600">Add and manage detailed solutions for questions to help Ayansh when he gets stuck</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search Questions</Label>
              <Input
                id="search"
                placeholder="Search by question text, number, or topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="examFilter">Filter by Exam</Label>
              <Select value={examFilter} onValueChange={setExamFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  {examNames.map(exam => (
                    <SelectItem key={exam} value={exam}>{exam}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{solutions.length}</div>
              <div className="text-sm text-gray-600">Solutions Added</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{questionsWithoutSolutions.length}</div>
              <div className="text-sm text-gray-600">Needs Solutions</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Questions without solutions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Questions Need Solutions ({questionsWithoutSolutions.length})
            </CardTitle>
            <CardDescription>
              Add solutions to help Ayansh when he encounters difficult problems
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            {questionsWithoutSolutions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                All questions have solutions! 🎉
              </p>
            ) : (
              <div className="space-y-3">
                {questionsWithoutSolutions.map((question) => (
                  <div key={question.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2">
                        <Badge variant="outline">{question.examName}</Badge>
                        <Badge variant="secondary">{question.topic}</Badge>
                        <Badge variant={
                          question.difficulty === 'EASY' ? 'default' :
                          question.difficulty === 'MEDIUM' ? 'secondary' : 'destructive'
                        }>
                          {question.difficulty}
                        </Badge>
                      </div>
                      <Badge variant="outline">Q{question.questionNumber}</Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                      {question.questionText}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleCreateNew(question)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Solution
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Existing solutions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Existing Solutions ({filteredSolutions.length})
            </CardTitle>
            <CardDescription>
              Manage and edit existing solutions
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            {filteredSolutions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No solutions found matching your criteria.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredSolutions.map((solution) => (
                  <div key={solution.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2">
                        <Badge variant="outline">{solution.question.examName}</Badge>
                        <Badge variant="secondary">{solution.question.topic}</Badge>
                        <Badge variant="default">Has Solution</Badge>
                      </div>
                      <Badge variant="outline">Q{solution.question.questionNumber}</Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                      {solution.question.questionText}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(solution)}
                        className="flex-1"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(solution.questionId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Solution Editor Modal */}
      {(selectedQuestion && (isCreatingNew || editingSolution)) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                {isCreatingNew ? 'Add Solution' : 'Edit Solution'}
              </CardTitle>
              <CardDescription>
                Question: {selectedQuestion.examName} {selectedQuestion.examYear} - Q{selectedQuestion.questionNumber}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Question Text */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <Label className="font-semibold">Question:</Label>
                <p className="mt-1 text-sm">{selectedQuestion.questionText}</p>
              </div>

              {/* Solution Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="solutionText">Solution Text *</Label>
                  <Textarea
                    id="solutionText"
                    placeholder="Step-by-step solution explanation..."
                    value={formData.solutionText}
                    onChange={(e) => setFormData(prev => ({ ...prev, solutionText: e.target.value }))}
                    rows={6}
                    required
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="approach">Approach</Label>
                    <Input
                      id="approach"
                      placeholder="e.g., Algebraic, Geometric, etc."
                      value={formData.approach}
                      onChange={(e) => setFormData(prev => ({ ...prev, approach: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <Select
                        value={formData.difficulty}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EASY">Easy</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HARD">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeEstimate">Time (minutes)</Label>
                      <Input
                        id="timeEstimate"
                        type="number"
                        placeholder="5"
                        value={formData.timeEstimate}
                        onChange={(e) => setFormData(prev => ({ ...prev, timeEstimate: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyInsights">Key Insights</Label>
                  <Textarea
                    id="keyInsights"
                    placeholder="Important concepts, tricks, or patterns (comma-separated)"
                    value={formData.keyInsights}
                    onChange={(e) => setFormData(prev => ({ ...prev, keyInsights: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commonMistakes">Common Mistakes</Label>
                  <Textarea
                    id="commonMistakes"
                    placeholder="Typical errors students make (comma-separated)"
                    value={formData.commonMistakes}
                    onChange={(e) => setFormData(prev => ({ ...prev, commonMistakes: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alternativeApproaches">Alternative Approaches</Label>
                  <Textarea
                    id="alternativeApproaches"
                    placeholder="Other ways to solve this problem (comma-separated)"
                    value={formData.alternativeApproaches}
                    onChange={(e) => setFormData(prev => ({ ...prev, alternativeApproaches: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving || !formData.solutionText.trim()}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Solution'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}