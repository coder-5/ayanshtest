'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Trash2, Upload, X } from "lucide-react"
import Link from 'next/link'

type QuestionType = 'mcq' | 'fill-blanks' | 'text-answer'

interface Option {
  optionLetter: string
  optionText: string
  isCorrect: boolean
}

export default function AddQuestionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [questionType, setQuestionType] = useState<QuestionType>('text-answer')
  const [questionText, setQuestionText] = useState('')
  const [examName, setExamName] = useState('')
  const [examYear, setExamYear] = useState(2024)
  const [questionNumber, setQuestionNumber] = useState('')
  const [difficulty, setDifficulty] = useState('MEDIUM')
  const [topic, setTopic] = useState('')
  const [subtopic, setSubtopic] = useState('')
  const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined)
  const [solutionText, setSolutionText] = useState('')
  const [approach, setApproach] = useState('')

  // Image uploads
  const [questionImage, setQuestionImage] = useState<File | null>(null)
  const [questionImagePreview, setQuestionImagePreview] = useState<string | null>(null)
  const [solutionImage, setSolutionImage] = useState<File | null>(null)
  const [solutionImagePreview, setSolutionImagePreview] = useState<string | null>(null)
  const questionImageRef = useRef<HTMLInputElement>(null)
  const solutionImageRef = useRef<HTMLInputElement>(null)

  // Different answer types
  const [textAnswer, setTextAnswer] = useState('')
  const [fillBlanksAnswer, setFillBlanksAnswer] = useState<string[]>([''])
  const [options, setOptions] = useState<Option[]>([
    { optionLetter: 'A', optionText: '', isCorrect: false },
    { optionLetter: 'B', optionText: '', isCorrect: false },
    { optionLetter: 'C', optionText: '', isCorrect: false },
    { optionLetter: 'D', optionText: '', isCorrect: false },
    { optionLetter: 'E', optionText: '', isCorrect: false }
  ])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Image handling functions
  const handleImageUpload = (file: File | null, type: 'question' | 'solution') => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (type === 'question') {
        setQuestionImage(file)
        setQuestionImagePreview(result)
      } else {
        setSolutionImage(file)
        setSolutionImagePreview(result)
      }
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (type: 'question' | 'solution') => {
    if (type === 'question') {
      setQuestionImage(null)
      setQuestionImagePreview(null)
      if (questionImageRef.current) questionImageRef.current.value = ''
    } else {
      setSolutionImage(null)
      setSolutionImagePreview(null)
      if (solutionImageRef.current) solutionImageRef.current.value = ''
    }
  }

  // Answer handling functions
  const updateOption = (index: number, field: keyof Option, value: string | boolean) => {
    const newOptions = [...options]
    if (field === 'isCorrect' && value === true) {
      // Ensure only one correct answer
      newOptions.forEach((opt, i) => opt.isCorrect = i === index)
    } else {
      newOptions[index] = { ...newOptions[index], [field]: value }
    }
    setOptions(newOptions)
  }

  const addOption = () => {
    const nextLetter = String.fromCharCode(65 + options.length) // A, B, C, D, E, F...
    setOptions([...options, { optionLetter: nextLetter, optionText: '', isCorrect: false }])
  }

  const removeOption = (index: number) => {
    if (options.length > 2) { // Keep at least 2 options
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const addBlank = () => {
    setFillBlanksAnswer([...fillBlanksAnswer, ''])
  }

  const updateBlank = (index: number, value: string) => {
    const newBlanks = [...fillBlanksAnswer]
    newBlanks[index] = value
    setFillBlanksAnswer(newBlanks)
  }

  const removeBlank = (index: number) => {
    if (fillBlanksAnswer.length > 1) {
      setFillBlanksAnswer(fillBlanksAnswer.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!questionText.trim()) {
        alert('Question text is required')
        return
      }
      if (!topic.trim()) {
        alert('Topic is required')
        return
      }

      // Validate answers based on question type
      if (questionType === 'mcq') {
        const hasCorrectAnswer = options.some(opt => opt.isCorrect && opt.optionText.trim())
        if (!hasCorrectAnswer) {
          alert('Please mark one option as correct and provide answer text')
          return
        }
        const validOptions = options.filter(opt => opt.optionText.trim())
        if (validOptions.length < 2) {
          alert('Please provide at least 2 answer options')
          return
        }
      } else if (questionType === 'text-answer') {
        if (!textAnswer.trim()) {
          alert('Please provide the correct text answer')
          return
        }
      } else if (questionType === 'fill-blanks') {
        const validBlanks = fillBlanksAnswer.filter(blank => blank.trim())
        if (validBlanks.length === 0) {
          alert('Please provide at least one fill-in-the-blank answer')
          return
        }
      }

      // Prepare options based on question type
      let formattedOptions: any[] = []

      if (questionType === 'mcq') {
        const validOptions = options.filter(opt => opt.optionText.trim())
        formattedOptions = validOptions.map(opt => ({
          optionLetter: opt.optionLetter,
          optionText: opt.optionText.trim(),
          isCorrect: opt.isCorrect
        }))
      }
      // For text-answer and fill-blanks, don't create options
      // This will make the question open-ended (free text input)

      const questionData = {
        question: {
          questionText: questionText.trim(),
          examName: examName === 'No Exam' ? null : examName.trim(),
          examYear: examName === 'No Exam' ? null : examYear,
          questionNumber: examName === 'No Exam' ? null : questionNumber.trim() || null,
          difficulty,
          topic: topic.trim(),
          subtopic: subtopic.trim(),
          timeLimit: timeLimit,
          hasImage: questionImage !== null,
        },
        options: formattedOptions,
        solution: {
          solutionText: questionType === 'text-answer' ? textAnswer.trim() :
                       questionType === 'fill-blanks' ? fillBlanksAnswer.filter(blank => blank.trim()).join(', ') :
                       solutionText.trim(),
          approach: approach.trim(),
          difficulty: 'MEDIUM', // Default solution difficulty
        }
      }

      // First, create the question without image
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionData)
      })

      if (response.ok) {
        const result = await response.json()
        const questionId = result.data?.id

        // If there's an image and we have a question ID, upload the image
        if (questionImage && questionId) {
          try {
            const formData = new FormData()
            formData.append('file', questionImage)
            formData.append('questionId', questionId)
            formData.append('userId', 'ayansh')
            formData.append('description', 'Question diagram')
            formData.append('replaceExisting', 'true')

            const uploadResponse = await fetch('/api/diagrams/upload', {
              method: 'POST',
              body: formData
            })

            if (!uploadResponse.ok) {
              // Failed to upload question diagram, but question was created
            }
          } catch (uploadError) {
            // Error uploading question diagram
          }
        }

        // If there's a solution image and we have a question ID, upload the solution image
        if (solutionImage && questionId) {
          try {
            const formData = new FormData()
            formData.append('file', solutionImage)
            formData.append('questionId', questionId)
            formData.append('userId', 'ayansh')
            formData.append('description', 'Solution diagram')
            formData.append('replaceExisting', 'false') // Don't replace question diagram

            const uploadResponse = await fetch('/api/diagrams/upload', {
              method: 'POST',
              body: formData
            })

            if (!uploadResponse.ok) {
              // Failed to upload solution diagram, but question was created
            }
          } catch (uploadError) {
            // Error uploading solution diagram
          }
        }

        alert('Question added successfully!')
        router.push('/')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to add question'}`)
      }
    } catch (error) {
      alert('Error adding question. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Add New Question</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
          <CardDescription>Enter the question information and answer choices</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Question Type */}
            <div className="space-y-2">
              <Label htmlFor="questionType">Question Type *</Label>
              <Select value={questionType} onValueChange={(value: QuestionType) => setQuestionType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select question type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                  <SelectItem value="text-answer">Text Answer</SelectItem>
                  <SelectItem value="fill-blanks">Fill in the Blanks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="examName">Exam Name</Label>
                <Select value={examName} onValueChange={setExamName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No Exam">No Exam (Topic Practice)</SelectItem>
                    <SelectItem value="Practice">Practice/Custom</SelectItem>
                    <SelectItem value="AMC8">AMC8</SelectItem>
                    <SelectItem value="Kangaroo">Kangaroo</SelectItem>
                    <SelectItem value="MOEMS">MOEMS</SelectItem>
                    <SelectItem value="MathCounts">MathCounts</SelectItem>
                    <SelectItem value="CML">CML</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="examYear">Exam Year</Label>
                <Input
                  id="examYear"
                  type="number"
                  min="2000"
                  max="2030"
                  value={examYear}
                  onChange={(e) => setExamYear(parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="questionNumber">Question Number</Label>
                <Input
                  id="questionNumber"
                  placeholder="e.g., 15 or 2A"
                  value={questionNumber}
                  onChange={(e) => setQuestionNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty *</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Easy</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min="1"
                  placeholder="Optional"
                  value={timeLimit || ''}
                  onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic *</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Algebra, Geometry"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtopic">Subtopic</Label>
                <Input
                  id="subtopic"
                  placeholder="e.g., Quadratic Equations"
                  value={subtopic}
                  onChange={(e) => setSubtopic(e.target.value)}
                />
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-4">
              <Label htmlFor="questionText">Question Text *</Label>
              <Textarea
                id="questionText"
                placeholder="Enter the question text. You can use LaTeX for math: $x^2 + y^2 = r^2$"
                className="min-h-24"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                required
              />

              {/* Question Image Upload */}
              <div className="space-y-3">
                <Label>Question Image (Optional)</Label>
                <div className="flex items-center gap-4">
                  <input
                    ref={questionImageRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files?.[0] || null, 'question')}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => questionImageRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                  {questionImagePreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeImage('question')}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
                {questionImagePreview && (
                  <div className="mt-3">
                    <img
                      src={questionImagePreview}
                      alt="Question preview"
                      className="max-w-md max-h-48 object-contain border rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Answer Section */}
            <div className="space-y-4">
              <Label>Answers *</Label>

              {questionType === 'mcq' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Multiple Choice Options</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      disabled={options.length >= 8}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={option.isCorrect}
                            onChange={() => updateOption(index, 'isCorrect', true)}
                            className="h-4 w-4"
                          />
                          <Label className="font-medium">{option.optionLetter})</Label>
                        </div>

                        <Input
                          placeholder="Enter answer option text"
                          value={option.optionText}
                          onChange={(e) => updateOption(index, 'optionText', e.target.value)}
                          className="flex-1"
                        />

                        {options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">
                    Select the radio button to mark the correct answer
                  </p>
                </div>
              )}

              {questionType === 'text-answer' && (
                <div className="space-y-3">
                  <Label>Correct Answer</Label>
                  <Textarea
                    placeholder="Enter the correct text answer..."
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    className="min-h-16"
                  />
                  <p className="text-sm text-gray-500">
                    For mathematical expressions, use LaTeX format: $x^2 + 2x + 1 = 0$
                  </p>
                </div>
              )}

              {questionType === 'fill-blanks' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Fill in the Blank Answers</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addBlank}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Blank
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {fillBlanksAnswer.map((blank, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Label className="font-medium">Blank {index + 1}:</Label>
                        <Input
                          placeholder="Enter answer for this blank"
                          value={blank}
                          onChange={(e) => updateBlank(index, e.target.value)}
                          className="flex-1"
                        />
                        {fillBlanksAnswer.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBlank(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">
                    Use underscores (_____) in your question text to indicate where blanks should appear
                  </p>
                </div>
              )}
            </div>

            {/* Solution (Optional) */}
            <div className="space-y-4">
              <Label>Solution (Optional)</Label>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter step-by-step solution explanation"
                  className="min-h-24"
                  value={solutionText}
                  onChange={(e) => setSolutionText(e.target.value)}
                />
                <Input
                  placeholder="Solution approach (e.g., algebraic, geometric)"
                  value={approach}
                  onChange={(e) => setApproach(e.target.value)}
                />

                {/* Solution Image Upload */}
                <div className="space-y-3">
                  <Label>Solution Image (Optional)</Label>
                  <div className="flex items-center gap-4">
                    <input
                      ref={solutionImageRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files?.[0] || null, 'solution')}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => solutionImageRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Solution Image
                    </Button>
                    {solutionImagePreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeImage('solution')}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                  {solutionImagePreview && (
                    <div className="mt-3">
                      <img
                        src={solutionImagePreview}
                        alt="Solution preview"
                        className="max-w-md max-h-48 object-contain border rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Adding Question...' : 'Add Question'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}