'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, BookOpen, Calendar, Star, Download } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useAsyncState } from "@/hooks/useAsyncState";

interface Question {
  id: string;
  questionText: string;
  examName: string | null;
  examYear: number | null;
  questionNumber: string | null;
  difficulty: string;
  topic: string;
  timeLimit: number | null;
  createdAt: Date;
  solution?: {
    id: string;
    solutionText: string;
  } | null;
  attempts: {
    isCorrect: boolean;
  }[];
}

interface LibraryData {
  totalQuestions: number;
  competitionStats: {
    examName: string;
    _count: {
      examName: number;
    };
  }[];
  competitionNames: string[];
  topicList: string[];
  recentQuestions: Question[];
}

function getDifficultyBadge(difficulty: string) {
  const difficultyColors = {
    'EASY': 'default',
    'MEDIUM': 'secondary',
    'HARD': 'destructive'
  } as const;

  return difficultyColors[difficulty as keyof typeof difficultyColors] || 'outline';
}

function truncateText(text: string, maxLength: number = 100) {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function calculateSuccessRate(attempts: { isCorrect: boolean }[]) {
  if (attempts.length === 0) return 'N/A';
  const correct = attempts.filter(a => a.isCorrect).length;
  return Math.round((correct / attempts.length) * 100) + '%';
}

export default function LibraryPage() {
  const libraryDataState = useAsyncState<LibraryData>({
    totalQuestions: 0,
    competitionStats: [],
    competitionNames: [],
    topicList: [],
    recentQuestions: []
  });
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompetition, setSelectedCompetition] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchLibraryData = useCallback(async () => {
    await libraryDataState.execute(async () => {
      const response = await fetch('/api/library');
      if (!response.ok) {
        throw new Error('Failed to fetch library data');
      }
      const data = await response.json();
      return data;
    });
  }, [libraryDataState]);

  useEffect(() => {
    fetchLibraryData();
  }, [fetchLibraryData]);

  const applyFilters = useCallback(() => {
    let filtered = [...(libraryDataState.data?.recentQuestions || [])];

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(question =>
        question.questionText.toLowerCase().includes(search) ||
        question.topic.toLowerCase().includes(search) ||
        (question.examName && question.examName.toLowerCase().includes(search))
      );
    }

    // Competition filter
    if (selectedCompetition !== 'all') {
      filtered = filtered.filter(question =>
        question.examName && question.examName.toLowerCase().replace(/\s+/g, '-') === selectedCompetition
      );
    }

    // Topic filter
    if (selectedTopic !== 'all') {
      filtered = filtered.filter(question =>
        question.topic.toLowerCase().replace(/\s+/g, '-') === selectedTopic
      );
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(question =>
        question.difficulty === selectedDifficulty
      );
    }

    setFilteredQuestions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [libraryDataState.data?.recentQuestions, searchTerm, selectedCompetition, selectedTopic, selectedDifficulty]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCompetition('all');
    setSelectedTopic('all');
    setSelectedDifficulty('all');
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentQuestions = filteredQuestions.slice(startIndex, endIndex);

  if (libraryDataState.loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Problem Library 📚
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Browse and search through your collection of math competition problems
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Search & Filter
          </CardTitle>
          <CardDescription>
            Find specific problems or browse by topic and difficulty
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search problems by keyword, topic, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
              <SelectTrigger>
                <SelectValue placeholder="Competition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Competitions</SelectItem>
                {libraryDataState.data?.competitionNames?.filter(competition => competition && competition.trim()).map((competition) => {
                  const value = competition.toLowerCase().replace(/\s+/g, '-');
                  return (
                    <SelectItem key={competition} value={value || `comp-${Date.now()}`}>
                      {competition}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger>
                <SelectValue placeholder="Topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {libraryDataState.data?.topicList?.filter(topic => topic && topic.trim()).map((topic) => {
                  const value = topic.toLowerCase().replace(/\s+/g, '-');
                  return (
                    <SelectItem key={topic} value={value || `topic-${Date.now()}`}>
                      {topic}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button size="sm" onClick={applyFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
            <Button variant="outline" size="sm" onClick={clearFilters}>Clear All</Button>
            <div className="text-sm text-gray-600 flex items-center ml-4">
              Showing {filteredQuestions.length} of {libraryDataState.data?.totalQuestions || 0} problems
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Library Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-blue-600">
              {libraryDataState.data?.totalQuestions?.toLocaleString() || '0'}
            </CardTitle>
            <CardDescription>Total Problems</CardDescription>
          </CardHeader>
        </Card>
        {libraryDataState.data?.competitionStats?.slice(0, 3).map((stat, index) => {
          const colors = ['text-green-600', 'text-red-600', 'text-orange-600'];
          return (
            <Card key={stat.examName}>
              <CardHeader className="text-center">
                <CardTitle className={`text-2xl font-bold ${colors[index] || 'text-purple-600'}`}>
                  {stat._count?.examName?.toLocaleString() || '0'}
                </CardTitle>
                <CardDescription>{stat.examName} Problems</CardDescription>
              </CardHeader>
            </Card>
          );
        }) || []}
      </div>

      {/* Additional Stats Row */}
      {(libraryDataState.data?.competitionStats?.length || 0) > 3 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {libraryDataState.data?.competitionStats?.slice(3, 7).map((stat, index) => {
            const colors = ['text-purple-600', 'text-indigo-600', 'text-pink-600', 'text-cyan-600'];
            return (
              <Card key={stat.examName}>
                <CardHeader className="text-center">
                  <CardTitle className={`text-2xl font-bold ${colors[index] || 'text-gray-600'}`}>
                    {stat._count?.examName?.toLocaleString() || '0'}
                  </CardTitle>
                  <CardDescription>{stat.examName} Problems</CardDescription>
                </CardHeader>
              </Card>
            );
          }) || []}
          {(libraryDataState.data?.competitionStats?.length || 0) <= 6 && (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-lg font-semibold text-gray-600">
                  Updated Automatically
                </CardTitle>
                <CardDescription>Counts refresh with new questions</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      )}

      {/* Recent Uploads */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Recently Added
          </CardTitle>
          <CardDescription>
            Your latest problem sets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(libraryDataState.data?.recentQuestions?.length || 0) > 0 ? (
            <div className="space-y-3">
              {libraryDataState.data?.recentQuestions?.slice(0, 5).map((question) => (
                <div key={question.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {question.examName && <Badge variant="secondary">{question.examName}</Badge>}
                    <Badge variant="outline">{question.topic}</Badge>
                    <span className="text-sm text-gray-600">
                      {question.examYear ? `${question.examYear}` : 'Unknown Year'}
                      {question.questionNumber ? ` #${question.questionNumber}` : ''}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(question.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No problems available yet</p>
              <p className="text-sm">Start with quick practice to see recent questions</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Problem Collection */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Problem Collection</CardTitle>
          <CardDescription>
            Browse all problems in your library ({filteredQuestions.length} filtered, {libraryDataState.data?.totalQuestions || 0} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentQuestions.length > 0 ? (
            <div className="space-y-4">
              {currentQuestions.map((question) => (
                <div key={question.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>{question.examName}</Badge>
                        <Badge variant="secondary">{question.topic}</Badge>
                        <Badge variant={getDifficultyBadge(question.difficulty)}>
                          {question.difficulty}
                        </Badge>
                      </div>
                      <h3 className="font-medium mb-2">
                        {question.examName} {question.examYear}
                        {question.questionNumber ? ` #${question.questionNumber}` : ` Problem`}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {truncateText(question.questionText)}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>• From: {question.examName} {question.examYear}</span>
                        <span>• Topic: {question.topic}</span>
                        <span>• Success Rate: {calculateSuccessRate(question.attempts)}</span>
                        {question.timeLimit && (
                          <span>• Time Limit: {question.timeLimit}min</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/practice/quick">Practice</Link>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Star className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {filteredQuestions.length === 0 && (libraryDataState.data?.totalQuestions || 0) > 0
                  ? 'No matching problems found'
                  : 'No Problems Yet'
                }
              </h3>
              <p className="text-sm mb-4">
                {filteredQuestions.length === 0 && (libraryDataState.data?.totalQuestions || 0) > 0
                  ? 'Try adjusting your filters or search terms'
                  : 'Start practicing to see your question library grow with sample problems'
                }
              </p>
              {filteredQuestions.length === 0 && (libraryDataState.data?.totalQuestions || 0) > 0 ? (
                <Button onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/practice/quick">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Start Practice
                  </Link>
                </Button>
              )}
            </div>
          )}

          {/* Pagination - only show if there are questions */}
          {filteredQuestions.length > 0 && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Manage your problem library
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" asChild>
              <a href="/api/export-library" download>
                <Download className="h-4 w-4 mr-2" />
                Export Library
              </a>
            </Button>
            <Button asChild>
              <Link href="/practice">
                Start Practice Session
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-8 text-center">
        <Button variant="ghost" asChild>
          <Link href="/">← Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}