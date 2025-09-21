import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Target, AlertTriangle, TrendingDown } from "lucide-react";
import Link from "next/link";
import { RetrySessionManager } from "@/components/practice/RetrySessionManager";

async function getFailedQuestionsData() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/failed-questions?limit=50`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch failed questions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching failed questions:', error);
    return {
      questions: [],
      summary: {
        totalFailedQuestions: 0,
        totalFailedAttempts: 0,
        topicBreakdown: {},
        examBreakdown: {}
      }
    };
  }
}

export default async function RetryPage() {
  const data = await getFailedQuestionsData();
  const { questions, summary } = data;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Retry Failed Questions 🎯
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Master the questions you've struggled with. Turn your weaknesses into strengths!
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions to Retry</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.totalFailedQuestions}</div>
            <p className="text-xs text-muted-foreground">
              Still need mastery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Failed Attempts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summary.totalFailedAttempts}</div>
            <p className="text-xs text-muted-foreground">
              Learning opportunities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weak Topics</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Object.keys(summary.topicBreakdown).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Areas to focus on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Competitions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(summary.examBreakdown).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Different exam types
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Topic Breakdown */}
      {Object.keys(summary.topicBreakdown).length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-blue-600" />
              Topics That Need Work
            </CardTitle>
            <CardDescription>
              Focus your retry sessions on these challenging areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(summary.topicBreakdown)
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .map(([topic, count]) => (
                  <div key={topic} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="font-medium text-sm">{topic}</span>
                    <Badge variant="destructive">{count as number}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Retry Session Manager */}
      {questions.length > 0 ? (
        <RetrySessionManager questions={questions} summary={summary} />
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-2xl font-semibold mb-2 text-green-600">
              Excellent Work! 🎉
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't failed any questions recently, or you've already mastered all your previous mistakes!
            </p>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                This means either:
              </p>
              <ul className="text-sm text-gray-600 space-y-2 max-w-md mx-auto">
                <li>• You haven't started practicing yet</li>
                <li>• You've answered all questions correctly</li>
                <li>• You've already retried and mastered your failed questions</li>
              </ul>
              <div className="pt-4">
                <Button asChild>
                  <Link href="/practice">
                    Start New Practice Session
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="mt-8 text-center space-x-4">
        <Button variant="ghost" asChild>
          <Link href="/practice">← Back to Practice</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/progress">View Progress Analytics</Link>
        </Button>
      </div>
    </div>
  );
}