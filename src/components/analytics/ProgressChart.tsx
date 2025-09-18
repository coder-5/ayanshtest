'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ProgressData {
  topic: string;
  current: number;
  previous: number;
  total: number;
  trend: 'up' | 'down' | 'stable';
}

interface ProgressChartProps {
  data: ProgressData[];
  title: string;
  description: string;
}

export function ProgressChart({ data, title, description }: ProgressChartProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getBadgeVariant = (accuracy: number) => {
    if (accuracy >= 80) return 'default';
    if (accuracy >= 65) return 'secondary';
    return 'destructive';
  };

  const getBadgeLabel = (accuracy: number) => {
    if (accuracy >= 80) return 'Strong 💪';
    if (accuracy >= 65) return 'Good 👍';
    return 'Needs Work 📈';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((item) => (
            <div key={item.topic} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium capitalize">{item.topic}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={getBadgeVariant(item.current)}>
                    {item.current}% accuracy
                  </Badge>
                  <Badge variant={getBadgeVariant(item.current) === 'destructive' ? 'destructive' : 'default'}>
                    {getBadgeLabel(item.current)}
                  </Badge>
                </div>
              </div>

              <Progress value={item.current} className="h-2" />

              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>{item.total} questions practiced</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(item.trend)}
                  <span className={getTrendColor(item.trend)}>
                    {item.trend === 'up' ? '+' : item.trend === 'down' ? '-' : ''}
                    {Math.abs(item.current - item.previous)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}