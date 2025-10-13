import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditResult {
  category: string;
  checks: { name: string; status: 'PASS' | 'FAIL' | 'WARN'; message: string }[];
}

async function auditDatabase(): Promise<AuditResult> {
  const checks: { name: string; status: 'PASS' | 'FAIL' | 'WARN'; message: string }[] = [];

  try {
    // Check all tables exist
    const tables = [
      'users',
      'questions',
      'options',
      'solutions',
      'user_attempts',
      'practice_sessions',
      'daily_progress',
      'topic_performance',
      'weekly_analysis',
      'achievements',
      'user_achievements',
      'exam_schedules',
      'error_reports',
      'user_diagrams',
    ];

    for (const table of tables) {
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM ${table} LIMIT 1`);
        checks.push({ name: `Table ${table}`, status: 'PASS', message: 'Exists' });
      } catch (error) {
        checks.push({ name: `Table ${table}`, status: 'FAIL', message: 'Missing' });
      }
    }

    // Check data exists
    const questionCount = await prisma.question.count({ where: { deletedAt: null } });
    const achievementCount = await prisma.achievement.count();
    const userCount = await prisma.user.count();

    checks.push({
      name: 'Questions in database',
      status: questionCount > 0 ? 'PASS' : 'WARN',
      message: `${questionCount} questions`,
    });

    checks.push({
      name: 'Achievements seeded',
      status: achievementCount >= 13 ? 'PASS' : 'WARN',
      message: `${achievementCount} achievements`,
    });

    checks.push({
      name: 'Users created',
      status: userCount > 0 ? 'PASS' : 'WARN',
      message: `${userCount} users`,
    });
  } catch (error) {
    checks.push({ name: 'Database connection', status: 'FAIL', message: String(error) });
  }

  return { category: 'Database', checks };
}

async function auditAPI(): Promise<AuditResult> {
  const checks: { name: string; status: 'PASS' | 'FAIL' | 'WARN'; message: string }[] = [];
  const apiDir = path.join(__dirname, '..', 'app', 'api');

  const expectedRoutes = [
    'achievements/route.ts',
    'daily-progress/route.ts',
    'diagrams/route.ts',
    'error-reports/route.ts',
    'error-reports/[id]/route.ts',
    'exams/route.ts',
    'exams/[id]/route.ts',
    'progress/route.ts',
    'questions/route.ts',
    'questions/[id]/route.ts',
    'sessions/route.ts',
    'sessions/[id]/route.ts',
    'topic-performance/route.ts',
    'topics/route.ts',
    'upload/route.ts',
    'user-attempts/route.ts',
    'weekly-analysis/route.ts',
  ];

  for (const route of expectedRoutes) {
    const routePath = path.join(apiDir, route);
    const exists = fs.existsSync(routePath);
    checks.push({
      name: `/api/${route.replace('/route.ts', '')}`,
      status: exists ? 'PASS' : 'FAIL',
      message: exists ? 'Implemented' : 'Missing',
    });
  }

  return { category: 'API Routes', checks };
}

async function auditPages(): Promise<AuditResult> {
  const checks: { name: string; status: 'PASS' | 'FAIL' | 'WARN'; message: string }[] = [];
  const appDir = path.join(__dirname, '..', 'app');

  const expectedPages = [
    'page.tsx', // Home
    'practice/page.tsx', // Practice Hub
    'practice/quick/page.tsx', // Quick Practice
    'practice/timed/page.tsx', // Timed Challenge
    'practice/topics/page.tsx', // Topic Practice
    'library/page.tsx', // Library
    'library/add/page.tsx', // Add Question
    'library/edit/[id]/page.tsx', // Edit Question
    'library/upload-bulk/page.tsx', // Bulk Upload
    'progress/page.tsx', // Progress Dashboard
    'daily-progress/page.tsx', // Daily Progress
    'topic-performance/page.tsx', // Topic Performance
    'weekly-analysis/page.tsx', // Weekly Analysis
    'sessions/page.tsx', // Sessions
    'achievements/page.tsx', // Achievements
    'exams/page.tsx', // Exams
    'error-reports/page.tsx', // Error Reports
  ];

  for (const page of expectedPages) {
    const pagePath = path.join(appDir, page);
    const exists = fs.existsSync(pagePath);
    const routeName = page.replace('/page.tsx', '') || '/';
    checks.push({
      name: routeName,
      status: exists ? 'PASS' : 'FAIL',
      message: exists ? 'Implemented' : 'Missing',
    });
  }

  return { category: 'UI Pages', checks };
}

async function auditComponents(): Promise<AuditResult> {
  const checks: { name: string; status: 'PASS' | 'FAIL' | 'WARN'; message: string }[] = [];
  const componentsDir = path.join(__dirname, '..', 'components');

  const expectedComponents = [
    'Navigation.tsx',
    'ErrorBoundary.tsx',
    'DiagramManager.tsx',
    'ui/Button.tsx',
  ];

  for (const component of expectedComponents) {
    const componentPath = path.join(componentsDir, component);
    const exists = fs.existsSync(componentPath);
    checks.push({
      name: component,
      status: exists ? 'PASS' : 'WARN',
      message: exists ? 'Exists' : 'Missing (optional)',
    });
  }

  return { category: 'Components', checks };
}

async function auditScripts(): Promise<AuditResult> {
  const checks: { name: string; status: 'PASS' | 'FAIL' | 'WARN'; message: string }[] = [];
  const scriptsDir = path.join(__dirname, '..', 'scripts');

  const expectedScripts = ['backup-questions.ts', 'create-user.ts', 'seed-achievements.ts'];

  for (const script of expectedScripts) {
    const scriptPath = path.join(scriptsDir, script);
    const exists = fs.existsSync(scriptPath);
    checks.push({
      name: script,
      status: exists ? 'PASS' : 'WARN',
      message: exists ? 'Exists' : 'Missing (optional)',
    });
  }

  return { category: 'Scripts', checks };
}

async function auditFeatureFlows(): Promise<AuditResult> {
  const checks: { name: string; status: 'PASS' | 'FAIL' | 'WARN'; message: string }[] = [];

  try {
    // Check if practice flow is possible
    const hasQuestions = (await prisma.question.count({ where: { deletedAt: null } })) > 0;
    checks.push({
      name: 'Practice Flow',
      status: hasQuestions ? 'PASS' : 'WARN',
      message: hasQuestions ? 'Questions available' : 'No questions to practice',
    });

    // Check if analytics flow is possible
    const hasAttempts = (await prisma.userAttempt.count()) > 0;
    checks.push({
      name: 'Analytics Flow',
      status: hasAttempts ? 'PASS' : 'WARN',
      message: hasAttempts ? 'Has user data' : 'No practice history yet',
    });

    // Check if achievement flow is possible
    const hasAchievements = (await prisma.achievement.count()) >= 13;
    checks.push({
      name: 'Achievement Flow',
      status: hasAchievements ? 'PASS' : 'FAIL',
      message: hasAchievements ? 'Achievements seeded' : 'Run: npm run seed:achievements',
    });

    // Check if user exists
    const hasUser = (await prisma.user.count()) > 0;
    checks.push({
      name: 'User Flow',
      status: hasUser ? 'PASS' : 'FAIL',
      message: hasUser ? 'User exists' : 'Run: npm run seed:user',
    });
  } catch (error) {
    checks.push({ name: 'Feature flows check', status: 'FAIL', message: String(error) });
  }

  return { category: 'Feature Flows', checks };
}

async function main() {
  console.log('🔍 CODEBASE COMPLETENESS AUDIT');
  console.log('==============================\n');

  const audits = [
    await auditDatabase(),
    await auditAPI(),
    await auditPages(),
    await auditComponents(),
    await auditScripts(),
    await auditFeatureFlows(),
  ];

  let totalPass = 0;
  let totalFail = 0;
  let totalWarn = 0;

  for (const audit of audits) {
    console.log(`\n📂 ${audit.category}`);
    console.log('─'.repeat(70));

    for (const check of audit.checks) {
      const icon = check.status === 'PASS' ? '✓' : check.status === 'FAIL' ? '✗' : '⚠';
      console.log(`  ${icon} ${check.name.padEnd(40)} ${check.message}`);

      if (check.status === 'PASS') totalPass++;
      if (check.status === 'FAIL') totalFail++;
      if (check.status === 'WARN') totalWarn++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`📊 Summary: ${totalPass} passed, ${totalFail} failed, ${totalWarn} warnings`);
  console.log('='.repeat(70));

  if (totalFail === 0) {
    console.log('\n✅ CODEBASE IS COMPLETE! All critical features implemented.');
  } else {
    console.log('\n⚠️  Some critical features are missing. See failures above.');
  }

  if (totalWarn > 0) {
    console.log(
      `\n📝 Note: ${totalWarn} warnings indicate missing optional features or empty data.`
    );
  }

  await prisma.$disconnect();
}

main().catch(console.error);
