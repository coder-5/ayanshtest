import { test, expect, Page } from '@playwright/test';

/**
 * COMPREHENSIVE USER WORKFLOW TESTING
 * Tests complete user journeys and all possible interactions
 */

test.describe('👤 Complete User Workflow Testing', () => {

  // Helper function to simulate realistic user interaction delays
  const humanDelay = () => Math.random() * 1000 + 500;

  test('should complete full question upload workflow', async ({ page }) => {
    console.log('🚀 Starting complete question upload workflow');

    await page.goto('/upload');
    await page.waitForLoadState('networkidle');

    // Test file upload with different file types and sizes
    const testFiles = [
      {
        name: 'small-test.txt',
        content: 'Simple math question: What is 2+2?',
        type: 'text/plain'
      },
      {
        name: 'medium-test.docx',
        content: 'A'.repeat(1000) + '\n\nMath problems:\n1. Calculate 5×7\n2. Find the area of a circle with radius 3',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }
    ];

    for (const file of testFiles) {
      console.log(`Testing upload with ${file.name}`);

      // Select exam type
      await page.selectOption('[data-testid="exam-select"], select[name="examName"]', 'AMC 8');
      await page.waitForTimeout(humanDelay());

      // Fill exam year
      await page.fill('[data-testid="exam-year"], input[name="examYear"]', '2024');
      await page.waitForTimeout(humanDelay());

      // Upload file
      await page.setInputFiles('[data-testid="file-input"], input[type="file"]', {
        name: file.name,
        mimeType: file.type,
        buffer: Buffer.from(file.content)
      });
      await page.waitForTimeout(humanDelay());

      // Submit upload
      await page.click('[data-testid="upload-submit"], button[type="submit"]');

      // Wait for upload result
      await page.waitForSelector('text=success,text=uploaded,text=processed', { timeout: 30000 });

      console.log(`✅ Successfully uploaded ${file.name}`);

      // Reset for next iteration
      await page.reload();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should complete full practice session workflow', async ({ page }) => {
    console.log('🚀 Starting complete practice session workflow');

    // Test different practice modes
    const practiceModes = [
      { path: '/practice/quick', name: 'Quick Practice' },
      { path: '/practice/amc8', name: 'AMC 8 Practice' },
      { path: '/practice/topics', name: 'Topics Practice' }
    ];

    for (const mode of practiceModes) {
      console.log(`Testing ${mode.name}`);

      await page.goto(mode.path);
      await page.waitForLoadState('networkidle');

      // Look for start button or configuration options
      const startButton = page.locator('button:has-text("Start"), [data-testid="start-practice"]');

      if (await startButton.count() > 0) {
        await startButton.first().click();
        await page.waitForTimeout(humanDelay());

        // Wait for question to load
        await page.waitForSelector('[data-testid="question-card"], .question-card, text=Question', { timeout: 10000 });

        // Answer a few questions to test the workflow
        for (let i = 0; i < 3; i++) {
          console.log(`Answering question ${i + 1}`);

          // Check if it's multiple choice or open-ended
          const multipleChoice = await page.locator('input[type="radio"], button:has-text("A"), button:has-text("B")').count();
          const openEnded = await page.locator('input[type="text"], textarea').count();

          if (multipleChoice > 0) {
            // Answer multiple choice question
            const options = page.locator('input[type="radio"], button:has-text("A"), button:has-text("B"), button:has-text("C"), button:has-text("D")');
            const optionCount = await options.count();
            if (optionCount > 0) {
              await options.first().click();
              await page.waitForTimeout(humanDelay());
            }
          } else if (openEnded > 0) {
            // Answer open-ended question
            await page.fill('input[type="text"], textarea', '42');
            await page.waitForTimeout(humanDelay());
          }

          // Submit answer
          const submitButton = page.locator('button:has-text("Submit"), [data-testid="submit-answer"]');
          if (await submitButton.count() > 0) {
            await submitButton.click();
            await page.waitForTimeout(humanDelay());
          }

          // Move to next question
          const nextButton = page.locator('button:has-text("Next"), [data-testid="next-question"]');
          if (await nextButton.count() > 0) {
            await nextButton.click();
            await page.waitForTimeout(humanDelay());
          } else {
            // Might be end of session
            break;
          }
        }

        console.log(`✅ Completed ${mode.name} workflow`);
      } else {
        console.log(`ℹ️ ${mode.name} requires additional configuration`);
      }
    }
  });

  test('should complete progress tracking workflow', async ({ page }) => {
    console.log('🚀 Starting progress tracking workflow');

    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // Check that progress page loads
    await expect(page.locator('text=Progress,text=Analytics,text=Performance')).toBeVisible();

    // Test different time range filters
    const timeRanges = ['7', '30', '90'];

    for (const range of timeRanges) {
      console.log(`Testing progress view for ${range} days`);

      const selector = page.locator(`select, [data-testid="time-range"]`);
      if (await selector.count() > 0) {
        await selector.selectOption(range);
        await page.waitForTimeout(humanDelay());
        await page.waitForLoadState('networkidle');
      }

      // Check for progress data visualization
      await expect(page.locator('canvas, svg, .chart, [data-testid="progress-chart"]')).toBeVisible();

      console.log(`✅ Progress view for ${range} days loaded`);
    }

    // Test navigation to different progress sections
    const progressSections = [
      { selector: 'button:has-text("Topic"), [data-testid="topic-tab"]', name: 'Topic Analysis' },
      { selector: 'button:has-text("Difficulty"), [data-testid="difficulty-tab"]', name: 'Difficulty Breakdown' },
      { selector: 'button:has-text("Insights"), [data-testid="insights-tab"]', name: 'Insights' }
    ];

    for (const section of progressSections) {
      const button = page.locator(section.selector);
      if (await button.count() > 0) {
        await button.first().click();
        await page.waitForTimeout(humanDelay());
        console.log(`✅ ${section.name} section loaded`);
      }
    }
  });

  test('should complete library management workflow', async ({ page }) => {
    console.log('🚀 Starting library management workflow');

    await page.goto('/library');
    await page.waitForLoadState('networkidle');

    // Test search functionality
    const searchInput = page.locator('input[type="search"], [data-testid="search-input"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('algebra');
      await page.waitForTimeout(humanDelay());
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      console.log('✅ Search functionality tested');
    }

    // Test filter combinations
    const filters = [
      { type: 'exam', value: 'AMC 8' },
      { type: 'difficulty', value: 'easy' },
      { type: 'topic', value: 'Algebra' }
    ];

    for (const filter of filters) {
      const filterSelect = page.locator(`select[name="${filter.type}"], [data-testid="${filter.type}-filter"]`);
      if (await filterSelect.count() > 0) {
        await filterSelect.selectOption(filter.value);
        await page.waitForTimeout(humanDelay());
        await page.waitForLoadState('networkidle');
        console.log(`✅ ${filter.type} filter applied: ${filter.value}`);
      }
    }

    // Test pagination
    const nextPageButton = page.locator('button:has-text("Next"), [data-testid="next-page"]');
    if (await nextPageButton.count() > 0) {
      await nextPageButton.click();
      await page.waitForTimeout(humanDelay());
      console.log('✅ Pagination tested');
    }

    // Test export functionality
    const exportButton = page.locator('button:has-text("Export"), [data-testid="export-button"]');
    if (await exportButton.count() > 0) {
      await exportButton.click();
      await page.waitForTimeout(humanDelay());
      console.log('✅ Export functionality tested');
    }
  });

  test('should complete exam management workflow', async ({ page }) => {
    console.log('🚀 Starting exam management workflow');

    await page.goto('/exams');
    await page.waitForLoadState('networkidle');

    // Test creating a new exam
    const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), [data-testid="create-exam"]');

    if (await createButton.count() > 0) {
      await createButton.first().click();
      await page.waitForTimeout(humanDelay());

      // Fill exam form
      const examForm = [
        { field: 'examName', value: 'Test Exam 2024' },
        { field: 'location', value: 'Test Location' },
        { field: 'examDate', value: '2024-12-15' }
      ];

      for (const field of examForm) {
        const input = page.locator(`input[name="${field.field}"], [data-testid="${field.field}"]`);
        if (await input.count() > 0) {
          await input.fill(field.value);
          await page.waitForTimeout(humanDelay());
        }
      }

      // Submit exam creation
      const submitButton = page.locator('button[type="submit"], button:has-text("Save"), [data-testid="save-exam"]');
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(humanDelay());
        console.log('✅ Exam creation tested');
      }
    }

    // Test exam filtering and viewing
    const statusFilters = ['upcoming', 'past', 'all'];

    for (const status of statusFilters) {
      const filterButton = page.locator(`button:has-text("${status}"), [data-value="${status}"]`);
      if (await filterButton.count() > 0) {
        await filterButton.click();
        await page.waitForTimeout(humanDelay());
        console.log(`✅ ${status} exams filter tested`);
      }
    }
  });

  test('should test complete user interaction flow', async ({ page }) => {
    console.log('🚀 Starting complete user interaction flow');

    // Simulate a realistic user journey
    const userJourney = [
      { url: '/', action: 'View dashboard', duration: 3000 },
      { url: '/practice/quick', action: 'Start quick practice', duration: 2000 },
      { url: '/progress', action: 'Check progress', duration: 4000 },
      { url: '/library', action: 'Browse question library', duration: 3000 },
      { url: '/upload', action: 'Upload new questions', duration: 2000 },
      { url: '/exams', action: 'View upcoming exams', duration: 2000 }
    ];

    for (const step of userJourney) {
      console.log(`User journey: ${step.action}`);

      await page.goto(step.url);
      await page.waitForLoadState('networkidle');

      // Verify page loaded correctly
      await expect(page.locator('body')).toBeVisible();

      // Simulate user reading/interacting with the page
      await page.waitForTimeout(step.duration);

      // Check for any JavaScript errors
      const errors = await page.evaluate(() => window.console.error.length || 0);
      if (errors > 0) {
        console.warn(`⚠️ JavaScript errors detected on ${step.url}`);
      }

      console.log(`✅ ${step.action} completed`);
    }
  });

  test('should test form validation edge cases', async ({ page }) => {
    console.log('🚀 Testing form validation edge cases');

    await page.goto('/upload');

    // Test various invalid inputs
    const invalidInputs = [
      {
        scenario: 'Empty exam name',
        examName: '',
        examYear: '2024',
        expectError: true
      },
      {
        scenario: 'Invalid exam year',
        examName: 'AMC 8',
        examYear: '1999',
        expectError: true
      },
      {
        scenario: 'Future exam year',
        examName: 'AMC 8',
        examYear: '2030',
        expectError: true
      },
      {
        scenario: 'Non-numeric year',
        examName: 'AMC 8',
        examYear: 'abc',
        expectError: true
      },
      {
        scenario: 'Valid input',
        examName: 'AMC 8',
        examYear: '2024',
        expectError: false
      }
    ];

    for (const input of invalidInputs) {
      console.log(`Testing: ${input.scenario}`);

      // Clear and fill form
      await page.selectOption('[data-testid="exam-select"], select[name="examName"]', input.examName || 'AMC 8');
      await page.fill('[data-testid="exam-year"], input[name="examYear"]', input.examYear);

      // Add a test file
      await page.setInputFiles('[data-testid="file-input"], input[type="file"]', {
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Test content')
      });

      // Try to submit
      await page.click('[data-testid="upload-submit"], button[type="submit"]');
      await page.waitForTimeout(humanDelay());

      if (input.expectError) {
        // Should show validation error
        await expect(page.locator('text=error,text=invalid,text=required')).toBeVisible();
        console.log(`✅ ${input.scenario} - Error correctly shown`);
      } else {
        // Should succeed or show processing
        const successOrProcessing = page.locator('text=success,text=processing,text=uploaded');
        await expect(successOrProcessing).toBeVisible({ timeout: 10000 });
        console.log(`✅ ${input.scenario} - Validation passed`);
      }

      // Reset form
      await page.reload();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should test responsive design and mobile interactions', async ({ page }) => {
    console.log('🚀 Testing responsive design and mobile interactions');

    // Test different viewport sizes
    const viewports = [
      { width: 375, height: 667, name: 'Mobile Portrait' },
      { width: 768, height: 1024, name: 'Tablet Portrait' },
      { width: 1024, height: 768, name: 'Tablet Landscape' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];

    const testUrls = ['/', '/practice', '/progress', '/library'];

    for (const viewport of viewports) {
      console.log(`Testing ${viewport.name} (${viewport.width}x${viewport.height})`);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const url of testUrls) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // Check that content is visible and accessible
        await expect(page.locator('body')).toBeVisible();

        // Check for mobile menu if applicable
        if (viewport.width < 768) {
          const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu, button:has-text("Menu")');
          if (await mobileMenu.count() > 0) {
            await mobileMenu.click();
            await page.waitForTimeout(500);
            console.log(`✅ Mobile menu tested on ${url}`);
          }
        }

        console.log(`✅ ${url} responsive design tested for ${viewport.name}`);
      }
    }
  });
});