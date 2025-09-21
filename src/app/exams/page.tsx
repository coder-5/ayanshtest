'use client'

import { useState } from 'react'
import ExamSchedule from '@/components/exams/ExamSchedule'
import ExamForm from '@/components/exams/ExamForm'
import { Button } from '@/components/ui/button'
import { ExamSchedule as ExamType } from '@/types'
import Link from 'next/link'

const createDefaultExam = (): Partial<ExamType> => ({
  examName: '',
  examDate: new Date(),
  location: '',
  duration: 120,
  status: 'upcoming' as const,
  notes: null,
  registrationId: null,
  score: null,
  maxScore: null,
  percentile: null,
  availableFromDate: null,
  availableToDate: null,
  examUrl: null,
  loginId: null,
  loginPassword: null,
  registeredAt: null
})

export default function ExamsPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingExam, setEditingExam] = useState<Partial<ExamType>>(createDefaultExam())

  const handleAddExam = () => {
    setEditingExam(createDefaultExam())
    setShowForm(true)
  }

  const handleEditExam = (exam: ExamType) => {
    setEditingExam(exam)
    setShowForm(true)
  }

  const handleSave = () => {
    setShowForm(false)
    setEditingExam(createDefaultExam())
    // The ExamSchedule component will automatically refresh
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingExam(createDefaultExam())
  }

  if (showForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ExamForm
          exam={editingExam}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Schedule</h1>
        <p className="text-gray-600">
          Track Ayansh's upcoming math competitions and view past exam results.
        </p>
      </div>

      <ExamSchedule onAddExam={handleAddExam} onEditExam={handleEditExam} />

      {/* Navigation */}
      <div className="mt-8 text-center">
        <Button variant="ghost" asChild>
          <Link href="/">← Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}