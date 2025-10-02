import { Question } from '@/types';

// Transform database question to consistent frontend format
export function transformQuestion(question: any): Question {
  const result: Question = {
    id: question.id,
    questionText: question.questionText || '',
    examName: question.examName || null,
    examYear: question.examYear || null,
    questionNumber: question.questionNumber || '1',
    difficulty: question.difficulty || 'MEDIUM',
    topic: question.topic || 'Mixed',
    subtopic: question.subtopic || 'Problem Solving',
    hasImage: question.hasImage || false,
    imageUrl: question.imageUrl || '',
    timeLimit: question.timeLimit || null,
    createdAt: question.createdAt || new Date(),
    updatedAt: question.updatedAt || new Date(),
    options: question.options?.map((opt: any) => ({
      id: opt.id,
      questionId: opt.questionId,
      label: opt.optionLetter,    // Map to consistent field name
      text: opt.optionText,       // Map to consistent field name
      isCorrect: opt.isCorrect,
      // Keep original fields for backward compatibility
      optionLetter: opt.optionLetter,
      optionText: opt.optionText
    })) || []
  };

  if (question.solution) {
    result.solution = {
      id: question.solution.id,
      questionId: question.solution.questionId,
      solutionText: question.solution.solutionText,
      approach: question.solution.approach,
      difficulty: question.solution.difficulty,
      timeEstimate: question.solution.timeEstimate,
      keyInsights: question.solution.keyInsights,
      commonMistakes: question.solution.commonMistakes,
      alternativeApproaches: question.solution.alternativeApproaches,
      successRate: question.solution.successRate,
      createdAt: question.solution.createdAt,
      updatedAt: question.solution.updatedAt
    };
  }

  return result;
}

// Transform array of questions
export function transformQuestions(questions: any[]): Question[] {
  return questions.map(transformQuestion);
}

// Transform question for PracticeSession component
export function transformQuestionForPractice(question: any): any {
  return {
    id: question.id,
    text: question.questionText, // PracticeSession expects 'text'
    type: question.options && question.options.length > 0 ? 'multiple-choice' as const : 'open-ended' as const,
    competition: question.examName && question.examYear ? `${question.examName} ${question.examYear}` : (question.examName || 'Topic Practice'),
    examName: question.examName, // QuestionCard expects 'examName'
    examYear: question.examYear,
    topic: question.topic,
    difficulty: question.difficulty,
    hasImage: question.hasImage,
    imageUrl: question.imageUrl,
    solution: question.solution, // Keep original solution structure
    options: question.options?.map((opt: any) => ({
      id: opt.id,
      label: opt.optionLetter, // PracticeSession expects 'label'
      text: opt.optionText,    // PracticeSession expects 'text'
      isCorrect: opt.isCorrect
    })),
    solutions: question.solution ? [{
      id: question.solution.id,
      text: question.solution.solutionText,
      type: 'step-by-step'
    }] : undefined
  };
}