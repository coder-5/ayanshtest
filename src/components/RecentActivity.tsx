'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserAttempt {
  id: string
  isCorrect: boolean
  attemptedAt: string
  question: {
    examName: string
    topic: string
  }
}

interface RecentActivityProps {
  recentAttempts: UserAttempt[]
  totalQuestions: number
}

export default function RecentActivity({ recentAttempts, totalQuestions }: RecentActivityProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const clearActivity = async () => {
    if (!confirm('Are you sure you want to clear all recent activity? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/user-attempts', {
        method: 'DELETE'
      })

      if (response.ok) {
        router.refresh() // Refresh the page to show updated data
      } else {
        alert('Failed to clear activity. Please try again.')
      }
    } catch (error) {
      console.error('Error clearing activity:', error)
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
                    <p className="font-medium">{attempt.question.examName} - {attempt.question.topic}</p>
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