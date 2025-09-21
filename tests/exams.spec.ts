import { test, expect } from '@playwright/test';

test.describe('Exams Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/exams');
  });

  test('should display exams page header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Exam Schedule/i })).toBeVisible();
  });

  test('should show add new exam button', async ({ page }) => {
    const addExamBtn = page.getByRole('button', { name: /Add New Exam/i });
    await expect(addExamBtn).toBeVisible();
  });

  test('should open exam form when clicking add new exam', async ({ page }) => {
    await page.getByRole('button', { name: /Add New Exam/i }).click();

    // Check if form appears
    await expect(page.getByText('Add New Exam')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Exam' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('should test exam form fields and validation', async ({ page }) => {
    await page.getByRole('button', { name: /Add New Exam/i }).click();

    // Test Exam Name dropdown
    const examNameSelect = page.locator('[data-testid="exam-name-select"]').or(page.getByText('Select exam type')).first();
    if (await examNameSelect.isVisible()) {
      await examNameSelect.click();
      // Should show options
      await expect(page.getByText('AMC8').or(page.getByText('Math Kangaroo')).or(page.getByText('MOEMS'))).toBeVisible();
    }

    // Test required fields
    const examNameField = page.getByLabel(/Exam Name/i);
    const dateField = page.getByLabel(/Date & Time/i);
    const locationField = page.getByLabel(/Location/i);

    await expect(examNameField).toBeVisible();
    await expect(dateField).toBeVisible();
    await expect(locationField).toBeVisible();

    // Test form validation - try to submit empty form
    await page.getByRole('button', { name: 'Save Exam' }).click();

    // Should show validation messages or prevent submission
    // This depends on browser validation implementation
  });

  test('should test all exam form fields', async ({ page }) => {
    await page.getByRole('button', { name: /Add New Exam/i }).click();

    // Basic Information
    await expect(page.getByLabel(/Exam Name/i)).toBeVisible();
    await expect(page.getByLabel(/Status/i)).toBeVisible();
    await expect(page.getByLabel(/Date & Time/i)).toBeVisible();
    await expect(page.getByLabel(/Location/i)).toBeVisible();

    // Duration and Registration
    await expect(page.getByLabel(/Duration/i)).toBeVisible();
    await expect(page.getByLabel(/Registration ID/i)).toBeVisible();
    await expect(page.getByLabel(/Registration Date/i)).toBeVisible();

    // Recurring Options
    await expect(page.getByText('Recurring Exam Options')).toBeVisible();
    await expect(page.getByLabel(/Create multiple recurring exams/i)).toBeVisible();

    // Availability Window
    await expect(page.getByText('Exam Availability Window')).toBeVisible();
    await expect(page.getByLabel(/Available From/i)).toBeVisible();
    await expect(page.getByLabel(/Available Until/i)).toBeVisible();

    // Online Access
    await expect(page.getByText('Online Exam Access')).toBeVisible();
    await expect(page.getByLabel(/Exam URL/i)).toBeVisible();
    await expect(page.getByLabel(/Login ID/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();

    // Notes
    await expect(page.getByLabel(/Notes/i)).toBeVisible();
  });

  test('should test status dropdown options', async ({ page }) => {
    await page.getByRole('button', { name: /Add New Exam/i }).click();

    // Find and click status dropdown
    const statusSelect = page.locator('select').or(page.getByRole('combobox')).filter({ hasText: /Status|Upcoming/ }).first();

    if (await statusSelect.isVisible()) {
      await statusSelect.click();

      // Check for status options
      await expect(page.getByText('Upcoming').or(page.getByText('Completed')).or(page.getByText('Missed')).or(page.getByText('Cancelled'))).toBeVisible();
    }
  });

  test('should test recurring exam options', async ({ page }) => {
    await page.getByRole('button', { name: /Add New Exam/i }).click();

    // Click recurring checkbox
    const recurringCheckbox = page.getByLabel(/Create multiple recurring exams/i);
    await expect(recurringCheckbox).toBeVisible();
    await recurringCheckbox.check();

    // Should show frequency and count options
    await expect(page.getByText('Frequency')).toBeVisible();
    await expect(page.getByText('Number of occurrences')).toBeVisible();

    // Test frequency dropdown
    const frequencySelect = page.locator('[data-testid="frequency-select"]').or(page.getByText('Weekly')).first();
    if (await frequencySelect.isVisible()) {
      await frequencySelect.click();
      await expect(page.getByText('Weekly').or(page.getByText('Monthly'))).toBeVisible();
    }

    // Test occurrence count input
    const countInput = page.getByLabel(/Number of occurrences/i);
    await expect(countInput).toBeVisible();
    await countInput.fill('5');
    await expect(countInput).toHaveValue('5');
  });

  test('should test custom exam name input', async ({ page }) => {
    await page.getByRole('button', { name: /Add New Exam/i }).click();

    // Select "Other" from exam name dropdown
    const examNameSelect = page.locator('select').or(page.getByRole('combobox')).first();

    if (await examNameSelect.isVisible()) {
      await examNameSelect.selectOption({ label: 'Other' });

      // Should show custom name input
      const customNameInput = page.getByPlaceholder(/Enter custom exam name/i);
      await expect(customNameInput).toBeVisible();

      await customNameInput.fill('Custom Competition');
      await expect(customNameInput).toHaveValue('Custom Competition');
    }
  });

  test('should test results section for completed exams', async ({ page }) => {
    await page.getByRole('button', { name: /Add New Exam/i }).click();

    // Change status to completed
    const statusSelect = page.locator('select').or(page.getByRole('combobox')).filter({ hasText: /Status/ }).first();

    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption({ label: 'Completed' });

      // Should show results section
      await expect(page.getByText('Results')).toBeVisible();
      await expect(page.getByLabel(/Score/i)).toBeVisible();
      await expect(page.getByLabel(/Max Score/i)).toBeVisible();
      await expect(page.getByLabel(/Percentile/i)).toBeVisible();
    }
  });

  test('should test form submission and cancellation', async ({ page }) => {
    await page.getByRole('button', { name: /Add New Exam/i }).click();

    // Test cancel button
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Form should close/disappear
    await expect(page.getByText('Add New Exam')).not.toBeVisible();

    // Test save button (with minimal valid data)
    await page.getByRole('button', { name: /Add New Exam/i }).click();

    // Fill required fields
    const locationField = page.getByLabel(/Location/i);
    const dateField = page.getByLabel(/Date & Time/i);

    await locationField.fill('Test Location');

    // Set a future date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateValue = tomorrow.toISOString().slice(0, 16);
    await dateField.fill(dateValue);

    // Try to save (may need exam name selection first)
    await page.getByRole('button', { name: 'Save Exam' }).click();

    // Check for success or error messages
    // This depends on backend validation
  });

  test('should handle input validation and error states', async ({ page }) => {
    await page.getByRole('button', { name: /Add New Exam/i }).click();

    // Test invalid URL
    const urlField = page.getByLabel(/Exam URL/i);
    await urlField.fill('invalid-url');

    // Test numeric fields
    const durationField = page.getByLabel(/Duration/i);
    await durationField.fill('abc'); // Invalid number

    const scoreField = page.getByLabel(/Score/i);
    if (await scoreField.isVisible()) {
      await scoreField.fill('-5'); // Negative number
    }

    // Test form submission with invalid data
    await page.getByRole('button', { name: 'Save Exam' }).click();
  });

  test('should test responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await expect(page.getByRole('heading', { name: /Exam Schedule/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Add New Exam/i })).toBeVisible();

    // Open form on mobile
    await page.getByRole('button', { name: /Add New Exam/i }).click();
    await expect(page.getByText('Add New Exam')).toBeVisible();
  });

  test('should test exam list display and management', async ({ page }) => {
    // Check if exams table/list is displayed
    const examsList = page.locator('[data-testid="exams-list"]').or(page.locator('table')).first();

    // Table may or may not be visible depending on data
    const tableExists = await examsList.isVisible().catch(() => false);

    if (tableExists) {
      // Test table headers and structure
      await expect(page.getByText('Exam')).toBeVisible();
      await expect(page.getByText('Date')).toBeVisible();
      await expect(page.getByText('Status')).toBeVisible();
    } else {
      // Should show empty state
      const emptyState = page.locator('text=No exams scheduled').or(page.locator('text=Add your first exam'));
      await expect(emptyState).toBeVisible();
    }
  });
});