# Ayansh Math Competition Prep App

A comprehensive web application for personal family use to help Ayansh (5th grade, highly talented) prepare for math competitions, focusing primarily on AMC 8, Math Kangaroo, and MOEMS (Mathematical Olympiad for Elementary and Middle Schools).

## Features

- 📚 **Question Practice**: Interactive practice with multiple choice (AMC 8) and open-ended (MOEMS) questions
- 📊 **Progress Analytics**: Daily and weekly progress tracking with detailed insights
- 🎯 **Adaptive Learning**: Smart recommendations based on performance and weak areas
- 📱 **Document Upload**: Support for Word documents, PDFs, and images with automatic parsing
- 🏆 **Gamification**: Streaks, achievements, and progress celebration
- 👨‍👩‍👧 **Family Dashboard**: Parent view for monitoring progress

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **UI**: Tailwind CSS + shadcn/ui components
- **Math Rendering**: KaTeX for mathematical notation
- **File Processing**: mammoth.js (Word), pdf-parse (PDF), tesseract.js (OCR)
- **Charts**: Recharts for analytics visualization

## Supported Competitions

### AMC 8
- 25 multiple choice questions (A-E format)
- 40-minute time limit
- Target preparation for talented 5th grader

### MOEMS (Mathematical Olympiad for Elementary and Middle Schools)
- 5 open-ended questions per contest (2A-2E format)
- Individual time limits (4-7 minutes)
- Detailed solution explanations with multiple methods

### Math Kangaroo
- Age-appropriate levels (Grades 3-5 and 6-8 categories)
- Expandable format support

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd ayansh-math-prep
   npm install
   ```

2. **Database Setup**
   ```bash
   # Set up your PostgreSQL database and update .env.local
   cp .env.local.example .env.local
   # Edit DATABASE_URL in .env.local

   # Generate Prisma client and push schema
   npm run db:generate
   npm run db:push
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Access Application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Upload your first math competition documents
   - Start practicing!

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Prisma Studio

## Environment Variables

Create a `.env.local` file with:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/ayansh_math_prep?schema=public"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
UPLOAD_DIR="./public/uploads"
```

## Database Schema

The application uses a comprehensive schema designed for:
- **Questions & Solutions**: Store problems with multiple choice options or numerical answers
- **User Progress**: Track attempts, accuracy, timing, and learning patterns
- **Analytics**: Daily/weekly progress analysis and weak area identification
- **Categorization**: Topics, tags, and difficulty levels for smart filtering

## Document Processing

### Supported Formats
- **Word Documents** (.docx): Direct parsing with mammoth.js
- **PDF Files**: Text and image extraction with pdf-parse
- **Images** (PNG, JPG): OCR text extraction with tesseract.js

### Parsing Features
- Automatic question detection and numbering
- Multiple choice option extraction (AMC 8)
- Mathematical equation conversion to KaTeX
- Image diagram preservation and linking
- Solution matching and verification

## Usage Examples

### Upload Documents
1. Go to `/upload` page
2. Drag and drop competition documents
3. Review extracted questions and solutions
4. Add to question database

### Practice Sessions
1. Select competition type (AMC 8, MOEMS, etc.)
2. Choose practice mode (random, topic-focused, timed)
3. Answer questions with mathematical rendering
4. Get immediate feedback and explanations

### View Progress
1. Check daily streaks and goals on dashboard
2. Analyze weekly performance trends
3. Identify weak areas needing focus
4. Track improvement over time

## Family Use Features

- **No Authentication**: Direct access for Ayansh and parents
- **Dual Interface**: Student practice view + parent monitoring dashboard
- **Privacy First**: All data stays within family database
- **Local Network**: Accessible from family devices

## License

Private family application - not for redistribution.

## Support

For technical issues or feature requests, please check the project documentation or create an issue in the repository.