// Simple user identification system for family use
// Since this is for personal/family use only, we'll use a simple approach

import { useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  grade?: number;
  avatar?: string;
  preferences: {
    preferredCompetitions: string[];
    difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD' | 'mixed';
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
        try {
          this.currentUser = JSON.parse(savedUser);
        } catch (error) {
          // Invalid saved user data, using default
          this.setCurrentUser(DEFAULT_USERS[0]);
        }
      } else {
        // Default to Ayansh for first time use
        this.setCurrentUser(DEFAULT_USERS[0]);
      }
    } else {
      // Server-side rendering - use default user
      this.currentUser = DEFAULT_USERS[0];
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getCurrentUserId(): string {
    // Ensure we always return a valid user ID
    if (this.currentUser?.id) {
      return this.currentUser.id;
    }
    // Fallback to default user
    return DEFAULT_USERS[0].id;
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
      };
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
        difficulty: 'MEDIUM',
        questionCount: 10
      };
    }

    const preferences = user.preferences;
    const primaryCompetition = preferences?.preferredCompetitions[0] || 'amc8';

    return {
      competition: primaryCompetition,
      difficulty: preferences?.difficultyLevel || 'MEDIUM',
      questionCount: preferences?.practiceGoals.questionsPerDay || 10
    };
  }
}

// Export singleton instance
export const userManager = new UserManager();

// React hook for using user state
export function useUser() {
  // Initialize with default user to avoid SSR issues
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // During SSR, return default user immediately
    if (typeof window === 'undefined') {
      return DEFAULT_USERS[0];
    }
    return userManager.getCurrentUser() || DEFAULT_USERS[0];
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const user = userManager.getCurrentUser();
      if (user) {
        setCurrentUser(user);
      }

      // Listen for user changes
      const handleStorageChange = () => {
        const updatedUser = userManager.getCurrentUser();
        if (updatedUser) {
          setCurrentUser(updatedUser);
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }

    // Return undefined for server-side
    return undefined;
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