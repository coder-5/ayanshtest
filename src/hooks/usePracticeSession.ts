'use client';

import { useState, useEffect, useCallback } from 'react';
import { PracticeQuestion } from '@/types';

interface SessionResult {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

interface PracticeSessionState {
  sessionId: string;
  questions: PracticeQuestion[];
  currentQuestionIndex: number;
  answers: SessionResult[];
  startTime: number;
  isActive: boolean;
  sessionType: string;
  completed: boolean;
}

interface SavedSession {
  sessionId: string;
  questions: PracticeQuestion[];
  currentQuestionIndex: number;
  answers: SessionResult[];
  startTime: number;
  sessionType: string;
  savedAt: string;
  completed: boolean;
}

const SESSION_STORAGE_KEY = 'practice_session';
const SESSIONS_HISTORY_KEY = 'practice_sessions_history';

export function usePracticeSession() {
  const [session, setSession] = useState<PracticeSessionState | null>(null);
  const [loading, setLoading] = useState(true);

  // Load saved session on mount
  useEffect(() => {
    const savedSession = loadSavedSession();
    if (savedSession && !savedSession.completed) {
      setSession({
        sessionId: savedSession.sessionId,
        questions: savedSession.questions,
        currentQuestionIndex: savedSession.currentQuestionIndex,
        answers: savedSession.answers,
        startTime: savedSession.startTime,
        isActive: true,
        sessionType: savedSession.sessionType,
        completed: false
      });
    }
    setLoading(false);
  }, []);

  // Auto-save session whenever state changes
  useEffect(() => {
    if (session && session.isActive) {
      saveSession(session);
    }
  }, [session]);

  const startSession = useCallback((questions: PracticeQuestion[], sessionType: string) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSession: PracticeSessionState = {
      sessionId,
      questions,
      currentQuestionIndex: 0,
      answers: [],
      startTime: Date.now(),
      isActive: true,
      sessionType,
      completed: false
    };

    setSession(newSession);
    saveSession(newSession);
  }, []);

  const answerQuestion = useCallback((answer: SessionResult) => {
    if (!session) return;

    const updatedSession = {
      ...session,
      answers: [...session.answers, answer],
      currentQuestionIndex: session.currentQuestionIndex + 1
    };

    setSession(updatedSession);
  }, [session]);

  const completeSession = useCallback(() => {
    if (!session) return;

    const completedSession = {
      ...session,
      isActive: false,
      completed: true
    };

    setSession(completedSession);

    // Save to history
    saveToHistory(completedSession);

    // Clear active session
    clearSavedSession();

    return {
      sessionId: completedSession.sessionId,
      results: completedSession.answers,
      totalTime: Date.now() - completedSession.startTime,
      accuracy: completedSession.answers.length > 0
        ? completedSession.answers.filter(a => a.isCorrect).length / completedSession.answers.length
        : 0
    };
  }, [session]);

  const pauseSession = useCallback(() => {
    if (!session) return;

    const pausedSession = { ...session, isActive: false };
    setSession(pausedSession);
    saveSession(pausedSession);
  }, [session]);

  const resumeSession = useCallback(() => {
    if (!session) return;

    const resumedSession = { ...session, isActive: true };
    setSession(resumedSession);
    saveSession(resumedSession);
  }, [session]);

  const clearSession = useCallback(() => {
    setSession(null);
    clearSavedSession();
  }, []);

  // Get current question
  const getCurrentQuestion = useCallback(() => {
    if (!session || session.currentQuestionIndex >= session.questions.length) {
      return null;
    }
    return session.questions[session.currentQuestionIndex];
  }, [session]);

  // Get session progress
  const getProgress = useCallback(() => {
    if (!session) return { current: 0, total: 0, percentage: 0 };

    return {
      current: session.currentQuestionIndex + 1,
      total: session.questions.length,
      percentage: ((session.currentQuestionIndex + 1) / session.questions.length) * 100
    };
  }, [session]);

  // Check if session is complete
  const isSessionComplete = useCallback(() => {
    return session ? session.currentQuestionIndex >= session.questions.length : false;
  }, [session]);

  return {
    session,
    loading,
    startSession,
    answerQuestion,
    completeSession,
    pauseSession,
    resumeSession,
    clearSession,
    getCurrentQuestion,
    getProgress,
    isSessionComplete,
    hasActiveSession: !!session && session.isActive,
    hasSavedSession: !!loadSavedSession()
  };
}

// Helper functions for localStorage operations
function loadSavedSession(): SavedSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    return null;
  }
}

function saveSession(session: PracticeSessionState): void {
  if (typeof window === 'undefined') return;

  try {
    const sessionToSave: SavedSession = {
      sessionId: session.sessionId,
      questions: session.questions,
      currentQuestionIndex: session.currentQuestionIndex,
      answers: session.answers,
      startTime: session.startTime,
      sessionType: session.sessionType,
      savedAt: new Date().toISOString(),
      completed: session.completed
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionToSave));
  } catch (error) {
  }
}

function clearSavedSession(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
  }
}

function saveToHistory(session: PracticeSessionState): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getSessionHistory();
    const historyEntry = {
      sessionId: session.sessionId,
      sessionType: session.sessionType,
      questionsCount: session.questions.length,
      correctAnswers: session.answers.filter(a => a.isCorrect).length,
      totalTime: Date.now() - session.startTime,
      completedAt: new Date().toISOString(),
      accuracy: session.answers.length > 0
        ? session.answers.filter(a => a.isCorrect).length / session.answers.length
        : 0
    };

    // Keep only last 50 sessions
    const updatedHistory = [historyEntry, ...history].slice(0, 50);
    localStorage.setItem(SESSIONS_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
  }
}

function getSessionHistory() {
  if (typeof window === 'undefined') return [];

  try {
    const history = localStorage.getItem(SESSIONS_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    return [];
  }
}

export { getSessionHistory };