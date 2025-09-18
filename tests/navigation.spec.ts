import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should have working navigation menu', async ({ page }) => {
    await page.goto('/');

    // Check main navigation links
    await expect(page.getByRole('link', { name: 'Practice' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Progress' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Upload' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Library' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Exams' })).toBeVisible();
  });

  test('should navigate between main sections', async ({ page }) => {
    await page.goto('/');

    // Test navigation to each main section
    const sections = [
      { link: 'Practice', url: '/practice', heading: 'Practice Math Problems' },
      { link: 'Progress', url: '/progress', heading: 'Progress Analytics' },
      { link: 'Upload', url: '/upload', heading: 'Upload Documents' },
      { link: 'Library', url: '/library', heading: 'Question Library' },
      { link: 'Exams', url: '/exams', heading: 'Exam Schedule' }
    ];

    for (const section of sections) {
      // Navigate to section
      await page.getByRole('link', { name: section.link }).first().click();

      // Verify URL and heading
      await expect(page).toHaveURL(section.url);
      await expect(page.getByText(section.heading)).toBeVisible();

      // Go back to home
      await page.goto('/');
      await expect(page.getByText('Welcome Back, Ayansh!')).toBeVisible();
    }
  });

  test('should have responsive navigation', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Navigation should still be functional on mobile
    await expect(page.getByText('Welcome Back, Ayansh!')).toBeVisible();
  });

  test('should maintain state when navigating', async ({ page }) => {
    await page.goto('/');

    // Navigate to practice
    await page.getByRole('link', { name: 'Practice' }).first().click();
    await expect(page).toHaveURL('/practice');

    // Navigate to exams
    await page.getByRole('link', { name: 'Exams' }).first().click();
    await expect(page).toHaveURL('/exams');

    // Go back using browser back button
    await page.goBack();
    await expect(page).toHaveURL('/practice');
    await expect(page.getByText('Practice Math Problems')).toBeVisible();
  });
});