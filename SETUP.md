# Ayansh Math Competition Prep - Setup Guide

Follow these steps to get the application running on your computer.

## Prerequisites

Before you begin, make sure you have these installed:

1. **Node.js** (version 18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **PostgreSQL Database**
   - Option A: Install locally from [postgresql.org](https://www.postgresql.org/download/)
   - Option B: Use cloud service like [Neon](https://neon.tech/) or [Supabase](https://supabase.com/)

3. **Git** (optional, for version control)
   - Download from [git-scm.com](https://git-scm.com/)

## Step-by-Step Setup

### 1. Install Dependencies

Open terminal/command prompt in the project folder and run:

```bash
npm install
```

This will install all required packages for the application.

### 2. Database Setup (Choose One Option)

#### Option A: Local PostgreSQL (Recommended for Family Use)
1. Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)
2. During installation, remember your postgres user password
3. Create database:
   ```sql
   # Connect to PostgreSQL (use password you set during install)
   psql -U postgres

   # Create database
   CREATE DATABASE ayansh_math_prep;

   # Exit psql
   \q
   ```

#### Option B: Cloud Database (Easier Setup)
1. Go to [neon.tech](https://neon.tech) and sign up (free)
2. Create new project called "ayansh-math-prep"
3. Copy the connection string they provide

### 3. Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and update the DATABASE_URL:

   **For local PostgreSQL:**
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ayansh_math_prep?schema=public"
   ```
   Replace `YOUR_PASSWORD` with the password you set during PostgreSQL installation.

   **For Neon cloud database:**
   ```env
   DATABASE_URL="postgresql://username:password@host.region.neon.tech:5432/dbname?sslmode=require"
   ```
   Use the exact connection string provided by Neon.

3. Generate a secure secret key:
   ```bash
   # On Mac/Linux:
   openssl rand -base64 32

   # On Windows (PowerShell):
   [System.Web.Security.Membership]::GeneratePassword(32, 0)
   ```

   Add this to `.env.local`:
   ```env
   NEXTAUTH_SECRET="your-generated-secret-here"
   ```

### 4. Database Schema Setup

Run these commands to set up your database:

```bash
# Generate Prisma client
npm run db:generate

# Push the schema to your database
npm run db:push

# Seed the database with sample data
npm run db:seed
```

**Note:** Make sure your DATABASE_URL is correctly set before running these commands!

### 5. Create Upload Directories

Create the uploads folder structure:

```bash
# On Mac/Linux:
mkdir -p public/uploads/questions public/uploads/solutions public/uploads/images

# On Windows:
mkdir public\\uploads\\questions public\\uploads\\solutions public\\uploads\\images
```

### 6. Start the Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

## First Time Usage

### 1. Upload Your First Documents

1. Go to **http://localhost:3000/upload**
2. Upload the AMC 8 2011 PDF you shared earlier
3. Upload the MOEMS 2000 question and answer PDFs
4. Review the extracted questions and add them to the database

### 2. Create Ayansh's Profile

The application will automatically create a user profile when questions are first attempted.

### 3. Start Practicing!

1. Go to the main dashboard
2. Click "Start Practicing"
3. Choose your competition type (AMC 8 or MOEMS)
4. Begin answering questions

## Troubleshooting

### Database Connection Issues

If you see database connection errors:

1. **Check your DATABASE_URL** in `.env.local`
2. **Verify PostgreSQL is running** (if using local)
3. **Test connection** using a database client like pgAdmin or DBeaver

### Port Already in Use

If port 3000 is busy:
```bash
npm run dev -- -p 3001
```
Then visit: **http://localhost:3001**

### Dependencies Issues

If npm install fails:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and try again
rm -rf node_modules package-lock.json
npm install
```

### File Upload Issues

If document uploads fail:
1. Check that upload directories exist
2. Verify file permissions on upload folders
3. Check file size (max 10MB by default)

## Database Management

### View Your Data
```bash
npm run db:studio
```
This opens Prisma Studio at **http://localhost:5555**

### Reset Database (if needed)
```bash
npm run db:push --force-reset
```
⚠️ **Warning**: This deletes all data!

### Backup Your Data
Use your PostgreSQL tools to create regular backups of the database.

## Performance Tips

1. **Close unnecessary applications** when running locally
2. **Use SSD storage** for better file upload performance
3. **Ensure good internet connection** for cloud database

## Need Help?

1. Check the main README.md for feature documentation
2. Review error messages in the terminal
3. Check browser developer console for client-side errors
4. Verify all environment variables are set correctly

## Success Indicators

You'll know setup worked when:
- ✅ Application loads at localhost:3000
- ✅ You can upload and parse competition documents
- ✅ Questions appear in the practice interface
- ✅ Progress tracking works after answering questions

**Ready to help Ayansh excel in math competitions!** 🚀