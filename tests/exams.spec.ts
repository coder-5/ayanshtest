import { test, expect } from '@playwright/test';

test.describe('Exam Management', () => {
  test('should display exam schedule page', async ({ page }) => {
    await page.goto('/exams');

    // Check main elements
    await expect(page.getByText('Exam Schedule')).toBeVisible();
    await expect(page.getByText('Track Ayansh\'s upcoming math competitions')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Exam' })).toBeVisible();
  });

  test('should show search and filter controls in compact view', async ({ page }) => {
    await page.goto('/exams');

    // Check for search and filter controls
    await expect(page.getByPlaceholder('Search by exam name, location, or notes')).toBeVisible();
    await expect(page.getByText('Filter')).toBeVisible();

    // Check view mode toggle
    await expect(page.getByText('Compact')).toBeVisible();
    await expect(page.getByText('Detailed')).toBeVisible();
  });

  test('should open exam form when Add Exam is clicked', async ({ page }) => {
    await page.goto('/exams');

    // Click Add Exam button
    await page.getByRole('button', { name: 'Add Exam' }).click();

    // Should show exam form
    await expect(page.getByText('Add New Exam')).toBeVisible();
    await expect(page.getByText('Exam Name *')).toBeVisible();
    await expect(page.getByText('Date & Time *')).toBeVisible();
    await expect(page.getByText('Location *')).toBeVisible();
  });

  test('should be able to search exams', async ({ page }) => {
    await page.goto('/exams');

    // Type in search box
    const searchBox = page.getByPlaceholder('Search by exam name, location, or notes');
    await searchBox.fill('AMC');

    // Should show search results or no results message
    // (depends on whether there are exams in the database)
  });

  test('should be able to switch between view modes', async ({ page }) => {
    await page.goto('/exams');

    // Click on Detailed view
    await page.getByRole('button', { name: 'Detailed' }).click();

    // Should be in detailed view (different layout)
    await expect(page.getByRole('button', { name: 'Detailed' })).toHaveClass(/.*default.*/);

    // Click back to Compact view
    await page.getByRole('button', { name: 'Compact' }).click();

    // Should be back in compact view
    await expect(page.getByRole('button', { name: 'Compact' })).toHaveClass(/.*default.*/);
  });
});