#!/usr/bin/env node

import Database from 'better-sqlite3';
import os from 'os';
import path from 'path';

const args = process.argv.slice(2);
const isHelp = args.includes('--help') || args.includes('-h');
const isApply = args.includes('--apply');
const isDryRun = args.includes('--dry-run') || !isApply;

const dbPathArgIndex = args.indexOf('--db-path');
const dbPathArg = dbPathArgIndex >= 0 ? args[dbPathArgIndex + 1] : undefined;
const dbPath = dbPathArg || path.join(os.homedir(), '.aiknowsys', 'knowledge.db');

if (isHelp) {
  console.log(`
Archive CANCELLED plans from active "plans" into "plans_archive".

Usage:
  node scripts/archive-cancelled-plans.js [options]

Options:
  --dry-run          Preview how many rows would be archived (default)
  --apply            Execute archive move + delete
  --db-path <path>   Override database path
  --help, -h         Show help

Examples:
  node scripts/archive-cancelled-plans.js --dry-run
  node scripts/archive-cancelled-plans.js --apply
  node scripts/archive-cancelled-plans.js --apply --db-path /path/to/knowledge.db
`);
  process.exit(0);
}

const db = new Database(dbPath);

try {
  const cancelledCount = db
    .prepare("SELECT COUNT(*) AS count FROM plans WHERE status='CANCELLED'")
    .get();

  if (isDryRun) {
    console.log(
      JSON.stringify({
        mode: 'dry-run',
        dbPath,
        cancelledPlans: cancelledCount.count
      }, null, 2)
    );
    process.exit(0);
  }

  db.exec(`
    BEGIN;
    CREATE TABLE IF NOT EXISTS plans_archive (
      id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      author TEXT NOT NULL,
      priority TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      topics TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived_at TEXT NOT NULL
    );
    INSERT INTO plans_archive (
      id, project_id, title, status, author, priority, type, description,
      content, topics, created_at, updated_at, archived_at
    )
    SELECT
      id,
      COALESCE(project_id, 'default'),
      COALESCE(title, 'Untitled Plan'),
      COALESCE(status, 'CANCELLED'),
      COALESCE(author, 'unknown'),
      COALESCE(priority, 'medium'),
      COALESCE(type, 'feature'),
      description,
      COALESCE(content, ''),
      COALESCE(topics, '[]'),
      COALESCE(created_at, datetime('now')),
      COALESCE(updated_at, datetime('now')),
      datetime('now')
    FROM plans
    WHERE status='CANCELLED';
    DELETE FROM plans WHERE status='CANCELLED';
    COMMIT;
  `);

  const archivedTotal = db.prepare('SELECT COUNT(*) AS count FROM plans_archive').get();
  const remainingCancelled = db
    .prepare("SELECT COUNT(*) AS count FROM plans WHERE status='CANCELLED'")
    .get();

  console.log(
    JSON.stringify({
      mode: 'apply',
      dbPath,
      archivedTotal: archivedTotal.count,
      remainingCancelled: remainingCancelled.count
    }, null, 2)
  );
} finally {
  db.close();
}
