import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

interface BackupConfig {
  host: string;
  port: string;
  database: string;
  username: string;
  backupDir: string;
  retentionDays: number;
}

const getConfig = (): BackupConfig => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Parse DATABASE_URL: postgresql://username:password@host:port/database
  const url = new URL(databaseUrl);

  return {
    host: url.hostname,
    port: url.port || '5432',
    database: url.pathname.slice(1), // Remove leading slash
    username: url.username,
    backupDir: path.join(process.cwd(), 'backups'),
    retentionDays: 30,
  };
};

const getTimestamp = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}-${hour}-${minute}`;
};

const ensureBackupDir = (backupDir: string): void => {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`Created backup directory: ${backupDir}`);
  }
};

const createBackup = async (): Promise<void> => {
  console.log('Starting automated backup...');

  const config = getConfig();
  ensureBackupDir(config.backupDir);

  const timestamp = getTimestamp();
  const backupFile = path.join(config.backupDir, `backup-${timestamp}.sql`);

  // Set PGPASSWORD environment variable for pg_dump
  const password = process.env.DATABASE_URL?.match(/:([^@]+)@/)?.[1];
  if (!password) {
    throw new Error('Could not extract password from DATABASE_URL');
  }

  // Build pg_dump command
  const command = `pg_dump -h ${config.host} -p ${config.port} -U ${config.username} -d ${config.database} -F p -f "${backupFile}"`;

  try {
    // Execute backup
    await execAsync(command, {
      env: {
        ...process.env,
        PGPASSWORD: password,
      },
    });

    const stats = fs.statSync(backupFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✓ Backup completed successfully!`);
    console.log(`  File: ${backupFile}`);
    console.log(`  Size: ${fileSizeMB} MB`);

    // Clean up old backups
    await cleanupOldBackups(config.backupDir, config.retentionDays);
  } catch (error) {
    console.error('✗ Backup failed:', error);
    throw error;
  }
};

const cleanupOldBackups = async (backupDir: string, retentionDays: number): Promise<void> => {
  console.log(`\nCleaning up backups older than ${retentionDays} days...`);

  const files = fs.readdirSync(backupDir);
  const backupFiles = files.filter((file) => file.startsWith('backup-') && file.endsWith('.sql'));

  const now = Date.now();
  const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

  let deletedCount = 0;

  for (const file of backupFiles) {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    const age = now - stats.mtime.getTime();

    if (age > retentionMs) {
      fs.unlinkSync(filePath);
      console.log(`  Deleted: ${file}`);
      deletedCount++;
    }
  }

  if (deletedCount === 0) {
    console.log('  No old backups to delete');
  } else {
    console.log(`  Deleted ${deletedCount} old backup(s)`);
  }
};

const listBackups = (): void => {
  const config = getConfig();
  const backupDir = config.backupDir;

  if (!fs.existsSync(backupDir)) {
    console.log('No backups directory found');
    return;
  }

  const files = fs.readdirSync(backupDir);
  const backupFiles = files
    .filter((file) => file.startsWith('backup-') && file.endsWith('.sql'))
    .sort()
    .reverse();

  if (backupFiles.length === 0) {
    console.log('No backups found');
    return;
  }

  console.log(`\nFound ${backupFiles.length} backup(s):\n`);

  for (const file of backupFiles) {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    const date = stats.mtime.toLocaleDateString();
    const time = stats.mtime.toLocaleTimeString();

    console.log(`  ${file}`);
    console.log(`    Size: ${fileSizeMB} MB`);
    console.log(`    Date: ${date} ${time}\n`);
  }
};

// Main execution
const main = async () => {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'backup':
        await createBackup();
        break;
      case 'list':
        listBackups();
        break;
      case 'cleanup':
        const config = getConfig();
        await cleanupOldBackups(config.backupDir, config.retentionDays);
        break;
      default:
        console.log('Usage: npm run backup:auto [backup|list|cleanup]');
        console.log('');
        console.log('Commands:');
        console.log('  backup  - Create a new database backup');
        console.log('  list    - List all available backups');
        console.log('  cleanup - Remove backups older than 30 days');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

main();
