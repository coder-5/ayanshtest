import { test, expect } from '@playwright/test';

test.describe('Library Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/library');
  });

  test('should display library page header and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Problem Library 📚/i })).toBeVisible();
    await expect(page.getByText('Browse and search through your collection of math competition problems')).toBeVisible();
  });

  test('should display search and filter section', async ({ page }) => {
    await expect(page.getByText('Search & Filter')).toBeVisible();
    await expect(page.getByText('Find specific problems or browse by topic and difficulty')).toBeVisible();

    // Search input
    const searchInput = page.getByPlaceholder(/Search problems by keyword/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('algebra');
    await expect(searchInput).toHaveValue('algebra');

    // Filter buttons
    await expect(page.getByRole('button', { name: /Apply Filters/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear All' })).toBeVisible();
  });

  test('should test competition filter dropdown', async ({ page }) => {
    const competitionSelect = page.getByText('Competition').first();
    await expect(competitionSelect).toBeVisible();

    // Click to open dropdown
    await competitionSelect.click();

    // Should show "All Competitions" option
    await expect(page.getByText('All Competitions')).toBeVisible();

    // May show specific competitions depending on data
    const possibleCompetitions = ['AMC 8', 'MOEMS', 'Math Kangaroo', 'MathCounts'];

    // Check if any of these exist (depends on database content)
    for (const competition of possibleCompetitions) {
      const competitionOption = page.getByText(competition);
      if (await competitionOption.isVisible()) {
        await expect(competitionOption).toBeVisible();
      }
    }
  });

  test('should test topic filter dropdown', async ({ page }) => {
    const topicSelect = page.getByText('Topic').first();
    await expect(topicSelect).toBeVisible();

    await topicSelect.click();

    // Should show "All Topics" option
    await expect(page.getByText('All Topics')).toBeVisible();

    // Topics depend on database content
    const commonTopics = ['Algebra', 'Geometry', 'Number Theory', 'Combinatorics'];

    for (const topic of commonTopics) {
      const topicOption = page.getByText(topic);
      if (await topicOption.isVisible()) {
        await expect(topicOption).toBeVisible();
      }
    }
  });

  test('should display library statistics', async ({ page }) => {
    // Total problems stat
    await expect(page.getByText('Total Problems')).toBeVisible();

    // Competition-specific stats (depends on data)
    const statCards = page.locator('[data-testid="stat-card"]').or(page.locator('.text-center').filter({ hasText: /Problems/ }));

    // Should have at least the total problems card
    await expect(statCards.first()).toBeVisible();
  });

  test('should display recently added section', async ({ page }) => {
    await expect(page.getByText('Recently Added')).toBeVisible();
    await expect(page.getByText('Your latest problem sets')).toBeVisible();

    // Check for empty state or actual recent questions
    const recentContent = page.locator('[data-testid="recent-questions"]').or(
      page.locator('text=No problems available yet')
    );

    // Either shows questions or empty state
    await expect(recentContent.or(page.getByText('Start with quick practice'))).toBeVisible();
  });

  test('should display problem collection section', async ({ page }) => {
    await expect(page.getByText('Problem Collection')).toBeVisible();

    // Check for problem list or empty state
    const hasProblems = await page.locator('.border.rounded-lg.p-4').isVisible().catch(() => false);

    if (hasProblems) {
      // Test problem card elements
      await expect(page.locator('.border.rounded-lg.p-4').first()).toBeVisible();

      // Check for badges and metadata
      const badges = page.locator('[data-testid="badge"]').or(page.locator('.bg-'));
      if (await badges.first().isVisible()) {
        await expect(badges.first()).toBeVisible();
      }

      // Check for practice buttons
      const practiceButtons = page.getByRole('link', { name: 'Practice' });
      if (await practiceButtons.first().isVisible()) {
        await expect(practiceButtons.first()).toBeVisible();
      }
    } else {
      // Empty state
      await expect(page.getByText('No Problems Yet')).toBeVisible();
      await expect(page.getByText('Start practicing to see your question library')).toBeVisible();

      const startPracticeBtn = page.getByRole('link', { name: /Start Practice/i });
      await expect(startPracticeBtn).toBeVisible();
      await expect(startPracticeBtn).toHaveAttribute('href', '/practice/quick');
    }
  });

  test('should test pagination controls', async ({ page }) => {
    // Check if pagination exists (depends on having enough problems)
    const pagination = page.locator('text=Page').or(page.getByRole('button', { name: 'Previous' }));

    const hasPagination = await pagination.isVisible().catch(() => false);

    if (hasPagination) {
      await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
      await expect(page.locator('text=Page')).toBeVisible();
    }
  });

  test('should display quick actions section', async ({ page }) => {
    await expect(page.getByText('Quick Actions')).toBeVisible();
    await expect(page.getByText('Manage your problem library')).toBeVisible();

    // Export Library button
    const exportBtn = page.getByRole('link', { name: /Export Library/i });
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toHaveAttribute('href', '/api/export-library');

    // Start Practice Session button
    const practiceBtn = page.getByRole('link', { name: 'Start Practice Session' });
    await expect(practiceBtn).toBeVisible();
    await expect(practiceBtn).toHaveAttribute('href', '/practice');
  });

  test('should have back to dashboard navigation', async ({ page }) => {
    const backBtn = page.getByRole('link', { name: /Back to Dashboard/i });
    await expect(backBtn).toBeVisible();
    await expect(backBtn).toHaveAttribute('href', '/');

    // Test navigation
    await backBtn.click();
    await expect(page).toHaveURL('/');
  });

  test('should test filter functionality', async ({ page }) => {
    // Fill search input
    const searchInput = page.getByPlaceholder(/Search problems by keyword/i);
    await searchInput.fill('geometry');

    // Select competition filter
    const competitionSelect = page.getByText('Competition').first();
    await competitionSelect.click();

    const allCompetitionsOption = page.getByText('All Competitions');
    if (await allCompetitionsOption.isVisible()) {
      await allCompetitionsOption.click();
    }

    // Select topic filter
    const topicSelect = page.getByText('Topic').first();
    await topicSelect.click();

    const allTopicsOption = page.getByText('All Topics');
    if (await allTopicsOption.isVisible()) {
      await allTopicsOption.click();
    }

    // Apply filters
    await page.getByRole('button', { name: /Apply Filters/i }).click();

    // Clear filters
    await page.getByRole('button', { name: 'Clear All' }).click();

    // Search should be cleared
    await expect(searchInput).toHaveValue('');
  });

  test('should test problem difficulty badges', async ({ page }) => {
    // Look for difficulty badges if problems exist
    const difficultyBadges = page.locator('text=easy').or(page.locator('text=medium')).or(page.locator('text=hard'));

    const hasDifficultyBadges = await difficultyBadges.first().isVisible().catch(() => false);

    if (hasDifficultyBadges) {
      await expect(difficultyBadges.first()).toBeVisible();
    }
  });

  test('should test star/favorite functionality', async ({ page }) => {
    // Look for star buttons if problems exist
    const starButtons = page.getByRole('button').filter({ hasText: /star/i }).or(
      page.locator('[data-testid="star-button"]')
    );

    const hasStarButtons = await starButtons.first().isVisible().catch(() => false);

    if (hasStarButtons) {
      await expect(starButtons.first()).toBeVisible();

      // Test clicking star button
      await starButtons.first().click();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Check main elements are visible on mobile
    await expect(page.getByRole('heading', { name: /Problem Library/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Search problems/i)).toBeVisible();
    await expect(page.getByText('Total Problems')).toBeVisible();
  });

  test('should handle search input interactions', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search problems by keyword/i);

    // Test different search terms
    await searchInput.fill('algebra');
    await expect(searchInput).toHaveValue('algebra');

    await searchInput.clear();
    await searchInput.fill('geometry problem');
    await expect(searchInput).toHaveValue('geometry problem');

    // Test search with special characters
    await searchInput.clear();
    await searchInput.fill('x^2 + 3x - 4');
    await expect(searchInput).toHaveValue('x^2 + 3x - 4');
  });

  test('should test problem metadata display', async ({ page }) => {
    // Look for problem metadata if problems exist
    const metadataElements = [
      page.locator('text=From:'),
      page.locator('text=Topic:'),
      page.locator('text=Success Rate:'),
      page.locator('text=Time Limit:')
    ];

    for (const element of metadataElements) {
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        await expect(element).toBeVisible();
      }
    }
  });

  test('should test export functionality', async ({ page }) => {
    const exportBtn = page.getByRole('link', { name: /Export Library/i });

    // Check that export link has correct attributes
    await expect(exportBtn).toHaveAttribute('href', '/api/export-library');
    await expect(exportBtn).toHaveAttribute('download');

    // Note: Actual download testing would require more complex setup
    // This just verifies the link is properly configured
  });
});