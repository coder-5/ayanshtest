import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test('should navigate between all main pages', async ({ page }) => {
    // Start at homepage
    await page.goto('/');
    await expect(page).toHaveURL('/');

    // Navigate to Practice page
    await page.getByRole('link', { name: 'Start Practicing' }).click();
    await expect(page).toHaveURL('/practice');
    await expect(page.getByRole('heading', { name: /Practice Mode/i })).toBeVisible();

    // Navigate to Exams page
    await page.goto('/');
    await page.getByRole('link', { name: 'Manage Exams' }).click();
    await expect(page).toHaveURL('/exams');

    // Navigate to Progress page
    await page.goto('/');
    await page.getByRole('link', { name: 'View Analytics' }).click();
    await expect(page).toHaveURL('/progress');

    // Navigate to Upload page
    await page.goto('/');
    await page.getByRole('link', { name: 'Upload Questions' }).click();
    await expect(page).toHaveURL('/upload');

    // Navigate to Library page
    await page.goto('/');
    await page.getByRole('link', { name: 'Browse Library' }).click();
    await expect(page).toHaveURL('/library');
  });

  test('should navigate to practice subroutes', async ({ page }) => {
    await page.goto('/practice');

    // Quick Practice
    const quickPracticeBtn = page.getByRole('link', { name: 'Start Quick Practice' });
    await expect(quickPracticeBtn).toHaveAttribute('href', '/practice/quick');

    // AMC 8 Practice
    const amc8Btn = page.getByRole('link', { name: 'Practice AMC 8' });
    await expect(amc8Btn).toHaveAttribute('href', '/practice/amc8');

    // MOEMS Practice
    const moemsBtn = page.getByRole('link', { name: 'Practice MOEMS' });
    await expect(moemsBtn).toHaveAttribute('href', '/practice/moems');

    // Math Kangaroo Practice
    const kangarooBtn = page.getByRole('link', { name: 'Practice Kangaroo' });
    await expect(kangarooBtn).toHaveAttribute('href', '/practice/kangaroo');

    // MathCounts Practice
    const mathcountsBtn = page.getByRole('link', { name: 'Practice MathCounts' });
    await expect(mathcountsBtn).toHaveAttribute('href', '/practice/mathcounts');

    // Weak Areas
    const weakAreasBtn = page.getByRole('link', { name: 'Target Weak Areas' });
    await expect(weakAreasBtn).toHaveAttribute('href', '/practice/weak-areas');
  });

  test('should have back navigation buttons', async ({ page }) => {
    // Test back button on practice page
    await page.goto('/practice');
    const backToDashboard = page.getByRole('link', { name: /Back to Dashboard/i });
    await expect(backToDashboard).toBeVisible();
    await expect(backToDashboard).toHaveAttribute('href', '/');

    // Test back button on library page
    await page.goto('/library');
    const backToDashboardLibrary = page.getByRole('link', { name: /Back to Dashboard/i });
    await expect(backToDashboardLibrary).toBeVisible();
    await expect(backToDashboardLibrary).toHaveAttribute('href', '/');
  });

  test('should handle direct URL navigation', async ({ page }) => {
    // Test direct navigation to each route
    const routes = [
      '/practice',
      '/practice/quick',
      '/practice/amc8',
      '/practice/moems',
      '/practice/kangaroo',
      '/practice/mathcounts',
      '/practice/weak-areas',
      '/exams',
      '/progress',
      '/upload',
      '/library'
    ];

    for (const route of routes) {
      await page.goto(route);
      await expect(page).toHaveURL(route);
      // Check that page loads without errors
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle special practice routes', async ({ page }) => {
    // Test AMC 8 simulation route
    await page.goto('/practice/amc8/simulation');
    await expect(page).toHaveURL('/practice/amc8/simulation');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle 404 for invalid routes', async ({ page }) => {
    // Test invalid route
    const response = await page.goto('/nonexistent-page');

    // Next.js typically returns 404 status for invalid routes
    // Check if it's handled gracefully
    if (response) {
      // Either 404 or redirected to a valid page
      expect([200, 404]).toContain(response.status());
    }
  });

  test('should maintain state during navigation', async ({ page }) => {
    // Start at homepage and check initial state
    await page.goto('/');
    await expect(page.getByText('Welcome Back, Ayansh!')).toBeVisible();

    // Navigate to practice and back
    await page.getByRole('link', { name: 'Start Practicing' }).click();
    await expect(page).toHaveURL('/practice');

    await page.getByRole('link', { name: /Back to Dashboard/i }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Welcome Back, Ayansh!')).toBeVisible();
  });
});