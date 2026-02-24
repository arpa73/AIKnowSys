import { syncSkills } from '../lib/commands/sync-skills.js';

async function main() {
  try {
    const result = await syncSkills({
      dir: process.cwd(),
      dbPath: process.env.AIKNOWSYS_DB_PATH,
      verbose: true,
    });

    console.log('Skills sync complete');
    console.log(`  Found: ${result.found}`);
    console.log(`  Synced: ${result.synced}`);
    console.log(`  Skipped: ${result.skipped}`);
    console.log(`  DB: ${result.dbPath}`);
  } catch (error) {
    console.error('Skills sync failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

void main();
