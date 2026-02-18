import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseLocator } from '../lib/context/database-locator.js';

// ESM dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function updateSchema() {
  console.log('🔄 AIKnowSys Schema Update');
  console.log('-------------------------');

  try {
    // 1. Locate the database
    const locator = new DatabaseLocator();
    const config = await locator.getDatabaseConfig(process.cwd());
    const dbPath = config.dbPath;

    console.log(`📍 Database: ${dbPath}`);

    if (!fs.existsSync(dbPath)) {
      console.log('⚠️  Database not found. Creating new database...');
      // Ensure directory exists
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
    }

    // 2. Read the schema file
    // Try to find schema.sql relative to this script
    // In dev: scripts/update-schema.ts -> ../lib/context/schema.sql
    // In prod: dist/scripts/update-schema.js -> ../lib/context/schema.sql
    let schemaPath = path.resolve(__dirname, '../lib/context/schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      // Fallback for some dev environments or if structure differs
      schemaPath = path.resolve(process.cwd(), 'lib/context/schema.sql');
    }

    if (!fs.existsSync(schemaPath)) {
      console.error(`❌ Schema file not found at: ${schemaPath}`);
      process.exit(1);
    }

    console.log(`📜 Schema:   ${schemaPath}`);
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // 3. Apply schema
    const db = new Database(dbPath);
    
    // Enable WAL mode for concurrency
    db.pragma('journal_mode = WAL');
    
    console.log('🚀 Applying schema changes...');
    db.exec(schema);
    
    // 4. Verification
    console.log('✅ Schema application complete.');
    
    console.log('\n🔍 Verifying new tables...');
    const tables = [
      'reviews', 
      'links', 
      'user_state', 
      'knowledge_events'
    ];
    
    let allExist = true;
    for (const table of tables) {
      const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table) as { name: string } | undefined;
      if (result) {
        console.log(`  - ${table}: [OK]`);
      } else {
        console.log(`  - ${table}: [MISSING]`);
        allExist = false;
      }
    }

    db.close();

    if (allExist) {
      console.log('\n✨ Database is up to date with Phase 1 schema.');
    } else {
      console.error('\n❌ Verification failed. Some tables are missing.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Error updating schema:', error);
    process.exit(1);
  }
}

updateSchema();
