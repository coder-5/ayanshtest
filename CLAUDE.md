# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ayansh Math Prep** is a comprehensive math practice platform for competitive mathematics exams (AMC8, MOEMS, Math Kangaroo, etc.). Built with Next.js 15, React 19, TypeScript, PostgreSQL, and Prisma ORM.

**IMPORTANT DESIGN DECISION:** This is intentionally a single-user application. The user ID is a constant (`USER_ID = 'user-ayansh'` in `lib/constants.ts`). DO NOT add authentication systems unless explicitly requested.

## Development Commands

### Running the Application

```bash
# Development server (runs on port 3000)
npm run dev

# Production build
npm run build
npm start

# Database operations
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:migrate       # Create and run migrations
npm run db:studio        # Open Prisma Studio (visual database editor)

# Code quality
npm run lint             # Run ESLint (flat config)
npm run format           # Format with Prettier
npm run format:check     # Check formatting
```

### Testing

```bash
npm test                 # Run Vitest unit tests
npm run test:ui          # Open Vitest UI
npm run test:coverage    # Generate coverage report
npm run test:api         # Run Newman/Postman API tests
npm run tests            # Run all tests (unit + API)
```

**Pre-commit Hook:** Tests run automatically before commits via Husky (`.husky/pre-commit`).

### Database Management

```bash
# Seed data
npm run db:seed          # Seed default data

# Backup/restore
npm run backup           # Manual backup
npm run restore          # Restore from backup
npm run backup:auto      # Auto backup with timestamps
npm run backup:list      # List available backups
npm run backup:cleanup   # Clean old backups
```

## Architecture Overview

### Application Structure

The codebase follows Next.js 15 App Router conventions:

- **`app/`** - Next.js App Router with API routes and pages
  - **`app/api/`** - RESTful API endpoints (Next.js Route Handlers)
  - **`app/practice/`** - Practice mode pages (quick, timed, topics, wrong-questions)
  - **`app/library/`** - Question library management
  - **`app/progress/`** - Analytics and progress tracking dashboards
  - **`app/achievements/`** - Achievement display system
  - **`app/exams/`** - Exam scheduling and management

- **`lib/`** - Shared utilities and business logic
  - **`lib/services/`** - Service layer (e.g., `questionService.ts`)
  - **`lib/constants.ts`** - Application constants (single user ID)
  - **`lib/validation.ts`** - Zod schemas for input validation
  - **`lib/sanitizer.ts`** - XSS protection that preserves LaTeX math
  - **`lib/prisma.ts`** - Database client singleton

- **`components/`** - Reusable React components
- **`prisma/schema.prisma`** - Database schema (soft-delete pattern)
- **`scripts/`** - Utility scripts for data import, backup, etc.

### Key Architectural Patterns

**1. Service Layer Pattern**
Business logic lives in `lib/services/`, not in API routes. Example:

- `QuestionService.create()` - Creates questions with sanitization and validation
- `QuestionService.update()` - Updates with upsert pattern for safety
- `QuestionService.delete()` - Soft deletes (sets `deletedAt`)

**2. Soft Delete Pattern**
All deletions use `deletedAt: DateTime?` instead of actual deletion to preserve data integrity and user history. Filter with `where: { deletedAt: null }` in all queries.

**3. Input Sanitization (Critical)**
All user input MUST be sanitized using `lib/sanitizer.ts`:

- `sanitizeQuestionText()` - Removes HTML but preserves LaTeX ($...$, $$...$$, \[...\], \(...\))
- `sanitizeOptionText()` - Same as question text
- `sanitizeSolutionText()` - Allows basic HTML tags (b, i, em, strong, br, p)
- `sanitizeIdentifier()` - For exam names, topics (alphanumeric only)

**⚠️ DO NOT sanitize at validation layer** - Sanitization happens in the service layer to preserve LaTeX math.

**4. Server-Side Answer Validation**
The client NEVER sends `isCorrect` to the server. Server calculates correctness by querying the database. See `app/api/user-attempts/route.ts`.

**5. Transaction Safety**
Use Prisma transactions for multi-step operations:

```typescript
await prisma.$transaction(async (tx) => {
  // Create question
  // Create options
  // Create solution
});
```

**6. Secure ID Generation**
Use `crypto.randomUUID()` for all new IDs. Never use `Date.now()` or `Math.random()`.

## Database Schema (Key Models)

### Core Models

- **User** - Single user profile (hardcoded to 'user-ayansh')
- **Question** - Math questions with metadata
  - Relations: options, solution, attempts, errorReports, userDiagrams
  - Unique constraint: `(examName, examYear, questionNumber)`
  - Always filter `deletedAt: null`

- **Option** - Multiple-choice answers (A-E)
- **Solution** - Written and video solutions (1:1 with Question)
- **UserAttempt** - Answer attempts with correctness tracking
  - Server validates `isCorrect` - never trust client

- **PracticeSession** - Practice session metadata
  - SessionType: QUICK, TIMED, TOPIC_FOCUSED, WEAK_AREAS, RETRY_FAILED

- **Achievement** - Unlockable achievements (criteria stored as JSON)
- **UserAchievement** - User achievement progress
- **ErrorReport** - Quality issue reporting
- **DailyProgress** - Daily stats (uses UTC for timezone safety)
- **WeeklyAnalysis** - Weekly performance reports (uses UTC)
- **TopicPerformance** - Topic mastery tracking
- **ExamSchedule** - Scheduled exams

### Important Indexes

The database has 12+ composite indexes for performance. Most important:

- Questions: `(deletedAt), (examName, examYear), (topic, difficulty), (qualityScore)`
- UserAttempts: `(userId, attemptedAt), (questionId, isCorrect), (userId, deletedAt, attemptedAt)`
- PracticeSession: `(userId, startedAt)`

## API Patterns

### Standard Response Format

```typescript
// Success
return NextResponse.json({ success: true, data: result });

// Error
return NextResponse.json({ error: 'Error message' }, { status: 400 });
```

### Input Validation

Always use Zod schemas from `lib/validation.ts`:

```typescript
import { questionCreateSchema } from '@/lib/validation';

const body = await request.json();
const validated = questionCreateSchema.parse(body); // Throws if invalid
```

### Question Filtering

Questions without answers are excluded using this pattern (see `questionService.ts:58-78`):

```typescript
where: {
  deletedAt: null,
  OR: [
    { examName: 'MOEMS Division E', AND: [{ correctAnswer: { not: null } }] },
    { examName: 'AMC8', options: { some: { isCorrect: true } } },
    // ... other exams
  ]
}
```

## LaTeX and Math Rendering

**Rendering:** The app uses KaTeX via `better-react-mathjax` to render LaTeX math expressions.

**Supported Delimiters:**

- Inline: `$...$` or `\(...\)`
- Display: `$$...$$` or `\[...\]`

**Critical:** When sanitizing, ALWAYS preserve these delimiters (handled automatically by `sanitizer.ts`).

## User Management

The app uses a **single constant user ID** (intentional for single-user use):

```typescript
// Both server-side and client-side
import { USER_ID } from '@/lib/constants';
const userId = USER_ID; // Always returns 'user-ayansh'
```

**DO NOT implement authentication or user switching** unless explicitly requested. This is a single-user local application.

## Practice Mode Logic

### Question Selection Priority

1. **Failed questions** - Questions user got wrong recently
2. **Weak topics** - Topics with accuracy < 70%
3. **Untried questions** - Never attempted
4. **Random** - If above categories exhausted

See `app/api/questions/route.ts` for implementation.

## Common Pitfalls to Avoid

### ❌ Don't Trust Client Data

```typescript
// BAD - trusts client
const { isCorrect } = await request.json();

// GOOD - server validates
const question = await prisma.question.findUnique({
  where: { id: questionId },
  include: { options: true },
});
const isCorrect =
  question.options.find((opt) => opt.optionLetter === selectedAnswer)?.isCorrect || false;
```

### ❌ Don't Use innerHTML

```typescript
// BAD - XSS vulnerability
element.innerHTML = userContent;

// GOOD - use React state
const [content, setContent] = useState('');
return <div>{content}</div>;
```

### ❌ Don't Use Weak IDs

```typescript
// BAD
id: `prefix-${Date.now()}-${Math.random()}`;

// GOOD
id: crypto.randomUUID();
```

### ❌ Don't Forget Soft Delete

```typescript
// BAD - returns deleted questions
where: { id: questionId }

// GOOD
where: { id: questionId, deletedAt: null }
```

### ❌ Don't Use Local Time for Streaks

```typescript
// BAD - breaks for users in different timezones
const today = new Date();
today.setHours(0, 0, 0, 0);

// GOOD - use UTC
const now = new Date();
const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
```

### ❌ Don't Sanitize LaTeX as HTML

```typescript
// BAD - breaks math rendering
const cleaned = text.replace(/<[^>]*>/g, '');

// GOOD - use sanitizer that preserves LaTeX
import { sanitizeQuestionText } from '@/lib/sanitizer';
const cleaned = sanitizeQuestionText(text);
```

## Code Quality Tools

- **ESLint:** Flat config (`eslint.config.mjs`), runs with `npm run lint`
- **Prettier:** Format code with `npm run format`
- **TypeScript:** Strict mode enabled, use `npx tsc --noEmit` to check
- **Vitest:** Unit tests with happy-dom
- **Newman:** API tests via Postman collections

## Environment Variables

Required in `.env`:

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/ayansh_math_prep"
NODE_ENV="development"
```

## Production Deployment

**Recommended Platform:** Vercel (optimized for Next.js)

**Pre-deployment checklist:**

1. Run `npm run build` to verify build succeeds
2. Run migrations: `npx prisma migrate deploy`
3. Apply database constraints: `psql $DATABASE_URL -f scripts/add-database-constraints.sql`
4. Set environment variables in hosting platform
5. Test critical flows (practice session, question submission)

## Known Issues

See `COMPLETE_DOCUMENTATION.md` for full security audit. Key items:

1. **No real authentication** - Hardcoded user (intentional for personal use)
2. **No rate limiting** - Vulnerable to DoS (add `@upstash/ratelimit` if needed)
3. **Race conditions** - Achievement granting needs transactions
4. **XSS protection** - DOMPurify installed but not fully integrated yet

## Additional Resources

- **Complete Documentation:** `COMPLETE_DOCUMENTATION.md` (security audit, API reference)
- **README:** `README.md` (quick start, features)
- **Database Schema:** `prisma/schema.prisma`
- **API Tests:** `postman/collections/` (run with Newman)

## Summary

This is a well-architected Next.js application with focus on:

- **Data integrity** (soft deletes, transactions)
- **Security** (server-side validation, input sanitization)
- **LaTeX support** (preserves math expressions during sanitization)
- **Type safety** (TypeScript strict mode, Zod validation)
- **Performance** (indexed queries, service layer)

When making changes, always maintain these patterns and test thoroughly with `npm run tests`.
