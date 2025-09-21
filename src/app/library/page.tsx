import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, BookOpen, Calendar, Star, Download } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getLibraryData() {
  try {
    const [totalQuestions, competitionStats, topicList, recentQuestions] = await Promise.all([
      prisma.question.count(),
      prisma.question.groupBy({
        by: ['examName'],
        _count: {
          examName: true
        },
        orderBy: {
          _count: {
            examName: 'desc'
          }
        }
      }),
      prisma.question.findMany({
        select: {
          topic: true
        },
        distinct: ['topic'],
        orderBy: {
          topic: 'asc'
        }
      }),
      prisma.question.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          solution: true,
          attempts: {
            select: {
              isCorrect: true
            }
          }
        }
      })
    ]);

    // Get all unique competition names
    const competitionNames = await prisma.question.findMany({
      select: {
        examName: true
      },
      distinct: ['examName'],
      orderBy: {
        examName: 'asc'
      }
    });

    return {
      totalQuestions,
      competitionStats,
      competitionNames: competitionNames.map(c => c.examName),
      topicList: topicList.map(t => t.topic),
      recentQuestions
    };
  } catch (error) {
    console.error('Error fetching library data:', error);
    return {
      totalQuestions: 0,
      competitionStats: [],
      competitionNames: [],
      topicList: [],
      recentQuestions: []
    };
  }
}

function getDifficultyBadge(difficulty: string) {
  const difficultyColors = {
    'easy': 'default',
    'medium': 'secondary',
    'hard': 'destructive'
  } as const;

  return difficultyColors[difficulty.toLowerCase() as keyof typeof difficultyColors] || 'outline';
}

function truncateText(text: string, maxLength: number = 100) {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function calculateSuccessRate(attempts: { isCorrect: boolean }[]) {
  if (attempts.length === 0) return 'N/A';
  const correct = attempts.filter(a => a.isCorrect).length;
  return Math.round((correct / attempts.length) * 100) + '%';
}

export default async function LibraryPage() {
  const libraryData = await getLibraryData();

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search problems by keyword, topic, or content..."
                className="w-full"
              />
            </div>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Competition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Competitions</SelectItem>
                {libraryData.competitionNames?.map((competition) => (
                  <SelectItem key={competition} value={competition.toLowerCase().replace(/\s+/g, '-')}>
                    {competition}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {libraryData.topicList?.map((topic) => (
                  <SelectItem key={topic} value={topic.toLowerCase().replace(/\s+/g, '-')}>
                    {topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
            <Button variant="outline" size="sm">Clear All</Button>
          </div>
        </CardContent>
      </Card>

      {/* Library Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-blue-600">
              {libraryData.totalQuestions.toLocaleString()}
            </CardTitle>
            <CardDescription>Total Problems</CardDescription>
          </CardHeader>
        </Card>
        {libraryData.competitionStats?.slice(0, 3).map((stat, index) => {
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
      {(libraryData.competitionStats?.length || 0) > 3 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {libraryData.competitionStats?.slice(3, 7).map((stat, index) => {
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
          {(libraryData.competitionStats?.length || 0) <= 6 && (
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
          {libraryData.recentQuestions.length > 0 ? (
            <div className="space-y-3">
              {libraryData.recentQuestions.slice(0, 5).map((question) => (
                <div key={question.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{question.examName}</Badge>
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
            Browse all problems in your library ({libraryData.totalQuestions} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {libraryData.recentQuestions.length > 0 ? (
            <div className="space-y-4">
              {libraryData.recentQuestions.map((question) => (
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
              <h3 className="text-lg font-medium mb-2">No Problems Yet</h3>
              <p className="text-sm mb-4">
                Start practicing to see your question library grow with sample problems
              </p>
              <Button asChild>
                <Link href="/practice/quick">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Start Practice
                </Link>
              </Button>
            </div>
          )}

          {/* Pagination - only show if there are questions */}
          {libraryData.recentQuestions.length > 0 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button variant="outline" size="sm">Previous</Button>
              <span className="px-3 py-1 text-sm">
                Page 1 of {Math.ceil(libraryData.totalQuestions / 10)}
              </span>
              <Button variant="outline" size="sm">Next</Button>
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