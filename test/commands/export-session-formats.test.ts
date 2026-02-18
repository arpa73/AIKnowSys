import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { exportSession } from '../../lib/commands/export-session.js';
import { SqliteStorage } from '../../lib/context/sqlite-storage.js';
import { EventType } from '../../lib/events/types.js';

describe('export-session formats', () => {
  let tempDir: string;
  let dbPath: string;
  let storage: SqliteStorage;

  beforeEach(async () => {
    tempDir = path.join(process.cwd(), `test-tmp-export-session-formats-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    dbPath = path.join(tempDir, 'knowledge.db');
    storage = new SqliteStorage();
    await storage.init(dbPath);

    await storage.insertProject({
      id: 'test-project',
      name: 'Test Project',
      path: tempDir,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    await storage.insertSession({
      id: 'sess-format-001',
      project_id: 'test-project',
      date: '2026-02-18',
      topic: 'Format Session',
      status: 'active',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      content: ''
    });

    await storage.insertEvent({
      eventId: 'evt-format-001',
      projectId: 'test-project',
      sessionId: 'sess-format-001',
      eventType: EventType.SESSION_STARTED,
      timestamp: new Date('2026-02-18T10:00:00Z').toISOString(),
      data: { title: 'Format Session', topics: ['format'] }
    });

    await storage.insertEvent({
      eventId: 'evt-format-002',
      projectId: 'test-project',
      sessionId: 'sess-format-001',
      eventType: EventType.GOAL_DEFINED,
      timestamp: new Date('2026-02-18T10:02:00Z').toISOString(),
      data: { goal: 'Test format output' }
    });
  });

  afterEach(async () => {
    await storage.close();
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should export timeline format', async () => {
    const result = await exportSession({
      sessionId: 'sess-format-001',
      dbPath,
      format: 'timeline'
    });

    expect(result.success).toBe(true);
    expect(result.markdown).toContain('## Timeline');
    expect(result.markdown).toContain('session started');
  });

  it('should export grouped format', async () => {
    const result = await exportSession({
      sessionId: 'sess-format-001',
      dbPath,
      format: 'grouped'
    });

    expect(result.success).toBe(true);
    expect(result.markdown).toContain('## Event Groups');
    expect(result.markdown).toContain('### goal defined');
  });

  it('should export custom format scaffold', async () => {
    const result = await exportSession({
      sessionId: 'sess-format-001',
      dbPath,
      format: 'custom'
    });

    expect(result.success).toBe(true);
    expect(result.markdown).toContain('## Custom Export');
  });

  it('should reject unknown format', async () => {
    const result = await exportSession({
      sessionId: 'sess-format-001',
      dbPath,
      format: 'unknown' as never
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid format 'unknown'");
  });
});
