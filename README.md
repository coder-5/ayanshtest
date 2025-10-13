# 📚 Ayansh Math Prep

A comprehensive math practice and preparation platform for competitive mathematics exams (AMC8, MOEMS, Math Kangaroo, etc.) built with Next.js, React, TypeScript, and PostgreSQL.

---

## 📖 COMPLETE DOCUMENTATION

**For full system documentation, API reference, security audit, and all recent fixes:**

👉 **[COMPLETE_DOCUMENTATION.md](./COMPLETE_DOCUMENTATION.md)** 👈

**This README provides a quick overview. The complete documentation includes:**

- ✅ All 11 critical fixes applied on October 10, 2025
- 🔐 Security audit and remaining issues
- 📊 Database schema with constraints
- 🔌 Complete API reference
- 🚀 Deployment guide

---

## 🎯 Features

- **Practice Modes**
  - Quick Practice: Random questions from the entire library
  - Topic-Based Practice: Focus on specific math topics
  - Timed Challenges: Simulate exam conditions
  - Retry Failed Questions: Review previously incorrect answers
  - Exam Simulations: Practice specific competition exams

- **Progress Tracking**
  - Real-time performance analytics
  - Topic-wise accuracy and performance metrics
  - Historical progress visualization
  - Weekly activity reports
  - Achievement system with unlockable badges

- **Question Library**
  - Add questions manually or bulk upload
  - Support for multiple-choice and fill-in-the-blank questions
  - Image/diagram support for geometry problems
  - Video solution integration (YouTube embeds)
  - Written step-by-step solutions
  - Quality validation and error reporting

- **Exam Management**
  - Schedule upcoming exams
  - Set target scores and track progress
  - Percentile calculations based on historical data
  - Realistic cutoff and achievement benchmarks

## 🚀 Tech Stack

- **Frontend**: React 19, Next.js 15 (App Router)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS 4
- **Validation**: Zod schemas
- **UI Components**: Custom components with shadcn/ui patterns
- **Notifications**: React Hot Toast
- **Type Safety**: TypeScript with strict mode

## 📋 Prerequisites

- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- npm, yarn, pnpm, or bun

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd web-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your configuration:

   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ayansh_math_prep"
   NEXT_PUBLIC_DEFAULT_USER_ID="ayansh"
   NODE_ENV="development"
   ```

4. **Set up the database**

   Create the PostgreSQL database:

   ```bash
   createdb ayansh_math_prep
   ```

   Run Prisma migrations:

   ```bash
   npx prisma migrate dev
   ```

   Generate Prisma Client:

   ```bash
   npx prisma generate
   ```

5. **Seed initial data (optional)**
   ```bash
   npm run seed:user
   npm run seed:achievements
   ```

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at [http://localhost:3004](http://localhost:3004)

### Production Build

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## 📁 Project Structure

```
web-app/
├── app/                        # Next.js App Router
│   ├── api/                    # API routes
│   │   ├── questions/          # Question CRUD operations
│   │   ├── sessions/           # Practice session management
│   │   ├── user-attempts/      # Answer attempt tracking
│   │   ├── achievements/       # Achievement system
│   │   ├── error-reports/      # Quality issue reporting
│   │   └── ...
│   ├── practice/               # Practice mode pages
│   │   ├── quick/              # Quick practice
│   │   ├── topics/             # Topic-based practice
│   │   ├── timed/              # Timed challenges
│   │   └── wrong-questions/    # Retry failed questions
│   ├── library/                # Question library management
│   ├── progress/               # Analytics and progress tracking
│   ├── exams/                  # Exam scheduling and management
│   └── achievements/           # Achievement display
├── lib/                        # Shared utilities and services
│   ├── services/               # Business logic layer
│   │   └── questionService.ts  # Question operations
│   ├── validation.ts           # Zod validation schemas
│   ├── examCutoffs.ts          # Real exam percentile data
│   ├── userContext.ts          # User management
│   └── ...
├── components/                 # Reusable UI components
├── prisma/                     # Database schema and migrations
│   └── schema.prisma           # Prisma schema definition
├── scripts/                    # Utility scripts
├── public/                     # Static assets
│   └── images/questions/       # Question diagrams
└── package.json
```

## 🗄️ Database Schema

The application uses 14 main models:

- **User**: User profiles and authentication
- **Question**: Math questions with metadata
- **Option**: Multiple-choice options
- **Solution**: Written and video solutions
- **UserAttempt**: Answer attempt tracking
- **PracticeSession**: Practice session management
- **Achievement**: Unlockable achievements
- **UserAchievement**: User achievement progress
- **ErrorReport**: Quality issue reporting
- **Exam**: Scheduled exams
- **Diagram**: Question diagrams and images
- **Topic**: Math topic taxonomy
- **UserDiagram**: User-uploaded diagrams
- **DailyProgress**: Daily activity tracking

See `prisma/schema.prisma` for complete schema details.

## 🔐 Authentication

Currently using a temporary user system with localStorage for multi-user support on a single machine.

**TODO**: Implement proper authentication using NextAuth.js, Clerk, or similar.

The `lib/userContext.ts` file provides centralized user management:

- `getCurrentUserId()`: Server-side user ID retrieval
- `getClientUserId()`: Client-side user ID with localStorage
- `setClientUserId(userId)`: Update current user

## 📊 Key Features Explained

### Smart Question Selection

Questions are selected using adaptive algorithms based on:

- User's historical performance
- Topic weakness identification
- Spaced repetition principles
- Difficulty progression

### Percentile Calculations

Real competition data from AMC8, MOEMS, and other exams to provide accurate percentile rankings and achievement targets.

### Quality Validation

- Input sanitization for XSS prevention
- Payload size limits for DoS protection
- Question quality scoring
- User-reported error tracking

### Soft Delete Pattern

All deletions use soft-delete pattern (`deletedAt` timestamp) to maintain data integrity and enable recovery.

## 🧪 Testing

The application uses Playwright for end-to-end testing:

```bash
npm run test:e2e
```

## 🚢 Deployment

### Environment Variables

Ensure all required environment variables are set in production:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXT_PUBLIC_DEFAULT_USER_ID`: Default user ID
- `NODE_ENV`: Set to "production"

### Database Migrations

Before deploying, run migrations on production database:

```bash
npx prisma migrate deploy
```

### Recommended Platforms

- **Vercel**: Optimized for Next.js applications
- **Railway**: Easy PostgreSQL + Next.js deployment
- **Fly.io**: Containerized deployment option

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check
- `npm run seed:user` - Create default user
- `npm run seed:achievements` - Seed achievement data
- `npm run backup` - Backup question database

## 🤝 Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run linting and type checking
4. Test your changes thoroughly
5. Submit a pull request

## 📄 License

[Add your license information here]

## 🐛 Known Issues and TODOs

- [ ] Implement proper authentication system
- [ ] Add remaining TypeScript type definitions (remove 'any' types)
- [ ] Complete internationalization support
- [ ] Add comprehensive test coverage
- [ ] Implement caching layer for improved performance
- [ ] Add rate limiting for API routes
- [ ] Set up proper logging infrastructure

## 📧 Support

For issues or questions, please create an issue in the GitHub repository.

---

Built with ❤️ for math enthusiasts
