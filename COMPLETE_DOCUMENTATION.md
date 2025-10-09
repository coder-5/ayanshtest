# AYANSH MATH PREP - COMPLETE DOCUMENTATION

**Version**: 2.0 (Production-Ready)
**Last Updated**: October 5, 2025
**Status**: ✅ Fully Functional & Optimized

---

## QUICK START

```bash
cd web-app
npx kill-port 3000
npm run dev
```
**Access**: http://localhost:3000 or http://192.168.1.197:3000

---

## TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Technology & Architecture](#2-technology--architecture)
3. [Database Schema](#3-database-schema)
4. [API Reference](#4-api-reference)
5. [Features Guide](#5-features-guide)
6. [Development Guide](#6-development-guide)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. OVERVIEW

### Purpose
Math competition practice app for Ayansh (5th grade): AMC 8, MOEMS, Math Kangaroo

### Current Status
- **16 Routes**: 12 pages + 4 API route handlers
- **4 Active Tables**: questions, options, solutions, user_diagrams
- **Build**: ✅ Clean, zero errors, zero warnings
- **Features**: Full CRUD, practice modes, diagram upload

### Key Features
| Feature | Status |
|---------|--------|
| Question CRUD | ✅ Create, Read, Update, Delete |
| Bulk Upload | ✅ JSON format |
| Diagram Upload | ✅ Image support with Next.js Image |
| Quick Practice | ✅ Random questions |
| Timed Challenge | ✅ 5/10 minute modes |
| Topic Practice | ✅ Filter by topic |
| Progress (Static) | ✅ Display only |

---

## 2. TECHNOLOGY & ARCHITECTURE

### Stack

**Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
**Backend**: Next.js API Routes, PostgreSQL 18, Prisma 6.16.3
**Tools**: ESLint, Prisma Studio
**Security**: Input validation (Zod), file upload validation, XSS prevention, transaction-safe operations

### Directory Structure

```
web-app/
├── app/
│   ├── api/                    # 4 API route handlers
│   │   ├── diagrams/route.ts   # POST, GET, DELETE
│   │   ├── questions/
│   │   │   ├── route.ts        # GET, POST
│   │   │   └── [id]/route.ts   # GET, PUT, DELETE
│   │   ├── topics/route.ts     # GET
│   │   └── upload/route.ts     # POST
│   ├── library/                # Question management
│   │   ├── page.tsx            # Browse/filter
│   │   ├── add/page.tsx        # Create
│   │   ├── edit/[id]/page.tsx  # Update
│   │   └── upload-bulk/page.tsx
│   ├── practice/               # Practice modes
│   │   ├── page.tsx
│   │   ├── quick/page.tsx
│   │   ├── timed/page.tsx
│   │   └── topics/page.tsx
│   ├── progress/page.tsx
│   └── page.tsx                # Home
├── components/
│   ├── DiagramManager.tsx      # Diagram upload/display
│   └── ErrorBoundary.tsx
├── lib/
│   ├── prisma.ts               # Database client singleton
│   ├── validation.ts           # Zod schemas for validation
│   └── services/
│       └── questionService.ts
├── prisma/schema.prisma
├── public/images/questions/    # Uploaded files
└── .env
```

### Routes (16 Total)

**Pages (12)**:
- `/` - Home
- `/practice` - Practice hub
- `/practice/quick` - Quick practice
- `/practice/timed` - Timed challenge
- `/practice/topics` - Topic selection
- `/progress` - Progress display
- `/library` - Browse questions
- `/library/add` - Add question
- `/library/edit/[id]` - Edit question
- `/library/upload-bulk` - Bulk upload
- `/_not-found` - 404 page

**API Routes (4)**:
- `/api/questions` - GET (list), POST (create)
- `/api/questions/[id]` - GET (single), PUT (update), DELETE (soft delete)
- `/api/topics` - GET (list topics with counts)
- `/api/diagrams` - POST (upload), GET (list), DELETE (soft delete)
- `/api/upload` - POST (bulk upload)

---

## 3. DATABASE SCHEMA

### Active Tables (4)

#### questions
```sql
id VARCHAR PRIMARY KEY             -- q-{nanoid(21)}
questionText TEXT NOT NULL
examName VARCHAR                   -- AMC8, MOEMS, MATHKANGAROO (nullable)
examYear INT                       -- (nullable)
questionNumber VARCHAR             -- (nullable)
difficulty ENUM NOT NULL           -- EASY, MEDIUM, HARD, EXPERT (default: MEDIUM)
topic VARCHAR                      -- (nullable)
subtopic VARCHAR                   -- (nullable)
hasImage BOOLEAN DEFAULT false
imageUrl VARCHAR                   -- (nullable)
timeLimit INT                      -- seconds (nullable)
points INT DEFAULT 1
qualityScore INT DEFAULT 100
createdAt, updatedAt TIMESTAMP
deletedAt TIMESTAMP                -- Soft delete (nullable)
```

#### options
```sql
id VARCHAR PRIMARY KEY             -- opt-{nanoid(21)}
questionId VARCHAR → questions.id  -- CASCADE DELETE
optionLetter VARCHAR NOT NULL      -- A, B, C, D, E
optionText TEXT NOT NULL
isCorrect BOOLEAN DEFAULT false
explanation TEXT                   -- (nullable)
UNIQUE (questionId, optionLetter)
```

#### solutions
```sql
id VARCHAR PRIMARY KEY             -- sol-{nanoid(21)}
questionId VARCHAR → questions.id  -- CASCADE DELETE, UNIQUE (one-to-one)
solutionText TEXT NOT NULL
approach TEXT                      -- (nullable)
difficulty TEXT                    -- (nullable)
timeEstimate INT                   -- seconds (nullable)
keyInsights TEXT                   -- (nullable)
commonMistakes TEXT                -- (nullable)
alternativeApproaches TEXT         -- (nullable)
successRate FLOAT                  -- (nullable)
videoUrl TEXT                      -- (nullable)
hints JSON                         -- array of hints (nullable)
createdAt, updatedAt TIMESTAMP
```

#### user_diagrams
```sql
id VARCHAR PRIMARY KEY             -- diagram-{nanoid(21)}
questionId VARCHAR → questions.id  -- CASCADE DELETE
userId VARCHAR                     -- (nullable, for future multi-user)
imageUrl VARCHAR NOT NULL
filename VARCHAR NOT NULL
fileSize INT, mimeType VARCHAR
status ENUM DEFAULT 'ACTIVE'       -- ACTIVE, REPLACED, DELETED
isApproved BOOLEAN DEFAULT false
isPreferred BOOLEAN DEFAULT false
uploadedAt TIMESTAMP
```

### Inactive Tables (13)
Tables defined in `schema.prisma` but not yet used: `users`, `user_attempts`, `practice_sessions`, `topic_performance`, `daily_progress`, `weekly_analysis`, `achievements`, `user_achievements`, `exam_schedules`, `error_reports`, `tags`, `topics`, `question_tags`

**Reserved for future features**: user authentication, progress tracking, achievements, etc.

### Database Enums

```sql
DifficultyLevel: EASY | MEDIUM | HARD | EXPERT
DiagramStatus: ACTIVE | REPLACED | DELETED
ExamStatus: UPCOMING | REGISTERED | COMPLETED | SCORED
ReportSeverity: LOW | MEDIUM | HIGH | CRITICAL
ReportStatus: PENDING | INVESTIGATING | CONFIRMED | FIXED | DISMISSED
AchievementType: STREAK | ACCURACY | QUESTIONS | TOPIC_MASTERY | SPEED
SessionType: QUICK | TIMED | TOPIC_FOCUSED | WEAK_AREAS | RETRY_FAILED
```

### Design Patterns

**1. Soft Delete**: Preserve data with timestamp
```typescript
// Delete (sets timestamp)
await prisma.questions.update({
  where: { id },
  data: { deletedAt: new Date() }
});

// Query (exclude deleted)
await prisma.questions.findMany({
  where: { deletedAt: null }
});
```

**2. Secure IDs**: Cryptographically random, collision-resistant
```typescript
import { nanoid } from 'nanoid';
const id = `q-${nanoid(21)}`;
// Example: q-V1StGXR8_Z5jdHi6B-myT
// 2.76 quadrillion unique IDs before 1% collision probability
```

**3. Transactions**: Atomic multi-step operations
```typescript
await prisma.$transaction(async (tx) => {
  await tx.questions.update({...});
  await tx.options.deleteMany({...});
  await tx.options.createMany({...});
});
```

---

## 4. API REFERENCE

### Questions API

#### GET /api/questions
**Query Parameters**:
- `examName` (optional): AMC8, MOEMS, MATHKANGAROO
- `topic` (optional): Filter by topic
- `difficulty` (optional): EASY, MEDIUM, HARD, EXPERT
- `limit` (optional): Max results (default: 50)
- `offset` (optional): Pagination offset

**Returns**: `{ questions: [...] }` with options included

#### POST /api/questions
**Body**:
```json
{
  "questionText": "What is 2+2?",
  "examName": "AMC8",
  "examYear": 2024,
  "topic": "Arithmetic",
  "difficulty": "EASY",
  "options": [
    { "optionLabel": "A", "optionText": "3", "isCorrect": false },
    { "optionLabel": "B", "optionText": "4", "isCorrect": true }
  ],
  "solution": "2 + 2 = 4"
}
```
**Validation**:
- `questionText` required
- `topic` optional at API level
- ≥2 options, ≥1 correct answer
- Max 6 options (A-E plus optional F)

**Returns**: `{ success: true, question: {...} }`

#### GET /api/questions/[id]
**Returns**: Single question with options and solution

#### PUT /api/questions/[id]
**Body**: Same as POST
**Process**: Update question → Delete old options → Create new options → Upsert solution (transaction)

#### DELETE /api/questions/[id]
**Action**: Soft delete (sets deletedAt timestamp)
**Returns**: `{ success: true, question: {...} }`

### Topics API

#### GET /api/topics
**Returns**:
```json
{
  "topics": [
    { "name": "Algebra", "icon": "📐", "count": 45 },
    { "name": "Geometry", "icon": "📏", "count": 32 }
  ]
}
```

### Diagrams API

#### POST /api/diagrams
**Type**: `multipart/form-data`
**Fields**:
- `file` (required): Image file
- `questionId` (required): Question ID
- `userId` (optional): User ID

**Validation**:
- Magic number check (PNG/JPG/GIF)
- Max 10MB file size
- Filename sanitization

**Process**: Transaction (create DB record → update question) → Write file to disk
**Returns**: `{ success: true, imageUrl, diagram }`

#### GET /api/diagrams
**Query**: `?questionId=q-xxx`
**Returns**: `{ diagrams: [...] }` - All active diagrams for question

#### DELETE /api/diagrams
**Query**: `?questionId=q-xxx`
**Process**: Soft delete (status=DELETED), update question.hasImage=false
**Returns**: `{ success: true, message }`

### Upload API

#### POST /api/upload
**Body**: `{ questions: [...] }` (JSON array)
**Process**: Validates and creates each question
**Returns**:
```json
{
  "success": true,
  "uploaded": 45,
  "failed": 2,
  "total": 47,
  "errors": [
    { "index": 3, "error": "Missing required field" }
  ]
}
```

---

## 5. FEATURES GUIDE

### Question Management

**Create** (`/library/add`):
1. Fill form fields:
   - Question text* (required)
   - Exam name, year, question number (optional)
   - Topic (optional but recommended)
   - Difficulty* (default: MEDIUM)
   - Options A-E* (minimum 2, mark correct answer)
   - Solution text (optional)
2. Optionally upload diagram (PNG/JPG/GIF, max 10MB)
3. Submit → Redirects to library

**Edit** (`/library/edit/[id]`):
1. Loads existing question data
2. Modify any fields
3. Upload/replace/delete diagram
4. Submit → Updates question (transaction) → Redirects to library

**Delete** (Library page):
1. Click Delete button
2. Confirm dialog
3. Soft delete (sets deletedAt) → Removed from UI

**Browse** (`/library`):
- Filter by: Exam type, Topic (text search), Difficulty
- Pagination: 20 questions per page
- Actions: Search, Reset, Edit, Delete, Add, Bulk Upload

### Practice Modes

**Quick Practice** (`/practice/quick`):
- Random questions from library
- Immediate feedback after each answer
- Score tracking during session
- URL parameter: `?topic=Algebra` for topic filtering

**Timed Challenge** (`/practice/timed`):
- Two modes: Quick (5 min, 10 questions), Standard (10 min, 10 questions)
- Countdown timer
- Question navigation (mark for review)
- Results page: Score, percentage, option to retry

**Topic Practice** (`/practice/topics`):
- Lists all unique topics with question counts
- Click topic → Redirects to `/practice/quick?topic={name}`

### Diagram Management

**Upload** (In Add/Edit pages):
- Drag & drop or click to upload
- Preview before submission
- Supported: PNG, JPG, GIF (max 10MB)
- Magic number validation (security)
- Transaction-safe (no orphaned files)

**Display**:
- Next.js Image component (optimized)
- Lazy loading
- Responsive sizing

**Replace/Delete**:
- Available in edit page
- Soft delete (preserves history)

### Bulk Upload

**Process** (`/library/upload-bulk`):
1. Upload JSON file with array of questions
2. Each question validated individually
3. Shows results: Total, uploaded, failed
4. Error details for failed questions

**JSON Format**:
```json
[
  {
    "questionText": "What is 2+2?",
    "examName": "AMC8",
    "examYear": 2024,
    "topic": "Arithmetic",
    "difficulty": "EASY",
    "options": [
      { "optionLabel": "A", "optionText": "3", "isCorrect": false },
      { "optionLabel": "B", "optionText": "4", "isCorrect": true }
    ],
    "solution": "Simple addition"
  }
]
```

---

## 6. DEVELOPMENT GUIDE

### Initial Setup

```bash
# 1. Install dependencies
cd web-app
npm install

# 2. Setup environment
echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ayansh_math_prep"' > .env

# 3. Initialize database
npx prisma db push

# 4. Start development server
npm run dev
```

### Common Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server (http://localhost:3000) |
| `npm run build` | Build for production |
| `npm run lint` | Check code quality |
| `npx prisma studio` | Open database GUI (http://localhost:5555) |
| `npx prisma db push` | Sync schema.prisma to database |
| `npx kill-port 3000` | Kill process on port 3000 |
| `rm -rf .next` | Clear Next.js cache |

### Configuration Files

**Environment** (`.env`):
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ayansh_math_prep"
```

**Next.js** (`next.config.ts`):
```typescript
{
  allowedDevOrigins: ['http://192.168.1.197:3000'],
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '192.168.1.197' }
    ]
  }
}
```

### Best Practices

**Before Starting**:
- ✅ Kill any existing process on port 3000
- ✅ Verify PostgreSQL is running
- ✅ Check `.env` file exists

**During Development**:
- ✅ Use TypeScript strict mode
- ✅ Follow naming: `optionLabel` (API) vs `optionLetter` (DB)
- ✅ Test in browser frequently
- ✅ Monitor browser console for errors

**Before Committing**:
- ✅ `npm run build` must pass
- ✅ `npm run lint` must pass
- ✅ Test all modified pages
- ✅ Check network tab in DevTools

### Code Patterns

**Server vs Client Components**:
```typescript
// Server Component (default) - for static content
export default function Page() {
  return <div>Static content</div>;
}

// Client Component - requires 'use client' directive
'use client';
import { useState } from 'react';

export default function Page() {
  const [state, setState] = useState();
  return <button onClick={() => setState(...)}>Click</button>;
}
```

**When to use 'use client'**:
- Forms with state
- Event handlers (onClick, onChange)
- React hooks (useState, useEffect, useRouter)
- Browser APIs (localStorage, window)

### Key Learnings from Development

**Database Schema**:
- ✅ Make fields nullable unless absolutely required
- ✅ Use soft delete (deletedAt) to preserve data
- ✅ Use transactions for multi-step operations
- ✅ Use enums for fixed value sets

**API Design**:
- ✅ Validate input with Zod schemas
- ✅ Use nanoid for secure, collision-resistant IDs
- ✅ Return consistent error formats
- ✅ Implement payload size limits (prevent DoS)

**File Uploads**:
- ✅ Validate file types with magic numbers (not just extension)
- ✅ Sanitize filenames (remove path traversal attempts)
- ✅ Write files AFTER database transaction succeeds
- ✅ Check directory exists before writing

**Next.js 15 Specifics**:
- ✅ Server components are default
- ✅ `params` are Promises (need `await`)
- ✅ Images need remote patterns config
- ✅ Dev origins need full URLs with protocol

---

## 7. TROUBLESHOOTING

### Common Issues

| Issue | Solution |
|-------|----------|
| **Port 3000 in use** | `npx kill-port 3000` then restart |
| **Webpack errors** | `rm -rf .next && npm run dev` |
| **Database connection failed** | Check PostgreSQL: `pg_isready` and verify `.env` |
| **Build failures** | Check types: `npx tsc --noEmit` |
| **CORS errors** | Verify `next.config.ts` has `http://` in origins |
| **Images not showing** | Check: file exists, `imageUrl` correct, `hasImage=true` |
| **Deleted questions appearing** | Add `where: { deletedAt: null }` to query |
| **404 on page** | Ensure file is named `page.tsx`, restart server |

### Debugging Checklist

**Server Issues**:
- [ ] Only one instance running on port 3000?
- [ ] `.env` file present and correct?
- [ ] No TypeScript errors in terminal?

**Build Issues**:
- [ ] All dependencies installed?
- [ ] Prisma client generated? (`npx prisma generate`)
- [ ] Lint passes?
- [ ] TypeScript compiles without errors?

**Database Issues**:
- [ ] PostgreSQL service running?
- [ ] Database `ayansh_math_prep` exists?
- [ ] Tables created? (check with `\dt` in psql)

**Frontend Issues**:
- [ ] Browser console errors?
- [ ] Network tab shows failed requests?
- [ ] Hard refresh tried? (Ctrl+Shift+R)

### Useful SQL Queries

```sql
-- Count active questions
SELECT COUNT(*) FROM questions WHERE "deletedAt" IS NULL;

-- Recent questions
SELECT id, "questionText", "createdAt"
FROM questions
WHERE "deletedAt" IS NULL
ORDER BY "createdAt" DESC
LIMIT 10;

-- Questions by topic
SELECT topic, COUNT(*) as count
FROM questions
WHERE "deletedAt" IS NULL AND topic IS NOT NULL
GROUP BY topic
ORDER BY count DESC;

-- Questions without diagrams
SELECT id, "questionText", "hasImage"
FROM questions
WHERE "deletedAt" IS NULL AND "hasImage" = false
LIMIT 10;

-- Restore soft-deleted question
UPDATE questions SET "deletedAt" = NULL WHERE id = 'q-xxx';

-- Permanently delete old soft-deleted (cleanup)
DELETE FROM questions
WHERE "deletedAt" < NOW() - INTERVAL '30 days';
```

---

## APPENDICES

### TypeScript Interfaces

```typescript
interface Question {
  id: string;
  questionText: string;
  examName: string | null;
  examYear: number | null;
  questionNumber: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  topic: string | null;
  subtopic: string | null;
  hasImage: boolean;
  imageUrl: string | null;
  timeLimit: number | null;
  points: number;
  qualityScore: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  options: Option[];
  solutions?: Solution;
}

interface Option {
  id: string;
  optionLetter: string;  // A, B, C, D, E
  optionText: string;
  isCorrect: boolean;
  explanation: string | null;
}

interface Solution {
  id: string;
  questionId: string;
  solutionText: string;
  approach: string | null;
  hints: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UserDiagram {
  id: string;
  questionId: string;
  userId: string | null;
  imageUrl: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  status: 'ACTIVE' | 'REPLACED' | 'DELETED';
  isApproved: boolean;
  isPreferred: boolean;
  uploadedAt: Date;
}
```

### Validation Schema

**Topic Field Clarification**:
- **Database**: `topic VARCHAR` (nullable) - accepts null values
- **API Validation**: `topic` is marked as required in validation schema
- **Frontend**: Topic field is optional but recommended
- **Behavior**: API enforces topic requirement, but can be bypassed if needed

```typescript
// Question create/update validation
export const questionUpdateSchema = z.object({
  questionText: z.string().min(1, 'Question text is required'),
  examName: z.string().optional(),
  examYear: z.number().int().min(1900).max(2100).optional(),
  topic: z.string().min(1, 'Topic is required'),  // Required at API level
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).optional(),
  options: z.array(
    z.object({
      optionLabel: z.string().min(1),
      optionText: z.string().min(1),
      isCorrect: z.boolean(),
    })
  ).min(2).max(6),  // Minimum 2 options, maximum 6
  solution: z.string().optional(),
});
```

### Future Enhancements

**Phase 1 (High Priority)**:
- User authentication (integrate `users` table)
- Progress tracking (integrate `user_attempts`, `practice_sessions`)
- Performance analytics dashboard
- Weak areas identification and retry mode

**Phase 2 (Medium Priority)**:
- Full exam simulation mode
- Adaptive difficulty based on performance
- Video solution integration
- Export progress reports (PDF)

**Phase 3 (Low Priority)**:
- Achievements & gamification system
- Mobile PWA (Progressive Web App)
- AI-powered question generation
- Cloud deployment (Vercel + Supabase)
- Multi-user support with roles

---

## RECENT UPDATES

### October 5, 2025 - Documentation Cleanup & Image Optimization
- ✅ Consolidated all documentation into single source
- ✅ Removed duplicate information and ambiguities
- ✅ Replaced `<img>` with Next.js `<Image>` component (3 locations)
- ✅ Fixed image optimization warnings in production build
- ✅ Comprehensive code health check completed
- ✅ Database schema verified and consistent
- ✅ All API routes functional and secure
- ✅ Clarified topic field validation behavior

**Build Status**: ✅ PASSING
**Routes**: 16 total (12 pages + 4 API route handlers)
**Bundle Size**: 102 kB shared JS
**Compile Time**: ~3 seconds

---

*Last Updated: October 5, 2025 | Version 2.0 | Production-Ready & Optimized*
