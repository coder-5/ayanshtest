import mammoth from 'mammoth';

export interface ProcessedQuestion {
  questionText: string;
  examName: string;
  examYear: number;
  questionNumber: string;
  topic: string;
  subtopic?: string;
  difficulty: string;
  timeLimit?: number;
  hasImage: boolean;
  imageUrl?: string;
  answerChoices?: Array<{
    letter: string;
    text: string;
    isCorrect: boolean;
  }>;
}

export async function processDocxFile(
  buffer: ArrayBuffer,
  examName: string,
  examYear: string,
  description?: string
): Promise<ProcessedQuestion[]> {
  try {
    // Convert DOCX to text using mammoth
    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });

    // Clean the extracted text to remove null bytes and problematic characters
    const cleanedText = cleanTextForProcessing(result.value);

    // Parse questions from the extracted text
    const questions = parseQuestionsFromText(cleanedText, examName, examYear, description);

    return questions;
  } catch (error) {
    throw new Error('Failed to process DOCX file: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

function cleanTextForProcessing(text: string): string {
  if (!text) return '';

  // Convert to string and handle potential null/undefined values
  const safeText = String(text);

  // Remove null bytes and other problematic characters that can cause DB issues
  return safeText
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters except \t, \n, \r
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n') // Convert remaining \r to \n
    .trim();
}

function parseQuestionsFromText(
  text: string,
  examName: string,
  examYear: string,
  description?: string
): ProcessedQuestion[] {
  const questions: ProcessedQuestion[] = [];
  const processedQuestionNumbers = new Set<number>(); // Track processed question numbers

  // Split text into lines and clean them
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  let currentQuestion = '';
  let currentAnswerChoices: Array<{letter: string; text: string; isCorrect: boolean}> = [];
  let questionNumber = 1;
  let isInQuestion = false;
  let isInAnswerChoices = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Enhanced question detection patterns - more restrictive to avoid false positives
    const questionPatterns = [
      /^(\d+)\.?\s+(.+)$/,                    // "1. Question text" (requires space after number)
      /^(?:Question|Problem)\s+(\d+):?\s*(.+)$/i,  // "Question 1: Text"
      /^(\d+)\)\s+(.+)$/,                     // "1) Question text" (requires space after parenthesis)
    ];

    // Answer choice patterns
    const answerChoicePattern = /^([A-E])\)\s*(.+)$/i;
    const answerKeyPattern = /^(?:Answer|Solution):\s*([A-E])\b/i;

    let questionMatch = null;
    let detectedQuestionNumber = null;

    // Find the first matching pattern and extract question number
    for (const pattern of questionPatterns) {
      questionMatch = line.match(pattern);
      if (questionMatch) {
        detectedQuestionNumber = parseInt(questionMatch[1]);
        // Only accept if this is a new question number we haven't seen
        if (!processedQuestionNumbers.has(detectedQuestionNumber) && questionMatch[2]?.trim().length > 10) {
          break;
        } else {
          questionMatch = null; // Reject this match
        }
      }
    }

    const answerChoiceMatch = line.match(answerChoicePattern);
    const answerKeyMatch = line.match(answerKeyPattern);

    if (questionMatch && detectedQuestionNumber) {
      // Save previous question if we have one
      if (currentQuestion.trim() && isInQuestion && !processedQuestionNumbers.has(questionNumber)) {
        const processedQuestion = createQuestionObject(
          currentQuestion.trim(),
          examName,
          examYear,
          description,
          questionNumber.toString(),
          currentAnswerChoices.length > 0 ? currentAnswerChoices : undefined
        );
        if (processedQuestion) {
          questions.push(processedQuestion);
          processedQuestionNumbers.add(questionNumber);
        }
      }

      // Start new question
      questionNumber = detectedQuestionNumber;
      currentQuestion = questionMatch[2] || '';
      currentAnswerChoices = [];
      isInQuestion = true;
      isInAnswerChoices = false;
    } else if (answerChoiceMatch && (isInQuestion || isInAnswerChoices)) {
      // Found an answer choice
      const letter = answerChoiceMatch[1].toUpperCase();
      const choiceText = answerChoiceMatch[2].trim();

      currentAnswerChoices.push({
        letter,
        text: choiceText,
        isCorrect: false // Will be set when we find the answer key
      });

      isInAnswerChoices = true;
      isInQuestion = false; // No longer in question text
    } else if (answerKeyMatch) {
      // Found answer key - mark the correct choice
      const correctLetter = answerKeyMatch[1].toUpperCase();
      currentAnswerChoices.forEach(choice => {
        choice.isCorrect = choice.letter === correctLetter;
      });
    } else if (isInQuestion && !isAnswerSection(line)) {
      // Continue building current question
      if (currentQuestion) {
        currentQuestion += ' ' + line;
      } else {
        currentQuestion = line;
      }
    } else if (isAnswerSection(line)) {
      // Hit answer section, break out
      break;
    }
  }

  // Add the last question
  if (currentQuestion.trim() && (isInQuestion || isInAnswerChoices) && !processedQuestionNumbers.has(questionNumber)) {
    const processedQuestion = createQuestionObject(
      currentQuestion.trim(),
      examName,
      examYear,
      description,
      questionNumber.toString(),
      currentAnswerChoices.length > 0 ? currentAnswerChoices : undefined
    );
    if (processedQuestion) {
      questions.push(processedQuestion);
      processedQuestionNumbers.add(questionNumber);
    }
  }

  return questions;
}

function isAnswerSection(line: string): boolean {
  const lowerLine = line.toLowerCase();
  return (
    lowerLine.includes('answer') &&
    (lowerLine.includes('key') || lowerLine.includes('section') || lowerLine.includes(':'))
  ) ||
  lowerLine.includes('solutions') ||
  lowerLine.includes('solution:') ||
  lowerLine.startsWith('answers:');
}

function createQuestionObject(
  questionText: string,
  examName: string,
  examYear: string,
  _description: string | undefined,
  questionNumber: string,
  answerChoices?: Array<{letter: string; text: string; isCorrect: boolean}>
): ProcessedQuestion | null {
  // Clean up the question text
  const cleanText = questionText.trim();

  // Skip if text is too short to be a valid question
  if (cleanText.length < 10) {
    return null;
  }

  // Determine topic based on exam name and question content
  const topic = determineTopicFromContent(cleanText, examName);

  // Determine subtopic for more specific categorization
  const subtopic = determineSubtopic(cleanText, topic);

  // Determine difficulty
  const difficulty = determineDifficulty(cleanText, examName, parseInt(questionNumber));

  const question: ProcessedQuestion = {
    questionText: cleanText,
    examName: examName,
    examYear: examYear ? parseInt(examYear) : new Date().getFullYear(),
    questionNumber: questionNumber,
    topic: topic,
    difficulty: difficulty,
    timeLimit: getTimeLimit(examName),
    hasImage: false, // Will be determined later if images are processed
  };

  if (subtopic) {
    question.subtopic = subtopic;
  }

  if (answerChoices && answerChoices.length > 0) {
    question.answerChoices = answerChoices;
  }

  return question;
}

function determineTopicFromContent(text: string, examName: string): string {
  const lowerText = text.toLowerCase();
  const lowerExamName = examName.toLowerCase();

  // If exam name contains topic information, use it as primary indicator
  if (lowerExamName.includes('algebra')) return 'Algebra';
  if (lowerExamName.includes('geometry')) return 'Geometry';
  if (lowerExamName.includes('number theory')) return 'Number Theory';
  if (lowerExamName.includes('combinatorics') || lowerExamName.includes('probability')) return 'Combinatorics';
  if (lowerExamName.includes('statistics')) return 'Statistics';

  // Content-based topic detection
  const topicKeywords = {
    'Algebra': [
      'equation', 'function', 'variable', 'solve', 'polynomial', 'quadratic',
      'linear', 'system', 'inequality', 'expression', 'coefficient', 'root',
      'factor', 'expand', 'simplify', 'substitution'
    ],
    'Geometry': [
      'triangle', 'circle', 'angle', 'polygon', 'area', 'perimeter',
      'volume', 'surface area', 'coordinate', 'line', 'point', 'parallel',
      'perpendicular', 'congruent', 'similar', 'theorem', 'proof', 'radius',
      'diameter', 'circumference', 'rectangle', 'square', 'rhombus'
    ],
    'Number Theory': [
      'prime', 'factor', 'divisible', 'remainder', 'modular', 'gcd', 'lcm',
      'integer', 'digit', 'base', 'divisibility', 'congruence', 'fibonacci',
      'perfect square', 'cube', 'even', 'odd'
    ],
    'Combinatorics': [
      'permutation', 'combination', 'arrange', 'choose', 'ways', 'order',
      'sequence', 'counting', 'selection', 'arrangement', 'factorial',
      'binomial coefficient'
    ],
    'Probability': [
      'probability', 'chance', 'likely', 'random', 'outcome', 'event',
      'sample space', 'independent', 'conditional', 'expected value',
      'distribution', 'dice', 'coin', 'card'
    ],
    'Statistics': [
      'mean', 'median', 'mode', 'average', 'variance', 'deviation',
      'data', 'frequency', 'histogram', 'correlation', 'regression',
      'sample', 'population', 'survey'
    ]
  };

  let maxScore = 0;
  let bestTopic = 'General Math';

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        score++;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestTopic = topic;
    }
  }

  return bestTopic;
}

function determineSubtopic(text: string, mainTopic: string): string | undefined {
  const lowerText = text.toLowerCase();

  const subtopicMap: Record<string, Record<string, string[]>> = {
    'Algebra': {
      'Linear Equations': ['linear', 'slope', 'y-intercept', 'line'],
      'Quadratic Equations': ['quadratic', 'parabola', 'x^2', 'square'],
      'Polynomials': ['polynomial', 'degree', 'coefficient'],
      'Systems': ['system', 'simultaneous', 'multiple equations'],
      'Inequalities': ['inequality', 'greater than', 'less than', '>', '<']
    },
    'Geometry': {
      'Triangles': ['triangle', 'trigonometry', 'pythagorean'],
      'Circles': ['circle', 'radius', 'diameter', 'circumference', 'arc'],
      'Polygons': ['polygon', 'pentagon', 'hexagon', 'octagon'],
      'Coordinate Geometry': ['coordinate', 'plane', 'graph', 'x-axis', 'y-axis'],
      '3D Geometry': ['volume', 'surface area', 'cube', 'sphere', 'cylinder']
    },
    'Number Theory': {
      'Prime Numbers': ['prime', 'composite'],
      'Divisibility': ['divisible', 'factor', 'multiple'],
      'Modular Arithmetic': ['modular', 'remainder', 'congruence'],
      'Integer Properties': ['integer', 'whole number', 'counting number']
    },
    'Combinatorics': {
      'Permutations': ['permutation', 'arrange', 'order matters'],
      'Combinations': ['combination', 'choose', 'select'],
      'Counting Principles': ['counting', 'fundamental principle']
    },
    'Probability': {
      'Basic Probability': ['basic probability', 'simple event'],
      'Conditional Probability': ['conditional', 'given that'],
      'Independent Events': ['independent', 'unrelated'],
      'Expected Value': ['expected', 'average outcome']
    }
  };

  if (subtopicMap[mainTopic]) {
    for (const [subtopic, keywords] of Object.entries(subtopicMap[mainTopic])) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          return subtopic;
        }
      }
    }
  }

  return undefined;
}

function determineDifficulty(_text: string, examName: string, questionNumber: number): string {
  const lowerExamName = examName.toLowerCase();

  // Advanced/Master level sets are typically harder
  if (lowerExamName.includes('advanced') || lowerExamName.includes('master')) {
    if (questionNumber <= 5) return 'MEDIUM';
    if (questionNumber <= 10) return 'HARD';
    return 'HARD';
  }

  // For standard competition problems
  if (lowerExamName.includes('amc 8')) {
    if (questionNumber <= 8) return 'EASY';
    if (questionNumber <= 16) return 'MEDIUM';
    return 'HARD';
  }

  if (lowerExamName.includes('amc 10') || lowerExamName.includes('amc 12')) {
    if (questionNumber <= 5) return 'EASY';
    if (questionNumber <= 15) return 'MEDIUM';
    return 'HARD';
  }

  // Default difficulty assignment
  if (questionNumber <= 5) return 'EASY';
  if (questionNumber <= 15) return 'MEDIUM';
  return 'HARD';
}

function getTimeLimit(examName: string): number {
  const examLower = examName.toLowerCase();

  if (examLower.includes('amc 8')) return 3;
  if (examLower.includes('amc 10') || examLower.includes('amc 12')) return 4;
  if (examLower.includes('aime')) return 9;
  if (examLower.includes('mathcounts')) return 2;
  if (examLower.includes('kangaroo')) return 3;
  if (examLower.includes('advanced') || examLower.includes('master')) return 6;

  return 5; // Default 5 minutes
}