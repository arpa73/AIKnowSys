import * as fs from 'node:fs';
import * as path from 'node:path';
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import { SqliteStorage } from '../context/sqlite-storage.js';
import { EventMigrator } from '../migration/event-migrator.js';
import type {
  MigrateToEventsOptions,
  MigrateToEventsResult
} from '../types/index.js';

/**
 * Migrate markdown sessions/plans to event-sourced storage
 * 
 * Converts existing markdown-only sessions and plans into event-sourced format
 * by parsing markdown sections into structured events. Enables full event history
 * tracking while preserving backward compatibility.
 * 
 * @param options - Migration options
 * @returns Migration statistics
 * 
 * @example
 * ```typescript
 * // Migrate single session
 * await migrateToEvents({
 *   dir: process.cwd(),
 *   dbPath: './knowledge.db',
 *   sessionId: 'sess-2026-02-15-001',
 *   verbose: true
 * });
 * 
 * // Migrate all sessions
 * await migrateToEvents({
 *   dir: process.cwd(),
 *   dbPath: './knowledge.db',
 *   all: true,
 *   verbose: true
 * });
 * ```
 */
export async function migrateToEvents(
  options: MigrateToEventsOptions
): Promise<MigrateToEventsResult> {
  const targetDir = path.resolve(options.dir);
  const aiknowsysDir = path.join(targetDir, '.aiknowsys');
  const dbPath = path.resolve(options.dbPath);
  const verbose = options.verbose ?? false;
  const dryRun = options.dryRun ?? false;

  const result: MigrateToEventsResult = {
    sessions: { found: 0, migrated: 0, errors: 0 },
    plans: { found: 0, migrated: 0, errors: 0 }
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

    // Initialize database
    spinner = ora('Initializing database...').start();
    const storage = new SqliteStorage();
    await storage.init(dbPath);
    spinner.succeed('Database initialized');

    // Initialize migrator
    const migrator = new EventMigrator(storage);

    // Dry run mode
    if (dryRun) {
      if (verbose) {
        console.log(chalk.yellow('\n🔍 DRY RUN MODE - No changes will be made'));
      }
      
      // Count what would be migrated
      if (options.sessionId) {
        const session = await storage.getSessionById(options.sessionId);
        if (session) {
          result.sessions.found = 1;
        } else {
          result.sessions.errors = 1;
          if (verbose) {
            console.log(chalk.red(`❌ Session not found: ${options.sessionId}`));
          }
        }
      } else if (options.planId) {
        const plan = await storage.getPlanById(options.planId);
        if (plan) {
          result.plans.found = 1;
        } else {
          result.plans.errors = 1;
          if (verbose) {
            console.log(chalk.red(`❌ Plan not found: ${options.planId}`));
          }
        }
      } else if (options.all) {
        // Query all sessions and plans
        const sessionsResult = await storage.querySessions({});
        const plansResult = await storage.queryPlans({});
        result.sessions.found = sessionsResult.count;
        result.plans.found = plansResult.count;
        
        if (verbose) {
          console.log(chalk.dim(`Would migrate ${sessionsResult.count} sessions and ${plansResult.count} plans`));
        }
      }
      
      await storage.close();
      return result;
    }

    // Perform actual migration
    if (options.sessionId) {
      // Migrate single session
      spinner = ora(`Migrating session ${options.sessionId}...`).start();
      
      const session = await storage.getSessionById(options.sessionId);
      if (!session) {
        result.sessions.errors = 1;
        spinner.fail(`Session not found: ${options.sessionId}`);
        if (verbose) {
          console.log(chalk.red(`❌ Session not found: ${options.sessionId}`));
        }
        await storage.close();
        return result;
      }
      
      result.sessions.found = 1;
      
      try {
        const migrationResult = await migrator.migrateSession(options.sessionId);
        
        if (migrationResult.skipped) {
          // Already migrated
          if (verbose) {
            console.log(chalk.yellow('⚠️  Session already migrated'));
          }
        } else {
          result.sessions.migrated = 1;
          spinner.succeed(`Migrated session ${options.sessionId} (${migrationResult.eventsCreated} events)`);
        }
      } catch (error) {
        result.sessions.errors = 1;
        spinner.fail(`Failed to migrate session ${options.sessionId}`);
        if (verbose) {
          console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : String(error)}`));
        }
      }
      
    } else if (options.planId) {
      // Migrate single plan
      spinner = ora(`Migrating plan ${options.planId}...`).start();
      
      const plan = await storage.getPlanById(options.planId);
      if (!plan) {
        result.plans.errors = 1;
        spinner.fail(`Plan not found: ${options.planId}`);
        if (verbose) {
          console.log(chalk.red(`❌ Plan not found: ${options.planId}`));
        }
        await storage.close();
        return result;
      }
      
      result.plans.found = 1;
      
      try {
        const migrationResult = await migrator.migratePlan(options.planId);
        
        if (migrationResult.skipped) {
          // Already migrated
          if (verbose) {
            console.log(chalk.yellow('⚠️  Plan already migrated'));
          }
        } else {
          result.plans.migrated = 1;
          spinner.succeed(`Migrated plan ${options.planId} (${migrationResult.eventsCreated} events)`);
        }
      } catch (error) {
        result.plans.errors = 1;
        spinner.fail(`Failed to migrate plan ${options.planId}`);
        if (verbose) {
          console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : String(error)}`));
        }
      }
      
    } else if (options.all) {
      // Migrate all sessions and plans
      spinner = ora('Migrating all sessions...').start();
      
      const sessionMigrationResult = await migrator.migrateAllSessions();
      
      result.sessions.found = sessionMigrationResult.total;
      result.sessions.migrated = sessionMigrationResult.succeeded;
      result.sessions.errors = sessionMigrationResult.failed;
      
      spinner.succeed(`Migrated ${sessionMigrationResult.succeeded}/${sessionMigrationResult.total} sessions`);
      
      if (sessionMigrationResult.errors.length > 0 && verbose) {
        console.log(chalk.yellow(`\n⚠️  ${sessionMigrationResult.errors.length} session errors occurred:`));
        sessionMigrationResult.errors.forEach((err) => {
          console.log(chalk.dim(`  - ${err.sessionId}: ${err.error}`));
        });
      }
      
      // Migrate all plans
      spinner = ora('Migrating all plans...').start();
      
      const planMigrationResult = await migrator.migrateAllPlans();
      
      result.plans.found = planMigrationResult.total;
      result.plans.migrated = planMigrationResult.succeeded;
      result.plans.errors = planMigrationResult.failed;
      
      spinner.succeed(`Migrated ${planMigrationResult.succeeded}/${planMigrationResult.total} plans`);
      
      if (planMigrationResult.errors.length > 0 && verbose) {
        console.log(chalk.yellow(`\n⚠️  ${planMigrationResult.errors.length} plan errors occurred:`));
        planMigrationResult.errors.forEach((err) => {
          console.log(chalk.dim(`  - ${err.sessionId}: ${err.error}`));
        });
      }
    }
    
    result.dbPath = dbPath;
    
    // Summary
    if (verbose) {
      const totalMigrated = result.sessions.migrated + result.plans.migrated;
      const totalErrors = result.sessions.errors + result.plans.errors;
      
      console.log(chalk.green('\n✅ Migration complete!'));
      console.log(chalk.dim(`  Sessions: ${result.sessions.migrated}/${result.sessions.found}`));
      console.log(chalk.dim(`  Plans: ${result.plans.migrated}/${result.plans.found}`));
      console.log(chalk.dim(`  Total migrated: ${totalMigrated}`));
      console.log(chalk.dim(`  Errors: ${totalErrors}`));
      console.log(chalk.dim(`  Database: ${dbPath}`));
    }
    
    await storage.close();
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
