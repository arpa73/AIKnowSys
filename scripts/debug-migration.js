#!/usr/bin/env node
/**
 * Debug script to test migration and query database
 */

import { migrateToSqlite } from '../dist/lib/commands/migrate-to-sqlite.js';
import { SqliteStorage } from '../dist/lib/context/sqlite-storage.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function debug() {
  const fixturesPath = path.join(__dirname, '..', 'test/integration/fixtures');
  const dbPath = '/tmp/test-migration-debug.db';
  
  console.log('Migrating fixtures from:', fixturesPath);
  console.log('Database path:', dbPath);
  
  const result = await migrateToSqlite({
    dir: fixturesPath,
    dbPath,
    verbose: true,
    dryRun: false,
  });
  
  console.log('\nMigration result:');
  console.log(JSON.stringify(result, null, 2));
  
  if (result.sessions.migrated > 0 || result.plans.migrated > 0 || result.learned.migrated > 0) {
    console.log('\nQuerying database...');
    const storage = new SqliteStorage();
    await storage.init(dbPath);
    
    const {sessions} = await storage.querySessions({});
    console.log('\nSessions in DB:', sessions.length);
    sessions.forEach(s => console.log('  -', s));
    
    const {plans} = await storage.queryPlans({});
    console.log('\nPlans in DB:', plans.length);
    plans.forEach(p => console.log('  -', p));
    
    const {results} = await storage.search('integration', 'learned');
    console.log('\nLearned patterns matching "integration":', results.length);
    results.forEach(r => console.log('  -', r));
    
    await storage.close();
  }
}

debug().catch(console.error);
