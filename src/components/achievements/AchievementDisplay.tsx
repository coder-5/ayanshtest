'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Target, Zap, Award } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  badgeIcon: string;
  category: string;
  unlockedAt: Date;
}

interface AchievementStats {
  total: number;
  totalPossible: number;
  completionRate: number;
  categories: {
    streak: number;
    volume: number;
    accuracy: number;
    speed: number;
    milestone: number;
  };
}

interface AchievementDisplayProps {
  userId?: string;
}

export function AchievementDisplay({ userId = 'ayansh' }: AchievementDisplayProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/achievements?userId=${userId}&withStats=true`);
      const data = await response.json();

      if (data.achievements && data.statistics) {
        setAchievements(data.achievements);
        setStats(data.statistics);
      } else if (Array.isArray(data)) {
        setAchievements(data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'streak': return <Zap className="h-4 w-4" />;
      case 'volume': return <Target className="h-4 w-4" />;
      case 'accuracy': return <Star className="h-4 w-4" />;
      case 'speed': return <Trophy className="h-4 w-4" />;
      case 'milestone': return <Award className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'streak': return 'bg-orange-500';
      case 'volume': return 'bg-blue-500';
      case 'accuracy': return 'bg-green-500';
      case 'speed': return 'bg-purple-500';
      case 'milestone': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Achievement Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Achievement Progress
            </CardTitle>
            <CardDescription>
              {stats.total} of {stats.totalPossible} achievements unlocked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>{stats.completionRate}%</span>
                </div>
                <Progress value={stats.completionRate} className="h-2" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {Object.entries(stats.categories).map(([category, count]) => (
                  <div key={category} className="text-center p-2 bg-gray-50 rounded">
                    <div className="flex justify-center mb-1">
                      {getCategoryIcon(category)}
                    </div>
                    <div className="text-lg font-bold">{count}</div>
                    <div className="text-xs text-gray-600 capitalize">{category}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievement Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Your Achievements</CardTitle>
          <CardDescription>
            {filteredAchievements.length} achievement{filteredAchievements.length !== 1 ? 's' : ''} earned
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Button>
            {['streak', 'volume', 'accuracy', 'speed', 'milestone'].map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {getCategoryIcon(category)}
                <span className="ml-1">{category}</span>
              </Button>
            ))}
          </div>

          {/* Achievement Grid */}
          {filteredAchievements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No achievements yet in this category.</p>
              <p className="text-sm">Keep practicing to unlock your first achievement!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAchievements.map((achievement) => (
                <Card key={achievement.id} className="relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-full h-1 ${getCategoryColor(achievement.category)}`} />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{achievement.badgeIcon}</div>
                        <div>
                          <CardTitle className="text-base">{achievement.title}</CardTitle>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {achievement.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                    <p className="text-xs text-gray-500">
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}