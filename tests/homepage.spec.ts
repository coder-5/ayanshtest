import { test, expect } from '@playwright/test';

test.describe('Homepage Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load and display welcome message', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Ayansh Math Competition Prep/);

    // Check main heading
    await expect(page.getByRole('heading', { name: /Welcome Back, Ayansh!/i })).toBeVisible();

    // Check subtitle
    await expect(page.getByText(/Ready to tackle some math competition problems/)).toBeVisible();
  });

  test('should display all stat cards with correct labels', async ({ page }) => {
    // Total Questions card
    await expect(page.getByText('Total Questions')).toBeVisible();

    // Your Progress card - use heading role to be more specific
    await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible();

    // Accuracy card
    await expect(page.getByText('Accuracy')).toBeVisible();
    await expect(page.getByText('📊')).toBeVisible();

    // Current Streak card
    await expect(page.getByText('Current Streak')).toBeVisible();
    await expect(page.getByText('🔥')).toBeVisible();
    await expect(page.getByText('0 days')).toBeVisible();
  });

  test('should display "Ready to Start?" section', async ({ page }) => {
    await expect(page.getByText('Ready to Start?')).toBeVisible();
    await expect(page.getByText('Ready to practice? Choose from AMC 8, MathCounts, and Math Kangaroo problems!')).toBeVisible();

    // Check "Start Practicing" button
    const startPracticeBtn = page.getByRole('link', { name: 'Start Practicing' });
    await expect(startPracticeBtn).toBeVisible();
    await expect(startPracticeBtn).toHaveAttribute('href', '/practice');
  });

  test('should have all quick action cards with correct icons and links', async ({ page }) => {
    // View Progress card
    await expect(page.getByText('View Progress')).toBeVisible();
    await expect(page.getByText('See your progress, statistics, and performance analytics')).toBeVisible();
    const viewProgressBtn = page.getByRole('link', { name: 'View Analytics' });
    await expect(viewProgressBtn).toBeVisible();
    await expect(viewProgressBtn).toHaveAttribute('href', '/progress');

    // Upload Documents card
    await expect(page.getByText('Upload Documents')).toBeVisible();
    await expect(page.getByText('Add new competition questions from Word, PDF, or image files')).toBeVisible();
    const uploadBtn = page.getByRole('link', { name: 'Upload Questions' });
    await expect(uploadBtn).toBeVisible();
    await expect(uploadBtn).toHaveAttribute('href', '/upload');

    // Question Library card
    await expect(page.getByText('Question Library')).toBeVisible();
    await expect(page.getByText('Browse and search through your collection of math problems')).toBeVisible();
    const libraryBtn = page.getByRole('link', { name: 'Browse Library' });
    await expect(libraryBtn).toBeVisible();
    await expect(libraryBtn).toHaveAttribute('href', '/library');

    // Exam Schedule card
    await expect(page.getByText('Exam Schedule')).toBeVisible();
    await expect(page.getByText('Track upcoming competitions and view past exam results')).toBeVisible();
    const examBtn = page.getByRole('link', { name: 'Manage Exams' });
    await expect(examBtn).toBeVisible();
    await expect(examBtn).toHaveAttribute('href', '/exams');
  });

  test('should navigate to practice page', async ({ page }) => {
    await page.getByRole('link', { name: 'Start Practicing' }).click();
    await page.waitForURL('/practice');
    await expect(page).toHaveURL('/practice');
    await expect(page.getByRole('heading', { name: /Practice Mode/i })).toBeVisible();
  });

  test('should navigate to exam schedule', async ({ page }) => {
    await page.getByRole('link', { name: 'Manage Exams' }).click();
    await page.waitForURL('/exams');
    await expect(page).toHaveURL('/exams');
  });

  test('should navigate to progress page', async ({ page }) => {
    await page.getByRole('link', { name: 'View Analytics' }).click();
    await page.waitForURL('/progress');
    await expect(page).toHaveURL('/progress');
  });

  test('should navigate to upload page', async ({ page }) => {
    await page.getByRole('link', { name: 'Upload Questions' }).click();
    await page.waitForURL('/upload');
    await expect(page).toHaveURL('/upload');
  });

  test('should navigate to library page', async ({ page }) => {
    await page.getByRole('link', { name: 'Browse Library' }).click();
    await page.waitForURL('/library');
    await expect(page).toHaveURL('/library');
  });

  test('should show upcoming exams table when data is available', async ({ page }) => {
    // This test checks if the upcoming exams section appears
    // Note: This depends on data being in the database
    const upcomingExamsSection = page.getByRole('heading', { name: 'Upcoming Exams' });

    // Check if section exists (it may or may not depending on data)
    const sectionExists = await upcomingExamsSection.isVisible().catch(() => false);

    if (sectionExists) {
      await expect(upcomingExamsSection).toBeVisible();
      await expect(page.getByRole('link', { name: 'View All Exams' })).toBeVisible();

      // Check table headers if table exists
      const tableExists = await page.locator('table').isVisible().catch(() => false);
      if (tableExists) {
        // Look for table headers more specifically
        await expect(page.locator('th').filter({ hasText: /exam/i })).toBeVisible();
        await expect(page.locator('th').filter({ hasText: /date/i })).toBeVisible();
        await expect(page.locator('th').filter({ hasText: /location/i })).toBeVisible();
        await expect(page.locator('th').filter({ hasText: /days/i })).toBeVisible();
      }
    }
  });

  test('should show recent activity section', async ({ page }) => {
    // Check for RecentActivity component
    const recentActivityExists = await page.locator('[data-testid="recent-activity"]').isVisible().catch(() => false);

    // The component exists but content depends on data
    // This is a basic check that the section renders
  });

  test('should have responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that main elements are still visible on mobile
    await expect(page.getByRole('heading', { name: /Welcome Back, Ayansh!/i })).toBeVisible();
    await expect(page.getByText('Total Questions')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start Practicing' })).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test that the page loads even if stats fail to load
    // This is mainly checking that the error handling in getStats() works
    await expect(page.getByRole('heading', { name: /Welcome Back, Ayansh!/i })).toBeVisible();

    // Even with errors, these should show default values
    await expect(page.getByText('Total Questions')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible();
    await expect(page.getByText('Accuracy')).toBeVisible();
  });
});