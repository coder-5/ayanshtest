// Simple user identification system for family use
// Since this is for personal/family use only, we'll use a simple approach

import { useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  grade?: number;
  avatar?: string;
  preferences?: {
    preferredCompetitions: string[];
    difficultyLevel: 'easy' | 'medium' | 'hard' | 'mixed';
    practiceGoals: {
      questionsPerDay: number;
      sessionsPerWeek: number;
    };
  };
}

// Default users for the family
export const DEFAULT_USERS: User[] = [
  {
    id: 'ayansh',
    name: 'Ayansh',
    grade: 5,
    avatar: '👦',
    preferences: {
      preferredCompetitions: ['amc8', 'moems', 'kangaroo'],
      difficultyLevel: 'mixed',
      practiceGoals: {
        questionsPerDay: 10,
        sessionsPerWeek: 5
      }
    }
  },
  {
    id: 'parent',
    name: 'Parent',
    avatar: '👨‍🏫',
    preferences: {
      preferredCompetitions: ['amc8', 'moems', 'kangaroo'],
      difficultyLevel: 'mixed',
      practiceGoals: {
        questionsPerDay: 5,
        sessionsPerWeek: 3
      }
    }
  }
];

class UserManager {
  private currentUser: User | null = null;

  constructor() {
    this.loadCurrentUser();
  }

  private loadCurrentUser() {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      } else {
        // Default to Ayansh for first time use
        this.setCurrentUser(DEFAULT_USERS[0]);
      }
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getCurrentUserId(): string {
    return this.currentUser?.id || 'ayansh';
  }

  setCurrentUser(user: User) {
    this.currentUser = user;
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  }

  switchUser(userId: string) {
    const user = DEFAULT_USERS.find(u => u.id === userId);
    if (user) {
      this.setCurrentUser(user);
      return user;
    }
    return null;
  }

  updateUserPreferences(preferences: Partial<User['preferences']>) {
    if (this.currentUser) {
      this.currentUser.preferences = {
        ...this.currentUser.preferences,
        ...preferences
      } as User['preferences'];
      this.setCurrentUser(this.currentUser);
    }
  }

  getAllUsers(): User[] {
    return DEFAULT_USERS;
  }

  // Get user's practice history summary
  async getUserStats(userId?: string): Promise<any> {
    const targetUserId = userId || this.getCurrentUserId();

    try {
      const response = await fetch(`/api/stats?userId=${targetUserId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }

    return null;
  }

  // Get recommended practice settings for current user
  getRecommendedPractice(): {
    competition: string;
    difficulty: string;
    questionCount: number;
  } {
    const user = this.getCurrentUser();

    if (!user) {
      return {
        competition: 'amc8',
        difficulty: 'medium',
        questionCount: 10
      };
    }

    const preferences = user.preferences;
    const primaryCompetition = preferences?.preferredCompetitions[0] || 'amc8';

    return {
      competition: primaryCompetition,
      difficulty: preferences?.difficultyLevel || 'medium',
      questionCount: preferences?.practiceGoals.questionsPerDay || 10
    };
  }
}

// Export singleton instance
export const userManager = new UserManager();

// React hook for using user state
export function useUser() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setCurrentUser(userManager.getCurrentUser());

    // Listen for user changes
    const handleStorageChange = () => {
      setCurrentUser(userManager.getCurrentUser());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  const switchUser = (userId: string) => {
    const user = userManager.switchUser(userId);
    if (user) {
      setCurrentUser(user);
    }
    return user;
  };

  const updatePreferences = (preferences: Partial<User['preferences']>) => {
    userManager.updateUserPreferences(preferences);
    setCurrentUser(userManager.getCurrentUser());
  };

  return {
    currentUser,
    switchUser,
    updatePreferences,
    allUsers: DEFAULT_USERS,
    getCurrentUserId: () => userManager.getCurrentUserId(),
    getRecommendedPractice: () => userManager.getRecommendedPractice()
  };
}