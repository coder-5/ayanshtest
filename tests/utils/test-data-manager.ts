/**
 * Test Data Manager Utility
 * Handles test data setup and cleanup for comprehensive testing
 */

interface TestData {
  users: Array<{
    id: string;
    name: string;
  }>;
  questions: Array<{
    id: string;
    questionText: string;
    examName: string;
    examYear: number;
    difficulty: string;
    topic: string;
    options?: Array<{
      optionLetter: string;
      optionText: string;
      isCorrect: boolean;
    }>;
  }>;
  exams: Array<{
    name: string;
    year: number;
    location: string;
    date: string;
  }>;
}

export class TestDataManager {
  private testData: TestData = {
    users: [],
    questions: [],
    exams: []
  };

  async setupTestData(): Promise<void> {
    // Create test users
    this.testData.users = [
      { id: 'test-user-1', name: 'Test User 1' },
      { id: 'test-user-2', name: 'Test User 2' },
      { id: 'test-user-comprehensive', name: 'Comprehensive Test User' }
    ];

    // Create comprehensive test questions covering all combinations
    const examNames = ['AMC8', 'Kangaroo', 'MOEMS', 'MathCounts', 'Others'];
    const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
    const topics = ['Algebra', 'Geometry', 'Number Theory', 'Combinatorics', 'Probability'];
    const years = [2020, 2021, 2022, 2023, 2024];

    let questionId = 1;
    for (const examName of examNames) {
      for (const difficulty of difficulties) {
        for (const topic of topics) {
          for (const year of years) {
            // Multiple choice question
            this.testData.questions.push({
              id: `test-question-mc-${questionId}`,
              questionText: `Test ${difficulty} ${topic} question ${questionId} for ${examName}. What is 2 + 2?`,
              examName,
              examYear: year,
              difficulty,
              topic,
              options: [
                { optionLetter: 'A', optionText: '3', isCorrect: false },
                { optionLetter: 'B', optionText: '4', isCorrect: true },
                { optionLetter: 'C', optionText: '5', isCorrect: false },
                { optionLetter: 'D', optionText: '6', isCorrect: false }
              ]
            });
            questionId++;

            // Open-ended question
            this.testData.questions.push({
              id: `test-question-oe-${questionId}`,
              questionText: `Test ${difficulty} ${topic} open-ended question ${questionId} for ${examName}. Calculate: 3 × 7 = ?`,
              examName,
              examYear: year,
              difficulty,
              topic
            });
            questionId++;
          }
        }
      }
    }

    // Create test exams
    this.testData.exams = examNames.flatMap(name =>
      years.map(year => ({
        name,
        year,
        location: `Test Location for ${name} ${year}`,
        date: `${year}-06-15`
      }))
    );
  }

  async createTestDataInDB(): Promise<void> {
    // Create questions in database
    for (const question of this.testData.questions) {
      try {
        const response = await fetch('http://192.168.1.197:3000/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: question,
            options: question.options || [],
            solution: {
              solutionText: 'Test solution',
              approach: 'Test approach',
              timeEstimate: 2,
              difficulty: question.difficulty
            }
          })
        });

        if (!response.ok) {
          console.warn(`Failed to create question ${question.id}:`, await response.text());
        }
      } catch (error) {
        console.warn(`Error creating question ${question.id}:`, error);
      }
    }

    // Create exams in database
    for (const exam of this.testData.exams) {
      try {
        const response = await fetch('http://192.168.1.197:3000/api/exams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exam)
        });

        if (!response.ok) {
          console.warn(`Failed to create exam ${exam.name} ${exam.year}:`, await response.text());
        }
      } catch (error) {
        console.warn(`Error creating exam ${exam.name} ${exam.year}:`, error);
      }
    }
  }

  async cleanupTestData(): Promise<void> {
    console.log('🧹 Cleaning up test data...');

    // Delete test questions
    for (const question of this.testData.questions) {
      try {
        const response = await fetch(`http://192.168.1.197:3000/api/questions/${question.id}`, {
          method: 'DELETE'
        });
        if (!response.ok && response.status !== 404) {
          console.warn(`Failed to delete question ${question.id}`);
        }
      } catch (error) {
        console.warn(`Error deleting question ${question.id}:`, error);
      }
    }

    // Delete test user attempts
    for (const user of this.testData.users) {
      try {
        const response = await fetch(`http://192.168.1.197:3000/api/user-attempts?userId=${user.id}`, {
          method: 'DELETE'
        });
        if (!response.ok && response.status !== 404) {
          console.warn(`Failed to delete user attempts for ${user.id}`);
        }
      } catch (error) {
        console.warn(`Error deleting user attempts for ${user.id}:`, error);
      }
    }

    console.log('✅ Test data cleanup completed');
  }

  getTestData(): TestData {
    return this.testData;
  }
}

// Export singleton instance
export const testDataManager = new TestDataManager();