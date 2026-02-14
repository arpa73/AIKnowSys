import * as fs from 'node:fs';
import * as path from 'node:path';
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import { FileScanner } from '../migration/file-scanner.js';
import { MigrationCoordinator } from '../migration/migration-coordinator.js';
import { SqliteStorage } from '../context/sqlite-storage.js';
import type {
  MigrateToSqliteOptions,
  MigrateToSqliteResult
} from '../types/index.js';

/**
 * Migrate .aiknowsys files to SQLite database
 * 
 * @param options - Migration options
 * @returns Migration statistics
 * 
 * @example
 * ```typescript
 * await migrateToSqlite({
 *   dir: process.cwd(),
 *   dbPath: './knowledge.db',
 *   verbose: true,
 *   dryRun: false
 * });
 * ```
 */
export async function migrateToSqlite(
  options: MigrateToSqliteOptions
): Promise<MigrateToSqliteResult> {
  const targetDir = path.resolve(options.dir);
  const aiknowsysDir = path.join(targetDir, '.aiknowsys');
  const dbPath = path.resolve(options.dbPath);
  const verbose = options.verbose ?? false;
  const dryRun = options.dryRun ?? false;

  const result: MigrateToSqliteResult = {
    sessions: { found: 0, migrated: 0, errors: 0 },
    plans: { found: 0, migrated: 0, errors: 0 },
    learned: { found: 0, migrated: 0, errors: 0 }
  };

  let spinner: Ora | null = null;

  try {
    // Check if .aiknowsys directory exists
    if (!fs.existsSync(aiknowsysDir)) {
      if (verbose) {
        console.log(chalk.yellow(`⚠️  .aiknowsys directory not found at ${aiknowsysDir}`));
      }
      return result;
    }

    // Scan for files
    if (verbose) {
      console.log(chalk.cyan('Scanning .aiknowsys directory...'));
    }
    
    spinner = ora('Scanning files...').start();
    const scanner = new FileScanner();
    const scanResult = await scanner.scanDirectory(targetDir);
    spinner.succeed(`Found ${scanResult.total} files`);

    result.sessions.found = scanResult.sessions.length;
    result.plans.found = scanResult.plans.length;
    result.learned.found = scanResult.learned.length;

    if (verbose) {
      console.log(chalk.dim(`  Sessions: ${result.sessions.found}`));
      console.log(chalk.dim(`  Plans: ${result.plans.found}`));
      console.log(chalk.dim(`  Learned patterns: ${result.learned.found}`));
    }

    // Dry run mode
    if (dryRun) {
      if (verbose) {
        console.log(chalk.yellow('\n🔍 DRY RUN MODE - No changes will be made'));
        console.log(chalk.dim(`Would migrate to: ${dbPath}`));
      }
      return result;
    }

    // Initialize database
    spinner = ora('Initializing database...').start();
    const storage = new SqliteStorage();
    await storage.init(dbPath);
    spinner.succeed('Database initialized');

    // Migrate files
    spinner = ora('Migrating files...').start();
    const coordinator = new MigrationCoordinator(storage);
    const migrationResult = await coordinator.migrateFromDirectory(targetDir);
    spinner.succeed('Migration complete');

    // Map results
    result.sessions.migrated = migrationResult.sessionsMigrated;
    result.plans.migrated = migrationResult.plansMigrated;
    result.learned.migrated = migrationResult.learnedMigrated;
    
    // Count errors by trying to categorize them from error messages
    if (migrationResult.errors.length > 0) {
      result.sessions.errors = migrationResult.errors.filter((e: string) => 
        e.toLowerCase().includes('session') || e.includes('.md')
      ).length;
      result.plans.errors = migrationResult.errors.filter((e: string) => 
        e.toLowerCase().includes('plan')
      ).length;
      result.learned.errors = migrationResult.errors.filter((e: string) => 
        e.toLowerCase().includes('learned')
      ).length;
      
      // If we can't categorize all errors, assign remainder to sessions
      const uncategorized = migrationResult.errors.length - 
        (result.sessions.errors + result.plans.errors + result.learned.errors);
      if (uncategorized > 0 && result.sessions.found > 0) {
        result.sessions.errors += uncategorized;
      }
    }
    
    result.dbPath = dbPath;

    // Show errors if any
    if (migrationResult.errors.length > 0 && verbose) {
      console.log(chalk.yellow(`\n⚠️  ${migrationResult.errors.length} errors occurred:`));
      migrationResult.errors.forEach((err: string) => {
        console.log(chalk.dim(`  - ${err}`));
      });
    }

    // Summary
    if (verbose) {
      const totalMigrated = result.sessions.migrated + result.plans.migrated + result.learned.migrated;
      const totalErrors = migrationResult.errors.length;
      
      console.log(chalk.green('\n✅ Migration complete!'));
      console.log(chalk.dim(`  Sessions: ${result.sessions.migrated}/${result.sessions.found}`));
      console.log(chalk.dim(`  Plans: ${result.plans.migrated}/${result.plans.found}`));
      console.log(chalk.dim(`  Learned: ${result.learned.migrated}/${result.learned.found}`));
      console.log(chalk.dim(`  Total migrated: ${totalMigrated}`));
      console.log(chalk.dim(`  Skipped: ${migrationResult.skipped}`));
      console.log(chalk.dim(`  Errors: ${totalErrors}`));
      console.log(chalk.dim(`  Database: ${dbPath}`));
    }

    return result;

  } catch (error) {
    if (spinner) {
      spinner.fail('Migration failed');
    }
    
    if (verbose) {
      console.error(chalk.red('\n❌ Migration error:'));
      console.error(error instanceof Error ? error.message : String(error));
    }
    
    throw error;
  }
}
