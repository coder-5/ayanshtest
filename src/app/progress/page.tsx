'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PerformanceDashboard } from "@/components/analytics/PerformanceDashboard";
import { AchievementDisplay } from "@/components/achievements/AchievementDisplay";

export default function ProgressPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Your Progress 📊
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Track your math competition journey and see how much you've improved!
        </p>
      </div>

      {/* Performance Dashboard */}
      <div className="mb-12">
        <PerformanceDashboard />
      </div>

      {/* Achievements Section */}
      <div className="mb-12">
        <AchievementDisplay />
      </div>

      {/* Action Buttons */}
      <div className="text-center space-x-4">
        <Button asChild>
          <Link href="/practice">Continue Practice</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/practice/weak-areas">Work on Weak Areas</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/">← Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}