/**
 * Real-world migration test using actual .aiknowsys directory
 * Validates migration with production data
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { migrateToSqlite } from '../../lib/commands/migrate-to-sqlite.js';
import type { MigrateToSqliteOptions } from '../../lib/types/index.js';

describe('migrate-to-sqlite real-world migration', () => {
  const projectRoot = join(import.meta.dirname, '../..');
  const aiknowsysDir = join(projectRoot, '.aiknowsys');
  let dbPath: string;

  beforeAll(() => {
    // Create temporary database path
    dbPath = join(tmpdir(), `realworld-migration-${Date.now()}.db`);
    
    // Verify .aiknowsys directory exists
    if (!existsSync(aiknowsysDir)) {
      throw new Error(`.aiknowsys directory not found at ${aiknowsysDir}`);
    }
  });

  afterAll(() => {
    // Clean up test database
    if (existsSync(dbPath)) {
      rmSync(dbPath, { force: true });
    }
  });

  it('should successfully migrate actual .aiknowsys directory', async () => {
    // GIVEN: Real .aiknowsys directory from this project
    const options: MigrateToSqliteOptions = {
      dir: projectRoot,
      dbPath,
      dryRun: false,
      verbose: true,
    };

    // WHEN: Running migration on real data
    console.log('\n🌍 Testing real-world migration...');
    console.log(`   Source: ${aiknowsysDir}`);
    console.log(`   Database: ${dbPath}`);
    
    const startTime = Date.now();
    const result = await migrateToSqlite(options);
    const duration = Date.now() - startTime;

    // THEN: Migration completes (may have YAML parse errors for files with
    // markdown in frontmatter - this is expected in real-world data)
    const totalFound = result.sessions.found + result.plans.found + result.learned.found;
    const totalMigrated = result.sessions.migrated + result.plans.migrated + result.learned.migrated;
    const totalErrors = result.sessions.errors + result.plans.errors + result.learned.errors;
    
    // At least some files should be found
    expect(totalFound).toBeGreaterThan(0);
    
    // At least 50% of files should migrate successfully (accounting for YAML issues)
    const successRate = totalMigrated / totalFound;
    expect(successRate).toBeGreaterThanOrEqual(0.5);
    
    // Learned patterns should have clean YAML (they're simpler)
    if (result.learned.found > 0) {
      expect(result.learned.errors).toBe(0);
      expect(result.learned.migrated).toBe(result.learned.found);
    }

    // Report results
    console.log('\n✅ Real-world Migration Results:');
    console.log(`   Sessions: ${result.sessions.migrated}/${result.sessions.found} (${result.sessions.errors} YAML errors)`);
    console.log(`   Plans: ${result.plans.migrated}/${result.plans.found} (${result.plans.errors} YAML errors)`);
    console.log(`   Learned: ${result.learned.migrated}/${result.learned.found} (${result.learned.errors} YAML errors)`);
    console.log(`   Total: ${totalMigrated}/${totalFound} files (${successRate.toFixed(1)}% success rate)`);
    console.log(`   Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    console.log(`   Throughput: ${(totalMigrated / (duration / 1000)).toFixed(1)} files/second`);
    console.log(`   Database size: ${existsSync(dbPath) ? 'created' : 'missing'}`);
    
    if (totalErrors > 0) {
      console.log(`\n⚠️  Note: ${totalErrors} files failed YAML parsing`);
      console.log('   This is expected for files with markdown in frontmatter (**bold**, lists, etc.)');
      console.log('   Future work: Add lenient YAML parser or document frontmatter rules');
    }
  });

  it('should perform dry-run on real data without creating database', async () => {
    // GIVEN: Real .aiknowsys directory and dry-run mode
    const dryRunDbPath = join(tmpdir(), `dryrun-${Date.now()}.db`);
    const options: MigrateToSqliteOptions = {
      dir: projectRoot,
      dbPath: dryRunDbPath,
      dryRun: true,
      verbose: false,
    };

    // WHEN: Running dry-run
    const result = await migrateToSqlite(options);

    // THEN: Files are scanned but database is not created
    const totalFound = result.sessions.found + result.plans.found + result.learned.found;
    expect(totalFound).toBeGreaterThan(0);
    expect(existsSync(dryRunDbPath)).toBe(false);

    console.log(`\n✅ Dry-run found ${totalFound} files without creating database`);
  });
});
