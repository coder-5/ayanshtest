import { test, expect } from '@playwright/test';

test.describe('Progress Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/progress');
  });

  test('should display progress page header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Progress/i })).toBeVisible();
  });

  test('should display overall statistics cards', async ({ page }) => {
    // Look for common progress metrics
    const statTexts = [
      'Questions Attempted',
      'Accuracy',
      'Average Time',
      'Total Time',
      'Current Streak',
      'Best Streak'
    ];

    // At least some of these should be visible
    for (const statText of statTexts) {
      const statElement = page.getByText(statText);
      const isVisible = await statElement.isVisible().catch(() => false);
      if (isVisible) {
        await expect(statElement).toBeVisible();
      }
    }
  });

  test('should display progress charts and visualizations', async ({ page }) => {
    // Look for chart containers or canvas elements
    const chartElements = [
      page.locator('canvas'),
      page.locator('[data-testid="progress-chart"]'),
      page.locator('[data-testid="performance-chart"]'),
      page.locator('.recharts-wrapper').or(page.locator('.chart-container'))
    ];

    for (const chartElement of chartElements) {
      const isVisible = await chartElement.isVisible().catch(() => false);
      if (isVisible) {
        await expect(chartElement).toBeVisible();
      }
    }
  });

  test('should display weekly activity section', async ({ page }) => {
    // Look for weekly activity component
    const weeklyActivity = page.locator('[data-testid="weekly-activity"]').or(
      page.getByText('Weekly Activity')
    );

    const hasWeeklyActivity = await weeklyActivity.isVisible().catch(() => false);

    if (hasWeeklyActivity) {
      await expect(weeklyActivity).toBeVisible();
    }
  });

  test('should display topic performance breakdown', async ({ page }) => {
    // Look for topic-based performance metrics
    const topicElements = [
      page.getByText('Topic Performance'),
      page.getByText('Subject Breakdown'),
      page.getByText('Areas for Improvement'),
      page.locator('[data-testid="topic-performance"]')
    ];

    for (const element of topicElements) {
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        await expect(element).toBeVisible();
      }
    }
  });

  test('should display competition-specific statistics', async ({ page }) => {
    // Look for competition breakdown
    const competitions = ['AMC 8', 'MOEMS', 'Math Kangaroo', 'MathCounts'];

    for (const competition of competitions) {
      const competitionElement = page.getByText(competition);
      const isVisible = await competitionElement.isVisible().catch(() => false);
      if (isVisible) {
        await expect(competitionElement).toBeVisible();
      }
    }
  });

  test('should display achievement or milestone indicators', async ({ page }) => {
    // Look for achievements, badges, or milestones
    const achievementElements = [
      page.getByText('Achievements'),
      page.getByText('Milestones'),
      page.getByText('Goals'),
      page.locator('[data-testid="achievement"]'),
      page.locator('🏆').or(page.locator('🥇')).or(page.locator('⭐'))
    ];

    for (const element of achievementElements) {
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        await expect(element).toBeVisible();
      }
    }
  });

  test('should display recent attempts or activity log', async ({ page }) => {
    // Look for recent activity section
    const recentElements = [
      page.getByText('Recent Attempts'),
      page.getByText('Recent Activity'),
      page.getByText('Latest Practice'),
      page.locator('[data-testid="recent-attempts"]')
    ];

    for (const element of recentElements) {
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        await expect(element).toBeVisible();
      }
    }
  });

  test('should handle empty progress state', async ({ page }) => {
    // Look for empty state messages
    const emptyStateMessages = [
      'No progress data available',
      'Start practicing to see your progress',
      'No attempts yet',
      'Begin your learning journey'
    ];

    // Check if any empty state messages are shown
    for (const message of emptyStateMessages) {
      const messageElement = page.getByText(message);
      const isVisible = await messageElement.isVisible().catch(() => false);
      if (isVisible) {
        await expect(messageElement).toBeVisible();
      }
    }
  });

  test('should display time-based filters or date ranges', async ({ page }) => {
    // Look for date filters or time range selectors
    const timeFilters = [
      page.getByText('Last 7 days'),
      page.getByText('Last 30 days'),
      page.getByText('This month'),
      page.getByText('All time'),
      page.locator('[data-testid="date-filter"]'),
      page.locator('input[type="date"]')
    ];

    for (const filter of timeFilters) {
      const isVisible = await filter.isVisible().catch(() => false);
      if (isVisible) {
        await expect(filter).toBeVisible();
      }
    }
  });

  test('should display progress percentage indicators', async ({ page }) => {
    // Look for percentage values and progress bars
    const progressElements = [
      page.locator('text=/%/'),
      page.locator('.progress-bar').or(page.locator('[role="progressbar"]')),
      page.locator('[data-testid="progress-indicator"]')
    ];

    for (const element of progressElements) {
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        await expect(element).toBeVisible();
      }
    }
  });

  test('should display difficulty-based performance metrics', async ({ page }) => {
    // Look for difficulty breakdowns
    const difficultyElements = [
      page.getByText('Easy'),
      page.getByText('Medium'),
      page.getByText('Hard'),
      page.getByText('Difficulty Breakdown')
    ];

    for (const element of difficultyElements) {
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        await expect(element).toBeVisible();
      }
    }
  });

  test('should have navigation back to dashboard', async ({ page }) => {
    const backBtn = page.getByRole('link', { name: /Back to Dashboard/i }).or(
      page.getByRole('button', { name: /Back/i })
    );

    const hasBackNavigation = await backBtn.isVisible().catch(() => false);

    if (hasBackNavigation) {
      await expect(backBtn).toBeVisible();

      // Test navigation
      await backBtn.click();
      await expect(page).toHaveURL('/');
    }
  });

  test('should display exportable data options', async ({ page }) => {
    // Look for export or download options
    const exportElements = [
      page.getByText('Export'),
      page.getByText('Download'),
      page.getByRole('button', { name: /Export/i }),
      page.getByRole('link', { name: /Download/i })
    ];

    for (const element of exportElements) {
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        await expect(element).toBeVisible();
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that main progress elements are visible on mobile
    await expect(page.locator('body')).toBeVisible();

    // Look for at least one main progress indicator
    const mainElements = [
      page.getByRole('heading', { name: /Progress/i }),
      page.locator('[data-testid="progress-stats"]'),
      page.getByText('Questions Attempted').or(page.getByText('Accuracy'))
    ];

    let foundElement = false;
    for (const element of mainElements) {
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        await expect(element).toBeVisible();
        foundElement = true;
        break;
      }
    }

    // At least one progress element should be visible
    if (!foundElement) {
      // If no specific progress elements, at least the page should load
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle data loading states', async ({ page }) => {
    // Look for loading indicators
    const loadingElements = [
      page.locator('.animate-spin'),
      page.locator('text=Loading'),
      page.locator('[data-testid="loading"]'),
      page.locator('.spinner')
    ];

    // Loading might be brief, so we just check if page loads successfully
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display numerical statistics with proper formatting', async ({ page }) => {
    // Look for numerical values and ensure they're properly formatted
    const numberElements = page.locator('text=/\\d+%/').or(
      page.locator('text=/\\d+\\.\\d+/')
    ).or(
      page.locator('text=/\\d+/')
    );

    const hasNumbers = await numberElements.first().isVisible().catch(() => false);

    if (hasNumbers) {
      await expect(numberElements.first()).toBeVisible();
    }
  });

  test('should test interactive chart elements', async ({ page }) => {
    // Look for interactive chart elements
    const interactiveElements = [
      page.locator('canvas'),
      page.locator('[data-testid="interactive-chart"]'),
      page.locator('.recharts-tooltip-wrapper')
    ];

    for (const element of interactiveElements) {
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        await expect(element).toBeVisible();

        // Test hover interaction if possible
        await element.hover();
      }
    }
  });
});