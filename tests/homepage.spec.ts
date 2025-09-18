import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load and display welcome message', async ({ page }) => {
    await page.goto('/');

    // Check if the welcome message is displayed
    await expect(page.getByText('Welcome Back, Ayansh!')).toBeVisible();

    // Check for the main navigation elements
    await expect(page.getByText('Ready to tackle some math competition problems?')).toBeVisible();

    // Verify stats cards are present
    await expect(page.getByText('Total Questions')).toBeVisible();
    await expect(page.getByText('Your Progress')).toBeVisible();
    await expect(page.getByText('Accuracy')).toBeVisible();
    await expect(page.getByText('Current Streak')).toBeVisible();
  });

  test('should navigate to practice page', async ({ page }) => {
    await page.goto('/');

    // Click on practice link
    await page.getByRole('link', { name: 'Start Practicing' }).first().click();

    // Should be on practice page
    await expect(page).toHaveURL('/practice');
    await expect(page.getByText('Practice Math Problems')).toBeVisible();
  });

  test('should navigate to exam schedule', async ({ page }) => {
    await page.goto('/');

    // Click on exam schedule link
    await page.getByRole('link', { name: 'Manage Exams' }).click();

    // Should be on exams page
    await expect(page).toHaveURL('/exams');
    await expect(page.getByText('Exam Schedule')).toBeVisible();
  });
});