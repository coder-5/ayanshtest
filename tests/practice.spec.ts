import { test, expect } from '@playwright/test';

test.describe('Practice Section', () => {
  test('should display practice options page', async ({ page }) => {
    await page.goto('/practice');

    // Check main elements
    await expect(page.getByText('Practice Math Problems')).toBeVisible();
    await expect(page.getByText('Choose your practice mode')).toBeVisible();

    // Check practice options
    await expect(page.getByText('Quick Practice')).toBeVisible();
    await expect(page.getByText('AMC 8 Practice')).toBeVisible();
    await expect(page.getByText('Math Kangaroo')).toBeVisible();
    await expect(page.getByText('MOEMS Practice')).toBeVisible();
  });

  test('should navigate to quick practice', async ({ page }) => {
    await page.goto('/practice');

    // Click on Quick Practice
    await page.getByRole('link', { name: 'Quick Practice' }).click();

    // Should be on quick practice page
    await expect(page).toHaveURL('/practice/quick');
    await expect(page.getByText('Quick Practice Session')).toBeVisible();
  });

  test('should show practice session setup for quick practice', async ({ page }) => {
    await page.goto('/practice/quick');

    // Should show session setup or questions (depending on database state)
    const hasQuestions = await page.getByText('Start Practice Session').isVisible().catch(() => false);
    const noQuestions = await page.getByText('No questions in the database').isVisible().catch(() => false);

    // Either should show start button or no questions message
    expect(hasQuestions || noQuestions).toBe(true);

    if (hasQuestions) {
      await expect(page.getByText('Questions Ready')).toBeVisible();
      await expect(page.getByText('What to expect:')).toBeVisible();
    }
  });

  test('should navigate to AMC 8 practice', async ({ page }) => {
    await page.goto('/practice');

    // Click on AMC 8 Practice
    await page.getByRole('link', { name: 'AMC 8 Practice' }).click();

    // Should be on AMC 8 page
    await expect(page).toHaveURL('/practice/amc8');
    await expect(page.getByText('AMC 8 Practice')).toBeVisible();
  });

  test('should show back to practice link', async ({ page }) => {
    await page.goto('/practice/quick');

    // Should have back link
    await expect(page.getByRole('link', { name: '← Back to Practice Options' })).toBeVisible();

    // Click back link
    await page.getByRole('link', { name: '← Back to Practice Options' }).click();

    // Should be back on practice page
    await expect(page).toHaveURL('/practice');
  });
});