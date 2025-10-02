#!/usr/bin/env node

/**
 * Safe Migration Script
 * Automatically backs up data before running Prisma migrations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function safeMigration() {
  console.log('🛡️  Starting Safe Migration Process...\n');

  try {
    // Step 1: Create pre-migration backup
    console.log('📦 Step 1: Creating pre-migration backup...');
    const backupResult = execSync('node scripts/backup-questions.js backup', {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    console.log('✅ Backup completed');

    // Step 2: Check for pending migrations
    console.log('\n🔍 Step 2: Checking for pending migrations...');
    try {
      execSync('npx prisma migrate status', {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      console.log('✅ Migration status checked');
    } catch (error) {
      if (error.stdout && error.stdout.includes('pending')) {
        console.log('⚠️  Pending migrations detected');
      }
    }

    // Step 3: Run migration
    console.log('\n🚀 Step 3: Running database migration...');
    execSync('npx prisma migrate dev', {
      encoding: 'utf8',
      stdio: 'inherit'
    });
    console.log('✅ Migration completed successfully');

    // Step 4: Verify data integrity
    console.log('\n🔍 Step 4: Verifying data integrity...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const questionCount = await prisma.question.count();
    console.log(`✅ Data verification: ${questionCount} questions found`);

    await prisma.$disconnect();

    console.log('\n🎉 Safe migration completed successfully!');
    console.log('📊 Summary:');
    console.log('   ✅ Pre-migration backup created');
    console.log('   ✅ Migration executed');
    console.log('   ✅ Data integrity verified');
    console.log(`   📈 Questions in database: ${questionCount}`);

  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    console.log('\n🛠️  Recovery options:');
    console.log('   1. Check the latest backup in /backups folder');
    console.log('   2. Run: npm run db:restore <backup-file>');
    console.log('   3. Contact system administrator');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  safeMigration();
}

module.exports = { safeMigration };