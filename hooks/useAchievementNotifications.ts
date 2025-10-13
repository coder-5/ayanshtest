'use client';

import { useState, useEffect, useCallback } from 'react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  points: number;
  tier: string | null;
}

// Store achievements that need to be shown in localStorage to persist across page reloads
const STORAGE_KEY = 'pending_achievement_notifications';

export function useAchievementNotifications() {
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);

  // Load pending achievements from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPendingAchievements(parsed);
      } catch (error) {
        console.error('Failed to parse pending achievements:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save pending achievements to localStorage whenever they change
  useEffect(() => {
    if (pendingAchievements.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingAchievements));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [pendingAchievements]);

  // Check for new achievements by comparing current with stored
  const checkForNewAchievements = useCallback(async () => {
    try {
      const response = await fetch('/api/achievements');
      const data = await response.json();

      if (!data.achievements) return;

      // Get list of achievement IDs that were already notified
      const notifiedIds = new Set(
        JSON.parse(localStorage.getItem('notified_achievements') || '[]')
      );

      // Find newly earned achievements
      const newAchievements = data.achievements.filter(
        (achievement: Achievement & { earned: boolean }) =>
          achievement.earned && !notifiedIds.has(achievement.id)
      );

      if (newAchievements.length > 0) {
        // Add to pending notifications
        setPendingAchievements((prev) => [...prev, ...newAchievements]);

        // Mark as notified
        const updatedNotified = [
          ...Array.from(notifiedIds),
          ...newAchievements.map((a: Achievement) => a.id),
        ];
        localStorage.setItem('notified_achievements', JSON.stringify(updatedNotified));
      }
    } catch (error) {
      console.error('Failed to check for new achievements:', error);
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setPendingAchievements([]);
  }, []);

  return {
    pendingAchievements,
    checkForNewAchievements,
    clearNotifications,
  };
}
