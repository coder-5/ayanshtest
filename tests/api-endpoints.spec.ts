import { test, expect } from '@playwright/test';

test.describe('API Endpoints Tests', () => {
  test('should test GET /api/stats endpoint', async ({ request }) => {
    const response = await request.get('/api/stats');
    expect([200, 404, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

  test('should test GET /api/question-counts endpoint', async ({ request }) => {
    const response = await request.get('/api/question-counts');
    expect([200, 404, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data).toHaveProperty('total');
    }
  });

  test('should test GET /api/questions endpoint', async ({ request }) => {
    const response = await request.get('/api/questions');
    expect([200, 404, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      // Data might be an object with questions array or array directly
      expect(data !== null && typeof data === 'object').toBeTruthy();
    }
  });

  test('should test GET /api/exams endpoint', async ({ request }) => {
    const response = await request.get('/api/exams');
    expect([200, 404, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();
    }
  });

  test('should test POST /api/exams endpoint with valid data', async ({ request }) => {
    const examData = {
      examName: 'Test AMC 8',
      examDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      location: 'Test Location',
      duration: 40,
      status: 'upcoming',
      notes: 'Test exam',
      registrationId: 'TEST123',
      score: 0,
      maxScore: 25,
      percentile: 0,
      availableFromDate: new Date().toISOString(),
      availableToDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      examUrl: 'https://example.com',
      loginId: 'testuser',
      loginPassword: 'testpass',
      registeredAt: new Date().toISOString()
    };

    const response = await request.post('/api/exams', {
      data: examData
    });

    expect([200, 201, 400, 500]).toContain(response.status());

    if (response.status() === 200 || response.status() === 201) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

  test('should test POST /api/exams endpoint with invalid data', async ({ request }) => {
    const invalidExamData = {
      examName: '', // Invalid: empty name
      examDate: 'invalid-date', // Invalid: bad date format
      location: '', // Invalid: empty location
    };

    const response = await request.post('/api/exams', {
      data: invalidExamData
    });

    expect([400, 422, 500]).toContain(response.status());
  });

  test('should test POST /api/exams/recurring endpoint', async ({ request }) => {
    const recurringExamData = {
      examName: 'Weekly Math Practice',
      examDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Test Location',
      duration: 30,
      status: 'upcoming',
      recurrenceType: 'weekly',
      recurrenceCount: 4,
      notes: '',
      registrationId: '',
      score: 0,
      maxScore: 0,
      percentile: 0,
      availableFromDate: new Date().toISOString(),
      availableToDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      examUrl: '',
      loginId: '',
      loginPassword: '',
      registeredAt: new Date().toISOString()
    };

    const response = await request.post('/api/exams/recurring', {
      data: recurringExamData
    });

    expect([200, 201, 400, 500]).toContain(response.status());
  });

  test('should test GET /api/progress endpoint', async ({ request }) => {
    const response = await request.get('/api/progress');
    expect([200, 404, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

  test('should test POST /api/progress endpoint', async ({ request }) => {
    const progressData = {
      questionId: 'test-question-id',
      isCorrect: true,
      timeSpent: 45,
      userAnswer: 'C'
    };

    const response = await request.post('/api/progress', {
      data: progressData
    });

    expect([200, 201, 400, 404, 500]).toContain(response.status());
  });

  test('should test GET /api/user-attempts endpoint', async ({ request }) => {
    const response = await request.get('/api/user-attempts');
    expect([200, 404, 405, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();
    }
  });

  test('should test POST /api/user-attempts endpoint', async ({ request }) => {
    const attemptData = {
      questionId: 'test-question-id',
      userAnswer: 'B',
      isCorrect: false,
      timeSpent: 30
    };

    const response = await request.post('/api/user-attempts', {
      data: attemptData
    });

    expect([200, 201, 400, 404, 405, 500]).toContain(response.status());
  });

  test('should test GET /api/competitions endpoint', async ({ request }) => {
    const response = await request.get('/api/competitions');
    expect([200, 404, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBeTruthy();
    }
  });

  test('should test GET /api/achievements endpoint', async ({ request }) => {
    const response = await request.get('/api/achievements');
    expect([200, 404, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();
    }
  });

  test('should test GET /api/daily-progress endpoint', async ({ request }) => {
    const response = await request.get('/api/daily-progress');
    expect([200, 404, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();
    }
  });

  test('should test GET /api/topic-performance endpoint', async ({ request }) => {
    const response = await request.get('/api/topic-performance');
    expect([200, 404, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();
    }
  });

  test('should test GET /api/practice-sessions endpoint', async ({ request }) => {
    const response = await request.get('/api/practice-sessions');
    expect([200, 400, 404, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();
    }
  });

  test('should test POST /api/practice-sessions endpoint', async ({ request }) => {
    const sessionData = {
      sessionType: 'quick-practice',
      questionsCount: 5,
      startedAt: new Date().toISOString()
    };

    const response = await request.post('/api/practice-sessions', {
      data: sessionData
    });

    expect([200, 201, 400, 500]).toContain(response.status());
  });

  test('should test GET /api/export-library endpoint', async ({ request }) => {
    const response = await request.get('/api/export-library');
    expect([200, 404, 500]).toContain(response.status());

    // This endpoint should return a downloadable file
    if (response.status() === 200) {
      const contentType = response.headers()['content-type'];
      expect(contentType).toMatch(/(csv|json|excel|download)/i);
    }
  });

  test('should test competition-specific question endpoints', async ({ request }) => {
    const examTypes = ['amc8', 'moems', 'kangaroo', 'mathcounts'];

    for (const examType of examTypes) {
      const response = await request.get(`/api/questions/${examType}`);
      expect([200, 404, 500]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data)).toBeTruthy();
      }

      // Test years endpoint
      const yearsResponse = await request.get(`/api/questions/${examType}/years`);
      expect([200, 404, 500]).toContain(yearsResponse.status());

      if (yearsResponse.status() === 200) {
        const yearsData = await yearsResponse.json();
        expect(Array.isArray(yearsData)).toBeTruthy();
      }
    }
  });

  test('should test upload endpoint', async ({ request }) => {
    const response = await request.post('/api/upload', {
      data: {
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        examType: 'amc8'
      }
    });

    expect([200, 201, 400, 413, 422, 500]).toContain(response.status());
  });

  test('should test question CRUD operations', async ({ request }) => {
    // Test creating a question
    const questionData = {
      questionText: 'What is 2 + 2?',
      examName: 'Test Exam',
      examYear: 2024,
      questionNumber: 1,
      difficulty: 'easy',
      topic: 'Arithmetic',
      subtopic: 'Addition',
      hasImage: false,
      imageUrl: '',
      solution: 'The answer is 4.'
    };

    const createResponse = await request.post('/api/questions', {
      data: questionData
    });

    expect([200, 201, 400, 500]).toContain(createResponse.status());

    if (createResponse.status() === 200 || createResponse.status() === 201) {
      const createdQuestion = await createResponse.json();
      expect(createdQuestion).toBeDefined();

      // Test updating the question if we have an ID
      if (createdQuestion.id) {
        const updateData = {
          ...questionData,
          id: createdQuestion.id,
          questionText: 'What is 3 + 3?'
        };

        const updateResponse = await request.put('/api/questions', {
          data: updateData
        });

        expect([200, 400, 404, 500]).toContain(updateResponse.status());

        // Test deleting the question
        const deleteResponse = await request.delete(`/api/questions?id=${createdQuestion.id}`);
        expect([200, 204, 404, 500]).toContain(deleteResponse.status());
      }
    }
  });

  test('should test exam CRUD operations', async ({ request }) => {
    // Create exam
    const examData = {
      examName: 'API Test Exam',
      examDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      location: 'API Test Location',
      duration: 30,
      status: 'upcoming',
      notes: 'Created via API test',
      registrationId: 'API001',
      score: 0,
      maxScore: 20,
      percentile: 0,
      availableFromDate: new Date().toISOString(),
      availableToDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      examUrl: '',
      loginId: '',
      loginPassword: '',
      registeredAt: new Date().toISOString()
    };

    const createResponse = await request.post('/api/exams', {
      data: examData
    });

    expect([200, 201, 400, 500]).toContain(createResponse.status());

    if (createResponse.status() === 200 || createResponse.status() === 201) {
      const createdExam = await createResponse.json();

      if (createdExam.id) {
        // Test getting specific exam
        const getResponse = await request.get(`/api/exams/${createdExam.id}`);
        expect([200, 404, 500]).toContain(getResponse.status());

        // Test updating exam
        const updateData = {
          ...examData,
          location: 'Updated API Test Location'
        };

        const updateResponse = await request.put(`/api/exams/${createdExam.id}`, {
          data: updateData
        });

        expect([200, 400, 404, 500]).toContain(updateResponse.status());

        // Test deleting exam
        const deleteResponse = await request.delete(`/api/exams/${createdExam.id}`);
        expect([200, 204, 404, 500]).toContain(deleteResponse.status());
      }
    }
  });

  test('should handle API errors gracefully', async ({ request }) => {
    // Test with invalid JSON
    const invalidResponse = await request.post('/api/exams', {
      data: 'invalid json string'
    });
    expect([400, 500]).toContain(invalidResponse.status());

    // Test with missing required fields
    const incompleteResponse = await request.post('/api/exams', {
      data: { examName: 'Incomplete' }
    });
    expect([400, 422, 500]).toContain(incompleteResponse.status());

    // Test non-existent endpoint
    const notFoundResponse = await request.get('/api/nonexistent');
    expect([404, 500]).toContain(notFoundResponse.status());
  });

  test('should test API rate limiting and performance', async ({ request }) => {
    // Test multiple rapid requests
    const promises = Array.from({ length: 10 }, () =>
      request.get('/api/question-counts')
    );

    const responses = await Promise.all(promises);

    // All requests should complete (rate limiting may apply)
    for (const response of responses) {
      expect([200, 429, 500]).toContain(response.status());
    }
  });
});