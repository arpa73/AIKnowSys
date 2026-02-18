import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = ':memory:';

describe('Schema Migration Phase 1', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(DB_PATH);
  });

  afterEach(() => {
    db.close();
  });

  it('should create the new tables: reviews, links, user_state', () => {
    // 1. Apply the schema
    const schemaPath = path.resolve(__dirname, '../../lib/context/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);

    // 2. Verify tables exist
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    const tableNames = tables.map(t => t.name);

    expect(tableNames).toContain('reviews');
    expect(tableNames).toContain('links');
    expect(tableNames).toContain('user_state');
    expect(tableNames).toContain('knowledge_events'); // Should already be there or added if missing

    // 3. Verify columns for reviews
    const reviewsColumns = db.prepare('PRAGMA table_info(reviews)').all() as { name: string }[];
    const reviewsColNames = reviewsColumns.map(c => c.name);
    expect(reviewsColNames).toContain('id');
    expect(reviewsColNames).toContain('target_id');
    expect(reviewsColNames).toContain('status');
    expect(reviewsColNames).toContain('content');

    // 4. Verify columns for links
    const linksColumns = db.prepare('PRAGMA table_info(links)').all() as { name: string }[];
    const linksColNames = linksColumns.map(c => c.name);
    expect(linksColNames).toContain('source_id');
    expect(linksColNames).toContain('target_id');
    expect(linksColNames).toContain('type');
    expect(linksColNames).toContain('metadata');

    // 5. Verify columns for user_state
    const userStateColumns = db.prepare('PRAGMA table_info(user_state)').all() as { name: string }[];
    const userStateColNames = userStateColumns.map(c => c.name);
    expect(userStateColNames).toContain('user_id');
    expect(userStateColNames).toContain('focus_context');
  });
});
