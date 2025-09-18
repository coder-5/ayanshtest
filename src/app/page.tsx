import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Target, TrendingUp, Upload, Brain, Award, Calendar } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RecentActivity from "@/components/RecentActivity";

async function getStats() {
  try {
    const [totalQuestions, totalAttempts, recentAttempts, upcomingExams] = await Promise.all([
      prisma.question.count(),
      prisma.userAttempt.count(),
      prisma.userAttempt.findMany({
        orderBy: { attemptedAt: 'desc' },
        take: 3,
        include: {
          question: true
        }
      }),
      prisma.examSchedule.findMany({
        where: {
          status: 'upcoming',
          examDate: {
            gte: new Date()
          }
        },
        orderBy: { examDate: 'asc' },
        take: 3
      })
    ]);

    const correctAttempts = await prisma.userAttempt.count({
      where: { isCorrect: true }
    });

    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

    return {
      totalQuestions,
      totalAttempts,
      accuracy,
      recentAttempts,
      upcomingExams
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      totalQuestions: 0,
      totalAttempts: 0,
      accuracy: 0,
      recentAttempts: [],
      upcomingExams: []
    };
  }
}

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome Back, Ayansh! 🚀
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Ready to tackle some math competition problems? Let's build those problem-solving skills!
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuestions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalQuestions === 0 ? 'Upload documents to add questions' : 'Available for practice'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalAttempts === 0 ? 'Start practicing!' : 'Questions attempted'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <span className="text-orange-500">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accuracy}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalAttempts === 0 ? 'No attempts yet' : 'Keep practicing!'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <span className="text-orange-500">🔥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 days</div>
            <p className="text-xs text-muted-foreground">
              Start your streak!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Goal */}
      <Card className="mb-8 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Ready to Start?
          </CardTitle>
          <CardDescription>
            {stats.totalQuestions === 0
              ? 'Upload some math competition documents to get started!'
              : `${stats.totalQuestions} questions available for practice`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.totalQuestions > 0 ? (
            <Button asChild>
              <Link href="/practice">Start Practicing</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/upload">Upload Questions</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Exams */}
      {stats.upcomingExams.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Upcoming Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.upcomingExams.map((exam: any) => (
                <div key={exam.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{exam.examName}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(exam.examDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })} at {exam.location}
                    </p>
                  </div>
                  <div className="text-sm text-purple-600 font-medium">
                    {Math.ceil((new Date(exam.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                  </div>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" className="w-full mt-4">
              <Link href="/exams">View All Exams</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              Practice Questions
            </CardTitle>
            <CardDescription>
              Jump into practice mode with math competition questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" disabled={stats.totalQuestions === 0}>
              <Link href="/practice">Start Practicing</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              View Progress
            </CardTitle>
            <CardDescription>
              See your progress, statistics, and performance analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/progress">View Analytics</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-orange-600" />
              Upload Documents
            </CardTitle>
            <CardDescription>
              Add new competition questions from Word, PDF, or image files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/upload">Upload Questions</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              Question Library
            </CardTitle>
            <CardDescription>
              Browse and search through your collection of math problems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/library">Browse Library</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Exam Schedule
            </CardTitle>
            <CardDescription>
              Track upcoming competitions and view past exam results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/exams">Manage Exams</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <RecentActivity
        recentAttempts={stats.recentAttempts}
        totalQuestions={stats.totalQuestions}
      />
    </div>
  );
}