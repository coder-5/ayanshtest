'use client';

import { useEffect, useState } from 'react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  points: number;
  tier: string | null;
}

interface AchievementNotificationProps {
  achievements: Achievement[];
  onClose: () => void;
}

export function AchievementNotification({ achievements, onClose }: AchievementNotificationProps) {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (achievements.length > 0) {
      setVisible(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        if (currentIndex < achievements.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          setVisible(false);
          setTimeout(onClose, 300); // Wait for fade-out animation
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [achievements, currentIndex, onClose]);

  if (achievements.length === 0 || !visible) return null;

  const achievement = achievements[currentIndex];
  if (!achievement) return null;

  const getTierColor = (tier: string | null) => {
    switch (tier) {
      case 'BRONZE':
        return 'from-orange-400 to-orange-600';
      case 'SILVER':
        return 'from-gray-300 to-gray-500';
      case 'GOLD':
        return 'from-yellow-400 to-yellow-600';
      case 'PLATINUM':
        return 'from-purple-400 to-purple-600';
      default:
        return 'from-blue-400 to-indigo-600';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div
        className={`bg-gradient-to-r ${getTierColor(achievement.tier)} rounded-lg shadow-2xl p-6 max-w-sm border-2 border-white`}
      >
        <div className="flex items-start gap-4">
          <div className="text-5xl">{achievement.icon || '🏆'}</div>
          <div className="flex-1 text-white">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg">Achievement Unlocked!</h3>
              {achievement.tier && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-white bg-opacity-30 rounded">
                  {achievement.tier}
                </span>
              )}
            </div>
            <p className="font-semibold mb-1">{achievement.name}</p>
            <p className="text-sm text-white text-opacity-90 mb-2">{achievement.description}</p>
            <div className="flex items-center gap-1 text-sm font-semibold">
              <span>⭐</span>
              <span>+{achievement.points} points</span>
            </div>
          </div>
          <button
            onClick={() => {
              setVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-white hover:text-opacity-80 transition"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
        {achievements.length > 1 && (
          <div className="mt-3 flex gap-1 justify-center">
            {achievements.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white bg-opacity-50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
