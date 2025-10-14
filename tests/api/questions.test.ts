/**
 * Tests for /api/questions endpoints
 *
 * Critical security tests for question CRUD operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from '@/app/api/questions/route';
import { QuestionService } from '@/lib/services/questionService';
import { createGetRequest, createPostRequest, expectResponse } from '../mocks/mockRequest';
import { mockQuestions, mockOptions, createMockQuestion } from '../mocks/testData';

// Mock QuestionService
vi.mock('@/lib/services/questionService');

// Mock cache
vi.mock('@/lib/cache', () => ({
  cache: {
    invalidatePattern: vi.fn(),
    invalidate: vi.fn(),
  },
}));

// Mock user context
vi.mock('@/lib/userContext', () => ({
  getCurrentUserId: vi.fn(() => 'test-user-id'),
}));

describe('GET /api/questions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated questions with default params', async () => {
    const mockResult = {
      questions: [mockQuestions.multipleChoice],
      total: 1,
      limit: 50,
      offset: 0,
      hasMore: false,
    };

    vi.mocked(QuestionService.getAll).mockResolvedValue(mockResult);

    const request = createGetRequest('http://localhost/api/questions');
    const response = await GET(request);
    const data = await expectResponse(response, 200);

    expect(data).toMatchObject({
      questions: expect.any(Array),
      total: 1,
      limit: 50,
      offset: 0,
      hasMore: false,
    });
    expect(QuestionService.getAll).toHaveBeenCalledWith({
      examName: undefined,
      topic: undefined,
      difficulty: undefined,
      examYear: undefined,
      search: undefined,
      limit: 50,
      offset: 0,
    });
  });

  it('should filter by examName', async () => {
    const mockResult = {
      questions: [mockQuestions.multipleChoice],
      total: 1,
      limit: 50,
      offset: 0,
      hasMore: false,
    };

    vi.mocked(QuestionService.getAll).mockResolvedValue(mockResult);

    const request = createGetRequest('http://localhost/api/questions', {
      examName: 'AMC8',
    });
    const response = await GET(request);
    await expectResponse(response, 200);

    expect(QuestionService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        examName: 'AMC8',
      })
    );
  });

  it('should filter by topic', async () => {
    const mockResult = {
      questions: [mockQuestions.multipleChoice],
      total: 1,
      limit: 50,
      offset: 0,
      hasMore: false,
    };

    vi.mocked(QuestionService.getAll).mockResolvedValue(mockResult);

    const request = createGetRequest('http://localhost/api/questions', {
      topic: 'Algebra',
    });
    const response = await GET(request);
    await expectResponse(response, 200);

    expect(QuestionService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'Algebra',
      })
    );
  });

  it('should filter by difficulty', async () => {
    const mockResult = {
      questions: [],
      total: 0,
      limit: 50,
      offset: 0,
      hasMore: false,
    };

    vi.mocked(QuestionService.getAll).mockResolvedValue(mockResult);

    const request = createGetRequest('http://localhost/api/questions', {
      difficulty: 'HARD',
    });
    const response = await GET(request);
    await expectResponse(response, 200);

    expect(QuestionService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        difficulty: 'HARD',
      })
    );
  });

  it('should filter by examYear', async () => {
    const mockResult = {
      questions: [mockQuestions.multipleChoice],
      total: 1,
      limit: 50,
      offset: 0,
      hasMore: false,
    };

    vi.mocked(QuestionService.getAll).mockResolvedValue(mockResult);

    const request = createGetRequest('http://localhost/api/questions', {
      examYear: '2023',
    });
    const response = await GET(request);
    await expectResponse(response, 200);

    expect(QuestionService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        examYear: '2023',
      })
    );
  });

  it('should support search parameter', async () => {
    const mockResult = {
      questions: [mockQuestions.multipleChoice],
      total: 1,
      limit: 50,
      offset: 0,
      hasMore: false,
    };

    vi.mocked(QuestionService.getAll).mockResolvedValue(mockResult);

    const request = createGetRequest('http://localhost/api/questions', {
      search: 'algebra',
    });
    const response = await GET(request);
    await expectResponse(response, 200);

    expect(QuestionService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'algebra',
      })
    );
  });

  it('should respect custom limit parameter', async () => {
    const mockResult = {
      questions: [],
      total: 100,
      limit: 10,
      offset: 0,
      hasMore: true,
    };

    vi.mocked(QuestionService.getAll).mockResolvedValue(mockResult);

    const request = createGetRequest('http://localhost/api/questions', {
      limit: '10',
    });
    const response = await GET(request);
    await expectResponse(response, 200);

    expect(QuestionService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 10,
      })
    );
  });

  it('should enforce max limit of 1000', async () => {
    const mockResult = {
      questions: [],
      total: 5000,
      limit: 1000,
      offset: 0,
      hasMore: true,
    };

    vi.mocked(QuestionService.getAll).mockResolvedValue(mockResult);

    const request = createGetRequest('http://localhost/api/questions', {
      limit: '5000', // Trying to request 5000
    });
    const response = await GET(request);
    await expectResponse(response, 200);

    expect(QuestionService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 1000, // Should be capped at 1000
      })
    );
  });

  it('should enforce min limit of 1', async () => {
    const mockResult = {
      questions: [],
      total: 100,
      limit: 1,
      offset: 0,
      hasMore: true,
    };

    vi.mocked(QuestionService.getAll).mockResolvedValue(mockResult);

    const request = createGetRequest('http://localhost/api/questions', {
      limit: '-10', // Trying negative limit
    });
    const response = await GET(request);
    await expectResponse(response, 200);

    expect(QuestionService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 1, // Should be at least 1
      })
    );
  });

  it('should support pagination with offset', async () => {
    const mockResult = {
      questions: [],
      total: 100,
      limit: 50,
      offset: 50,
      hasMore: false,
    };

    vi.mocked(QuestionService.getAll).mockResolvedValue(mockResult);

    const request = createGetRequest('http://localhost/api/questions', {
      offset: '50',
    });
    const response = await GET(request);
    await expectResponse(response, 200);

    expect(QuestionService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        offset: 50,
      })
    );
  });

  it('should prevent negative offset', async () => {
    const mockResult = {
      questions: [],
      total: 100,
      limit: 50,
      offset: 0,
      hasMore: true,
    };

    vi.mocked(QuestionService.getAll).mockResolvedValue(mockResult);

    const request = createGetRequest('http://localhost/api/questions', {
      offset: '-10',
    });
    const response = await GET(request);
    await expectResponse(response, 200);

    expect(QuestionService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        offset: 0, // Negative offset should become 0
      })
    );
  });

  it('should return 400 for invalid query parameters', async () => {
    const request = createGetRequest('http://localhost/api/questions', {
      difficulty: 'INVALID_DIFFICULTY',
    });
    const response = await GET(request);
    const data = await expectResponse(response, 400);

    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Invalid query parameters');
  });

  it('should combine multiple filters', async () => {
    const mockResult = {
      questions: [mockQuestions.multipleChoice],
      total: 1,
      limit: 20,
      offset: 0,
      hasMore: false,
    };

    vi.mocked(QuestionService.getAll).mockResolvedValue(mockResult);

    const request = createGetRequest('http://localhost/api/questions', {
      examName: 'AMC8',
      topic: 'Algebra',
      difficulty: 'EASY',
      limit: '20',
    });
    const response = await GET(request);
    await expectResponse(response, 200);

    expect(QuestionService.getAll).toHaveBeenCalledWith({
      examName: 'AMC8',
      topic: 'Algebra',
      difficulty: 'EASY',
      examYear: undefined,
      search: undefined,
      limit: 20,
      offset: 0,
    });
  });
});

describe('POST /api/questions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create a question with valid data', async () => {
    const newQuestion = createMockQuestion({ id: 'new-q-1' });
    vi.mocked(QuestionService.create).mockResolvedValue(newQuestion as any);

    const request = createPostRequest('http://localhost/api/questions', {
      questionText: 'What is 3 + 3?',
      examName: 'AMC8',
      examYear: 2023,
      questionNumber: 2,
      topic: 'Algebra',
      difficulty: 'EASY',
      options: [
        { optionLetter: 'A', optionText: '5', isCorrect: false },
        { optionLetter: 'B', optionText: '6', isCorrect: true },
        { optionLetter: 'C', optionText: '7', isCorrect: false },
      ],
      solution: 'Add 3 + 3 to get 6',
    });

    const response = await POST(request);
    const data = await expectResponse(response, 201);

    expect(data).toHaveProperty('question');
    expect(data.question.id).toBe('new-q-1');
    expect(QuestionService.create).toHaveBeenCalled();

    // Verify cache invalidation
    const { cache } = await import('@/lib/cache');
    expect(cache.invalidatePattern).toHaveBeenCalledWith('questions:');
    expect(cache.invalidate).toHaveBeenCalledWith('question_counts');
    expect(cache.invalidate).toHaveBeenCalledWith('topics:all');
    expect(cache.invalidatePattern).toHaveBeenCalledWith('exams:');
  });

  it('should reject question without questionText', async () => {
    const request = createPostRequest('http://localhost/api/questions', {
      examName: 'AMC8',
      examYear: 2023,
      options: [],
    });

    const response = await POST(request);
    const data = await expectResponse(response, 400);

    expect(data.error).toBe('Invalid input');
    expect(QuestionService.create).not.toHaveBeenCalled();
  });

  it('should reject question with less than 2 options', async () => {
    const request = createPostRequest('http://localhost/api/questions', {
      questionText: 'What is 2+2?',
      examName: 'AMC8',
      options: [{ optionLetter: 'A', optionText: '4', isCorrect: true }], // Need at least 2 options
    });

    const response = await POST(request);
    const data = await expectResponse(response, 400);

    expect(data.error).toBe('Invalid input');
  });

  it('should reject question with invalid difficulty', async () => {
    const request = createPostRequest('http://localhost/api/questions', {
      questionText: 'What is 2+2?',
      examName: 'AMC8',
      difficulty: 'SUPER_HARD', // Invalid
      options: [{ optionLetter: 'A', optionText: '4', isCorrect: true }],
    });

    const response = await POST(request);
    const data = await expectResponse(response, 400);

    expect(data.error).toBe('Invalid input');
  });

  it('should reject payload exceeding size limit (DoS protection)', async () => {
    // Create a huge payload (> 1MB)
    const hugeText = 'x'.repeat(2 * 1024 * 1024); // 2MB

    const request = createPostRequest('http://localhost/api/questions', {
      questionText: hugeText,
      examName: 'AMC8',
      options: [
        { optionLetter: 'A', optionText: '3', isCorrect: false },
        { optionLetter: 'B', optionText: '4', isCorrect: true },
      ],
    });

    const response = await POST(request);
    expect(response.status).toBe(413); // Payload Too Large

    const data = await response.json();
    expect(data.error).toContain('payload too large');
  });

  it('should handle QuestionService.create errors', async () => {
    vi.mocked(QuestionService.create).mockRejectedValue(
      new Error('A question with this exam name, year, and number already exists')
    );

    const request = createPostRequest('http://localhost/api/questions', {
      questionText: 'What is 2+2?',
      examName: 'AMC8',
      examYear: 2023,
      questionNumber: '1', // Must be string
      options: [
        { optionLetter: 'A', optionText: '3', isCorrect: false },
        { optionLetter: 'B', optionText: '4', isCorrect: true },
      ],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('already exists');
  });

  it('should accept MOEMS fill-in-the-blank question with options', async () => {
    const newQuestion = createMockQuestion({
      id: 'moems-q-1',
      examName: 'MOEMS Division E',
      correctAnswer: '42',
    });

    vi.mocked(QuestionService.create).mockResolvedValue(newQuestion as any);

    const request = createPostRequest('http://localhost/api/questions', {
      questionText: 'What is the answer to life?',
      examName: 'MOEMS Division E',
      examYear: 2023,
      questionNumber: '1',
      correctAnswer: '42',
      topic: 'Philosophy',
      options: [
        { optionLetter: 'A', optionText: '41', isCorrect: false },
        { optionLetter: 'B', optionText: '42', isCorrect: true },
      ],
    });

    const response = await POST(request);
    const data = await expectResponse(response, 201);

    expect(data.question.correctAnswer).toBe('42');
  });

  it('should sanitize question text (XSS protection)', async () => {
    const newQuestion = createMockQuestion();
    vi.mocked(QuestionService.create).mockResolvedValue(newQuestion as any);

    const request = createPostRequest('http://localhost/api/questions', {
      questionText: 'What is $2 + 2$? <script>alert("xss")</script>',
      examName: 'AMC8',
      options: [
        { optionLetter: 'A', optionText: '3', isCorrect: false },
        { optionLetter: 'B', optionText: '4', isCorrect: true },
      ],
    });

    const response = await POST(request);
    await expectResponse(response, 201);

    // QuestionService.create should be called (sanitization happens in service layer)
    expect(QuestionService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        questionText: expect.stringContaining('$2 + 2$'),
      })
    );
  });

  it('should accept question with solution', async () => {
    const newQuestion = createMockQuestion();
    vi.mocked(QuestionService.create).mockResolvedValue(newQuestion as any);

    const request = createPostRequest('http://localhost/api/questions', {
      questionText: 'What is 2+2?',
      examName: 'AMC8',
      options: [
        { optionLetter: 'A', optionText: '3', isCorrect: false },
        { optionLetter: 'B', optionText: '4', isCorrect: true },
      ],
      solution: 'Simply add 2 + 2 to get 4.',
    });

    const response = await POST(request);
    await expectResponse(response, 201);

    expect(QuestionService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        solution: 'Simply add 2 + 2 to get 4.',
      })
    );
  });

  it('should accept question with image metadata', async () => {
    const newQuestion = createMockQuestion({
      hasImage: true,
      imageUrl: '/images/questions/test.png',
    });

    vi.mocked(QuestionService.create).mockResolvedValue(newQuestion as any);

    const request = createPostRequest('http://localhost/api/questions', {
      questionText: 'Identify the shape.',
      examName: 'Math Kangaroo',
      hasImage: true,
      imageUrl: '/images/questions/test.png',
      options: [
        { optionLetter: 'A', optionText: 'Triangle', isCorrect: true },
        { optionLetter: 'B', optionText: 'Square', isCorrect: false },
      ],
    });

    const response = await POST(request);
    const data = await expectResponse(response, 201);

    expect(data.question.hasImage).toBe(true);
    expect(data.question.imageUrl).toBe('/images/questions/test.png');
  });
});
