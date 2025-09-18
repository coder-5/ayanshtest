'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, MapPin, Save, X, Repeat } from 'lucide-react'

interface Exam {
  id?: string
  examName: string
  examDate: Date | string        // Date datatype for exam date/time
  location: string
  duration: number              // Number datatype for exam duration in minutes
  status: string
  notes: string                 // String datatype for notes (empty string if none)
  registrationId: string        // String datatype for registration ID (empty string if none)
  score: number                 // Number datatype for exam score
  maxScore: number              // Number datatype for maximum possible score
  percentile: number            // Number datatype (float) for percentile values like 85.5
  availableFromDate: Date | string  // Date datatype for availability start
  availableToDate: Date | string    // Date datatype for availability end
  examUrl: string               // String datatype for exam URL (empty string if none)
  loginId: string               // String datatype for login ID/username (empty string if none)
  loginPassword: string         // String datatype for login password (empty string if none)
  registeredAt: Date | string   // Date datatype for registration date
  createdAt?: Date | string     // Date datatype for creation date (optional for new exams)
  updatedAt?: Date | string     // Date datatype for last update (optional for new exams)
}

interface ExamFormProps {
  exam?: Exam
  onSave: () => void
  onCancel: () => void
}

export default function ExamForm({ exam, onSave, onCancel }: ExamFormProps) {
  const [formData, setFormData] = useState<Exam>({
    examName: '',
    examDate: '',
    location: '',
    duration: 0,
    status: 'upcoming',
    notes: '',
    registrationId: '',
    score: 0,
    maxScore: 0,
    percentile: 0,
    availableFromDate: '',
    availableToDate: '',
    examUrl: '',
    loginId: '',
    loginPassword: '',
    registeredAt: ''
  })
  const [loading, setLoading] = useState(false)
  const [customExamName, setCustomExamName] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState<'weekly' | 'monthly'>('weekly')
  const [recurrenceCount, setRecurrenceCount] = useState(4)

  useEffect(() => {
    if (exam) {
      // Format date for datetime-local input
      const examDate = new Date(exam.examDate)
      const formattedDate = examDate.toISOString().slice(0, 16)

      // Format available dates if they exist
      const availableFromFormatted = exam.availableFromDate
        ? new Date(exam.availableFromDate).toISOString().slice(0, 16)
        : ''
      const availableToFormatted = exam.availableToDate
        ? new Date(exam.availableToDate).toISOString().slice(0, 16)
        : ''

      // Check if exam name is a custom one (not in predefined list)
      const predefinedExams = ['AMC 8', 'AMC 10', 'Math Kangaroo', 'MOEMS', 'MathCounts', 'AIME', 'Local Competition', 'School Competition']
      const isCustomExam = !predefinedExams.includes(exam.examName)

      setFormData({
        ...exam,
        examDate: formattedDate,
        examName: isCustomExam ? 'Other' : exam.examName,
        availableFromDate: availableFromFormatted,
        availableToDate: availableToFormatted,
        // All fields are now required with proper defaults
        duration: exam.duration || 0,
        notes: exam.notes || '',
        registrationId: exam.registrationId || '',
        score: exam.score || 0,
        maxScore: exam.maxScore || 0,
        percentile: exam.percentile || 0,
        examUrl: exam.examUrl || '',
        loginId: exam.loginId || '',
        loginPassword: exam.loginPassword || '',
        registeredAt: exam.registeredAt ? new Date(exam.registeredAt).toISOString().slice(0, 16) : ''
      })

      if (isCustomExam) {
        setCustomExamName(exam.examName)
      }
    }
  }, [exam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validate custom exam name when "Other" is selected
    if (formData.examName === 'Other' && !customExamName.trim()) {
      alert('Please enter a custom exam name.')
      setLoading(false)
      return
    }

    try {
      const url = exam?.id ? `/api/exams/${exam.id}` : (isRecurring ? '/api/exams/recurring' : '/api/exams')
      const method = exam?.id ? 'PUT' : 'POST'

      const examData = {
        ...formData,
        examName: formData.examName === 'Other' ? customExamName : formData.examName,
        duration: parseInt(formData.duration.toString()) || 0,
        score: parseInt(formData.score.toString()) || 0,
        maxScore: parseInt(formData.maxScore.toString()) || 0,
        percentile: parseFloat(formData.percentile.toString()) || 0,
        availableFromDate: formData.availableFromDate || formData.examDate,
        availableToDate: formData.availableToDate || formData.examDate,
        examUrl: formData.examUrl?.trim() || '',
        loginId: formData.loginId?.trim() || '',
        loginPassword: formData.loginPassword?.trim() || '',
        registrationId: formData.registrationId?.trim() || '',
        notes: formData.notes?.trim() || ''
      }

      // Add recurrence data if creating recurring exams
      if (isRecurring && !exam?.id) {
        examData.recurrenceType = recurrenceType
        examData.recurrenceCount = recurrenceCount
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(examData)
      })

      if (response.ok) {
        const result = await response.json()
        if (isRecurring && result.count) {
          alert(`Successfully created ${result.count} recurring exams!`)
        }
        onSave()
      } else {
        const error = await response.json()
        console.error('Error saving exam:', error)
        console.error('Response status:', response.status)
        console.error('Form data sent:', examData)
        alert(`Failed to save exam: ${error.error || 'Unknown error'}. Please try again.`)
      }
    } catch (error) {
      console.error('Error saving exam:', error)
      alert('Failed to save exam. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const examTypes = [
    'AMC 8',
    'AMC 10',
    'Math Kangaroo',
    'MOEMS',
    'MathCounts',
    'AIME',
    'Local Competition',
    'School Competition',
    'Other'
  ]

  const statusOptions = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'completed', label: 'Completed' },
    { value: 'missed', label: 'Missed' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {exam?.id ? 'Edit Exam' : 'Add New Exam'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="examName" className="text-sm font-medium">
                Exam Name *
              </label>
              <Select
                value={formData.examName}
                onValueChange={(value) => handleChange('examName', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  {examTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Custom exam name input when "Other" is selected */}
              {formData.examName === 'Other' && (
                <div className="mt-2">
                  <Input
                    placeholder="Enter custom exam name"
                    value={customExamName}
                    onChange={(e) => setCustomExamName(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date, Time, and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="examDate" className="text-sm font-medium flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Date & Time *
              </label>
              <Input
                id="examDate"
                type="datetime-local"
                value={formData.examDate}
                onChange={(e) => handleChange('examDate', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Location *
              </label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="School, Online, Competition Center..."
                required
              />
            </div>
          </div>

          {/* Duration and Registration */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="duration" className="text-sm font-medium">
                  Duration (minutes)
                </label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration || ''}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  placeholder="40, 60, 90..."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="registrationId" className="text-sm font-medium">
                  Registration ID
                </label>
                <Input
                  id="registrationId"
                  value={formData.registrationId}
                  onChange={(e) => handleChange('registrationId', e.target.value)}
                  placeholder="Confirmation number..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="registeredAt" className="text-sm font-medium">
                Registration Date
              </label>
              <Input
                id="registeredAt"
                type="datetime-local"
                value={formData.registeredAt}
                onChange={(e) => handleChange('registeredAt', e.target.value)}
              />
              <p className="text-xs text-gray-500">When you registered for this exam</p>
            </div>
          </div>

          {/* Recurring Exam Options (only for new exams) */}
          {!exam?.id && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Repeat className="h-5 w-5" />
                Recurring Exam Options
              </h3>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="isRecurring" className="text-sm font-medium">
                    Create multiple recurring exams
                  </label>
                </div>

                {isRecurring && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Frequency</label>
                      <Select
                        value={recurrenceType}
                        onValueChange={(value: 'weekly' | 'monthly') => setRecurrenceType(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Number of occurrences
                      </label>
                      <Input
                        type="number"
                        min="2"
                        max="12"
                        value={recurrenceCount}
                        onChange={(e) => setRecurrenceCount(parseInt(e.target.value) || 4)}
                        placeholder="4"
                      />
                      <p className="text-xs text-gray-500">
                        Creates {recurrenceCount} exams {recurrenceType}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Available Date Range */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Exam Availability Window</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="availableFromDate" className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Available From
                </label>
                <Input
                  id="availableFromDate"
                  type="datetime-local"
                  value={formData.availableFromDate}
                  onChange={(e) => handleChange('availableFromDate', e.target.value)}
                />
                <p className="text-xs text-gray-500">When the exam becomes available to take</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="availableToDate" className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Available Until
                </label>
                <Input
                  id="availableToDate"
                  type="datetime-local"
                  value={formData.availableToDate}
                  onChange={(e) => handleChange('availableToDate', e.target.value)}
                />
                <p className="text-xs text-gray-500">When the exam is no longer available</p>
              </div>
            </div>
          </div>

          {/* Online Exam Access */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Online Exam Access (Optional)</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="examUrl" className="text-sm font-medium">
                  Exam URL
                </label>
                <Input
                  id="examUrl"
                  type="url"
                  value={formData.examUrl}
                  onChange={(e) => handleChange('examUrl', e.target.value)}
                  placeholder="https://example.com/exam-portal"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="loginId" className="text-sm font-medium">
                    Login ID / Username
                  </label>
                  <Input
                    id="loginId"
                    value={formData.loginId}
                    onChange={(e) => handleChange('loginId', e.target.value)}
                    placeholder="username or student ID"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="loginPassword" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="loginPassword"
                    type="password"
                    value={formData.loginPassword}
                    onChange={(e) => handleChange('loginPassword', e.target.value)}
                    placeholder="exam password"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results (for completed exams) */}
          {formData.status === 'completed' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="score" className="text-sm font-medium">
                    Score
                  </label>
                  <Input
                    id="score"
                    type="number"
                    value={formData.score || ''}
                    onChange={(e) => handleChange('score', e.target.value)}
                    placeholder="15"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxScore" className="text-sm font-medium">
                    Max Score
                  </label>
                  <Input
                    id="maxScore"
                    type="number"
                    value={formData.maxScore || ''}
                    onChange={(e) => handleChange('maxScore', e.target.value)}
                    placeholder="25"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="percentile" className="text-sm font-medium">
                    Percentile
                  </label>
                  <Input
                    id="percentile"
                    type="number"
                    step="0.1"
                    value={formData.percentile || ''}
                    onChange={(e) => handleChange('percentile', e.target.value)}
                    placeholder="85.5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes
            </label>
            <textarea
              id="notes"
              className="w-full p-3 border border-gray-300 rounded-md resize-none h-20"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional notes about this exam..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Exam'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}