'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PerformanceDashboard } from "@/components/analytics/PerformanceDashboard";
import { AchievementDisplay } from "@/components/achievements/AchievementDisplay";
import { useUser } from "@/lib/user";
import ClientOnly from "@/components/ClientOnly";

function ProgressContent() {
  const { getCurrentUserId } = useUser();
  const userId = getCurrentUserId();

  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Your Progress 📊
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Track your math competition journey and see how much you&apos;ve improved!
        </p>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <PerformanceDashboard userId={userId} />
      </div>

      {/* Achievements Section */}
      <div className="mb-8">
        <AchievementDisplay userId={userId} />
      </div>

      {/* Call to Action */}
      <div className="text-center">
        <Link href="/practice">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            Continue Practicing 🚀
          </Button>
        </Link>
      </div>
    </>
  );
}

export default function ProgressPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ClientOnly
        fallback={
          <div className="text-center py-20">
            <div className="animate-pulse">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Loading...</h1>
            </div>
          </div>
        }
      >
        <ProgressContent />
      </ClientOnly>
    </div>
  );
}