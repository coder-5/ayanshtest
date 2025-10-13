'use client';

import { useEffect } from 'react';
import { AchievementNotification } from './AchievementNotification';
import { useAchievementNotifications } from '@/hooks/useAchievementNotifications';

export function AchievementNotificationProvider() {
  const { pendingAchievements, checkForNewAchievements, clearNotifications } =
    useAchievementNotifications();

  // Check for new achievements on mount
  useEffect(() => {
    checkForNewAchievements();
  }, [checkForNewAchievements]);

  // Check for new achievements periodically (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      checkForNewAchievements();
    }, 30000);

    return () => clearInterval(interval);
  }, [checkForNewAchievements]);

  // Also check after user completes a question (listen for custom event)
  useEffect(() => {
    const handleQuestionCompleted = () => {
      checkForNewAchievements();
    };

    window.addEventListener('question-completed', handleQuestionCompleted);
    return () => window.removeEventListener('question-completed', handleQuestionCompleted);
  }, [checkForNewAchievements]);

  return (
    <AchievementNotification achievements={pendingAchievements} onClose={clearNotifications} />
  );
}
