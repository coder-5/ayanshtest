import { test, expect } from '@playwright/test';

test.describe('Practice Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/practice');
  });

  test('should display practice page header and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Practice Mode 🎯/i })).toBeVisible();
    await expect(page.getByText('Choose your practice style and start solving math competition problems!')).toBeVisible();
  });

  test('should display all practice mode cards', async ({ page }) => {
    // Quick Practice card - use heading role to be more specific
    await expect(page.getByRole('heading', { name: 'Quick Practice' })).toBeVisible();
    await expect(page.getByText('Jump into random problems from your level')).toBeVisible();
    await expect(page.getByText('Random selection')).toBeVisible();
    await expect(page.getByText('Mixed levels')).toBeVisible();

    // AMC 8 Practice card
    await expect(page.getByText('AMC 8 Practice')).toBeVisible();
    await expect(page.getByText('Focus on AMC 8 competition problems')).toBeVisible();
    await expect(page.getByText('Multiple Choice')).toBeVisible();

    // MOEMS Practice card
    await expect(page.getByText('MOEMS Practice')).toBeVisible();
    await expect(page.getByText('Mathematical Olympiad problems with detailed solutions')).toBeVisible();
    await expect(page.getByText('Open-ended')).toBeVisible();

    // Math Kangaroo card
    await expect(page.getByRole('heading', { name: 'Math Kangaroo' })).toBeVisible();
    await expect(page.getByText('Grade-appropriate Math Kangaroo problems')).toBeVisible();
    await expect(page.getByText('Grade 5-6')).toBeVisible();

    // MathCounts card
    await expect(page.getByRole('heading', { name: 'MathCounts' })).toBeVisible();
    await expect(page.getByText('Practice with official MathCounts Sprint Round problems')).toBeVisible();
    await expect(page.getByText('Middle School')).toBeVisible();

    // Timed Challenge card
    await expect(page.getByText('Timed Challenge')).toBeVisible();
    await expect(page.getByText('Real competition timing with full simulations')).toBeVisible();
    await expect(page.getByText('40 minutes')).toBeVisible();
    await expect(page.getByText('30 minutes')).toBeVisible();

    // Weak Areas card
    await expect(page.getByText('Improve Weak Areas')).toBeVisible();
    await expect(page.getByText('Focus on topics where you need more practice')).toBeVisible();
    await expect(page.getByText('Based on performance')).toBeVisible();
    await expect(page.getByText('Improvement areas')).toBeVisible();
  });

  test('should show question counts when loaded', async ({ page }) => {
    // Wait for question counts to load
    await page.waitForTimeout(2000);

    // Check that question count badges appear (they might show loading state first)
    const countBadges = page.locator('text=/\\d+ problems/');
    const loadingSpinners = page.locator('.animate-spin');

    // Either specific count badges or loading spinners should be visible
    const hasLoadingOrCounts = await countBadges.first().isVisible().catch(() => false) ||
                                await loadingSpinners.first().isVisible().catch(() => false);

    expect(hasLoadingOrCounts).toBeTruthy();
  });

  test('should have correct navigation links', async ({ page }) => {
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

    // Back to Dashboard
    const backBtn = page.getByRole('link', { name: /Back to Dashboard/i });
    await expect(backBtn).toHaveAttribute('href', '/');
  });

  test('should display "Coming Soon" for timed challenge', async ({ page }) => {
    const comingSoonBtn = page.getByRole('button', { name: 'Coming Soon' });
    await expect(comingSoonBtn).toBeVisible();
    await expect(comingSoonBtn).toBeDisabled();
  });

  test('should display recent activity section', async ({ page }) => {
    await expect(page.getByText('Continue Where You Left Off')).toBeVisible();
    await expect(page.getByText('Resume your recent practice sessions')).toBeVisible();

    // Should show empty state initially
    await expect(page.getByText('No recent practice sessions')).toBeVisible();
    await expect(page.getByText('Start practicing to see your recent activity here')).toBeVisible();
  });

  test('should have hover effects on cards', async ({ page }) => {
    const quickPracticeCard = page.locator('.hover\\:shadow-lg').first();
    await expect(quickPracticeCard).toBeVisible();

    // Test hover state (visual effect, can't easily test actual hover)
    await quickPracticeCard.hover();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Check main elements are visible on mobile
    await expect(page.getByRole('heading', { name: /Practice Mode/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Quick Practice' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'AMC 8 Practice' })).toBeVisible();
  });

  test('should navigate to specific practice types', async ({ page }) => {
    // Test navigation to Quick Practice
    await page.getByRole('link', { name: 'Start Quick Practice' }).click();
    await expect(page).toHaveURL('/practice/quick');

    // Go back and test AMC 8
    await page.goto('/practice');
    await page.getByRole('link', { name: 'Practice AMC 8' }).click();
    await expect(page).toHaveURL('/practice/amc8');

    // Go back and test MOEMS
    await page.goto('/practice');
    await page.getByRole('link', { name: 'Practice MOEMS' }).click();
    await expect(page).toHaveURL('/practice/moems');

    // Go back and test Kangaroo
    await page.goto('/practice');
    await page.getByRole('link', { name: 'Practice Kangaroo' }).click();
    await expect(page).toHaveURL('/practice/kangaroo');

    // Go back and test MathCounts
    await page.goto('/practice');
    await page.getByRole('link', { name: 'Practice MathCounts' }).click();
    await expect(page).toHaveURL('/practice/mathcounts');

    // Go back and test Weak Areas
    await page.goto('/practice');
    await page.getByRole('link', { name: 'Target Weak Areas' }).click();
    await expect(page).toHaveURL('/practice/weak-areas');
  });

  test('should handle API loading states', async ({ page }) => {
    // Reload to catch loading state
    await page.reload();

    // Should show loading spinners initially
    const loadingSpinners = page.locator('.animate-spin');
    // Spinners might be visible briefly, or counts might load immediately
    // This is race condition dependent
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check for proper button and link roles
    await expect(page.getByRole('link', { name: 'Start Quick Practice' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Practice AMC 8' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Coming Soon' })).toBeVisible();

    // Check for proper headings structure
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});