'use client'

import { useState } from 'react'
import ExamSchedule from '@/components/exams/ExamSchedule'
import ExamForm from '@/components/exams/ExamForm'

interface Exam {
  id?: string
  examName: string
  examDate: string
  location: string
  duration?: number
  status: string
  notes?: string
  registrationId?: string
  score?: number
  maxScore?: number
  percentile?: number
}

export default function ExamsPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | undefined>(undefined)

  const handleAddExam = () => {
    setEditingExam(undefined)
    setShowForm(true)
  }

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam)
    setShowForm(true)
  }

  const handleSave = () => {
    setShowForm(false)
    setEditingExam(undefined)
    // The ExamSchedule component will automatically refresh
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingExam(undefined)
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
    </div>
  )
}