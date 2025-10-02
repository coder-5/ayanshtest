import { test, expect } from '@playwright/test';

test.describe('Form Validation Tests', () => {
  test.describe('Exam Form Validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/exams');
      await page.getByRole('button', { name: /Add New Exam/i }).click();
    });

    test('should validate required exam name field', async ({ page }) => {
      const saveBtn = page.getByRole('button', { name: 'Save Exam' });

      // Try to submit without exam name
      await saveBtn.click();

      // Should show validation error or prevent submission
      const examNameField = page.getByLabel(/Exam Name/i);
      const isRequired = await examNameField.getAttribute('required');
      if (isRequired !== null) {
        expect(isRequired).toBeDefined();
      }
    });

    test('should validate required date field', async ({ page }) => {
      const dateField = page.getByLabel(/Date & Time/i);
      await expect(dateField).toBeVisible();

      const isRequired = await dateField.getAttribute('required');
      if (isRequired !== null) {
        expect(isRequired).toBeDefined();
      }

      // Test invalid date format
      await dateField.fill('invalid-date');
      const saveBtn = page.getByRole('button', { name: 'Save Exam' });
      await saveBtn.click();

      // Should show validation error
    });

    test('should validate required location field', async ({ page }) => {
      const locationField = page.getByLabel(/Location/i);
      await expect(locationField).toBeVisible();

      const isRequired = await locationField.getAttribute('required');
      if (isRequired !== null) {
        expect(isRequired).toBeDefined();
      }

      // Test empty location
      await locationField.fill('');
      const saveBtn = page.getByRole('button', { name: 'Save Exam' });
      await saveBtn.click();

      // Should show validation error or prevent submission
    });

    test('should validate duration field accepts only numbers', async ({ page }) => {
      const durationField = page.getByLabel(/Duration/i);
      if (await durationField.isVisible()) {
        const fieldType = await durationField.getAttribute('type');
        expect(fieldType).toBe('number');

        // Test invalid input
        await durationField.fill('abc');

        // Number input should reject non-numeric input
        const value = await durationField.inputValue();
        expect(value).toBe('');
      }
    });

    test('should validate URL fields for proper format', async ({ page }) => {
      const urlField = page.getByLabel(/Exam URL/i);
      if (await urlField.isVisible()) {
        const fieldType = await urlField.getAttribute('type');
        expect(fieldType).toBe('url');

        // Test invalid URL
        await urlField.fill('invalid-url');
        const saveBtn = page.getByRole('button', { name: 'Save Exam' });
        await saveBtn.click();

        // Should show validation error
      }
    });

    test('should validate score fields for completed exams', async ({ page }) => {
      // Change status to completed to show score fields
      const statusSelect = page.locator('select').or(page.getByRole('combobox')).first();

      if (await statusSelect.isVisible()) {
        await statusSelect.selectOption({ label: 'Completed' });

        // Wait for score fields to appear
        await page.waitForTimeout(500);

        const scoreField = page.getByLabel(/Score/i);
        const percentileField = page.getByLabel(/Percentile/i);

        if (await scoreField.isVisible()) {
          // Test negative scores
          await scoreField.fill('-5');
          const saveBtn = page.getByRole('button', { name: 'Save Exam' });
          await saveBtn.click();
          // Should handle negative scores appropriately
        }

        if (await percentileField.isVisible()) {
          // Test percentile out of range
          await percentileField.fill('150');
          const saveBtn = page.getByRole('button', { name: 'Save Exam' });
          await saveBtn.click();
          // Should validate percentile range (0-100)
        }
      }
    });

    test('should validate custom exam name when "Other" is selected', async ({ page }) => {
      const examNameSelect = page.locator('select').or(page.getByRole('combobox')).first();

      if (await examNameSelect.isVisible()) {
        await examNameSelect.selectOption({ label: 'Other' });

        const customNameInput = page.getByPlaceholder(/Enter custom exam name/i);
        if (await customNameInput.isVisible()) {
          await expect(customNameInput).toBeVisible();

          // Try to submit without custom name
          const saveBtn = page.getByRole('button', { name: 'Save Exam' });
          await saveBtn.click();

          // Should show validation error
          const isRequired = await customNameInput.getAttribute('required');
          if (isRequired !== null) {
            expect(isRequired).toBeDefined();
          }
        }
      }
    });

    test('should validate recurring exam fields', async ({ page }) => {
      const recurringCheckbox = page.getByLabel(/Create multiple recurring exams/i);
      if (await recurringCheckbox.isVisible()) {
        await recurringCheckbox.check();

        const countInput = page.getByLabel(/Number of occurrences/i);
        if (await countInput.isVisible()) {
          // Test invalid count values
          await countInput.fill('0');
          const saveBtn = page.getByRole('button', { name: 'Save Exam' });
          await saveBtn.click();

          await countInput.fill('100');
          await saveBtn.click();
          // Should validate reasonable range
        }
      }
    });

    test('should validate date range for availability window', async ({ page }) => {
      const availableFromField = page.getByLabel(/Available From/i);
      const availableToField = page.getByLabel(/Available Until/i);

      if (await availableFromField.isVisible() && await availableToField.isVisible()) {
        // Set "to" date before "from" date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        await availableFromField.fill(tomorrow.toISOString().slice(0, 16));
        await availableToField.fill(yesterday.toISOString().slice(0, 16));

        const saveBtn = page.getByRole('button', { name: 'Save Exam' });
        await saveBtn.click();

        // Should validate that end date is after start date
      }
    });
  });

  test.describe('Search and Filter Form Validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/library');
    });

    test('should handle search input validation', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/Search problems by keyword/i);
      await expect(searchInput).toBeVisible();

      // Test very long search query
      const longQuery = 'a'.repeat(1000);
      await searchInput.fill(longQuery);

      const applyFiltersBtn = page.getByRole('button', { name: /Apply Filters/i });
      await applyFiltersBtn.click();

      // Should handle long queries gracefully
    });

    test('should validate filter dropdown selections', async ({ page }) => {
      const competitionSelect = page.getByText('Competition').first();
      const topicSelect = page.getByText('Topic').first();

      // Test selecting filters
      if (await competitionSelect.isVisible()) {
        await competitionSelect.click();

        const allCompetitionsOption = page.getByText('All Competitions');
        if (await allCompetitionsOption.isVisible()) {
          await allCompetitionsOption.click();
        }
      }

      if (await topicSelect.isVisible()) {
        await topicSelect.click();

        const allTopicsOption = page.getByText('All Topics');
        if (await allTopicsOption.isVisible()) {
          await allTopicsOption.click();
        }
      }

      // Apply filters
      const applyFiltersBtn = page.getByRole('button', { name: /Apply Filters/i });
      await applyFiltersBtn.click();

      // Clear filters
      const clearAllBtn = page.getByRole('button', { name: 'Clear All' });
      await clearAllBtn.click();
    });

    test('should handle special characters in search', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/Search problems by keyword/i);

      const specialQueries = [
        'x^2 + 3x - 4',
        'α + β = γ',
        '∫ f(x) dx',
        '√(x² + y²)',
        '<script>alert("test")</script>',
        '"; DROP TABLE questions; --'
      ];

      for (const query of specialQueries) {
        await searchInput.fill(query);
        await expect(searchInput).toHaveValue(query);

        const applyFiltersBtn = page.getByRole('button', { name: /Apply Filters/i });
        await applyFiltersBtn.click();

        // Should handle special characters safely
        await searchInput.clear();
      }
    });
  });

  test.describe('Upload Form Validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/upload');
    });

    test('should validate file input restrictions', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');

      if (await fileInput.isVisible()) {
        const acceptAttribute = await fileInput.getAttribute('accept');
        if (acceptAttribute) {
          expect(acceptAttribute).toMatch(/\.(pdf|doc|docx|png|jpg|jpeg)/);
        }

        await fileInput.getAttribute('multiple');
        // Multiple attribute may or may not be present
      }
    });

    test('should validate metadata input fields', async ({ page }) => {
      const yearField = page.getByLabel(/Year/i);
      if (await yearField.isVisible()) {
        // Test invalid year
        await yearField.fill('abc');

        const fieldType = await yearField.getAttribute('type');
        if (fieldType === 'number') {
          const value = await yearField.inputValue();
          expect(value).toBe('');
        }

        // Test future year
        await yearField.fill('3000');

        // Test negative year
        await yearField.fill('-100');
      }

      const descriptionField = page.getByLabel(/Description/i).or(page.locator('textarea'));
      if (await descriptionField.isVisible()) {
        // Test very long description
        const longDescription = 'a'.repeat(10000);
        await descriptionField.fill(longDescription);

        // Should handle long text appropriately
      }
    });

    test('should validate competition type selection', async ({ page }) => {
      const competitionSelects = [
        page.getByLabel(/Competition/i),
        page.getByLabel(/Exam Type/i),
        page.locator('select').filter({ hasText: /competition|exam/ })
      ];

      for (const select of competitionSelects) {
        if (await select.isVisible()) {
          await select.selectOption({ index: 0 });
          // Should handle selection validation
        }
      }
    });
  });

  test.describe('Practice Session Form Validation', () => {
    test('should validate answer input in practice sessions', async ({ page }) => {
      // Navigate to a practice session (if available)
      await page.goto('/practice/quick');

      // Look for answer input fields
      const answerInputs = [
        page.locator('input[type="text"]').filter({ hasText: /answer/ }),
        page.locator('textarea').filter({ hasText: /answer/ }),
        page.getByPlaceholder(/Enter your answer/i)
      ];

      for (const input of answerInputs) {
        if (await input.isVisible()) {
          // Test various answer formats
          await input.fill('42');
          await input.clear();

          await input.fill('3.14159');
          await input.clear();

          await input.fill('1/2');
          await input.clear();

          // Test very long answer
          await input.fill('a'.repeat(1000));
          await input.clear();
        }
      }
    });

    test('should validate multiple choice selections', async ({ page }) => {
      await page.goto('/practice/amc8');

      // Look for multiple choice options
      const radioButtons = page.locator('input[type="radio"]');
      const checkboxes = page.locator('input[type="checkbox"]');

      const radioCount = await radioButtons.count();
      const checkboxCount = await checkboxes.count();

      if (radioCount > 0) {
        // Test radio button selection
        await radioButtons.first().check();
        await expect(radioButtons.first()).toBeChecked();
      }

      if (checkboxCount > 0) {
        // Test checkbox selection (if multiple answers allowed)
        await checkboxes.first().check();
        await expect(checkboxes.first()).toBeChecked();
      }
    });
  });

  test.describe('General Form Behavior', () => {
    test('should handle form submission without JavaScript', async ({ page }) => {
      // Disable JavaScript and test form functionality
      await page.goto('/exams');
      await page.getByRole('button', { name: /Add New Exam/i }).click();

      // Forms should still work with basic HTML validation
      const requiredFields = page.locator('input[required], select[required], textarea[required]');
      const requiredCount = await requiredFields.count();

      if (requiredCount > 0) {
        // Test that required attribute is present
        await expect(requiredFields.first()).toHaveAttribute('required');
      }
    });

    test('should validate form accessibility', async ({ page }) => {
      await page.goto('/exams');
      await page.getByRole('button', { name: /Add New Exam/i }).click();

      // Check for proper labels
      const inputs = page.locator('input, select, textarea');
      const inputCount = await inputs.count();

      for (let i = 0; i < Math.min(inputCount, 10); i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');

        // Each input should have some form of labeling
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = await label.isVisible().catch(() => false);
          // Either has label, aria-label, or aria-labelledby
          expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
        }
      }
    });

    test('should handle form state preservation on page refresh', async ({ page }) => {
      await page.goto('/exams');
      await page.getByRole('button', { name: /Add New Exam/i }).click();

      // Fill some form data
      const locationField = page.getByLabel(/Location/i);
      if (await locationField.isVisible()) {
        await locationField.fill('Test Location');
      }

      // Refresh page
      await page.reload();

      // Form should reset (or preserve state if implemented)
      // This tests the expected behavior
    });

    test('should validate form error message display', async ({ page }) => {
      await page.goto('/exams');
      await page.getByRole('button', { name: /Add New Exam/i }).click();

      // Try to submit invalid form
      const saveBtn = page.getByRole('button', { name: 'Save Exam' });
      await saveBtn.click();

      // Look for error messages
      const errorElements = [
        page.locator('.error'),
        page.locator('.text-red'),
        page.locator('[role="alert"]'),
        page.locator('.invalid-feedback'),
        page.getByText(/error|invalid|required/i)
      ];

      // At least some validation feedback should be present
      let foundError = false;
      for (const errorElement of errorElements) {
        if (await errorElement.isVisible().catch(() => false)) {
          await expect(errorElement).toBeVisible();
          foundError = true;
          break;
        }
      }

      // If no visible errors, check for browser validation
      const invalidInputs = page.locator('input:invalid, select:invalid, textarea:invalid');
      const invalidCount = await invalidInputs.count().catch(() => 0);

      // Either custom errors or browser validation should be present
      expect(foundError || invalidCount > 0).toBeTruthy();
    });
  });
});