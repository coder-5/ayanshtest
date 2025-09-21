import { useState } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage.
  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

// Hook for managing practice session progress
export function usePracticeProgress() {
  return useLocalStorage('ayansh_practice_progress', {
    sessionsCompleted: 0,
    totalQuestionsAnswered: 0,
    correctAnswers: 0,
    averageTimePerQuestion: 0,
    topicProgress: {} as Record<string, {
      attempted: number;
      correct: number;
      averageTime: number;
    }>,
    lastSessionDate: null as string | null
  });
}

// Hook for managing user preferences
export function useUserPreferences() {
  return useLocalStorage('ayansh_preferences', {
    theme: 'light' as 'light' | 'dark',
    practiceSettings: {
      showTimer: true,
      showHints: true,
      autoAdvance: false,
      questionsPerSession: 10
    },
    notifications: {
      sessionReminders: true,
      progressUpdates: true
    }
  });
}