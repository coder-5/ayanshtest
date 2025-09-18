'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface DayActivity {
  date: string;
  count: number;
  correct: number;
  dayName: string;
}

interface WeeklyActivityProps {
  data: DayActivity[];
}

export function WeeklyActivity({ data }: WeeklyActivityProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  const getBarHeight = (count: number) => {
    return Math.max((count / maxCount) * 100, 5); // Minimum 5% height for visibility
  };

  const getAccuracyColor = (correct: number, total: number) => {
    if (total === 0) return 'bg-gray-200';
    const accuracy = (correct / total) * 100;
    if (accuracy >= 80) return 'bg-green-500';
    if (accuracy >= 65) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          This Week's Activity
        </CardTitle>
        <CardDescription>
          Your daily practice activity and performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Activity Bars */}
          <div className="grid grid-cols-7 gap-2 h-32">
            {data.map((day, index) => (
              <div key={day.date} className="flex flex-col items-center">
                <div className="flex-1 flex items-end w-full">
                  <div
                    className={`w-full rounded-t-md flex items-end justify-center pb-1 text-white text-xs font-bold transition-all hover:opacity-80 ${
                      day.count > 0 ? getAccuracyColor(day.correct, day.count) : 'bg-gray-200'
                    }`}
                    style={{ height: `${getBarHeight(day.count)}%` }}
                    title={`${day.dayName}: ${day.count} questions, ${day.correct} correct`}
                  >
                    {day.count > 0 ? day.count : ''}
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-1 text-center">
                  {day.dayName}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>80%+ accuracy</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>65-79% accuracy</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>&lt;65% accuracy</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-200 rounded"></div>
              <span>No practice</span>
            </div>
          </div>

          {/* Week Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">
                {data.reduce((sum, day) => sum + day.count, 0)}
              </div>
              <div className="text-sm text-gray-600">Questions This Week</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">
                {data.reduce((sum, day) => sum + day.count, 0) > 0
                  ? Math.round((data.reduce((sum, day) => sum + day.correct, 0) / data.reduce((sum, day) => sum + day.count, 0)) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-gray-600">Average Accuracy</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">
                {data.filter(day => day.count > 0).length}
              </div>
              <div className="text-sm text-gray-600">Practice Days</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}