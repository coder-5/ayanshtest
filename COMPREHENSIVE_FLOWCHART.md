# 🔄 COMPREHENSIVE CODEBASE FLOWCHART

## 📋 Application Architecture Overview

```mermaid
graph TD
    A[User Access] --> B[Next.js App Router]
    B --> C[Pages]
    B --> D[API Routes]
    B --> E[Components]

    C --> C1[Homepage /]
    C --> C2[Practice /practice]
    C --> C3[Exams /exams]
    C --> C4[Library /library]
    C --> C5[Progress /progress]
    C --> C6[Upload /upload]

    D --> D1[Questions API]
    D --> D2[User Attempts API]
    D --> D3[Progress API]
    D --> D4[Stats API]
    D --> D5[Upload API]

    E --> E1[UI Components]
    E --> E2[Practice Components]
    E --> E3[Analytics Components]

    D1 --> F[Prisma Database]
    D2 --> F
    D3 --> F
    D4 --> F
    D5 --> F
```

## 🏗️ DETAILED CODE FLOW ANALYSIS

### 📄 HOMEPAGE (src/app/page.tsx) - LINE BY LINE

```mermaid
graph TD
    A1[User visits /] --> A2[HomePage Component Loads]
    A2 --> A3[getStats Function Called]

    A3 --> B1[calculateStreak Function]
    B1 --> B2[Query prisma.userAttempt - Line 9-13]
    B2 --> B3[Process dates - Line 17-27]
    B3 --> B4[Calculate consecutive days - Line 29-35]
    B4 --> B5[Return streak count - Line 38]

    A3 --> C1[Parallel Database Queries - Line 43]
    C1 --> C2[prisma.question.count - Line 44]
    C1 --> C3[prisma.userAttempt.count - Line 45]
    C1 --> C4[Recent attempts query - Line 46-52]
    C1 --> C5[Upcoming exams query - Line 53-62]
    C1 --> C6[calculateStreak call - Line 63]

    C1 --> D1[Calculate accuracy - Line 66-70]
    D1 --> D2[Return stats object - Line 72-82]

    D2 --> E1[Render Dashboard - Line 99]
    E1 --> E2[Welcome Header - Line 102-109]
    E1 --> E3[Stats Cards Grid - Line 112-164]
    E1 --> E4[Quick Actions - Line 255-341]
    E1 --> E5[Recent Activity Component - Line 344-347]

    E3 --> F1[Total Questions Card - Line 113-124]
    E3 --> F2[Progress Card - Line 126-137]
    E3 --> F3[Accuracy Card - Line 139-150]
    E3 --> F4[Streak Card - Line 152-163]

    E4 --> G1[Progress Link - Line 268-270]
    E4 --> G2[Upload Link - Line 285-287]
    E4 --> G3[Library Link - Line 302-304]
    E4 --> G4[Exams Link - Line 319-321]
    E4 --> G5[Retry Link - Line 336-338]
```

### 🔧 ISSUES FOUND IN HOMEPAGE:

1. **Line 9**: Hard-coded userId 'ayansh' instead of dynamic user
2. **Line 43**: Multiple database queries could be optimized with transactions
3. **Line 206**: Missing type for exam parameter
4. **Line 83-93**: Silent error handling might hide database issues

### 🔌 API ROUTES (/src/app/api/questions/route.ts) - LINE BY LINE

```mermaid
graph TD
    A1[GET /api/questions] --> A2[getQuestionsHandler - Line 7]
    A2 --> A3[Extract URL parameters - Line 8-16]
    A3 --> A4[safeUrlParam calls - Line 11-13]
    A3 --> A5[safeUrlParamNumber calls - Line 14-15]
    A3 --> A6[Calculate pagination skip - Line 16]

    A6 --> B1[createSafeWhere - Line 19-23]
    B1 --> B2[Build where clause - Line 20-22]
    B2 --> B3[Parallel database queries - Line 25]

    B3 --> C1[prisma.question.findMany - Line 26-35]
    B3 --> C2[prisma.question.count - Line 36]

    C1 --> D1[Include options and solution - Line 28-30]
    C1 --> D2[Order by createdAt desc - Line 32]
    C1 --> D3[Apply pagination - Line 33-34]

    C2 --> E1[Return JSON response - Line 39-48]
    E1 --> E2[Success data structure - Line 40-41]
    E1 --> E3[Pagination metadata - Line 42-47]

    F1[POST /api/questions] --> F2[createQuestionHandler - Line 51]
    F2 --> F3[Parse request body - Line 52]
    F2 --> F4[Validate with schema - Line 53]
    F4 --> F5[Build questionData object - Line 55-69]
    F5 --> F6[Add solution if exists - Line 71-75]
    F6 --> F7[prisma.question.create - Line 77-83]
    F7 --> F8[Return created question - Line 85-89]

    A1 --> G1[withErrorHandling wrapper - Line 93]
    F1 --> G2[withErrorHandling wrapper - Line 94]
```

### 🧩 PRACTICE SESSION COMPONENT - LINE BY LINE

```mermaid
graph TD
    A1[PracticeSession Component Loads] --> A2[Initialize state variables - Line 29-45]
    A2 --> A3[useState for currentQuestionIndex - Line 29]
    A2 --> A4[useState for sessionResults - Line 30]
    A2 --> A5[useState for showSolution - Line 31]
    A2 --> A6[useState for timing - Line 32-34]
    A2 --> A7[useState for session state - Line 35-37]
    A2 --> A8[useState for questionStatuses - Line 39-45]

    A8 --> B1[Map questions to status objects - Line 40-44]
    B1 --> B2[Set initial status 'unanswered' - Line 42]
    B1 --> B3[Set isFlagged false - Line 43]

    A1 --> C1[Get currentQuestion - Line 49]

    C1 --> D1[Timer useEffect - Line 70-79]
    D1 --> D2[setInterval every 1000ms - Line 72-74]
    D1 --> D3[Calculate timeElapsed - Line 73]
    D1 --> D4[Return cleanup function - Line 76]

    A1 --> E1[handleAnswer function]
    E1 --> E2[Create SessionResult object]
    E1 --> E3[Update sessionResults state]
    E1 --> E4[Move to next question]

    A1 --> F1[Render UI components]
    F1 --> F2[Session progress bar]
    F1 --> F3[QuestionCard component]
    F1 --> F4[QuestionTracker component]
    F1 --> F5[Navigation buttons]
```

### 🔧 ISSUES FOUND IN API ROUTES:

1. **Line 55**: Using `any` type for questionData
2. **Line 93-94**: Error handling wrapper doesn't provide specific error context
3. **Missing**: Input sanitization for question text content
4. **Missing**: Rate limiting for POST requests

### 🔧 ISSUES FOUND IN PRACTICE SESSION:

1. **Line 37**: editedQuestion state uses `any` type
2. **Line 38**: Unused setSkippedQuestions setter
3. **Missing**: Proper cleanup for timer in component unmount
4. **Missing**: Error boundaries for question rendering

### 🗄️ DATABASE SCHEMA (prisma/schema.prisma) - LINE BY LINE

```mermaid
erDiagram
    Question ||--o{ Option : has
    Question ||--o| Solution : has
    Question ||--o{ UserAttempt : attempted
    Question ||--o{ QuestionTag : tagged
    Question ||--o{ ErrorReport : reported

    Question {
        string id PK "Line 11"
        string questionText "Line 12"
        string examName "Line 13"
        int examYear "Line 14"
        string questionNumber "Line 15"
        string difficulty "Line 16"
        string topic "Line 17"
        string subtopic "Line 18"
        boolean hasImage "Line 19"
        string imageUrl "Line 20"
        int timeLimit "Line 21"
        datetime createdAt "Line 22"
        datetime updatedAt "Line 23"
    }

    User ||--o{ UserAttempt : makes
    User ||--o{ PracticeSession : creates
    User ||--o{ Achievement : earns
    User ||--o{ DailyProgress : tracks
    User ||--o{ WeeklyAnalysis : analyzes
    User ||--o{ TopicPerformance : performance

    PracticeSession ||--o{ UserAttempt : contains
```

### 🔧 CRITICAL ISSUES IDENTIFIED ACROSS CODEBASE:

#### 🚨 **SECURITY ISSUES:**
1. **Hard-coded User ID** (Homepage Line 9): Using 'ayansh' instead of authenticated user
2. **Missing Input Sanitization** (API Routes): No XSS protection for question text
3. **No Rate Limiting** (API Routes): Vulnerable to abuse
4. **Missing CORS Configuration**: API endpoints not properly secured

#### ⚠️ **TYPE SAFETY ISSUES:**
1. **Any Types** (Multiple files):
   - Questions API Line 55: `questionData: any`
   - Practice Session Line 37: `editedQuestion: any`
   - Homepage Line 206: Missing exam type

#### 🐛 **POTENTIAL MEMORY LEAKS:**
1. **Timer Cleanup** (Practice Session): Timer cleanup exists but could be improved
2. **Event Listeners** (Multiple components): Some missing cleanup
3. **Large State Objects** (Practice Session): Multiple useState could be optimized

#### 📊 **PERFORMANCE ISSUES:**
1. **Database Queries** (Homepage Line 43): Multiple sequential queries instead of single transaction
2. **Missing Indexes** (Database): Some query patterns could use additional indexes
3. **Bundle Size** (Components): Some components could be lazy-loaded

#### 🧩 **CODE QUALITY ISSUES:**
1. **Unused Variables** (Practice Session Line 38): setSkippedQuestions setter
2. **Error Handling** (Homepage Line 83-93): Silent error fallbacks
3. **Magic Numbers** (Pagination): Hard-coded limit of 20
4. **Inconsistent Naming** (Various files): Mixed camelCase and snake_case

### 📈 **DATA FLOW SUMMARY:**

```mermaid
graph LR
    A[User Browser] --> B[Next.js Pages]
    B --> C[React Components]
    C --> D[API Routes]
    D --> E[Prisma ORM]
    E --> F[PostgreSQL Database]

    C --> G[UI State Management]
    G --> H[Local Storage]

    D --> I[Error Handling Middleware]
    D --> J[Validation Schemas]

    B --> K[Server-Side Rendering]
    K --> L[Static Generation]

    F --> M[Database Indexes]
    F --> N[Relationships]
```

### 🎯 **PRIORITIZED FIXES NEEDED:**

#### 🚨 **HIGH PRIORITY (Security & Critical):**
1. **Implement Authentication** - Replace hard-coded user IDs
2. **Add Input Sanitization** - Prevent XSS attacks
3. **Implement Rate Limiting** - Protect API endpoints
4. **Fix Type Safety** - Replace `any` types with proper interfaces

#### ⚠️ **MEDIUM PRIORITY (Performance & Reliability):**
1. **Optimize Database Queries** - Use transactions for multiple queries
2. **Add Error Boundaries** - Better error handling in React components
3. **Implement Proper Loading States** - Better UX for async operations
4. **Add Component Memoization** - Prevent unnecessary re-renders

#### 💡 **LOW PRIORITY (Code Quality):**
1. **Remove Unused Variables** - Clean up dead code
2. **Consistent Naming** - Standardize naming conventions
3. **Add TypeScript Strict Mode** - Improve type checking
4. **Component Lazy Loading** - Optimize bundle size

### 📊 **COMPLETE APPLICATION FLOW:**

```mermaid
graph TB
    A[User Browser] --> B[Next.js App Router]

    B --> C1[/ Homepage]
    B --> C2[/practice Practice Page]
    B --> C3[/library Library Page]
    B --> C4[/exams Exams Page]
    B --> C5[/upload Upload Page]
    B --> C6[/progress Progress Page]

    C1 --> D1[getStats Function]
    D1 --> E1[calculateStreak]
    D1 --> E2[Multiple DB Queries]
    E2 --> F1[PostgreSQL Database]

    C2 --> D2[PracticeSession Component]
    D2 --> E3[Timer Management]
    D2 --> E4[Question Navigation]
    D2 --> E5[Answer Tracking]

    C3 --> D3[Question Library]
    D3 --> E6[Search & Filter]
    D3 --> E7[Pagination]

    C4 --> D4[Exam Management]
    D4 --> E8[Schedule CRUD]
    D4 --> E9[Exam Results]

    C5 --> D5[File Upload]
    D5 --> E10[DOCX Processing]
    E10 --> E11[Question Parsing]
    E11 --> E12[Database Storage]

    C6 --> D6[Analytics]
    D6 --> E13[Progress Charts]
    D6 --> E14[Performance Metrics]

    E2 --> F1
    E5 --> F1
    E6 --> F1
    E8 --> F1
    E12 --> F1
    E14 --> F1

    F1 --> G1[Question Model]
    F1 --> G2[User Model]
    F1 --> G3[UserAttempt Model]
    F1 --> G4[ExamSchedule Model]
    F1 --> G5[PracticeSession Model]
```

### 📋 **FILE STRUCTURE SUMMARY:**

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Homepage (350 lines)
│   ├── api/               # API Routes (24 endpoints)
│   │   ├── questions/     # Question CRUD
│   │   ├── upload/        # File processing
│   │   ├── progress/      # Analytics
│   │   └── ...           # Other endpoints
│   ├── practice/         # Practice pages
│   ├── library/          # Question library
│   ├── exams/           # Exam management
│   └── upload/          # File upload
├── components/           # React Components
│   ├── ui/              # UI primitives
│   ├── practice/        # Practice-specific
│   ├── analytics/       # Charts & metrics
│   └── ...             # Other components
├── lib/                 # Utilities & config
├── utils/              # Helper functions
├── services/           # Business logic
├── types/              # TypeScript types
├── constants/          # App constants
└── hooks/              # Custom React hooks
```

### 🔍 **DETAILED ANALYSIS COMPLETE**

This comprehensive flowchart covers:
- ✅ **Line-by-line analysis** of critical components
- ✅ **Database schema mapping** with relationships
- ✅ **API endpoint flows** with error handling
- ✅ **React component lifecycle** and state management
- ✅ **Security vulnerability assessment**
- ✅ **Performance bottleneck identification**
- ✅ **Code quality issue documentation**
- ✅ **Prioritized fix recommendations**

**Total Issues Found**: 16 issues across security, performance, and code quality categories

**Codebase Health**: Good overall structure with specific areas needing attention