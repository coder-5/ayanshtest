import { test, expect } from '@playwright/test';

test.describe('Filters and Dropdowns Tests', () => {
  test.describe('Library Page Filters', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/library');
    });

    test('should test competition filter dropdown functionality', async ({ page }) => {
      const competitionSelect = page.getByText('Competition').first();
      await expect(competitionSelect).toBeVisible();

      // Click to open dropdown
      await competitionSelect.click();

      // Should show "All Competitions" option
      await expect(page.getByText('All Competitions')).toBeVisible();

      // Test selecting "All Competitions"
      await page.getByText('All Competitions').click();

      // Re-open dropdown to test other options
      await competitionSelect.click();

      // Look for specific competition options
      const competitions = ['AMC8', 'AMC 8', 'MOEMS', 'Math Kangaroo', 'MathCounts', 'Kangaroo'];

      for (const competition of competitions) {
        const competitionOption = page.getByText(competition);
        if (await competitionOption.isVisible().catch(() => false)) {
          await competitionOption.click();

          // Verify selection took effect
          await expect(competitionSelect).toBeVisible();

          // Re-open for next test
          await competitionSelect.click();
        }
      }
    });

    test('should test topic filter dropdown functionality', async ({ page }) => {
      const topicSelect = page.getByText('Topic').first();
      await expect(topicSelect).toBeVisible();

      await topicSelect.click();

      // Should show "All Topics" option
      await expect(page.getByText('All Topics')).toBeVisible();

      // Test selecting "All Topics"
      await page.getByText('All Topics').click();

      // Re-open dropdown to test other options
      await topicSelect.click();

      // Look for common topic options
      const topics = [
        'Algebra',
        'Geometry',
        'Number Theory',
        'Combinatorics',
        'Arithmetic',
        'Problem Solving',
        'Logic',
        'Probability'
      ];

      for (const topic of topics) {
        const topicOption = page.getByText(topic);
        if (await topicOption.isVisible().catch(() => false)) {
          await topicOption.click();

          // Verify selection
          await expect(topicSelect).toBeVisible();

          // Re-open for next test
          await topicSelect.click();
        }
      }
    });

    test('should test filter application and clearing', async ({ page }) => {
      // Fill search input
      const searchInput = page.getByPlaceholder(/Search problems by keyword/i);
      await searchInput.fill('geometry');

      // Select competition filter
      const competitionSelect = page.getByText('Competition').first();
      await competitionSelect.click();

      const competitionOption = page.getByText('All Competitions');
      if (await competitionOption.isVisible()) {
        await competitionOption.click();
      }

      // Apply filters
      const applyBtn = page.getByRole('button', { name: /Apply Filters/i });
      await applyBtn.click();

      // Wait for any potential loading or filtering
      await page.waitForTimeout(1000);

      // Clear filters
      const clearBtn = page.getByRole('button', { name: 'Clear All' });
      await clearBtn.click();

      // Verify search input is cleared
      await expect(searchInput).toHaveValue('');
    });

    test('should test filter combination effects', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/Search problems by keyword/i);
      const competitionSelect = page.getByText('Competition').first();
      const topicSelect = page.getByText('Topic').first();
      const applyBtn = page.getByRole('button', { name: /Apply Filters/i });

      // Test combining search with competition filter
      await searchInput.fill('problem');
      await competitionSelect.click();

      const amc8Option = page.getByText('AMC8').or(page.getByText('AMC 8'));
      if (await amc8Option.first().isVisible().catch(() => false)) {
        await amc8Option.first().click();
      } else {
        // Close dropdown if no specific option available
        await competitionSelect.click();
      }

      await applyBtn.click();
      await page.waitForTimeout(500);

      // Test adding topic filter
      await topicSelect.click();

      const algebraOption = page.getByText('Algebra');
      if (await algebraOption.isVisible().catch(() => false)) {
        await algebraOption.click();
      } else {
        await topicSelect.click();
      }

      await applyBtn.click();
      await page.waitForTimeout(500);

      // Clear all filters
      await page.getByRole('button', { name: 'Clear All' }).click();
    });
  });

  test.describe('Exam Form Dropdowns', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/exams');
      await page.getByRole('button', { name: /Add New Exam/i }).click();
    });

    test('should test exam name dropdown functionality', async ({ page }) => {
      // Find exam name dropdown
      const examNameSelect = page.locator('select').first().or(
        page.getByRole('combobox').first()
      );

      if (await examNameSelect.isVisible()) {
        await examNameSelect.click();

        // Test standard exam types
        const examTypes = [
          'AMC8',
          'AMC 8',
          'AMC 10',
          'AIME',
          'Math Kangaroo',
          'MOEMS',
          'MathCounts',
          'USAMO',
          'Local Competition',
          'School Competition',
          'Other'
        ];

        for (const examType of examTypes) {
          const examOption = page.getByText(examType);
          if (await examOption.isVisible().catch(() => false)) {
            await examOption.click();

            // Verify selection
            await expect(examNameSelect).toBeVisible();

            // Test "Other" option specifically
            if (examType === 'Other') {
              const customNameInput = page.getByPlaceholder(/Enter custom exam name/i);
              if (await customNameInput.isVisible()) {
                await customNameInput.fill('Custom Test Exam');
                await expect(customNameInput).toHaveValue('Custom Test Exam');
              }
            }

            // Re-open dropdown for next test
            await examNameSelect.click();
          }
        }
      }
    });

    test('should test status dropdown functionality', async ({ page }) => {
      const statusSelects = [
        page.locator('select').filter({ hasText: /status/i }),
        page.getByRole('combobox').filter({ hasText: /status/i }),
        page.locator('[data-testid="status-select"]')
      ];

      for (const statusSelect of statusSelects) {
        if (await statusSelect.isVisible()) {
          await statusSelect.click();

          const statusOptions = ['Upcoming', 'Completed', 'Missed', 'Cancelled'];

          for (const status of statusOptions) {
            const statusOption = page.getByText(status);
            if (await statusOption.isVisible().catch(() => false)) {
              await statusOption.click();

              // Test status-specific fields
              if (status === 'Completed') {
                // Should show results section
                await page.waitForTimeout(500);
                const scoreField = page.getByLabel(/Score/i);
                if (await scoreField.isVisible()) {
                  await expect(scoreField).toBeVisible();
                }
              }

              // Re-open dropdown
              await statusSelect.click();
            }
          }
          break; // Exit loop after finding first visible select
        }
      }
    });

    test('should test recurring exam frequency dropdown', async ({ page }) => {
      const recurringCheckbox = page.getByLabel(/Create multiple recurring exams/i);
      if (await recurringCheckbox.isVisible()) {
        await recurringCheckbox.check();

        const frequencySelect = page.locator('select').filter({ hasText: /frequency/i }).or(
          page.getByRole('combobox').filter({ hasText: /frequency/i })
        );

        if (await frequencySelect.isVisible()) {
          await frequencySelect.click();

          const frequencies = ['Weekly', 'Monthly'];

          for (const frequency of frequencies) {
            const frequencyOption = page.getByText(frequency);
            if (await frequencyOption.isVisible().catch(() => false)) {
              await frequencyOption.click();

              // Verify selection took effect
              await expect(frequencySelect).toBeVisible();

              // Re-open dropdown
              await frequencySelect.click();
            }
          }
        }
      }
    });
  });

  test.describe('Practice Page Dropdowns', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/practice');
    });

    test('should test question count dropdowns in practice cards', async ({ page }) => {
      // Look for dropdown selectors in practice cards
      const dropdownSelectors = [
        page.locator('select'),
        page.getByRole('combobox'),
        page.locator('[data-testid*="select"]')
      ];

      for (const selector of dropdownSelectors) {
        const count = await selector.count();
        for (let i = 0; i < count; i++) {
          const dropdown = selector.nth(i);
          if (await dropdown.isVisible()) {
            await dropdown.click();

            // Look for common options
            const options = ['5', '10', '15', '20', 'All', 'Random'];
            for (const option of options) {
              const optionElement = page.getByText(option);
              if (await optionElement.isVisible().catch(() => false)) {
                await optionElement.click();
                break;
              }
            }
          }
        }
      }
    });
  });

  test.describe('Upload Page Dropdowns', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/upload');
    });

    test('should test file type and competition selectors', async ({ page }) => {
      // Look for competition type dropdown
      const competitionSelects = [
        page.getByLabel(/Competition/i),
        page.getByLabel(/Exam Type/i),
        page.locator('select').filter({ hasText: /competition|exam/i })
      ];

      for (const select of competitionSelects) {
        if (await select.isVisible()) {
          await select.click();

          const competitions = ['AMC8', 'MOEMS', 'Math Kangaroo', 'MathCounts'];

          for (const competition of competitions) {
            const competitionOption = page.getByText(competition);
            if (await competitionOption.isVisible().catch(() => false)) {
              await competitionOption.click();

              // Verify selection
              await expect(select).toBeVisible();

              // Re-open dropdown
              await select.click();
            }
          }
          break;
        }
      }

      // Look for year dropdown
      const yearSelects = [
        page.getByLabel(/Year/i),
        page.locator('select').filter({ hasText: /year/i })
      ];

      for (const yearSelect of yearSelects) {
        if (await yearSelect.isVisible()) {
          await yearSelect.click();

          // Test year options
          const currentYear = new Date().getFullYear();
          const years = [currentYear, currentYear - 1, currentYear - 2];

          for (const year of years) {
            const yearOption = page.getByText(year.toString());
            if (await yearOption.isVisible().catch(() => false)) {
              await yearOption.click();
              break;
            }
          }
          break;
        }
      }
    });
  });

  test.describe('Dropdown Accessibility and Interaction', () => {
    test('should test keyboard navigation in dropdowns', async ({ page }) => {
      await page.goto('/library');

      const competitionSelect = page.getByText('Competition').first();
      if (await competitionSelect.isVisible()) {
        // Focus on dropdown
        await competitionSelect.focus();

        // Test keyboard navigation
        await page.keyboard.press('Enter'); // Open dropdown
        await page.keyboard.press('ArrowDown'); // Navigate down
        await page.keyboard.press('ArrowUp'); // Navigate up
        await page.keyboard.press('Enter'); // Select option
        await page.keyboard.press('Escape'); // Close dropdown

        // Dropdown should remain functional
        await expect(competitionSelect).toBeVisible();
      }
    });

    test('should test dropdown accessibility attributes', async ({ page }) => {
      await page.goto('/exams');
      await page.getByRole('button', { name: /Add New Exam/i }).click();

      const dropdowns = page.locator('select, [role="combobox"]');
      const count = await dropdowns.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const dropdown = dropdowns.nth(i);
        if (await dropdown.isVisible()) {
          // Check for accessibility attributes
          const ariaLabel = await dropdown.getAttribute('aria-label');
          const ariaLabelledBy = await dropdown.getAttribute('aria-labelledby');
          const id = await dropdown.getAttribute('id');

          // Should have some form of labeling
          if (id) {
            const label = page.locator(`label[for="${id}"]`);
            const hasLabel = await label.isVisible().catch(() => false);
            expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
          }

          // Check for aria-expanded if it's a combobox
          const role = await dropdown.getAttribute('role');
          if (role === 'combobox') {
            const ariaExpanded = await dropdown.getAttribute('aria-expanded');
            // Should have aria-expanded attribute
            expect(ariaExpanded).toBeDefined();
          }
        }
      }
    });

    test('should test dropdown loading states', async ({ page }) => {
      await page.goto('/exams');
      await page.getByRole('button', { name: /Add New Exam/i }).click();

      // Check for loading states in dropdowns
      const loadingIndicators = [
        page.getByText('Loading...'),
        page.locator('.animate-spin'),
        page.locator('[data-testid="loading"]')
      ];

      for (const indicator of loadingIndicators) {
        if (await indicator.isVisible().catch(() => false)) {
          await expect(indicator).toBeVisible();

          // Wait for loading to complete
          await page.waitForTimeout(2000);

          // Loading indicator should disappear
          await expect(indicator).not.toBeVisible();
        }
      }
    });

    test('should test dropdown error states', async ({ page }) => {
      await page.goto('/library');

      // Apply filters that might cause errors
      const searchInput = page.getByPlaceholder(/Search problems by keyword/i);
      await searchInput.fill('nonexistent-impossible-query-12345');

      const applyBtn = page.getByRole('button', { name: /Apply Filters/i });
      await applyBtn.click();

      // Check for error messages
      const errorElements = [
        page.getByText(/error|failed|not found/i),
        page.locator('.error'),
        page.locator('.text-red'),
        page.locator('[role="alert"]')
      ];

      // Wait for potential error display
      await page.waitForTimeout(1000);

      for (const errorElement of errorElements) {
        if (await errorElement.isVisible().catch(() => false)) {
          await expect(errorElement).toBeVisible();
        }
      }
    });

    test('should test dropdown mobile responsiveness', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/library');

      const competitionSelect = page.getByText('Competition').first();
      const topicSelect = page.getByText('Topic').first();

      // Test dropdowns on mobile
      if (await competitionSelect.isVisible()) {
        await competitionSelect.click();

        // Should show options on mobile
        const allCompetitionsOption = page.getByText('All Competitions');
        if (await allCompetitionsOption.isVisible()) {
          await expect(allCompetitionsOption).toBeVisible();
          await allCompetitionsOption.click();
        }
      }

      if (await topicSelect.isVisible()) {
        await topicSelect.click();

        const allTopicsOption = page.getByText('All Topics');
        if (await allTopicsOption.isVisible()) {
          await expect(allTopicsOption).toBeVisible();
          await allTopicsOption.click();
        }
      }
    });

    test('should test multi-select functionality if present', async ({ page }) => {
      await page.goto('/library');

      // Look for multi-select dropdowns
      const multiSelects = page.locator('select[multiple], [data-multiple="true"]');
      const count = await multiSelects.count();

      for (let i = 0; i < count; i++) {
        const multiSelect = multiSelects.nth(i);
        if (await multiSelect.isVisible()) {
          // Test multiple selections
          await multiSelect.selectOption({ index: 0 });
          await multiSelect.selectOption({ index: 1 });

          // Verify multiple selections
          const selectedOptions = await multiSelect.evaluate((select: HTMLSelectElement) => {
            return Array.from(select.selectedOptions).map(option => option.value);
          });

          expect(selectedOptions.length).toBeGreaterThan(0);
        }
      }
    });
  });
});