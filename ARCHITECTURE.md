# Ayansh Math Competition Prep - Complete Architecture Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Database Schema](#database-schema)
5. [Application Structure](#application-structure)
6. [Key Features](#key-features)
7. [API Routes](#api-routes)
8. [Services Layer](#services-layer)
9. [Component Architecture](#component-architecture)
10. [Data Flow](#data-flow)
11. [Security & Performance](#security--performance)

---

## Overview

**Purpose**: A comprehensive web application for personal family use to help Ayansh (5th grade, highly talented) prepare for math competitions.

**Target Competitions**:
- **AMC 8**: 25 multiple choice questions (A-E format), 40-minute time limit
- **MOEMS**: 5 open-ended questions per contest (2A-2E format), individual time limits (4-7 minutes)
- **Math Kangaroo**: Age-appropriate levels for grades 3-5 and 6-8

**Core Philosophy**:
- Family-first: No authentication required, direct access
- Privacy-focused: All data stays within family database
- Quality-aware: Smart scoring that protects against incomplete/broken questions
- Kid-friendly: Simple, visual interface with emoji-based feedback

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS 3.4
- **Component Library**: shadcn/ui (Radix UI primitives)
- **Math Rendering**: KaTeX 0.16.22, better-react-mathjax
- **Forms**: React Hook Form 7.52 + Zod validation
- **Charts**: Recharts 2.12, D3.js 7.9
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma 6.16
- **File Processing**:
  - Word: mammoth.js
  - PDF: pdf-parse
  - OCR: tesseract.js
- **Image Processing**: Sharp 0.34

### Development
- **Language**: TypeScript 5
- **Linting**: ESLint 8
- **Testing**: Playwright 1.55
- **Dev Server**: Next.js Turbopack

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Practice   │  │  Dashboard   │  │   Upload     │     │
│  │     UI       │  │   Analytics  │  │  Documents   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Next.js App Router                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Page Routes │  │  API Routes  │  │  Middleware  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Services Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Question   │  │   Progress   │  │   Quality    │     │
│  │   Service    │  │   Service    │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Prisma ORM                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL Database                          │
│  - Questions & Solutions                                    │
│  - User Attempts & Sessions                                 │
│  - Progress Analytics                                       │
│  - Error Reports & Quality Scores                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Entities

#### **Question** (Primary Content)
```prisma
- id: String (cuid)
- questionText: String (LaTeX/MathJax format)
- examName: String? (AMC8, Kangaroo, MOEMS)
- examYear: Int?
- questionNumber: String? (1-25 for AMC, 2A-2E for MOEMS)
- difficulty: DifficultyLevel (EASY, MEDIUM, HARD)
- topic: String (Algebra, Geometry, etc.)
- subtopic: String?
- hasImage: Boolean
- imageUrl: String?
- timeLimit: Int? (for MOEMS)
- Relations: options[], solution, attempts[], tags[], errorReports[]
```

#### **Option** (Multiple Choice Answers)
```prisma
- id: String
- questionId: String
- optionLetter: String (A-E)
- optionText: String
- isCorrect: Boolean
```

#### **Solution** (Detailed Explanations)
```prisma
- id: String
- questionId: String (unique)
- solutionText: String (LaTeX format)
- approach: String? (algebraic, geometric, etc.)
- difficulty: String
- timeEstimate: Int?
- keyInsights: String? (comma-separated)
- commonMistakes: String?
- alternativeApproaches: String?
- successRate: Float?
```

#### **UserAttempt** (Practice History)
```prisma
- id: String
- userId: String
- questionId: String
- selectedAnswer: String?
- isCorrect: Boolean
- timeSpent: Int (seconds)
- hintsUsed: Int
- excludeFromScoring: Boolean (quality protection)
- attemptedAt: DateTime
- sessionId: String?
```

#### **PracticeSession** (Study Sessions)
```prisma
- id: String
- userId: String
- sessionType: String (timed, topic-focused, exam-simulation)
- startedAt: DateTime
- completedAt: DateTime?
- totalQuestions: Int
- correctAnswers: Int
- totalTime: Int?
- focusTopics: String?
```

#### **DailyProgress** (Daily Analytics)
```prisma
- id: String
- userId: String
- date: DateTime
- questionsAttempted: Int
- correctAnswers: Int
- totalTimeSpent: Int
- averageAccuracy: Float
- topicsStudied: String?
- streakDays: Int
- isStreakDay: Boolean
```

#### **ErrorReport** (Quality Monitoring)
```prisma
- id: String
- questionId: String
- userId: String?
- reportType: String (WRONG_ANSWER, MISSING_DIAGRAM, etc.)
- description: String
- severity: ReportSeverity (LOW, MEDIUM, HIGH, CRITICAL)
- status: ReportStatus (PENDING, INVESTIGATING, CONFIRMED, FIXED)
- confidence: Int (1-10)
- reviewNotes: String?
```

#### **UserDiagram** (Custom Diagrams)
```prisma
- id: String
- questionId: String
- userId: String?
- imageUrl: String
- filename: String
- fileSize: Int
- mimeType: String
- status: DiagramStatus (ACTIVE, REPLACED, DELETED)
- isApproved: Boolean
- isPreferred: Boolean
```

### Indexes for Performance
- Multi-column indexes for common queries
- Topic + difficulty combinations
- Date-based queries (attempts, progress)
- Quality-aware filtering

---

## Application Structure

### Directory Organization

```
ayansh-math-prep/
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Sample data seeder
├── public/
│   └── uploads/                # Uploaded files
│       ├── questions/
│       ├── solutions/
│       └── images/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes
│   │   │   ├── achievements/
│   │   │   ├── error-reports/
│   │   │   ├── questions/
│   │   │   ├── progress/
│   │   │   ├── quality/
│   │   │   ├── solutions/
│   │   │   ├── stats/
│   │   │   └── upload/
│   │   ├── practice/           # Practice modes
│   │   │   ├── amc8/
│   │   │   ├── quick/
│   │   │   ├── timed/
│   │   │   ├── topics/
│   │   │   └── weak-areas/
│   │   ├── progress/           # Analytics dashboard
│   │   ├── library/            # Question library
│   │   ├── upload/             # Document upload
│   │   ├── add-question/       # Manual question entry
│   │   ├── edit-questions/     # Question management
│   │   ├── solutions/          # Solution viewer
│   │   └── exams/              # Exam scheduling
│   ├── components/             # React components
│   │   ├── ui/                 # Base UI components (shadcn)
│   │   ├── practice/           # Practice-specific components
│   │   ├── analytics/          # Charts and stats
│   │   ├── math/               # Math rendering
│   │   ├── quality/            # Quality indicators
│   │   ├── diagrams/           # Diagram management
│   │   └── achievements/       # Gamification
│   ├── lib/                    # Utilities
│   │   ├── prisma.ts          # Database client
│   │   ├── error-handler.ts   # Error handling
│   │   ├── api-wrapper.ts     # API utilities
│   │   └── rate-limiter.ts    # Rate limiting
│   ├── services/               # Business logic
│   │   ├── questionService.ts
│   │   ├── progressService.ts
│   │   └── questionQualityService.ts
│   ├── hooks/                  # Custom React hooks
│   │   └── useAsyncState.ts
│   ├── types/                  # TypeScript types
│   ├── schemas/                # Zod validation schemas
│   ├── constants/              # App constants
│   └── utils/                  # Helper functions
├── tests/                      # Playwright tests
│   ├── upload.spec.ts
│   ├── practice.spec.ts
│   └── user-workflows.spec.ts
└── scripts/                    # Utility scripts
    ├── backup-questions.js
    └── migrate-safely.js
```

---

## Key Features

### 1. **Question Practice System**
- Multiple practice modes:
  - **Quick Practice**: Random questions
  - **Timed Practice**: Exam simulation with timer
  - **Topic-Focused**: Filter by topic/difficulty
  - **Weak Areas**: Adaptive learning based on performance
  - **Retry Failed**: Review previously missed questions
- Real-time KaTeX math rendering
- Immediate feedback with detailed solutions
- Progress tracking per session

### 2. **Document Upload & Parsing**
- Supported formats: DOCX, PDF, Images
- Automatic question extraction
- Multiple choice option detection
- Solution matching and verification
- Diagram preservation and linking
- Batch processing capabilities

### 3. **Progress Analytics**
- **Daily Tracking**:
  - Questions attempted
  - Accuracy rate
  - Time spent
  - Streak tracking
- **Weekly Analysis**:
  - Performance trends
  - Weak topic identification
  - Improvement rate calculation
- **Topic Performance**:
  - Per-topic accuracy
  - Average time per topic
  - Strength level classification

### 4. **Quality Protection System**
- Automatic quality score calculation
- Error report integration
- Smart scoring exclusions
- Quality-weighted statistics
- Visual quality indicators

### 5. **Kid-Friendly Error Reporting**
- One-click issue reporting
- Visual, emoji-based interface
- Automatic geometry question detection
- Pre-defined report types:
  - 📷 Missing Picture
  - 👁️ Can't See Picture
  - ❓ Don't Understand
  - ⚠️ Wrong Answer

### 6. **Gamification**
- Achievement system
- Streak tracking
- Progress celebrations
- Badge collection

### 7. **Exam Scheduling**
- Upcoming exam tracker
- Registration management
- Score recording
- Percentile tracking

---

## API Routes

### Questions
- `GET /api/questions` - List questions with filters
- `GET /api/questions/[id]` - Get single question
- `POST /api/questions` - Create new question
- `PUT /api/questions/[id]` - Update question
- `DELETE /api/questions/[id]` - Soft delete question
- `GET /api/questions/random` - Get random question
- `GET /api/question-counts` - Get counts by topic/exam

### Practice & Attempts
- `POST /api/user-attempts` - Record attempt
- `GET /api/user-attempts` - Get attempt history
- `GET /api/failed-questions` - Get questions to retry

### Progress & Analytics
- `GET /api/progress/daily` - Daily progress stats
- `GET /api/progress/weekly` - Weekly analysis
- `GET /api/progress/topics` - Topic performance
- `GET /api/stats` - Overall statistics

### Quality & Error Reports
- `POST /api/error-reports` - Submit error report
- `GET /api/error-reports` - List reports
- `GET /api/quality/[questionId]` - Get quality score
- `PUT /api/error-reports/[id]` - Update report status

### Solutions
- `GET /api/solutions/[questionId]` - Get solution
- `POST /api/solutions` - Create solution
- `PUT /api/solutions/[id]` - Update solution

### Upload & Library
- `POST /api/upload` - Upload document
- `GET /api/library` - Browse question library
- `GET /api/export-library` - Export questions

### Diagrams
- `POST /api/diagrams` - Upload custom diagram
- `GET /api/diagrams/[questionId]` - Get diagrams
- `PUT /api/diagrams/[id]` - Update diagram status

### Achievements
- `GET /api/achievements` - Get user achievements
- `POST /api/achievements/check` - Check for new achievements

### Admin
- `GET /api/admin/stats` - Admin statistics
- `POST /api/admin/recalculate-quality` - Recalculate quality scores

---

## Services Layer

### **questionService.ts**
- Question CRUD operations
- Random question selection
- Topic-based filtering
- Quality-aware querying
- Soft delete management

### **progressService.ts**
- Attempt tracking
- Daily/weekly analytics calculation
- Streak management
- Topic performance analysis
- Quality-weighted statistics

### **questionQualityService.ts**
- Quality score calculation
- Error report aggregation
- Severity impact assessment
- Bulk quality processing
- Quality threshold enforcement

---

## Component Architecture

### UI Components (shadcn/ui)
- Button, Card, Dialog, Input, Select
- Progress, Tabs, Toast
- All fully typed with TypeScript
- Accessible (Radix UI primitives)

### Practice Components
- `QuestionDisplay` - Math rendering with KaTeX
- `AnswerOptions` - Multiple choice or open-ended input
- `Timer` - Countdown timer for timed practice
- `ResultFeedback` - Immediate feedback display
- `SolutionViewer` - Step-by-step solution display

### Analytics Components
- `DailyProgressChart` - Recharts line/bar charts
- `TopicHeatmap` - D3.js visualization
- `WeeklyTrends` - Performance trends
- `StreakCounter` - Gamified streak display

### Quality Components
- `QuestionQualityIndicator` - Visual quality badges
- `ErrorReportButton` - Kid-friendly reporting
- `QualityWarning` - Issue notifications

### Math Components
- `MathRenderer` - KaTeX/MathJax wrapper
- `LatexInput` - Math equation input
- `DiagramViewer` - Image display with zoom

---

## Data Flow

### Question Practice Flow
```
1. User selects practice mode
   ↓
2. Frontend requests questions from API
   ↓
3. questionService queries database with filters
   ↓
4. Quality scores calculated/cached
   ↓
5. Questions returned to frontend
   ↓
6. User answers question
   ↓
7. Frontend submits attempt to API
   ↓
8. progressService records attempt
   ↓
9. Daily/weekly stats updated
   ↓
10. Achievement check triggered
    ↓
11. Feedback displayed to user
```

### Error Reporting Flow
```
1. User clicks "Something Wrong?"
   ↓
2. Kid-friendly options displayed
   ↓
3. User selects issue type
   ↓
4. Error report submitted to API
   ↓
5. questionQualityService recalculates quality
   ↓
6. Quality score updated in database
   ↓
7. Future scoring automatically adjusted
   ↓
8. Success message shown to user
```

### Document Upload Flow
```
1. User uploads DOCX/PDF/Image
   ↓
2. File saved to /public/uploads
   ↓
3. Parser extracts text (mammoth/pdf-parse/tesseract)
   ↓
4. Question detection algorithm runs
   ↓
5. Options and solutions parsed
   ↓
6. Preview shown to user
   ↓
7. User confirms extraction
   ↓
8. Questions saved to database
   ↓
9. Initial quality score assigned
```

---

## Security & Performance

### Security Measures
- **Input Validation**: Zod schemas for all API inputs
- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **XSS Protection**: DOMPurify for user-generated content
- **Rate Limiting**: API route protection (100 requests/minute)
- **File Upload Limits**: 10MB max file size
- **CORS Configuration**: Restricted origins

### Performance Optimizations
- **Database Indexing**:
  - Multi-column indexes for common queries
  - Covering indexes for hot paths
- **Caching Strategy**:
  - Quality scores cached per request
  - Static content served from Next.js cache
- **Lazy Loading**:
  - Code splitting for routes
  - Dynamic imports for heavy components
- **Image Optimization**:
  - Sharp for image processing
  - Next.js Image component for serving
- **Query Optimization**:
  - Selective field loading
  - Pagination for large datasets
  - Aggregation pipelines for analytics

### Monitoring
- **Error Handling**: Standardized error logger
- **Performance Metrics**: Built-in Next.js analytics
- **Quality Tracking**: Question quality dashboard

---

## Environment Variables

### Required
```env
DATABASE_URL="postgresql://user:pass@host:5432/ayansh_math_prep"
```

### Optional
```env
UPLOAD_DIR="./public/uploads"
AMC_FOLDER="./uploads/amc-files"
DOCX_PATH="./uploads/documents/document.docx"
```

---

## Development Workflow

### Setup
```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

### Testing
```bash
npm test              # Run all Playwright tests
npm run test:ui       # Interactive test UI
npm run test:workflows # User workflow tests
```

### Database Management
```bash
npm run db:studio     # Visual database browser
npm run db:backup     # Backup questions
npm run db:restore    # Restore from backup
```

---

## Deployment Considerations

### Local Network Deployment
- Server runs on `192.168.1.197:3000`
- Accessible from family devices
- No external authentication required
- Local PostgreSQL database

### Production Build
```bash
npm run build
npm run start
```

---

## Known Issues & Technical Debt

### 🔴 Critical Issues (Previous Implementation)

#### 1. Database Management
- **Issue**: Database schema inconsistencies, missing constraints
- **Impact**: Data integrity problems, application crashes
- **Fix Required**: Fresh database with proper constraints and validation

#### 2. No Proper User Management
- **Issue**: Hardcoded userId = 'ayansh', no multi-user support
- **Impact**: Cannot add family members
- **Fix Required**: Simple user creation flow with user selection

#### 3. Missing Database Constraints
- **Issue**: Validation only in code, not enforced at DB level
- **Examples**:
  - `timeSpent` could be negative
  - `hintsUsed` could be negative
  - No CHECK constraints
- **Fix Required**: Add CHECK constraints in Prisma schema

### 🟡 Major Architectural Gaps (Previous Implementation)

#### 4. Circular Dependencies
- **Issue**: Services reference each other creating tight coupling
- **Example**: questionService → qualityService ↔ progressService
- **Impact**: Hard to maintain, test, and refactor
- **Fix Required**: Unidirectional dependency flow, dependency injection

#### 5. No Caching Strategy
- **Issue**: Quality scores recalculated on every request
- **Impact**: Performance degradation with scale
- **Fix Required**: Add Redis or in-memory caching with TTL

#### 6. Missing Transaction Management
- **Issue**: Multi-step operations not atomic
- **Example**: UserAttempt creation + DailyProgress update not atomic
- **Impact**: Data inconsistency if operations fail mid-way
- **Fix Required**: Use Prisma transactions for multi-step operations

#### 7. Inconsistent Error Handling
- **Issue**: Mixed error handling patterns across routes
- **Impact**: Hard to debug, inconsistent error responses
- **Fix Required**: Standardize all routes to use handleAPIError

#### 8. No Request Logging
- **Issue**: No middleware to log API requests/responses
- **Impact**: Hard to debug production issues
- **Fix Required**: Add logging middleware with request IDs

### 🟢 Minor Issues & Improvements (Previous Implementation)

#### 9. Missing Input Sanitization
- **Issue**: User input not sanitized before storage
- **Risk**: XSS vulnerabilities in question text
- **Fix Required**: Use DOMPurify on all user-generated content

#### 10. No Backup Strategy
- **Issue**: No automated database backups
- **Risk**: Data loss
- **Fix Required**: Automated daily backup script

#### 11. No Unit Tests
- **Issue**: Only E2E tests, no service layer tests
- **Impact**: Hard to test business logic in isolation
- **Fix Required**: Add Jest for unit testing

#### 12. Monolithic API Routes
- **Issue**: Large API files with mixed concerns
- **Impact**: Hard to maintain
- **Fix Required**: Split into smaller focused routes

#### 13. Missing Migration History
- **Issue**: Using `db push` instead of migrations
- **Impact**: Cannot rollback schema changes
- **Fix Required**: Use `prisma migrate dev`

#### 14. No Rate Limit Persistence
- **Issue**: In-memory rate limiting resets on restart
- **Impact**: Could be abused during deployments
- **Fix Required**: Use Redis for persistent rate limiting

#### 15. Quality Score Not Persisted
- **Issue**: Calculated on-the-fly every time
- **Impact**: Performance issue, cannot query by quality
- **Fix Required**: Add qualityScore column to Question table

## Future Enhancements

### Planned Features
1. **AI-Powered Hints**: Contextual hint system
2. **Peer Comparison**: Anonymous performance benchmarking
3. **Custom Worksheets**: Printable practice sheets
4. **Voice Input**: For open-ended answers
5. **Mobile App**: React Native companion
6. **Offline Mode**: PWA capabilities
7. **Multi-User Support**: Proper user management for family
8. **Real-time Collaboration**: Practice together features

### Architecture Improvements for V2
1. ✅ Implement proper database constraints
2. ✅ Add caching layer (Redis)
3. ✅ Use Prisma transactions
4. ✅ Standardize error handling
5. ✅ Add comprehensive logging
6. ✅ Unit test coverage (80%+)
7. ✅ Refactor circular dependencies
8. ✅ Add automated backups
9. ✅ Implement proper migrations
10. ✅ Store quality scores in DB

---

---

## Business Rules & Logic

### Quality Scoring Rules

#### **Severity Weights**
```typescript
CRITICAL: -30 points
HIGH:     -15 points
MEDIUM:   -8 points
LOW:      -3 points
```

#### **Report Type Weights (Multipliers)**
```typescript
WRONG_ANSWER:         2.0x (serious scoring issue)
INCORRECT_SOLUTION:   2.0x
UNCLEAR_QUESTION:     1.5x
MISSING_DIAGRAM:      1.5x
TYPO:                 0.5x
FORMATTING:           0.3x
DEFAULT:              1.0x
```

#### **Quality Thresholds**
- **Quality ≥ 70**: Reliable (full weight in statistics)
- **Quality 50-69**: Fair (reduced weight 0.5-0.7x)
- **Quality < 50**: Unreliable (excluded from statistics)

### Progress & Scoring Rules

#### **Default User**
- User ID: `'ayansh'` (hardcoded for family use)
- No authentication required

#### **Attempt Recording**
- `excludeFromScoring`: Controls whether attempt affects statistics
- Quality-based filtering: Only reliable questions (score ≥ 50) count
- Time spent recorded in seconds

#### **Weak Areas Criteria**
- Minimum attempts: 3 questions per topic
- Weak threshold: Accuracy < 70%
- Sorted by lowest accuracy first

#### **Streak Calculation**
- Consecutive days with at least 1 practice question
- Breaks if no practice for 1+ days
- Both current and longest streak tracked

### Rate Limiting Rules

#### **General API**
- Window: 15 minutes
- Max: 1000 requests
- Message: "Too many API requests"

#### **File Upload**
- Window: 1 hour
- Max: 50 uploads
- Message: "Too many file uploads"

#### **Question Requests**
- Window: 1 minute
- Max: 200 requests
- Message: "Too many question requests"

#### **Practice Sessions**
- Window: 10 minutes
- Max: 50 requests
- Message: "Too many practice requests"

### Error Handling Rules

#### **Error Codes**
```typescript
VALIDATION_ERROR          = 400
AUTHENTICATION_REQUIRED   = 401
AUTHORIZATION_FAILED      = 403
RESOURCE_NOT_FOUND        = 404
RESOURCE_CONFLICT         = 409
RATE_LIMIT_EXCEEDED       = 429
DATABASE_ERROR            = 500
INTERNAL_SERVER_ERROR     = 500
```

#### **Prisma Error Mapping**
- `P2002` → 409 Conflict (duplicate)
- `P2025` → 404 Not Found
- Other → 500 Database Error

#### **Development vs Production**
- **Development**: Detailed error messages with stack traces
- **Production**: Generic error messages only

### Exam Configuration

#### **Valid Exam Types**
```typescript
AMC8, Kangaroo, MOEMS, MathCounts, CML, Others
```

#### **Difficulty Levels**
```typescript
Beginner, Intermediate, Advanced, Others
```

#### **Topics**
```typescript
Algebra, Geometry, Number Theory, Combinatorics,
Probability, Statistics, Logic, Mixed, Others
```

---

## Implementation Patterns

### Custom Hooks

#### **useAsyncState**
Standardized async state management:
```typescript
const { data, loading, error, execute } = useAsyncState();

await execute(async () => {
  return await apiCall();
});
```

### Error Handling Patterns

#### **Server-Side (API Routes)**
```typescript
import { handleAPIError } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
  try {
    // Your logic here
  } catch (error) {
    return handleAPIError(error, 'ContextName', userId);
  }
}
```

#### **Client-Side (Components)**
```typescript
import { standardErrorHandler } from '@/lib/error-handler';

try {
  await operation();
} catch (error) {
  const errorMessage = standardErrorHandler(error, 'ComponentName');
  setError(errorMessage);
}
```

### Rate Limiting Pattern
```typescript
import { rateLimiters } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const rateLimitResponse = rateLimiters.upload(req);
  if (rateLimitResponse) return rateLimitResponse;

  // Your logic here
}
```

### Quality-Aware Querying
```typescript
// Get question quality scores
const qualityMap = await QuestionQualityService.getBulkQuestionQuality(questionIds);

// Filter for reliable questions
const reliableQuestions = questions.filter(q => {
  const quality = qualityMap.get(q.id);
  return quality && quality.isReliable;
});
```

---

## Data Validation Rules

### Question Validation
- `questionText`: Required, string
- `examName`: Optional, must be valid exam type
- `examYear`: Optional, integer
- `difficulty`: Required, valid difficulty level
- `topic`: Required, string
- `timeLimit`: Optional, integer (for MOEMS)

### UserAttempt Validation
- `timeSpent`: Required, integer ≥ 0 (seconds)
- `hintsUsed`: Default 0, integer ≥ 0
- `selectedAnswer`: Optional string
- `isCorrect`: Required boolean

### Error Report Validation
- `reportType`: Required string
- `severity`: Required (LOW, MEDIUM, HIGH, CRITICAL)
- `description`: Required string
- `confidence`: Integer 1-10

---

## Logging & Monitoring

### Logger Functions
```typescript
logger.info(message, context, metadata)
logger.error(message, context, error, metadata)
logger.validation(message, errors)
logger.databaseError(message, error, target)
```

### Request ID Generation
- Every error response includes unique `requestId`
- Used for tracing errors across logs

---

## Caching Strategy

### In-Memory Stores
- **Rate Limiter**: 5-minute cleanup cycle
- **Quality Scores**: Per-request caching
- No persistent cache (family app, single user)

### Next.js Caching
- Static pages cached automatically
- Dynamic routes: On-demand revalidation
- API routes: No default caching

---

## File Upload Rules

### Supported Formats
- **DOCX**: `.docx` (Word documents)
- **PDF**: `.pdf` (Portable documents)
- **Images**: `.png`, `.jpg`, `.jpeg` (with OCR)

### File Size Limits
- Maximum: 10MB per file
- Enforced at API level

### Upload Directory Structure
```
public/uploads/
├── questions/      # Extracted question files
├── solutions/      # Solution documents
└── images/         # Diagrams and photos
```

---

## Testing Strategy

### Test Types
- **E2E Tests**: Playwright (user workflows)
- **API Tests**: Playwright API testing
- **Unit Tests**: Not yet implemented

### Test Coverage Areas
1. Document upload and parsing
2. Question practice workflows
3. Progress tracking
4. Error reporting
5. Quality scoring

### Test Commands
```bash
npm test                # Run all tests
npm run test:ui         # Interactive test UI
npm run test:workflows  # User workflow tests
npm run test:headed     # Visual browser testing
```

---

## Summary

This architecture provides:
- ✅ **Scalable**: Modular design supports growth
- ✅ **Maintainable**: Clear separation of concerns
- ✅ **Type-Safe**: Full TypeScript coverage
- ✅ **Tested**: Playwright E2E tests
- ✅ **Performant**: Optimized queries and caching
- ✅ **User-Friendly**: Kid-focused interface
- ✅ **Quality-Aware**: Smart scoring protection
- ✅ **Family-First**: Privacy-focused design
- ✅ **Well-Documented**: Comprehensive rules and patterns
- ✅ **Error-Resilient**: Standardized error handling

**Built with ❤️ to help Ayansh excel in math competitions!**

---

## Version History & Notes

### V1.0 (Initial Implementation)
- ✅ Complete feature set implemented
- ✅ Working application with all core features
- ⚠️ Technical debt accumulated
- ⚠️ Database management issues
- ⚠️ Need for architectural improvements

### V2.0 (Clean Rebuild - Current)
- 🎯 **Goal**: Clean slate with improved architecture
- 🎯 **Focus**: Fix all identified gaps from V1
- 🎯 **Approach**: Rebuild with best practices from day one
- 🎯 **Retain**: All feature specifications and business logic
- 🎯 **Improve**: Architecture, code quality, performance

**Note**: This document serves as the complete specification for V2.0 rebuild. All features from V1.0 will be reimplemented with architectural improvements and fixes for identified issues.

**Refer to ARCHITECTURE_FLOWCHARTS.md for detailed gap analysis and diagrams.**
