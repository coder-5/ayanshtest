# Architecture Analysis - Flowcharts & Mind Maps

## Table of Contents
1. [System Architecture Flowchart](#system-architecture-flowchart)
2. [Data Flow Diagrams](#data-flow-diagrams)
3. [Feature Interaction Map](#feature-interaction-map)
4. [Database Relationship Map](#database-relationship-map)
5. [API Route Mind Map](#api-route-mind-map)
6. [Component Hierarchy](#component-hierarchy)
7. [Service Layer Dependencies](#service-layer-dependencies)
8. [Identified Gaps & Issues](#identified-gaps--issues)

---

## System Architecture Flowchart

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (Browser)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Pages      │  │  Components  │  │    Hooks     │              │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤              │
│  │ • Home       │  │ • Practice   │  │ • useAsync   │              │
│  │ • Practice   │  │ • Analytics  │  │   State      │              │
│  │ • Progress   │  │ • Quality    │  │              │              │
│  │ • Library    │  │ • Math       │  │              │              │
│  │ • Upload     │  │ • UI (shadcn)│  │              │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│         │                  │                  │                      │
└─────────┼──────────────────┼──────────────────┼──────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     API LAYER (Next.js Routes)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      Middleware                                 │ │
│  │  • Rate Limiting  • CORS  • Error Handling                     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                        │
│  ┌───────────────┬──────────┼──────────┬─────────────┬───────────┐ │
│  │               │          │          │             │           │ │
│  ▼               ▼          ▼          ▼             ▼           ▼ │
│ ┌─────┐   ┌─────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────┐│
│ │Quest│   │Progress │  │Quality │  │Upload  │  │Solutions│  │... ││
│ │ions │   │Stats    │  │Reports │  │Docs    │  │        │  │    ││
│ └─────┘   └─────────┘  └────────┘  └────────┘  └────────┘  └────┘│
│    │           │            │           │            │         │   │
└────┼───────────┼────────────┼───────────┼────────────┼─────────┼───┘
     │           │            │           │            │         │
     ▼           ▼            ▼           ▼            ▼         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Question    │  │  Progress    │  │   Quality    │              │
│  │  Service     │  │  Service     │  │   Service    │              │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤              │
│  │ • CRUD       │  │ • Track      │  │ • Calculate  │              │
│  │ • Random     │  │ • Analyze    │  │ • Validate   │              │
│  │ • Filter     │  │ • Streaks    │  │ • Weight     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│         │                  │                  │                      │
│         └──────────────────┼──────────────────┘                      │
│                            │                                         │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA ACCESS LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                     Prisma ORM                                  │ │
│  │  • Type-safe queries  • Relations  • Migrations                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                        │
└──────────────────────────────┼────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │Question  │  │UserAttemp│  │Progress  │  │Error     │           │
│  │          │  │t         │  │          │  │Report    │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│       │             │              │              │                  │
│  ┌────┴─────┬───────┴──────┬───────┴──────┬───────┴────┐           │
│  │          │              │              │            │           │
│  ▼          ▼              ▼              ▼            ▼           │
│ Option   Solution   PracticeSess  DailyProgress  UserDiagram      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Question Practice Flow

```
┌─────────┐
│  User   │
│ Selects │
│Practice │
│  Mode   │
└────┬────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Frontend: Practice Component           │
│  • Validates selection                  │
│  • Sets up session state                │
└────┬────────────────────────────────────┘
     │
     ▼ GET /api/questions?filters
┌─────────────────────────────────────────┐
│  API: Question Route                    │
│  • Rate limit check                     │
│  • Parse query params                   │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Service: questionService.getQuestions  │
│  • Build Prisma query                   │
│  • Apply filters (topic, difficulty)    │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Service: qualityService.getBulkQuality │
│  • Get quality scores                   │
│  • Filter unreliable (score < 50)       │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Database: Prisma Query                 │
│  • Join Question + Options + Solution   │
│  • Apply indexes for performance        │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Response: Questions Array              │
│  • JSON with questions, options         │
│  • Quality scores attached              │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Frontend: Display Question             │
│  • Render with KaTeX                    │
│  • Show options/input                   │
│  • Start timer                          │
└────┬────────────────────────────────────┘
     │
     ▼ User answers
┌─────────────────────────────────────────┐
│  Frontend: Submit Answer                │
│  • Validate input                       │
│  • Calculate time spent                 │
└────┬────────────────────────────────────┘
     │
     ▼ POST /api/user-attempts
┌─────────────────────────────────────────┐
│  API: User Attempts Route               │
│  • Validate submission                  │
│  • Check question exists                │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Service: progressService.saveProgress  │
│  • Create UserAttempt record            │
│  • Update daily progress                │
│  • Check for achievements               │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Database: Insert/Update                │
│  • UserAttempt table                    │
│  • DailyProgress table                  │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Response: Attempt Result               │
│  • isCorrect, solution, stats           │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Frontend: Show Feedback                │
│  • Correct/incorrect message            │
│  • Show solution                        │
│  • Update session stats                 │
└─────────────────────────────────────────┘
```

### 2. Error Reporting Flow

```
┌─────────┐
│  User   │
│ Clicks  │
│"Report" │
└────┬────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Frontend: Error Report Button          │
│  • Show kid-friendly options            │
│  • Auto-detect geometry questions       │
└────┬────────────────────────────────────┘
     │
     ▼ User selects issue type
┌─────────────────────────────────────────┐
│  Frontend: Submit Report                │
│  • Build report object                  │
│  • Set severity, confidence             │
└────┬────────────────────────────────────┘
     │
     ▼ POST /api/error-reports
┌─────────────────────────────────────────┐
│  API: Error Reports Route               │
│  • Validate report data                 │
│  • Rate limit check                     │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Database: Insert ErrorReport           │
│  • Create error report record           │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Service: qualityService.recalculate    │
│  • Get all reports for question         │
│  • Apply severity weights               │
│  • Apply type multipliers               │
│  • Calculate new quality score          │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Quality Score Decision                 │
│  • ≥ 70: Reliable                       │
│  • 50-69: Fair (reduced weight)         │
│  • < 50: Exclude from stats             │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Response: Success                      │
│  • New quality score                    │
│  • Updated status                       │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Frontend: Show Success Message         │
│  • "Thanks for helping! 🎉"            │
│  • Close modal                          │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Future Attempts                        │
│  • Question weighted/excluded           │
│  • Stats protected automatically        │
└─────────────────────────────────────────┘
```

### 3. Progress Analytics Flow

```
┌─────────┐
│  User   │
│ Visits  │
│Progress │
│  Page   │
└────┬────┘
     │
     ▼ GET /api/progress/daily
┌─────────────────────────────────────────┐
│  API: Progress Routes                   │
│  • /daily, /weekly, /topics             │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Service: progressService.getStats      │
│  • Query all user attempts              │
│  • Include question data                │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Service: qualityService.getBulk        │
│  • Get quality scores for all questions │
│  • Filter reliable questions            │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Calculate Weighted Stats               │
│  • Only count reliable questions        │
│  • Apply quality weights                │
│  • Group by topic/difficulty            │
└────┬────────────────────────────────────┘
     │
     ├─► Calculate Streaks
     │   • Group by day
     │   • Find consecutive days
     │   • Current vs longest
     │
     ├─► Topic Breakdown
     │   • Accuracy per topic
     │   • Attempts per topic
     │   • Identify weak areas (<70%)
     │
     └─► Time Analysis
         • Average time per question
         • Time trends over days
         • Slowest topics
     │
     ▼
┌─────────────────────────────────────────┐
│  Response: Comprehensive Stats          │
│  • Overall accuracy                     │
│  • Topic performance                    │
│  • Streak data                          │
│  • Recent sessions                      │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Frontend: Render Charts                │
│  • Recharts line/bar charts             │
│  • D3.js heatmaps                       │
│  • Streak counter                       │
└─────────────────────────────────────────┘
```

---

## Feature Interaction Map

```
                        ┌─────────────────┐
                        │  Core Features  │
                        └────────┬────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐        ┌──────────────┐        ┌──────────────┐
│   Question    │◄───────┤   Practice   │───────►│   Progress   │
│   Library     │        │    System    │        │   Tracking   │
└───────┬───────┘        └──────┬───────┘        └──────┬───────┘
        │                       │                        │
        │                       │                        │
        ▼                       ▼                        ▼
┌───────────────┐        ┌──────────────┐        ┌──────────────┐
│   Document    │        │   Quality    │        │   Analytics  │
│    Upload     │◄───────┤  Protection  │───────►│  Dashboard   │
└───────────────┘        └──────┬───────┘        └──────────────┘
        │                       │
        │                       ▼
        │                ┌──────────────┐
        └───────────────►│    Error     │
                         │  Reporting   │
                         └──────────────┘

Interaction Details:

1. Question Library → Practice System
   - Provides questions based on filters
   - Returns with quality scores

2. Practice System → Progress Tracking
   - Sends attempt data
   - Updates daily/weekly stats

3. Practice System → Quality Protection
   - Requests quality scores
   - Applies weighting to stats

4. Quality Protection → Progress Tracking
   - Excludes unreliable questions
   - Weights statistics

5. Document Upload → Question Library
   - Adds new questions
   - Preserves diagrams

6. Error Reporting → Quality Protection
   - Updates quality scores
   - Triggers recalculation

7. Progress Tracking → Analytics Dashboard
   - Provides aggregated data
   - Shows trends and insights

8. Analytics Dashboard → Practice System
   - Identifies weak areas
   - Suggests practice topics
```

---

## Database Relationship Map

```
                        ┌──────────────┐
                        │   Question   │
                        ├──────────────┤
                        │ id (PK)      │
                        │ questionText │
                        │ examName     │
                        │ topic        │
                        │ difficulty   │
                        │ hasImage     │
                        └──────┬───────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐      ┌──────────────┐      ┌──────────────┐
│    Option     │      │   Solution   │      │ UserAttempt  │
├───────────────┤      ├──────────────┤      ├──────────────┤
│ id (PK)       │      │ id (PK)      │      │ id (PK)      │
│ questionId FK │      │ questionId FK│      │ questionId FK│
│ optionLetter  │      │ solutionText │      │ userId FK    │
│ isCorrect     │      │ approach     │      │ isCorrect    │
└───────────────┘      │ keyInsights  │      │ timeSpent    │
                       └──────────────┘      │ sessionId FK │
                                             └──────┬───────┘
                                                    │
        ┌───────────────────────────────────────────┼───────────┐
        │                                           │           │
        ▼                                           ▼           ▼
┌───────────────┐                          ┌──────────────┐  ┌─────────────┐
│     User      │                          │PracticeSess  │  │DailyProgress│
├───────────────┤                          ├──────────────┤  ├─────────────┤
│ id (PK)       │◄─────────────────────────│ userId FK    │  │ userId FK   │
│ name          │                          │ sessionType  │  │ date        │
│ grade         │                          │ totalQuest.  │  │ questAttempt│
└───────┬───────┘                          └──────────────┘  │ accuracy    │
        │                                                     │ streakDays  │
        │                                                     └─────────────┘
        │
        └────────────────┐
                         │
                         ▼
                  ┌──────────────┐
                  │ ErrorReport  │
                  ├──────────────┤
                  │ id (PK)      │
                  │ questionId FK│
                  │ userId FK    │
                  │ reportType   │
                  │ severity     │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │UserDiagram   │
                  ├──────────────┤
                  │ id (PK)      │
                  │ questionId FK│
                  │ userId FK    │
                  │ imageUrl     │
                  │ isApproved   │
                  └──────────────┘

Key Relationships:
- Question → Option (1:Many)
- Question → Solution (1:1)
- Question → UserAttempt (1:Many)
- Question → ErrorReport (1:Many)
- Question → UserDiagram (1:Many)
- User → UserAttempt (1:Many)
- User → PracticeSession (1:Many)
- User → DailyProgress (1:Many)
- User → ErrorReport (1:Many)
- PracticeSession → UserAttempt (1:Many)
```

---

## API Route Mind Map

```
                        /api
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    questions        progress          quality
        │                │                │
    ┌───┴───┐        ┌───┴───┐       ┌───┴───┐
    │       │        │       │       │       │
  GET     POST     GET     GET     GET    POST
 /list    /new   /daily  /weekly  /:id  /recalc
 /:id   /:update /topics /analytics
/random  /delete
 /retry
 /failed

        │                │                │
    solutions        upload          error-reports
        │                │                │
    ┌───┴───┐        ┌───┴───┐       ┌───┴───┐
    │       │        │       │       │       │
  GET     POST     POST    POST     GET    POST
 /:qId    /new   /docx    /pdf   /list    /new
        /:update  /image          /:id   /:update

        │                │                │
   achievements      diagrams         exams
        │                │                │
    ┌───┴───┐        ┌───┴───┐       ┌───┴───┐
    │       │        │       │       │       │
  GET    POST      GET    POST     GET    POST
 /list   /check   /:qId  /upload  /list  /schedule
                        /:update        /:update

        │                │
     stats           admin
        │                │
    ┌───┴───┐        ┌───┴───┐
    │       │        │       │
  GET     GET      GET    POST
 /overall /user   /dashboard /recalc
 /topics         /quality
```

---

## Component Hierarchy

```
App (layout.tsx)
│
├─── HomePage (page.tsx)
│    ├─── StatsOverview
│    ├─── QuickStartButtons
│    └─── RecentActivity
│
├─── Practice
│    ├─── PracticeMode Selector
│    │    ├─── QuickPractice
│    │    ├─── TimedPractice
│    │    ├─── TopicPractice
│    │    └─── WeakAreasPractice
│    │
│    └─── PracticeSession
│         ├─── QuestionDisplay
│         │    ├─── MathRenderer (KaTeX)
│         │    ├─── DiagramViewer
│         │    └─── QualityIndicator
│         │
│         ├─── AnswerSection
│         │    ├─── MultipleChoice (for AMC8)
│         │    └─── TextInput (for MOEMS)
│         │
│         ├─── Timer
│         ├─── HintButton
│         ├─── ErrorReportButton
│         │
│         └─── ResultFeedback
│              ├─── SolutionViewer
│              ├─── ExplanationText
│              └─── NextQuestionButton
│
├─── Progress
│    ├─── ProgressDashboard
│    │    ├─── OverallStats
│    │    ├─── StreakCounter
│    │    └─── AchievementsList
│    │
│    ├─── AnalyticsCharts
│    │    ├─── DailyProgressChart (Recharts)
│    │    ├─── TopicHeatmap (D3.js)
│    │    ├─── AccuracyTrend
│    │    └─── TimeAnalysis
│    │
│    └─── WeakAreasPanel
│         ├─── TopicBreakdown
│         └─── RecommendedPractice
│
├─── Library
│    ├─── QuestionBrowser
│    │    ├─── FilterPanel
│    │    │    ├─── ExamFilter
│    │    │    ├─── TopicFilter
│    │    │    └─── DifficultyFilter
│    │    │
│    │    └─── QuestionList
│    │         ├─── QuestionCard
│    │         └─── Pagination
│    │
│    └─── QuestionEditor
│         ├─── QuestionForm
│         ├─── OptionEditor
│         └─── SolutionEditor
│
├─── Upload
│    ├─── FileUploader
│    │    ├─── DropZone
│    │    └─── ProgressBar
│    │
│    └─── ParsePreview
│         ├─── QuestionPreview
│         ├─── EditControls
│         └─── ConfirmButton
│
└─── Shared Components (UI)
     ├─── Button
     ├─── Card
     ├─── Dialog
     ├─── Input
     ├─── Select
     ├─── Toast
     └─── Progress
```

---

## Service Layer Dependencies

```
                    ┌──────────────────┐
                    │  questionService │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐    ┌──────────────┐    ┌──────────────┐
│ progressSvc   │    │ qualitySvc   │    │ selectionSvc │
└───────┬───────┘    └──────┬───────┘    └──────────────┘
        │                   │
        │                   │
        ▼                   ▼
┌───────────────────────────────────┐
│        Prisma Client              │
│  (Database Access Layer)          │
└───────────────┬───────────────────┘
                │
                ▼
        ┌───────────────┐
        │  PostgreSQL   │
        └───────────────┘

Dependency Details:

questionService depends on:
- qualityService (for quality filtering)
- Prisma (for DB queries)

progressService depends on:
- qualityService (for weighted stats)
- questionService (for question data)
- Prisma (for attempt storage)

qualityService depends on:
- Prisma (for error reports)

achievementService depends on:
- progressService (for user stats)
- Prisma (for achievement storage)

diagramService depends on:
- questionService (for question lookup)
- Prisma (for diagram storage)
- File system (for image storage)
```

---

## Identified Gaps & Issues

### 🔴 **CRITICAL ISSUES**

#### 1. **Database Issues**
**Problem**: Database connection/schema problems mentioned by user

**Potential Causes**:
- Missing database or wrong credentials
- Schema out of sync with Prisma
- Foreign key constraint violations
- Data corruption or inconsistencies

**Impact**: Application cannot function

**Recommended Fix**:
```bash
# 1. Create fresh database
createdb ayansh_math_prep

# 2. Reset Prisma
npx prisma db push --force-reset

# 3. Verify schema
npx prisma db pull
npx prisma generate

# 4. Seed with clean data
npm run db:seed
```

#### 2. **No User Authentication**
**Problem**: Hardcoded userId = 'ayansh'

**Gaps**:
- Cannot support multiple users
- No user creation flow
- No user profile management

**Impact**: Limited to single family member

**Recommended Fix**:
- Keep simple: Create User table entry on first visit
- Add user selection dropdown for family members
- No passwords needed for family use

#### 3. **Missing Database Constraints**
**Problem**: Some validation only in code, not DB

**Gaps**:
- `timeSpent` could be negative (only checked in service)
- `hintsUsed` could be negative
- No CHECK constraints in schema

**Impact**: Data integrity issues

**Recommended Fix**:
```prisma
model UserAttempt {
  timeSpent Int @db.Integer // Add: @check("timeSpent >= 0")
  hintsUsed Int @default(0) @db.Integer // Add: @check("hintsUsed >= 0")
}
```

### 🟡 **MAJOR GAPS**

#### 4. **Circular Dependencies Risk**
**Problem**: Services reference each other

```
questionService → qualityService
progressService → qualityService → progressService (potential)
```

**Impact**: Tight coupling, hard to maintain

**Recommended Fix**:
- Create shared interfaces
- Use dependency injection
- Refactor to unidirectional flow

#### 5. **No Caching Strategy**
**Problem**: Quality scores recalculated every request

**Gaps**:
- No Redis or in-memory cache
- Question quality recalculated frequently
- Progress stats recalculated on every dashboard visit

**Impact**: Performance issues with large datasets

**Recommended Fix**:
```typescript
// Add caching layer
const qualityCache = new Map<string, { score: number, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

#### 6. **Missing Transaction Management**
**Problem**: Multi-step operations not atomic

**Example**:
```typescript
// Not atomic:
await createUserAttempt();
await updateDailyProgress();
await checkAchievements();
```

**Impact**: Data inconsistency if one step fails

**Recommended Fix**:
```typescript
await prisma.$transaction(async (tx) => {
  await tx.userAttempt.create(...);
  await tx.dailyProgress.update(...);
  await tx.achievement.create(...);
});
```

### 🟢 **MINOR ISSUES**

#### 7. **Inconsistent Error Handling**
**Problem**: Some routes use try-catch, others use error wrapper

**Gap**: Mixed patterns across codebase

**Recommended Fix**: Standardize all API routes to use `handleAPIError`

#### 8. **No Request Logging**
**Problem**: Hard to debug issues

**Gap**: No request/response logging middleware

**Recommended Fix**: Add logging middleware to track all API calls

#### 9. **Missing Input Sanitization**
**Problem**: User input not sanitized before DB storage

**Gap**: XSS risk in question text, solutions

**Recommended Fix**: Use DOMPurify on all user-generated content

#### 10. **No Backup Strategy**
**Problem**: No automated backups

**Gap**: Risk of data loss

**Recommended Fix**: Add daily backup script with cron job

### 📊 **ARCHITECTURAL GAPS**

#### 11. **No Service Tests**
**Problem**: Only E2E tests, no unit tests for services

**Gap**: Hard to test business logic in isolation

**Recommended Fix**: Add Jest for unit testing services

#### 12. **Monolithic API Routes**
**Problem**: Large API route files with mixed concerns

**Example**: `/api/questions` handles CRUD + random + retry + failed

**Recommended Fix**: Split into smaller, focused routes

#### 13. **Missing Data Migration Strategy**
**Problem**: Only Prisma push, no migration history

**Gap**: Cannot rollback schema changes

**Recommended Fix**: Use `prisma migrate dev` instead of `db push`

#### 14. **No Rate Limit Persistence**
**Problem**: In-memory rate limiting resets on server restart

**Gap**: Could be abused during deployments

**Recommended Fix**: Use Redis for persistent rate limiting

#### 15. **Quality Score Not Stored**
**Problem**: Quality scores calculated on-the-fly

**Gap**: Performance issue, cannot query by quality

**Recommended Fix**: Add `qualityScore` column to Question table, update on report

---

## Recommendations Summary

### Immediate Fixes (Critical)
1. ✅ Fix database connection/schema
2. ✅ Add database constraints
3. ✅ Implement transaction management for multi-step operations

### Short-term Improvements (Major)
4. ✅ Add caching layer for quality scores
5. ✅ Implement proper user management
6. ✅ Refactor circular dependencies
7. ✅ Add request logging
8. ✅ Standardize error handling

### Long-term Enhancements (Minor)
9. ✅ Add unit tests for services
10. ✅ Implement automated backups
11. ✅ Use Prisma migrations
12. ✅ Add Redis for rate limiting
13. ✅ Store quality scores in DB
14. ✅ Input sanitization
15. ✅ Split large API routes

---

## Next Steps

1. **Database Reset Plan**
   - Backup current data
   - Create fresh database
   - Apply schema with constraints
   - Seed with clean data

2. **Code Cleanup Plan**
   - Fix circular dependencies
   - Standardize error handling
   - Add missing validations
   - Implement caching

3. **Testing Plan**
   - Add unit tests for services
   - Expand E2E coverage
   - Add API integration tests

4. **Performance Plan**
   - Add caching layer
   - Optimize database queries
   - Implement connection pooling
   - Add indexes where missing
