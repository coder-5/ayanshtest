'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, RotateCcw, RefreshCw } from "lucide-react"

interface UserAttempt {
  id: string
  isCorrect: boolean
  attemptedAt: string
  question: {
    examName: string | null
    topic: string
  }
}

interface RecentActivityProps {
  initialRecentAttempts?: UserAttempt[]
  totalQuestions: number
}

export default function RecentActivity({ initialRecentAttempts = [], totalQuestions }: RecentActivityProps) {
  const [recentAttempts, setRecentAttempts] = useState<UserAttempt[]>(initialRecentAttempts)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchRecentAttempts = useCallback(async () => {
    try {
      setRefreshing(true)
      // Use fixed user ID since we're in standalone mode
      const response = await fetch(`/api/user-attempts?limit=3&sort=desc`)
      if (response.ok) {
        const data = await response.json()
        setRecentAttempts(data.attempts || [])
      }
    } catch (error) {
      // Silently handle error - component will show empty state
    } finally {
      setRefreshing(false)
    }
  }, []) // No dependencies needed since we're using fixed user

  // Auto-refresh when component mounts and when page becomes visible
  useEffect(() => {
    // Initial fetch if no initial data
    if (initialRecentAttempts.length === 0) {
      fetchRecentAttempts()
    }
  }, []) // Only run once on mount

  // Separate effect for event listeners to avoid infinite loops
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchRecentAttempts()
      }
    }

    const handleFocus = () => {
      fetchRecentAttempts()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    // Periodic refresh every 5 minutes (increased to reduce server load)
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchRecentAttempts()
      }
    }, 300000) // 5 minutes

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      clearInterval(interval)
    }
  }, [fetchRecentAttempts])

  const clearActivity = async () => {
    if (!confirm('Are you sure you want to clear all recent activity? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      // Use fixed user ID since we're in standalone mode
      const response = await fetch('/api/user-attempts', {
        method: 'DELETE'
      })

      if (response.ok) {
        // Refresh the recent attempts instead of hard reload
        await fetchRecentAttempts()
      } else {
        const errorData = await response.json().catch(() => ({}))
        alert(`Failed to clear activity: ${errorData.error || 'Unknown error'}. Please try again.`)
      }
    } catch (error) {
      alert('Error clearing activity. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-8" data-testid="recent-activity">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent practice sessions</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchRecentAttempts}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            {recentAttempts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearActivity}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {loading ? 'Clearing...' : 'Clear All'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {recentAttempts.length > 0 ? (
          <div className="space-y-4">
            {recentAttempts.map((attempt) => (
              <div key={attempt.id} className={`flex items-center justify-between p-3 rounded-lg ${
                attempt.isCorrect ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    attempt.isCorrect ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {attempt.isCorrect ? '✓' : '✗'}
                  </div>
                  <div>
                    <p className="font-medium">{attempt.question.examName ? `${attempt.question.examName} - ` : ''}{attempt.question.topic}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(attempt.attemptedAt).toLocaleDateString()} at {new Date(attempt.attemptedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold ${
                  attempt.isCorrect ? 'text-green-600' : 'text-red-600'
                }`}>
                  {attempt.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No practice sessions yet</p>
            <p className="text-sm">
              {totalQuestions === 0
                ? 'Upload some questions and start practicing!'
                : 'Start practicing to see your recent activity here!'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}