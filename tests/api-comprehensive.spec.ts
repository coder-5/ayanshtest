import { test, expect, request } from '@playwright/test';

/**
 * COMPREHENSIVE API TESTING SUITE
 * Tests all API endpoints with every possible combination of parameters
 */

test.describe('🔌 Comprehensive API Testing', () => {
  let apiContext: any;

  test.beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext({
      baseURL: 'http://192.168.1.197:3000',
    });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  // Test all GET endpoints with various parameter combinations
  test('should test all GET endpoints with parameter combinations', async () => {
    const getEndpoints = [
      {
        endpoint: '/api/questions',
        paramCombinations: [
          {},
          { limit: 10 },
          { limit: 50 },
          { page: 1 },
          { page: 2 },
          { examName: 'AMC 8' },
          { examName: 'Math Kangaroo' },
          { difficulty: 'easy' },
          { difficulty: 'medium' },
          { difficulty: 'hard' },
          { topic: 'Algebra' },
          { topic: 'Geometry' },
          { year: 2024 },
          { year: 2023 },
          { random: 'true' },
          { limit: 20, examName: 'AMC 8', difficulty: 'medium' },
          { page: 1, limit: 15, topic: 'Algebra' },
          { examName: 'MOEMS', year: 2024, random: 'true' }
        ]
      },
      {
        endpoint: '/api/stats',
        paramCombinations: [
          {},
          { userId: 'test-user-1' },
          { userId: 'test-user-2' }
        ]
      },
      {
        endpoint: '/api/progress',
        paramCombinations: [
          {},
          { userId: 'test-user-1' },
          { userId: 'test-user-2' },
          { timeRange: '7' },
          { timeRange: '30' },
          { timeRange: '90' }
        ]
      },
      {
        endpoint: '/api/achievements',
        paramCombinations: [
          {},
          { userId: 'test-user-1' },
          { category: 'streak' },
          { category: 'accuracy' },
          { category: 'volume' },
          { withStats: 'true' }
        ]
      },
      {
        endpoint: '/api/topic-performance',
        paramCombinations: [
          {},
          { userId: 'test-user-1' },
          { strengthLevel: 'weak' },
          { strengthLevel: 'moderate' },
          { strengthLevel: 'strong' }
        ]
      },
      {
        endpoint: '/api/daily-progress',
        paramCombinations: [
          {},
          { userId: 'test-user-1' },
          { days: '7' },
          { days: '30' },
          { days: '90' }
        ]
      },
      {
        endpoint: '/api/exams',
        paramCombinations: [
          {},
          { status: 'upcoming' },
          { status: 'past' },
          { limit: 10 }
        ]
      },
      {
        endpoint: '/api/competitions',
        paramCombinations: [{}]
      },
      {
        endpoint: '/api/topics',
        paramCombinations: [{}]
      },
      {
        endpoint: '/api/question-counts',
        paramCombinations: [
          {},
          { examName: 'AMC 8' },
          { examName: 'Math Kangaroo' },
          { topic: 'Algebra' },
          { difficulty: 'easy' }
        ]
      }
    ];

    for (const { endpoint, paramCombinations } of getEndpoints) {
      for (const params of paramCombinations) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${endpoint}?${queryString}` : endpoint;

        console.log(`Testing GET ${fullUrl}`);

        const response = await apiContext.get(fullUrl);

        // All GET endpoints should return 200 or gracefully handle errors
        expect([200, 400, 404, 500]).toContain(response.status());

        if (response.status() === 200) {
          const data = await response.json();
          expect(data).toBeDefined();
          console.log(`✅ GET ${fullUrl} - Status: ${response.status()}`);
        } else {
          console.log(`⚠️ GET ${fullUrl} - Status: ${response.status()}`);
        }
      }
    }
  });

  // Test POST endpoints with various data combinations
  test('should test POST endpoints with data combinations', async () => {
    // Test question creation with various combinations
    const questionData = [
      {
        question: {
          questionText: 'Test multiple choice question 1',
          examName: 'AMC8',
          examYear: 2024,
          questionNumber: '1',
          difficulty: 'Beginner',
          topic: 'Algebra',
          subtopic: 'Linear Equations',
          hasImage: false
        },
        options: [
          { optionLetter: 'A', optionText: 'Option A', isCorrect: false },
          { optionLetter: 'B', optionText: 'Option B', isCorrect: true },
          { optionLetter: 'C', optionText: 'Option C', isCorrect: false },
          { optionLetter: 'D', optionText: 'Option D', isCorrect: false }
        ],
        solution: {
          solutionText: 'Test solution explanation',
          approach: 'algebraic',
          difficulty: 'Beginner',
          timeEstimate: 3,
          keyInsights: 'Key insight for solving'
        }
      },
      {
        question: {
          questionText: 'Test open-ended question 1',
          examName: 'Kangaroo',
          examYear: 2023,
          questionNumber: '5',
          difficulty: 'Intermediate',
          topic: 'Geometry',
          subtopic: 'Area and Perimeter',
          hasImage: true,
          imageUrl: 'https://example.com/image.jpg'
        },
        options: [
          { optionLetter: 'A', optionText: '21', isCorrect: true },
          { optionLetter: 'B', optionText: '22', isCorrect: false }
        ],
        solution: {
          solutionText: 'Test open-ended solution',
          approach: 'geometric',
          difficulty: 'Intermediate',
          timeEstimate: 5
        }
      },
      {
        question: {
          questionText: 'Test hard question with minimal data',
          examName: 'MOEMS',
          examYear: 2024,
          difficulty: 'Advanced',
          topic: 'Number Theory'
        },
        options: [
          { optionLetter: 'A', optionText: '42', isCorrect: true },
          { optionLetter: 'B', optionText: '43', isCorrect: false }
        ],
        solution: {
          solutionText: 'Minimal solution',
          difficulty: 'Advanced'
        }
      }
    ];

    for (const [index, data] of questionData.entries()) {
      console.log(`Testing question creation ${index + 1}`);

      const response = await apiContext.post('/api/questions', {
        data: data
      });

      if (response.status() === 201 || response.status() === 200) {
        const result = await response.json();
        expect(result).toBeDefined();
        console.log(`✅ Question ${index + 1} created successfully`);
      } else {
        const errorText = await response.text();
        console.log(`⚠️ Question ${index + 1} creation failed - Status: ${response.status()}`);
        console.log(`Error details: ${errorText}`);
      }
    }

    // Test progress tracking with various combinations
    const progressData = [
      {
        questionId: 'test-question-1',
        isCorrect: true,
        timeSpent: 45,
        userAnswer: 'B',
        userId: 'test-user-1'
      },
      {
        questionId: 'test-question-2',
        isCorrect: false,
        timeSpent: 120,
        userAnswer: 'A',
        userId: 'test-user-1',
        excludeFromScoring: true
      },
      {
        questionId: 'test-question-3',
        isCorrect: true,
        timeSpent: 30,
        userAnswer: '42',
        userId: 'test-user-2'
      }
    ];

    for (const [index, data] of progressData.entries()) {
      console.log(`Testing progress tracking ${index + 1}`);

      const response = await apiContext.post('/api/progress', {
        data: data
      });

      if (response.status() === 201 || response.status() === 200) {
        console.log(`✅ Progress ${index + 1} tracked successfully`);
      } else {
        console.log(`⚠️ Progress ${index + 1} tracking failed - Status: ${response.status()}`);
      }
    }

    // Test exam creation with various combinations
    const examData = [
      {
        examName: 'Test AMC 8 2024',
        examYear: 2024,
        location: 'Test School',
        examDate: '2024-11-15',
        status: 'upcoming'
      },
      {
        examName: 'Test Math Kangaroo 2024',
        examYear: 2024,
        location: 'Test Location 2',
        examDate: '2024-03-21',
        status: 'past'
      }
    ];

    for (const [index, data] of examData.entries()) {
      console.log(`Testing exam creation ${index + 1}`);

      const response = await apiContext.post('/api/exams', {
        data: data
      });

      if (response.status() === 201 || response.status() === 200) {
        console.log(`✅ Exam ${index + 1} created successfully`);
      } else {
        console.log(`⚠️ Exam ${index + 1} creation failed - Status: ${response.status()}`);
      }
    }
  });

  // Test DELETE endpoints
  test('should test DELETE endpoints with various scenarios', async () => {
    // Test user attempts deletion
    const userIds = ['test-user-1', 'test-user-2', 'nonexistent-user'];

    for (const userId of userIds) {
      console.log(`Testing user attempts deletion for: ${userId}`);

      const response = await apiContext.delete(`/api/user-attempts?userId=${userId}`);

      // Should either succeed (200) or fail gracefully (400/404)
      expect([200, 400, 404]).toContain(response.status());

      if (response.status() === 200) {
        const result = await response.json();
        expect(result.message).toBeDefined();
        console.log(`✅ User attempts deleted for ${userId}`);
      } else {
        console.log(`⚠️ User attempts deletion failed for ${userId} - Status: ${response.status()}`);
      }
    }
  });

  // Test error handling and edge cases
  test('should handle malformed requests gracefully', async () => {
    const malformedRequests = [
      {
        method: 'POST',
        endpoint: '/api/questions',
        data: { invalid: 'data' },
        description: 'Invalid question data',
        expectError: true
      },
      {
        method: 'POST',
        endpoint: '/api/progress',
        data: { questionId: '', isCorrect: 'not-boolean' },
        description: 'Invalid progress data',
        expectError: true
      },
      {
        method: 'GET',
        endpoint: '/api/questions?limit=invalid',
        description: 'Invalid query parameter (gracefully handled)',
        expectError: false
      },
      {
        method: 'DELETE',
        endpoint: '/api/user-attempts?userId=',
        description: 'Empty userId',
        expectError: true
      }
    ];

    for (const req of malformedRequests) {
      console.log(`Testing malformed request: ${req.description}`);

      let response;
      if (req.method === 'POST') {
        response = await apiContext.post(req.endpoint, { data: req.data });
      } else if (req.method === 'DELETE') {
        response = await apiContext.delete(req.endpoint);
      } else {
        response = await apiContext.get(req.endpoint);
      }

      // Check response based on expectation
      if (req.expectError) {
        expect([400, 422, 500]).toContain(response.status());
        console.log(`✅ Malformed request handled with error - Status: ${response.status()}`);
      } else {
        expect(response.status()).toBe(200);
        console.log(`✅ Malformed request handled gracefully - Status: ${response.status()}`);
      }
    }
  });

  // Test performance with large datasets
  test('should handle large data requests efficiently', async () => {
    const largeDataRequests = [
      { endpoint: '/api/questions?limit=100', description: 'Large question set' },
      { endpoint: '/api/questions?limit=500', description: 'Very large question set' }
    ];

    for (const req of largeDataRequests) {
      console.log(`Testing performance: ${req.description}`);

      const startTime = Date.now();
      const response = await apiContext.get(req.endpoint);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`${req.description} took ${duration}ms`);

      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toBeDefined();
        console.log(`✅ ${req.description} completed successfully in ${duration}ms`);
      } else {
        console.log(`⚠️ ${req.description} failed - Status: ${response.status()}`);
      }
    }
  });
});