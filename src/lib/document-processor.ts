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
}

export async function processDocxFile(
  buffer: ArrayBuffer,
  examName: string,
  examYear: string,
  description?: string
): Promise<ProcessedQuestion[]> {
  try {
    console.log('Processing DOCX file with mammoth...');
    // Convert DOCX to text using mammoth
    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
    const text = result.value;

    console.log('Extracted text length:', text.length);
    console.log('First 500 characters:', text.substring(0, 500));

    // Parse questions from the extracted text
    const questions = parseQuestionsFromText(text, examName, examYear, description);
    console.log('Parsed questions count:', questions.length);

    return questions;
  } catch (error) {
    console.error('Error processing DOCX file:', error);
    throw new Error('Failed to process DOCX file: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

function parseQuestionsFromText(
  text: string,
  examName: string,
  examYear: string,
  description?: string
): ProcessedQuestion[] {
  const questions: ProcessedQuestion[] = [];

  // Split text into lines and clean them
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  let currentQuestion = '';
  let questionNumber = 1;
  let isInQuestion = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Enhanced question detection patterns
    const questionPatterns = [
      /^(\d+)\.?\s*(.+)$/,                    // "1. Question text"
      /^(?:Question|Problem)\s+(\d+):?\s*(.+)$/i,  // "Question 1: Text"
      /^(\d+)\)\s*(.+)$/,                     // "1) Question text"
      /^Problem\s+(\d+)\s*(.+)$/i,            // "Problem 1 Text"
    ];

    let questionMatch = null;
    for (const pattern of questionPatterns) {
      questionMatch = line.match(pattern);
      if (questionMatch) break;
    }

    if (questionMatch) {
      // Save previous question if we have one
      if (currentQuestion.trim() && isInQuestion) {
        const processedQuestion = createQuestionObject(
          currentQuestion.trim(),
          examName,
          examYear,
          description,
          (questionNumber - 1).toString()
        );
        if (processedQuestion) {
          questions.push(processedQuestion);
        }
      }

      // Start new question
      questionNumber = parseInt(questionMatch[1]);
      currentQuestion = questionMatch[2] || '';
      isInQuestion = true;
    } else if (isInQuestion) {
      // Skip potential answer sections
      if (isAnswerSection(line)) {
        break;
      }

      // Continue building current question
      if (currentQuestion) {
        currentQuestion += ' ' + line;
      } else {
        currentQuestion = line;
      }
    }
  }

  // Add the last question
  if (currentQuestion.trim() && isInQuestion) {
    const processedQuestion = createQuestionObject(
      currentQuestion.trim(),
      examName,
      examYear,
      description,
      questionNumber.toString()
    );
    if (processedQuestion) {
      questions.push(processedQuestion);
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
  questionNumber: string
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
    if (questionNumber <= 5) return 'medium';
    if (questionNumber <= 10) return 'hard';
    return 'hard';
  }

  // For standard competition problems
  if (lowerExamName.includes('amc 8')) {
    if (questionNumber <= 8) return 'easy';
    if (questionNumber <= 16) return 'medium';
    return 'hard';
  }

  if (lowerExamName.includes('amc 10') || lowerExamName.includes('amc 12')) {
    if (questionNumber <= 5) return 'easy';
    if (questionNumber <= 15) return 'medium';
    return 'hard';
  }

  // Default difficulty assignment
  if (questionNumber <= 5) return 'easy';
  if (questionNumber <= 15) return 'medium';
  return 'hard';
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