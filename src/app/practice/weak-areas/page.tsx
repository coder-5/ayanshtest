import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function WeakAreasPracticePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Improve Weak Areas 🎯
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Targeted practice to strengthen your mathematical weak points and boost overall performance
        </p>
      </div>

      {/* Overall Progress */}
      <Card className="mb-8 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <TrendingUp className="h-5 w-5" />
            Your Progress Overview
          </CardTitle>
          <CardDescription>
            Track your improvement across different mathematical topics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Your weak area analysis will appear here</p>
            <p className="text-sm">Answer more questions to see topic-specific performance data</p>
          </div>
        </CardContent>
      </Card>

      {/* Weak Areas Analysis */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Areas Needing Improvement
          </CardTitle>
          <CardDescription>
            Topics where your accuracy is below 75%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No weak areas identified yet</p>
            <p className="text-sm">Answer more questions to identify areas for improvement</p>
          </div>
        </CardContent>
      </Card>

      {/* Strong Areas */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Your Strong Areas
          </CardTitle>
          <CardDescription>
            Topics where you're performing well (75%+ accuracy)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No strong areas identified yet</p>
            <p className="text-sm">Answer more questions to see your strengths</p>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Practice Plan */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Recommended Practice Plan
          </CardTitle>
          <CardDescription>
            Personalized study plan to improve your weak areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No practice plan available yet</p>
            <p className="text-sm">Complete more questions to generate a personalized practice plan</p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="text-center space-x-4">
        <Button variant="ghost" asChild>
          <Link href="/practice">← Back to Practice</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/progress">View Detailed Progress</Link>
        </Button>
      </div>
    </div>
  );
}