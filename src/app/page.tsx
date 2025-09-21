import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Target, TrendingUp, Upload, Calendar, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RecentActivity from "@/components/RecentActivity";

async function calculateStreak(userId: string = 'default-user'): Promise<number> {
  const progress = await prisma.userAttempt.findMany({
    where: { userId },
    orderBy: { attemptedAt: 'desc' },
    select: { attemptedAt: true }
  });

  if (progress.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const progressDates = progress.map(p => {
    const date = new Date(p.attemptedAt);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  });

  const uniqueDates = Array.from(new Set(progressDates)).sort((a, b) => b - a);

  for (const dateTime of uniqueDates) {
    if (dateTime === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

async function getStats() {
  try {
    const [totalQuestions, totalAttempts, recentAttempts, upcomingExams, streak] = await Promise.all([
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
      }),
      calculateStreak()
    ]);

    const correctAttempts = await prisma.userAttempt.count({
      where: { isCorrect: true }
    });

    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

    return {
      totalQuestions,
      totalAttempts,
      accuracy,
      streak,
      recentAttempts: recentAttempts.map(attempt => ({
        ...attempt,
        attemptedAt: attempt.attemptedAt.toISOString()
      })),
      upcomingExams
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      totalQuestions: 0,
      totalAttempts: 0,
      accuracy: 0,
      streak: 0,
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
            <div className="text-2xl font-bold">{stats.streak} days</div>
            <p className="text-xs text-muted-foreground">
              {stats.streak === 0 ? 'Start your streak!' : 'Keep it up!'}
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
            Ready to practice? Choose from AMC 8, MathCounts, and Math Kangaroo problems!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/practice">Start Practicing</Link>
          </Button>
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
            {/* Compact Table for Homepage */}
            <div className="border rounded-lg overflow-hidden mb-4">
              <table className="w-full">
                <thead className="bg-purple-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium text-sm">Exam</th>
                    <th className="text-left p-3 font-medium text-sm">Date</th>
                    <th className="text-left p-3 font-medium text-sm">Location</th>
                    <th className="text-right p-3 font-medium text-sm">Days Left</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.upcomingExams.map((exam: any) => {
                    const daysUntil = Math.floor((new Date(exam.examDate).getTime() - new Date().getTime()) / 86400000)
                    const getExamIcon = (examName: string) => {
                      if (examName.includes('AMC')) return '🧮'
                      if (examName.includes('Kangaroo')) return '🦘'
                      if (examName.includes('MOEMS')) return '🏆'
                      return '📝'
                    }

                    return (
                      <tr key={exam.id} className="border-b hover:bg-purple-50/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getExamIcon(exam.examName)}</span>
                            <span className="font-medium">{exam.examName}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            {new Date(exam.examDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-gray-600 max-w-[120px] truncate" title={exam.location}>
                            {exam.location}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="text-sm font-medium text-purple-600">
                            {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Button asChild variant="outline" className="w-full">
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

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCcw className="h-5 w-5 text-red-600" />
              Retry Failed Questions
            </CardTitle>
            <CardDescription>
              Master the questions you've struggled with before
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/practice/retry">Fix Your Mistakes</Link>
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