'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, Plus, Trophy, Users, Trash2, Edit, Search, Grid, List, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getExamIcon } from '@/lib/dynamic-data'
import { ExamSchedule as ExamType } from '@/types'

interface ExamScheduleProps {
  onAddExam: () => void
  onEditExam: (exam: ExamType) => void
}

export default function ExamSchedule({ onAddExam, onEditExam }: ExamScheduleProps) {
  const [exams, setExams] = useState<ExamType[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact')
  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    fetchExams()
  }, [filter])

  const fetchExams = async () => {
    try {
      const url = filter === 'all' ? '/api/exams' : `/api/exams?status=${filter}`
      const response = await fetch(url)
      const data = await response.json()

      // Ensure data is an array
      if (Array.isArray(data)) {
        setExams(data)
      } else {
        console.error('API returned non-array data:', data)
        setExams([])
      }
    } catch (error) {
      console.error('Error fetching exams:', error)
      setExams([])
    } finally {
      setLoading(false)
    }
  }

  const deleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam?')) {
      return
    }

    console.log(`Attempting to delete exam with ID: ${examId}`)

    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: 'DELETE',
      })

      console.log(`DELETE response status: ${response.status} ${response.statusText}`)
      console.log(`DELETE response headers:`, Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        console.log('Exam deleted successfully, refreshing list')
        // Refresh the exams list
        fetchExams()
        alert('Exam deleted successfully!')
      } else {
        // Get the response text first to see what we're dealing with
        const responseText = await response.text()
        console.error('DELETE failed - Response text:', responseText)
        console.error('DELETE failed - Response status:', response.status)

        let errorData;
        try {
          // Try to parse as JSON
          errorData = JSON.parse(responseText)
          console.log('Parsed error data:', errorData)
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', parseError)
          errorData = { error: `Server returned: ${responseText || 'Unknown error'}` }
        }

        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`
        console.error('Final error message:', errorMessage)
        alert(`Failed to delete exam: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Network or other error deleting exam:', error)
      alert(`Error deleting exam: ${error instanceof Error ? error.message : 'Network error - please try again.'}`)
    }
  }

  // Ensure exams is always an array before filtering
  const examArray = Array.isArray(exams) ? exams : []

  // Filter exams based on search term and filters
  const filteredExams = examArray.filter(exam => {
    const matchesSearch = searchTerm === '' ||
      exam.examName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exam.notes?.toLowerCase() || '').includes(searchTerm.toLowerCase())

    const matchesFilter = filter === 'all' || exam.status === filter

    return matchesSearch && matchesFilter
  })

  const upcomingExams = filteredExams.filter(exam => exam.status === 'upcoming')
  const completedExams = filteredExams.filter(exam => exam.status === 'completed')

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Exam Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading exams...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Ayansh's Exam Schedule
            </CardTitle>
            <Button onClick={onAddExam} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Exam
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by exam name, location, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex rounded-lg border bg-background p-1">
                <Button
                  variant={viewMode === 'compact' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('compact')}
                  className="h-8 px-3"
                >
                  <Grid className="h-4 w-4 mr-1" />
                  Compact
                </Button>
                <Button
                  variant={viewMode === 'detailed' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('detailed')}
                  className="h-8 px-3"
                >
                  <List className="h-4 w-4 mr-1" />
                  Detailed
                </Button>
              </div>
            </div>

            {/* Results Summary */}
            {searchTerm && (
              <div className="text-sm text-gray-600">
                Found {filteredExams.length} exam{filteredExams.length !== 1 ? 's' : ''} matching "{searchTerm}"
              </div>
            )}
          </div>

          {examArray.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No exams scheduled</h3>
              <p className="text-sm">Add your first exam to start tracking Ayansh's competition schedule.</p>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No exams found</h3>
              <p className="text-sm">Try adjusting your search or filter criteria.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setFilter('all')
                }}
                className="mt-3"
              >
                Clear filters
              </Button>
            </div>
          ) : viewMode === 'compact' ? (
            <CompactExamView
              exams={filteredExams}
              onEdit={onEditExam}
              onDelete={deleteExam}
            />
          ) : (
            <div className="space-y-4">
              {/* Upcoming Exams */}
              {upcomingExams.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Upcoming Exams ({upcomingExams.length})
                  </h3>
                  <div className="grid gap-3">
                    {upcomingExams.map((exam) => (
                      <ExamCard
                        key={exam.id}
                        exam={exam}
                        onEdit={() => onEditExam(exam)}
                        onDelete={() => deleteExam(exam.id)}
                        isUpcoming={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Exams */}
              {completedExams.length > 0 && filter !== 'upcoming' && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-green-600" />
                    Completed Exams ({completedExams.length})
                  </h3>
                  <div className="grid gap-3">
                    {completedExams.map((exam) => (
                      <ExamCard
                        key={exam.id}
                        exam={exam}
                        onEdit={() => onEditExam(exam)}
                        onDelete={() => deleteExam(exam.id)}
                        isUpcoming={false}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Other status exams */}
              {filter !== 'all' && filter !== 'upcoming' && filter !== 'completed' && (
                <div className="grid gap-3">
                  {filteredExams.map((exam) => (
                    <ExamCard
                      key={exam.id}
                      exam={exam}
                      onEdit={() => onEditExam(exam)}
                      onDelete={() => deleteExam(exam.id)}
                      isUpcoming={false}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface CompactExamViewProps {
  exams: ExamType[]
  onEdit: (exam: ExamType) => void
  onDelete: (examId: string) => void
}

function CompactExamView({ exams, onEdit, onDelete }: CompactExamViewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'missed': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }


  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getDaysUntil = (dateString: string | Date) => {
    return Math.floor((new Date(dateString).getTime() - new Date().getTime()) / 86400000)
  }

  // Group exams by status for better organization
  const groupedExams = {
    upcoming: exams.filter(exam => exam.status === 'upcoming'),
    completed: exams.filter(exam => exam.status === 'completed'),
    others: exams.filter(exam => !['upcoming', 'completed'].includes(exam.status))
  }

  return (
    <div className="space-y-6">
      {/* Compact Table View */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 font-medium text-sm">Exam</th>
              <th className="text-left p-3 font-medium text-sm">Date & Time</th>
              <th className="text-left p-3 font-medium text-sm">Location</th>
              <th className="text-left p-3 font-medium text-sm">Status</th>
              <th className="text-left p-3 font-medium text-sm">Score</th>
              <th className="text-right p-3 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Upcoming Exams First */}
            {groupedExams.upcoming.map((exam) => {
              const daysUntil = getDaysUntil(exam.examDate)
              return (
                <tr key={exam.id} className="border-b hover:bg-blue-50/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getExamIcon(exam.examName)}</span>
                      <div>
                        <div className="font-medium text-sm">{exam.examName}</div>
                        {exam.duration !== null && exam.duration > 0 && (
                          <div className="text-xs text-gray-500">{exam.duration} min</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm">
                      <div className="font-medium">{formatDate(exam.examDate)}</div>
                      <div className="text-gray-500">{formatTime(exam.examDate)}</div>
                      {daysUntil >= 0 && (
                        <div className="text-xs text-blue-600 font-medium">
                          {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm text-gray-600 max-w-[150px] truncate" title={exam.location}>
                      {exam.location}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge className={`${getStatusColor(exam.status)} text-xs`}>
                      {exam.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="text-sm text-gray-400">—</div>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(exam)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(exam.id)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}

            {/* Completed Exams */}
            {groupedExams.completed.map((exam) => (
              <tr key={exam.id} className="border-b hover:bg-green-50/30 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getExamIcon(exam.examName)}</span>
                    <div>
                      <div className="font-medium text-sm">{exam.examName}</div>
                      {exam.duration !== null && exam.duration > 0 && (
                        <div className="text-xs text-gray-500">{exam.duration} min</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-sm">
                    <div className="font-medium">{formatDate(exam.examDate)}</div>
                    <div className="text-gray-500">{formatTime(exam.examDate)}</div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-sm text-gray-600 max-w-[150px] truncate" title={exam.location}>
                    {exam.location}
                  </div>
                </td>
                <td className="p-3">
                  <Badge className={`${getStatusColor(exam.status)} text-xs`}>
                    {exam.status}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="text-sm">
                    {(exam.score || 0) > 0 && (exam.maxScore || 0) > 0 ? (
                      <div>
                        <div className="font-medium">{exam.score}/{exam.maxScore}</div>
                        <div className="text-xs text-gray-500">
                          {Math.round(((exam.score || 0) / (exam.maxScore || 1)) * 100)}%
                          {(exam.percentile || 0) > 0 && ` • ${exam.percentile}th`}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400">—</div>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(exam)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(exam.id)}
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {/* Other Status Exams */}
            {groupedExams.others.map((exam) => (
              <tr key={exam.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getExamIcon(exam.examName)}</span>
                    <div>
                      <div className="font-medium text-sm">{exam.examName}</div>
                      {exam.duration !== null && exam.duration > 0 && (
                        <div className="text-xs text-gray-500">{exam.duration} min</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-sm">
                    <div className="font-medium">{formatDate(exam.examDate)}</div>
                    <div className="text-gray-500">{formatTime(exam.examDate)}</div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-sm text-gray-600 max-w-[150px] truncate" title={exam.location}>
                    {exam.location}
                  </div>
                </td>
                <td className="p-3">
                  <Badge className={`${getStatusColor(exam.status)} text-xs`}>
                    {exam.status}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="text-sm text-gray-400">—</div>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(exam)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(exam.id)}
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-xl font-bold text-blue-600">{groupedExams.upcoming.length}</div>
          <div className="text-xs text-gray-600">Upcoming</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-xl font-bold text-green-600">{groupedExams.completed.length}</div>
          <div className="text-xs text-gray-600">Completed</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-xl font-bold text-orange-600">
            {groupedExams.completed.reduce((sum, exam) => (exam.score || 0) > 0 ? sum + (exam.score || 0) : sum, 0)}
          </div>
          <div className="text-xs text-gray-600">Total Points</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-xl font-bold text-purple-600">
            {groupedExams.completed.length > 0 ? Math.round(
              groupedExams.completed
                .filter(exam => (exam.score || 0) > 0 && (exam.maxScore || 0) > 0)
                .reduce((sum, exam) => sum + ((exam.score || 0) / (exam.maxScore || 1)), 0) * 100 /
              groupedExams.completed.filter(exam => (exam.score || 0) > 0 && (exam.maxScore || 0) > 0).length
            ) || 0 : 0}%
          </div>
          <div className="text-xs text-gray-600">Avg Score</div>
        </div>
      </div>
    </div>
  )
}

interface ExamCardProps {
  exam: ExamType
  onEdit: () => void
  onDelete: () => void
  isUpcoming: boolean
}

function ExamCard({ exam, onEdit, onDelete, isUpcoming }: ExamCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'missed': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Card view formatting functions (different from table view)
  const formatDateCard = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTimeCard = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className={`hover:shadow-md transition-shadow ${
      isUpcoming ? 'border-blue-200 bg-blue-50/30' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="text-2xl">{getExamIcon(exam.examName)}</div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-lg">{exam.examName}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDateCard(exam.examDate)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTimeCard(exam.examDate)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {exam.location}
                    </div>
                    {exam.duration !== null && exam.duration > 0 && (
                      <div className="text-gray-500">
                        {exam.duration} min
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(exam.status)}>
                    {exam.status}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit()
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete()
                      }}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Results for completed exams */}
              {exam.status === 'completed' && ((exam.score || 0) > 0 || (exam.percentile || 0) > 0) && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-4 text-sm">
                    {(exam.score || 0) > 0 && (exam.maxScore || 0) > 0 && (
                      <div className="flex items-center gap-1">
                        <Trophy className="h-4 w-4 text-green-600" />
                        Score: {exam.score}/{exam.maxScore} ({Math.round(((exam.score || 0) / (exam.maxScore || 1)) * 100)}%)
                      </div>
                    )}
                    {(exam.percentile || 0) > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-green-600" />
                        {exam.percentile}th percentile
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Registration info */}
              {exam.registrationId?.trim() && (
                <div className="mt-2 text-xs text-gray-500">
                  Registration: {exam.registrationId}
                  {exam.registeredAt && (
                    <span className="ml-2">({formatDateCard(exam.registeredAt)})</span>
                  )}
                </div>
              )}

              {/* Availability Window (if different from exam date) */}
              {(exam.availableFromDate !== exam.examDate || exam.availableToDate !== exam.examDate) && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                  <div className="font-medium">Availability Window:</div>
                  <div>From: {formatDateCard(exam.availableFromDate)} {formatTimeCard(exam.availableFromDate)}</div>
                  <div>Until: {formatDateCard(exam.availableToDate)} {formatTimeCard(exam.availableToDate)}</div>
                </div>
              )}

              {/* Exam URL and Login Info */}
              {exam.examUrl?.trim() && (
                <div className="mt-2 text-xs text-blue-600">
                  <a href={exam.examUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    🔗 Exam Portal
                  </a>
                  {exam.loginId?.trim() && (
                    <div className="mt-1 text-gray-600">
                      Login: {exam.loginId}
                      {exam.loginPassword?.trim() && (
                        <span className="ml-2">Password: ••••••••</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {exam.notes?.trim() && (
                <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {exam.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}