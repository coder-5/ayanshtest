# Ayansh Math Competition Prep App - Rules & Guidelines

## Project Overview
Building a comprehensive web application for personal family use to help Ayansh (5th grade, highly talented) prepare for math competitions, focusing primarily on AMC 8, Math Kangaroo, and MOEM (Mathematical Olympiad for Elementary and Middle Schools). This is a private family application designed specifically for Ayansh's learning and his parent's progress monitoring.

## Document Processing Rules

### Multi-Format Document Handling
- Support upload of **Word documents** (.docx files) containing math problems
- Support upload of **PDF files** with math competition questions
- Support upload of **Image files** (PNG, JPG, JPEG) of math problems
- Parse documents that contain questions with or without solutions
- Handle documents where solutions are in separate files
- Extract mathematical equations and preserve formatting
- Maintain original problem numbering and organization

### Document Processing Libraries
- **Word Documents**: Use `mammoth.js` or `docx` npm package for .docx parsing
- **PDF Documents**: Use `pdf-parse` or `pdf2pic` for PDF text and image extraction
- **Image Processing**: Use OCR libraries like `tesseract.js` for image text extraction
- **OCR Integration**: Handle OCR-processed documents from any source
- **Mathematical Content**: Parse equations from Word equation editor, PDF text, or OCR
- **Unified Output**: Convert all formats to structured JSON format

### OCR Document Advantages
- **Cleaner Text Structure**: OCR produces more consistent formatting
- **Better Question Detection**: Easier to identify question boundaries
- **Mathematical Content**: OCR often converts equations to text format
- **Reduced Parsing Errors**: More predictable document structure
- **Consistent Formatting**: Standardized spacing and numbering

### Math Competition System (Expandable)
**Initial Focus (Phase 1):**
- **AMC 8**: Primary target - 25 questions, multiple choice A-E format
- **Math Kangaroo**: Age-appropriate levels (Grades 3-5 and 6-8 categories)
- **MOEM**: Mathematical Olympiad for Elementary and Middle Schools format

**AMC 8 Specific Format Requirements:**
- **Question Structure**: "1 Margie bought 3 apples..." (number + space + question text)
- **Multiple Choice**: (A)$1.50 (B)$2.00 (C)$2.50 (D)$3.00 (E)$3.50
- **Image Integration**: Geometric diagrams, graphs, charts embedded in questions
- **Mathematical Content**: Fractions, money formats, equations, ratios
- **Question Length**: Varies from 1 line to multiple paragraphs
- **Answer Extraction**: Extract both question text and all 5 answer choices

**MOEMS Specific Format Requirements:**
- **Question Structure**: "2A Time: 4 minutes" followed by question text
- **No Multiple Choice**: Open-ended questions with numerical answers
- **Time Limits**: Each question specifies time allocation (4-7 minutes)
- **Question ID Format**: Contest number + Letter (2A, 2B, 2C, 2D, 2E)
- **Answer Type**: Single numerical answer (357, 6754, 5, 300, 200)
- **Dual Document Format**: Separate files for questions and solutions
- **Solution Structure**: "[2A] 357" answer format + detailed explanations
- **Multiple Methods**: Each solution shows 2-3 different approaches
- **Success Rates**: Percentage indicators (47%, 45%, 41%) showing difficulty
- **Follow-up Questions**: Extended learning opportunities provided
- **Content Types**: Number theory, algebra, geometry, logical reasoning

**Expandable Architecture:**
- **Modular Competition Support**: Easy addition of new competitions as needed
- **Flexible Format Detection**: Auto-detect competition type from document structure
- **Custom Competition Types**: Support for local/regional/school competitions
- **Progressive Addition**: Add new competitions based on Ayansh's needs and interests
- **Competition Metadata**: Store competition-specific rules, time limits, scoring systems

### Document Structure Recognition
- Identify question blocks vs solution blocks automatically
- Recognize multiple choice options (A, B, C, D, E format)
- Parse mathematical notation and convert to web-friendly format
- Extract diagrams and images from documents
- Handle different document layouts and formatting styles

### Content Extraction Standards
- Convert Word equations to MathJax/LaTeX format
- Preserve question difficulty indicators if present
- Extract competition source information (AMC 8 2020, etc.)
- Maintain problem categories and tags from source
- Handle special characters and mathematical symbols correctly

### File Organization for Uploads
- Create dedicated folder structure: `/uploads/questions/` and `/uploads/solutions/`
- Generate unique IDs for each problem set
- Link questions to their corresponding solutions
- Maintain version history of uploaded documents
- Store original files alongside processed content

## Educational Content Rules

### Problem Categories
- Organize problems by competition type (AMC 8, Math Kangaroo, MOEM)
- Categorize by math topics (Algebra, Geometry, Number Theory, Combinatorics, Probability)
- Include difficulty levels (Beginner, Intermediate, Advanced)
- Tag problems with specific concepts and techniques

### Problem Quality Standards
- Verify all extracted problems are complete and accurate
- Ensure mathematical notation renders correctly after conversion
- Validate that multiple choice options are properly formatted
- Check that diagrams and images are clearly visible
- Confirm solutions match their corresponding questions

### Solution Processing
- Link solutions to correct problems automatically when possible
- Handle cases where solutions are in separate documents
- Parse step-by-step solution formats
- Extract alternative solution methods when available
- Maintain solution clarity and mathematical rigor

## Data Processing Workflow

### Upload Process
1. User uploads document(s) (Word, PDF, or images)
2. System extracts text and mathematical content
3. Parse and identify questions vs solutions
4. Convert mathematical notation to web format
5. Generate problem database entries
6. Create review queue for manual verification

### Quality Control
- Flag problems that may have parsing errors
- Require manual review for complex mathematical expressions
- Verify image extraction quality
- Check for incomplete problems or solutions
- Validate mathematical accuracy of converted content

### Database Storage
- Store original document metadata (filename, upload date, source)
- Maintain parsed content in structured format
- Link questions to solutions with unique identifiers
- Store mathematical expressions in both original and converted formats
- Keep track of processing status and verification completion

## Database Design with Prisma

### Database Schema Requirements
- Use Prisma ORM for type-safe database operations
- PostgreSQL as the underlying database
- Structured storage for questions, options, solutions, and metadata
- Efficient querying for practice sessions and progress tracking

### Core Database Models

#### Question Model
```prisma
model Question {
  id          String   @id @default(cuid())
  questionText String  // Mathematical content in MathJax/LaTeX format
  examName    String   // AMC 8, Math Kangaroo, MOEM
  examYear    Int      // Year of the exam (2020, 2021, etc.)
  questionNumber Int?  // Original question number in exam
  difficulty  String   // Beginner, Intermediate, Advanced
  topic       String   // Algebra, Geometry, Number Theory, etc.
  subtopic    String?  // More specific categorization
  hasImage    Boolean  @default(false)
  imageUrl    String?  // URL to question diagram/image
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  options     Option[]
  solution    Solution?
  attempts    UserAttempt[]
  tags        QuestionTag[]

  @@unique([examName, examYear, questionNumber])
  @@index([examName, examYear])
  @@index([topic, difficulty])
}
```

#### Option Model (for multiple choice questions)
```prisma
model Option {
  id         String  @id @default(cuid())
  questionId String
  optionLetter String // A, B, C, D, E
  optionText String  // Mathematical content
  isCorrect  Boolean @default(false)

  // Relations
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([questionId, optionLetter])
}
```

#### Solution Model
```prisma
model Solution {
  id            String   @id @default(cuid())
  questionId    String   @unique
  solutionText  String   // Step-by-step solution in MathJax/LaTeX
  approach      String?  // Solution method (algebraic, geometric, etc.)
  difficulty    String   // How hard the solution is to understand
  timeEstimate  Int?     // Estimated solve time in minutes
  keyInsights   String[] // Important concepts or tricks used
  commonMistakes String[] // Typical errors students make
  alternativeApproaches String[] // Other ways to solve
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  question      Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
}
```

#### Exam Model
```prisma
model Exam {
  id          String   @id @default(cuid())
  name        String   // AMC 8, Math Kangaroo, MOEM
  year        Int
  fullName    String   // "American Mathematics Competitions 8"
  description String?
  timeLimit   Int?     // Time limit in minutes
  totalQuestions Int?  // Number of questions in exam
  passingScore Int?    // Qualifying score if applicable
  createdAt   DateTime @default(now())

  @@unique([name, year])
}
```

#### User Progress Tracking
```prisma
model User {
  id          String   @id @default(cuid())
  name        String   // Ayansh
  email       String?  @unique
  grade       Int?     // School grade level (5th grade)
  targetScore Int?     // Goal score for competitions
  createdAt   DateTime @default(now())

  // Relations
  attempts    UserAttempt[]
  sessions    PracticeSession[]
  achievements Achievement[]
  dailyStats  DailyProgress[]
  weeklyStats WeeklyAnalysis[]
}

model UserAttempt {
  id           String   @id @default(cuid())
  userId       String
  questionId   String
  selectedAnswer String? // User's selected option (A, B, C, D, E)
  isCorrect    Boolean
  timeSpent    Int      // Time in seconds
  hintsUsed    Int      @default(0)
  attemptedAt  DateTime @default(now())

  // Relations
  user         User     @relation(fields: [userId], references: [id])
  question     Question @relation(fields: [questionId], references: [id])
  session      PracticeSession? @relation(fields: [sessionId], references: [id])
  sessionId    String?

  @@index([userId, questionId])
  @@index([userId, attemptedAt])
}

model PracticeSession {
  id          String   @id @default(cuid())
  userId      String
  sessionType String   // timed, topic-focused, exam-simulation, etc.
  startedAt   DateTime @default(now())
  completedAt DateTime?
  totalQuestions Int
  correctAnswers Int    @default(0)
  totalTime   Int?     // Total time in seconds
  averageTimePerQuestion Float? // Average time per question
  focusTopics String[] // Topics focused on in this session

  // Relations
  user        User     @relation(fields: [userId], references: [id])
  attempts    UserAttempt[]
}

#### Daily Progress and Analytics Models
```prisma
model DailyProgress {
  id               String   @id @default(cuid())
  userId           String
  date             DateTime // Date of practice (date only, no time)
  questionsAttempted Int    @default(0)
  correctAnswers   Int      @default(0)
  totalTimeSpent   Int      @default(0) // Total minutes spent
  averageAccuracy  Float    @default(0) // Percentage accuracy
  topicsStudied    String[] // Topics practiced today
  difficultiesStudied String[] // Difficulty levels attempted
  streakDays       Int      @default(0) // Consecutive days of practice
  isStreakDay      Boolean  @default(false) // Did practice today
  createdAt        DateTime @default(now())

  // Relations
  user             User     @relation(fields: [userId], references: [id])

  @@unique([userId, date])
  @@index([userId, date])
}

model WeeklyAnalysis {
  id                    String   @id @default(cuid())
  userId                String
  weekStartDate         DateTime // Monday of the week
  weekEndDate           DateTime // Sunday of the week
  totalQuestions        Int      @default(0)
  totalCorrect          Int      @default(0)
  totalTimeSpent        Int      @default(0) // Total minutes
  averageAccuracy       Float    @default(0)
  improvementRate       Float    @default(0) // % improvement from last week

  // Weak Areas Analysis
  weakestTopics         Json     // Array of topics with low accuracy
  strongestTopics       Json     // Array of topics with high accuracy
  slowestTopics         Json     // Topics taking most time
  recommendedFocus      String[] // Topics to focus on next week

  // Daily Consistency
  practicedays          Int      @default(0) // Days practiced this week
  longestStreak         Int      @default(0) // Longest consecutive days
  averageDailyQuestions Float    @default(0)

  // Difficulty Analysis
  beginnerAccuracy      Float?   // Accuracy on beginner questions
  intermediateAccuracy  Float?   // Accuracy on intermediate questions
  advancedAccuracy      Float?   // Accuracy on advanced questions

  createdAt             DateTime @default(now())

  // Relations
  user                  User     @relation(fields: [userId], references: [id])

  @@unique([userId, weekStartDate])
  @@index([userId, weekStartDate])
}

model TopicPerformance {
  id              String   @id @default(cuid())
  userId          String
  topicName       String
  totalAttempts   Int      @default(0)
  correctAttempts Int      @default(0)
  accuracy        Float    @default(0)
  averageTime     Float    @default(0) // Average seconds per question
  lastPracticed   DateTime?
  improvementTrend String  // improving, declining, stable
  strengthLevel   String   // weak, moderate, strong
  updatedAt       DateTime @updatedAt

  // Relations
  user            User     @relation(fields: [userId], references: [id])

  @@unique([userId, topicName])
  @@index([userId, strengthLevel])
}
```

#### Categorization and Tagging
```prisma
model Topic {
  id          String @id @default(cuid())
  name        String @unique // Algebra, Geometry, etc.
  description String?
  parentId    String? // For subtopics

  // Relations
  parent      Topic?  @relation("TopicHierarchy", fields: [parentId], references: [id])
  children    Topic[] @relation("TopicHierarchy")
  tags        QuestionTag[]
}

model Tag {
  id          String @id @default(cuid())
  name        String @unique // "quadratic-formula", "pythagorean-theorem"
  description String?

  // Relations
  questions   QuestionTag[]
}

model QuestionTag {
  questionId  String
  tagId       String

  // Relations
  question    Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  tag         Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([questionId, tagId])
}
```

### Database Operations Rules

#### Data Insertion from Document Processing
- Batch insert questions from parsed Word documents
- Validate exam name and year combinations
- Ensure question numbers are unique within exam/year
- Handle duplicate detection and merge conflicts
- Maintain referential integrity between questions, options, and solutions

#### Query Optimization
- Index frequently searched fields (exam name, year, topic, difficulty)
- Use database transactions for multi-table operations
- Implement efficient pagination for large question sets
- Cache commonly accessed data (exam lists, topic hierarchies)

#### Data Validation Rules
- Validate exam years are reasonable (1980-current year + 1)
- Ensure exactly one correct option per multiple choice question
- Verify question text and solution text are not empty
- Check that image URLs are valid and accessible
- Validate difficulty levels match predefined values

### Prisma Configuration Standards

#### Schema Organization
- Use clear, descriptive model names
- Follow consistent naming conventions (camelCase for fields)
- Include proper indexes for performance
- Set up appropriate cascade deletes
- Use enums for fixed value sets where applicable

#### Type Safety
- Leverage Prisma's type generation for frontend/backend
- Use Prisma Client for all database operations
- Implement proper error handling for database operations
- Validate data types at the application level

#### Migration Management
- Use Prisma migrations for schema changes
- Keep migration files in version control
- Test migrations on sample data before production
- Maintain backward compatibility when possible

### Performance and Scaling Rules

#### Query Efficiency
- Use `select` to fetch only needed fields
- Implement proper pagination with cursor-based navigation
- Use `include` and `select` strategically to avoid N+1 queries
- Monitor query performance with Prisma query logging

#### Data Growth Management
- Archive old user attempts periodically
- Implement soft deletes for important records
- Use database partitioning for large tables if needed
- Regular cleanup of orphaned records

## Personal Use Application Architecture

### Recommended Tech Stack
- **Framework**: Next.js 14+ (App Router) - Full-stack React framework
- **Database**: PostgreSQL with Prisma - Robust, scalable database
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **Math Rendering**: MathJax or KaTeX for mathematical notation
- **File Processing**: mammoth.js for .docx, pdf-parse for PDFs
- **Deployment**: Local development initially, Vercel for cloud deployment

### Family Use Optimizations
- **No Authentication**: Direct access for family members (you and Ayansh)
- **PostgreSQL Database**: Robust data storage with excellent performance
- **Simple Setup**: Single command installation and startup
- **Dual Interface**: Student view for Ayansh, parent dashboard for progress monitoring
- **Privacy First**: Private family database, no external analytics or tracking
- **Local Network Access**: Accessible from family devices on home network

### 5th Grade Talent-Focused Features
- **Adaptive Difficulty**: Start with 5th grade concepts, quickly advance to competition level
- **Visual Learning**: Rich diagrams and visual explanations for geometry
- **Mistake Learning**: Detailed explanations of why wrong answers are incorrect
- **Concept Building**: Bridge from elementary math to competition math concepts
- **Time Management**: Build speed while maintaining accuracy
- **Celebration System**: Acknowledge achievements and progress milestones
- **Parent Dashboard**: Comprehensive view for monitoring Ayansh's progress, strengths, and areas needing focus

## Technical Implementation Rules

### Document Parser Requirements
- Support Microsoft Word .docx format
- Handle mathematical equations from Word's equation editor
- Extract and convert images (JPG, PNG, SVG)
- Parse tables and formatted lists
- Maintain document structure and hierarchy

### Mathematical Content Handling
- Convert Word equations to MathJax format
- Support LaTeX mathematical notation input
- Render fractions, exponents, and complex expressions
- Handle geometric diagrams and coordinate planes
- Ensure mobile-friendly mathematical display

### Error Handling
- Gracefully handle corrupted or unsupported documents
- Provide clear error messages for parsing failures
- Allow manual correction of parsing errors
- Maintain logs of processing issues for improvement
- Support re-processing of failed documents

## User Experience for Content Management

### Upload Interface
- Drag-and-drop document upload
- Progress indicators for processing
- Preview of extracted content before saving
- Bulk upload capability for multiple documents
- Easy re-upload for corrections

### Review and Editing Tools
- Side-by-side view of original and processed content
- Inline editing for mathematical expressions
- Image replacement and adjustment tools
- Problem categorization interface
- Solution linking and verification tools

### Content Organization
- Search and filter uploaded content
- Batch operations for categorization
- Export processed content for backup
- Version control for content updates
- Archive system for old or unused problems

## Success Metrics for Document Processing

### Processing Accuracy
- Percentage of problems correctly extracted
- Mathematical notation conversion accuracy
- Image extraction success rate
- Proper question-solution linking rate
- Reduction in manual correction time

### User Efficiency
- Time from upload to ready-for-use content
- Number of documents processed per session
- User satisfaction with extraction quality
- Reduction in manual data entry work
- Overall content preparation workflow speed