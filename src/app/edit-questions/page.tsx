"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, ArrowLeft } from "lucide-react";
import { Question } from "@/types";
import { QuestionEditor } from "@/components/QuestionEditor";

export default function EditQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/questions');
      const data = await response.json();
      const questionsData = data.questions || [];

      // Fetch solutions for each question
      const questionsWithSolutions = await Promise.all(
        questionsData.map(async (q: Question) => {
          try {
            const solutionResponse = await fetch(`/api/solutions?questionId=${q.id}`);
            if (solutionResponse.ok) {
              const solutionData = await solutionResponse.json();
              return {
                ...q,
                solution: solutionData.data || solutionData
              };
            }
          } catch (error) {
            // No solution found, that's okay
          }
          return q;
        })
      );

      setQuestions(questionsWithSolutions);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter(q =>
    q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.examName && q.examName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    q.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleQuestionSaved = (updatedQuestion: Question) => {
    setQuestions(prev => prev.map(q =>
      q.id === updatedQuestion.id ? updatedQuestion : q
    ));
    setSelectedQuestion(null);
  };

  if (selectedQuestion) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Button
            onClick={() => setSelectedQuestion(null)}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Questions
          </Button>
        </div>
        <QuestionEditor
          question={selectedQuestion}
          onSave={handleQuestionSaved}
          onCancel={() => setSelectedQuestion(null)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Questions</CardTitle>
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search questions by text, exam, or topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading questions...</div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No questions found matching your search.
                </div>
              ) : (
                filteredQuestions.map((question) => (
                  <Card key={question.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex gap-2 mb-2">
                            <Badge variant="secondary">{question.examName}</Badge>
                            <Badge variant="outline">{question.examYear}</Badge>
                            <Badge variant="outline">{question.topic}</Badge>
                            <Badge variant="outline">{question.difficulty}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {question.questionText.length > 150
                              ? question.questionText.substring(0, 150) + '...'
                              : question.questionText
                            }
                          </p>
                          <div className="mt-2 text-xs text-gray-500">
                            ID: {question.id}
                          </div>
                        </div>
                        <Button
                          onClick={() => setSelectedQuestion(question)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}