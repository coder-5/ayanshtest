# Complete System Flowchart & Broken Path Analysis

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOME PAGE (/)                             │
│  Navigation: Practice | Progress | Exams | Achievements | Library│
└────────┬────────┬────────┬────────┬────────┬────────────────────┘
         │        │        │        │        │
         v        v        v        v        v
    ┌────────┐ ┌──────┐ ┌──────┐ ┌────────┐ ┌────────┐
    │Practice│ │Progress│ │Exams │ │Achieve.│ │Library │
    └────────┘ └──────┘ └──────┘ └────────┘ └────────┘
```

---

## 1. PRACTICE FLOW

### 1.1 Practice Hub (/practice)
```
┌──────────────────────────────────────┐
│      /practice (Main Hub)             │
│  ┌────────────────────────────────┐  │
│  │ Filters (NEW):                 │  │
│  │ - Exam Type (AMC8/MOEMS/MK)   │  │
│  │ - Year (Dynamic)               │  │
│  └────────────────────────────────┘  │
│                                       │
│  Practice Modes:                      │
│  ┌────────┐ ┌────────┐ ┌────────┐  │
│  │ Quick  │ │ Timed  │ │ Topics │  │
│  └────────┘ └────────┘ └────────┘  │
└───────┬───────┬────────┬─────────────┘
        │       │        │
        v       v        v
```

### 1.2 Quick Practice Flow
```
/practice/quick?examName=AMC8&examYear=2024
        │
        v
┌──────────────────────────────────────┐
│  GET /api/questions                   │
│  - Filters: examName, examYear, topic │
│  - Returns: questions[] with options  │
└──────────┬───────────────────────────┘
           v
┌──────────────────────────────────────┐
│  Question Display                     │
│  - Question text                      │
│  - Diagram (if hasImage=true)        │
│  - Options (A, B, C, D, E)           │
│  - Video solution (if videoUrl)      │
└──────────┬───────────────────────────┘
           v
┌──────────────────────────────────────┐
│  User Interaction                     │
│  1. Select answer                     │
│  2. Submit                            │
│  3. View result (correct/incorrect)   │
│  4. Next question                     │
└──────────┬───────────────────────────┘
           v
┌──────────────────────────────────────┐
│  🔴 BROKEN PATH #1                   │
│  Missing: POST /api/user-attempts     │
│  Should save attempt with:            │
│  - userId, questionId, isCorrect     │
│  - timeSpent, selectedAnswer         │
│  - sessionId (optional)              │
└───────────────────────────────────────┘
```

### 1.3 Timed Challenge Flow
```
/practice/timed?examName=AMC8
        │
        v
┌──────────────────────────────────────┐
│  Similar to Quick Practice BUT:       │
│  - Timer countdown displayed          │
│  - Time per question tracked          │
│  🔴 BROKEN PATH #2                   │
│  Missing: Timer state persistence     │
│  Missing: Auto-submit on timeout      │
└───────────────────────────────────────┘
```

### 1.4 Topic Practice Flow
```
/practice/topics
        │
        v
┌──────────────────────────────────────┐
│  🔴 BROKEN PATH #3                   │
│  Page exists but:                     │
│  - No topic selection UI              │
│  - No filtering by topic              │
│  - Should fetch topics from DB        │
└───────────────────────────────────────┘
```

---

## 2. LIBRARY FLOW

### 2.1 Library Browser (/library)
```
┌──────────────────────────────────────┐
│  GET /api/questions                   │
│  - Pagination (20 per page)          │
│  - Filters: exam, topic, difficulty   │
└──────────┬───────────────────────────┘
           v
┌──────────────────────────────────────┐
│  Question List Display                │
│  For each question:                   │
│  - View details                       │
│  - Edit → /library/edit/[id]         │
│  - Delete (soft delete)              │
└───────────────────────────────────────┘
```

### 2.2 Add Question Flow
```
/library/add
        │
        v
┌──────────────────────────────────────┐
│  Form Fields:                         │
│  - Question text ✅                  │
│  - Exam name ✅                      │
│  - Exam year ✅                      │
│  - Topic ✅                          │
│  - Difficulty ✅                     │
│  - Options (A-E) ✅                  │
│  - Correct answer ✅                 │
│  - Image upload ✅                   │
│  - Video URL (NEW) ✅                │
└──────────┬───────────────────────────┘
           v
┌──────────────────────────────────────┐
│  POST /api/questions ✅              │
│  Creates question + options + solution│
└──────────┬───────────────────────────┘
           v
┌──────────────────────────────────────┐
│  🔴 BROKEN PATH #4                   │
│  Missing: Image optimization          │
│  - Should resize to 400x300           │
│  - Current: Stores full size          │
└───────────────────────────────────────┘
```

### 2.3 Edit Question Flow
```
/library/edit/[id]
        │
        v
┌──────────────────────────────────────┐
│  GET /api/questions/[id] ✅          │
│  - Fetches question with options      │
└──────────┬───────────────────────────┘
           v
┌──────────────────────────────────────┐
│  Pre-filled Form ✅                  │
│  PUT /api/questions/[id] ✅          │
└───────────────────────────────────────┘
```

---

## 3. PROGRESS FLOW

### 3.1 Progress Dashboard (/progress)
```
┌──────────────────────────────────────┐
│  GET /api/progress ✅                │
│  Returns:                             │
│  - Total questions attempted          │
│  - Overall accuracy                   │
│  - Streak days                        │
│  - Time spent                         │
│  - Topic performance []               │
│  - Recent activity []                 │
└──────────┬───────────────────────────┘
           v
┌──────────────────────────────────────┐
│  Display Components:                  │
│  1. Stats cards (4) ✅               │
│  2. Topic performance ✅              │
│  3. Recent activity ✅                │
└──────────┬───────────────────────────┘
           v
┌──────────────────────────────────────┐
│  🔴 BROKEN PATH #5                   │
│  Missing connections:                 │
│  - No link to Daily Progress page     │
│  - No link to Weekly Analysis page    │
│  - No link to Topic Performance page  │
└───────────────────────────────────────┘
```

### 3.2 Daily Progress (Backend Only)
```
┌──────────────────────────────────────┐
│  GET /api/daily-progress ✅          │
│  - Returns last N days                │
│  POST /api/daily-progress ✅         │
│  - Updates today's stats              │
└──────────┬───────────────────────────┘
           v
┌──────────────────────────────────────┐
│  🔴 BROKEN PATH #6                   │
│  Missing: /daily-progress page UI     │
│  Should show:                         │
│  - Calendar view with daily stats     │
│  - Streak visualization               │
│  - Daily goal tracking                │
└───────────────────────────────────────┘
```

### 3.3 Topic Performance (Backend Only)
```
┌──────────────────────────────────────┐
│  GET /api/topic-performance ✅       │
│  POST /api/topic-performance ✅      │
│  - Calculates strength levels         │
│  - Identifies weak topics             │
└──────────┬───────────────────────────┘
           v
┌──────────────────────────────────────┐
│  🔴 BROKEN PATH #7                   │
│  Missing: /topic-performance page UI  │
│  Should show:                         │
│  - Topic cards with strength badges   │
│  - Practice recommendations           │
│  - Progress over time charts          │
└───────────────────────────────────────┘
```

### 3.4 Weekly Analysis (Backend Only)
```
┌──────────────────────────────────────┐
│  GET /api/weekly-analysis ✅         │
│  POST /api/weekly-analysis ✅        │
│  - Generates weekly summaries         │
│  - Tracks improvement rate            │
└──────────┬───────────────────────────┘
           v
┌──────────────────────────────────────┐
│  🔴 BROKEN PATH #8                   │
│  Missing: /weekly-analysis page UI    │
│  Should show:                         │
│  - Week-by-week comparison            │
│  - Improvement graphs                 │
│  - Strong/weak topic highlights       │
└───────────────────────────────────────┘
```

---

## 4. EXAMS FLOW

### 4.1 Exams Management (/exams)
```
┌──────────────────────────────────────┐
│  GET /api/exams ✅                   │
│  - Lists all exams for user           │
└──────────┬───────────────────────────┘
           v
┌──────────────────────────────────────┐
│  Display Sections:                    │
│  1. Upcoming exams ✅                │
│  2. Past exams ✅                    │
│  3. Add exam form ✅                 │
└──────────┬───────────────────────────┘
           v
┌──────────────────────────────────────┐
│  User Actions:                        │
│  - Add exam → POST /api/exams ✅     │
│  - Mark complete → PUT /api/exams/[id]│
│  - Delete → DELETE /api/exams/[id]   │
└──────────┬───────────────────────────┘
           v
┌──────────────────────────────────────┐
│  🔴 BROKEN PATH #9                   │
│  Missing integrations:                │
│  - No link to practice for that exam  │
│  - No "Study for this exam" button    │
│  - Should filter questions by exam    │
└───────────────────────────────────────┘
```

---

## 5. ACHIEVEMENTS FLOW

### 5.1 Achievements Dashboard (/achievements)
```
┌──────────────────────────────────────┐
│  GET /api/achievements ✅            │
│  Returns:                             │
│  - All achievements                   │
│  - Progress for each                  │
│  - Earned status                      │
│  - Total points                       │
└──────────┬───────────────────────────┘
           v
┌──────────────────────────────────────┐
│  Display Components:                  │
│  1. Stats cards ✅                   │
│  2. Filter buttons ✅                │
│  3. Achievement grid ✅              │
└──────────┬───────────────────────────┘
           v
┌──────────────────────────────────────┐
│  🔴 BROKEN PATH #10                  │
│  Missing:                             │
│  - No achievements seeded in DB       │
│  - No auto-grant mechanism            │
│  - Achievement criteria not evaluated │
└───────────────────────────────────────┘
```

### 5.2 Achievement Auto-Grant System
```
┌──────────────────────────────────────┐
│  🔴 BROKEN PATH #11                  │
│  Missing trigger system:              │
│                                       │
│  Should trigger after:                │
│  - Question attempt saved             │
│  - Daily progress updated             │
│  - Session completed                  │
│                                       │
│  Process:                             │
│  1. Check all achievement criteria    │
│  2. Grant if conditions met           │
│  3. Create user_achievement record    │
└───────────────────────────────────────┘
```

---

## 6. PRACTICE SESSIONS FLOW

### 6.1 Session Management (Backend Only)
```
┌──────────────────────────────────────┐
│  POST /api/sessions ✅               │
│  - Creates new session                │
│  GET /api/sessions ✅                │
│  - Lists session history              │
│  GET /api/sessions/[id] ✅           │
│  - Session details with attempts      │
│  PUT /api/sessions/[id] ✅           │
│  - Marks session complete             │
└──────────┬───────────────────────────┘
           v
┌──────────────────────────────────────┐
│  🔴 BROKEN PATH #12                  │
│  Missing: /sessions page UI           │
│  Should show:                         │
│  - Session history table              │
│  - Click to view session details      │
│  - Performance metrics per session    │
└───────────────────────────────────────┘
```

### 6.2 Session Integration
```
┌──────────────────────────────────────┐
│  🔴 BROKEN PATH #13                  │
│  Practice pages don't create sessions │
│                                       │
│  Should:                              │
│  1. Create session on practice start  │
│  2. Link attempts to sessionId        │
│  3. Update session on completion      │
└───────────────────────────────────────┘
```

---

## 7. ERROR REPORTS FLOW

### 7.1 Error Reporting (Backend Only)
```
┌──────────────────────────────────────┐
│  POST /api/error-reports ✅          │
│  - Reports question issues            │
│  GET /api/error-reports ✅           │
│  - Lists all reports                  │
│  PUT /api/error-reports/[id] ✅      │
│  - Updates report status              │
└──────────┬───────────────────────────┘
           v
┌──────────────────────────────────────┐
│  🔴 BROKEN PATH #14                  │
│  Missing: UI to report errors         │
│  Should add to practice pages:        │
│  - "Report Issue" button              │
│  - Quick report form (modal)          │
│  - Issue type selection               │
└──────────┬───────────────────────────┘
           v
┌──────────────────────────────────────┐
│  🔴 BROKEN PATH #15                  │
│  Missing: /error-reports page         │
│  Admin view to:                       │
│  - Review reported issues             │
│  - Mark as resolved                   │
│  - Edit questions directly            │
└───────────────────────────────────────┘
```

---

## 8. DIAGRAM MANAGEMENT FLOW

### 8.1 Diagram Upload
```
/library/add (or during question creation)
        │
        v
┌──────────────────────────────────────┐
│  Image Upload Field ✅               │
│  - Drag & drop or file select        │
└──────────┬───────────────────────────┘
           v
┌──────────────────────────────────────┐
│  POST /api/upload ✅                 │
│  - Saves to /public/images/questions │
│  - Updates question.imageUrl          │
│  - Sets question.hasImage = true      │
└──────────┬───────────────────────────┘
           v
┌──────────────────────────────────────┐
│  🔴 BROKEN PATH #16                  │
│  Missing validation:                  │
│  - No file size limit check           │
│  - No image format validation         │
│  - No duplicate image detection       │
└───────────────────────────────────────┘
```

### 8.2 User Diagrams (Alternative Upload)
```
┌──────────────────────────────────────┐
│  POST /api/diagrams ✅               │
│  - Saves user-contributed diagrams    │
│  - Creates user_diagrams record       │
└──────────┬───────────────────────────┘
           v
┌──────────────────────────────────────┐
│  🔴 BROKEN PATH #17                  │
│  Missing: UI to upload user diagrams  │
│  Missing: Approval workflow           │
│  Missing: Preferred diagram selection │
└───────────────────────────────────────┘
```

---

## 9. DATA CONSISTENCY ISSUES

### 9.1 User Attempts Not Saved
```
┌──────────────────────────────────────┐
│  🔴 CRITICAL BROKEN PATH #18         │
│                                       │
│  Current Flow:                        │
│  Practice → Answer → Show Result →   │
│  Next Question                        │
│                                       │
│  Missing:                             │
│  POST /api/user-attempts              │
│  {                                    │
│    userId: 'ayansh',                 │
│    questionId: string,               │
│    selectedAnswer: string,           │
│    isCorrect: boolean,               │
│    timeSpent: number,                │
│    sessionId: string?                │
│  }                                    │
│                                       │
│  Impact:                              │
│  - No practice history               │
│  - Progress page shows 0 questions   │
│  - Topic performance empty           │
│  - Daily progress not updated        │
│  - Weekly analysis empty             │
│  - Achievements never unlock         │
└───────────────────────────────────────┘
```

### 9.2 Cascade Dependencies
```
┌──────────────────────────────────────┐
│  Dependency Chain:                    │
│                                       │
│  User Attempts (missing)              │
│         ↓                             │
│  Daily Progress (no data)             │
│         ↓                             │
│  Topic Performance (no data)          │
│         ↓                             │
│  Weekly Analysis (no data)            │
│         ↓                             │
│  Achievements (never unlock)          │
│         ↓                             │
│  Progress Dashboard (empty)           │
└───────────────────────────────────────┘
```

---

## 10. NAVIGATION GAPS

### 10.1 Missing Navigation Links
```
┌──────────────────────────────────────┐
│  🔴 BROKEN PATH #19                  │
│  Pages without nav links:             │
│  - /daily-progress (doesn't exist)    │
│  - /topic-performance (doesn't exist) │
│  - /weekly-analysis (doesn't exist)   │
│  - /sessions (doesn't exist)          │
│  - /error-reports (doesn't exist)     │
└───────────────────────────────────────┘
```

### 10.2 Inconsistent Navigation
```
┌──────────────────────────────────────┐
│  🔴 BROKEN PATH #20                  │
│  Some pages still missing Exams +     │
│  Achievements in nav:                 │
│  - /practice/quick                    │
│  - /practice/timed                    │
│  - /practice/topics                   │
│  - /library/*                         │
└───────────────────────────────────────┘
```

---

## 11. DATABASE INITIALIZATION ISSUES

### 11.1 Empty Tables
```
┌──────────────────────────────────────┐
│  🔴 BROKEN PATH #21                  │
│  Tables with no seed data:            │
│  - achievements (empty)               │
│  - topics (empty?)                    │
│  - tags (empty?)                      │
│                                       │
│  Missing:                             │
│  - Seed script for achievements       │
│  - Default topics list                │
│  - Standard tags                      │
└───────────────────────────────────────┘
```

### 11.2 Topic NOT NULL Constraint
```
┌──────────────────────────────────────┐
│  🔴 BROKEN PATH #22                  │
│  questions.topic is nullable but      │
│  should be required                   │
│                                       │
│  Fixed in migration but:              │
│  - Form doesn't enforce required      │
│  - API doesn't validate               │
└───────────────────────────────────────┘
```

---

## CRITICAL BROKEN PATHS SUMMARY

### 🔴 HIGH PRIORITY (Blocking Core Functionality)
1. **#18 - User attempts not saved** ⚠️ CRITICAL
   - Practice doesn't persist results
   - All analytics broken as a result

2. **#1 - Missing POST /api/user-attempts endpoint** ⚠️ CRITICAL
   - Need to create this endpoint

3. **#10 - No achievements in database**
   - Need seed data

4. **#11 - No achievement auto-grant system**
   - Need trigger mechanism

### 🟡 MEDIUM PRIORITY (Features Not Connected)
5. **#6 - Daily Progress page UI missing**
6. **#7 - Topic Performance page UI missing**
7. **#8 - Weekly Analysis page UI missing**
8. **#12 - Sessions page UI missing**
9. **#13 - Practice doesn't create sessions**
10. **#14 - No error reporting UI in practice**
11. **#15 - No admin error reports page**

### 🟢 LOW PRIORITY (UX Improvements)
12. **#2 - Timed challenge auto-submit**
13. **#3 - Topic practice no topic selection**
14. **#4 - Image not optimized**
15. **#9 - Exams not linked to practice**
16. **#16 - Upload validation missing**
17. **#17 - User diagram workflow missing**
18. **#20 - Inconsistent navigation**

---

## RECOMMENDED FIX ORDER

### Phase 1: Critical Data Flow (Must Fix First)
```
1. Create POST /api/user-attempts endpoint
2. Integrate attempt saving in practice pages
3. Test data flow to progress/analytics
4. Seed achievements table
5. Implement achievement auto-grant
```

### Phase 2: Analytics UI Pages
```
6. Create /daily-progress page
7. Create /topic-performance page
8. Create /weekly-analysis page
9. Create /sessions page
10. Update navigation to include these
```

### Phase 3: Enhanced Features
```
11. Add error reporting UI
12. Create admin /error-reports page
13. Implement session creation in practice
14. Add exam-to-practice linking
15. Build topic selection for topic practice
```

### Phase 4: Polish
```
16. Fix navigation consistency
17. Add upload validation
18. Optimize image processing
19. Build user diagram workflow
20. Add timed challenge auto-submit
```

---

## FLOW VERIFICATION CHECKLIST

- [ ] User can practice and attempts are saved
- [ ] Progress page shows real data
- [ ] Topics show performance metrics
- [ ] Daily progress updates automatically
- [ ] Weekly analysis generates correctly
- [ ] Achievements unlock automatically
- [ ] Sessions track practice properly
- [ ] Error reports can be submitted
- [ ] All pages have consistent navigation
- [ ] Images upload and display correctly
- [ ] Exams link to relevant practice
- [ ] Filters work across all practice modes
