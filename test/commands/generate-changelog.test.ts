import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { SqliteStorage } from '../../lib/context/sqlite-storage.js';
import { generateChangelog } from '../../lib/commands/generate-changelog.js';
import { EventType } from '../../lib/events/types.js';

describe('generate-changelog command', () => {
  let tempDir: string;
  let dbPath: string;
  let storage: SqliteStorage;

  beforeEach(async () => {
    tempDir = path.join(process.cwd(), `test-tmp-generate-changelog-command-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    dbPath = path.join(tempDir, 'knowledge.db');
    storage = new SqliteStorage();
    await storage.init(dbPath);

    const now = new Date().toISOString();
    await storage.insertProject({
      id: 'test-project',
      name: 'Test Project',
      path: tempDir,
      created_at: now,
      updated_at: now,
    });
  });

  afterEach(async () => {
    await storage.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('writes changelog to output path', async () => {
    await storage.insertEvent({
      eventId: 'evt-release',
      projectId: 'test-project',
      timestamp: '2026-02-23T11:00:00.000Z',
      eventType: EventType.DECISION_MADE,
      data: {
        decision: 'v1.3.0 release approved',
        rationale: 'Stable and validated',
      },
    });

    const outputPath = path.join(tempDir, 'CHANGELOG.generated.md');
    const result = await generateChangelog({
      dbPath,
      output: outputPath,
      _silent: true,
    });

    expect(result.success).toBe(true);
    expect(result.milestoneCount).toBe(1);
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  it('supports dry-run without writing output file', async () => {
    await storage.insertEvent({
      eventId: 'evt-arch',
      projectId: 'test-project',
      timestamp: '2026-02-23T11:00:00.000Z',
      eventType: EventType.DECISION_MADE,
      data: {
        decision: 'Major architecture change completed',
        rationale: 'Unified adapter',
      },
    });

    const outputPath = path.join(tempDir, 'CHANGELOG.generated.md');
    const result = await generateChangelog({
      dbPath,
      output: outputPath,
      dryRun: true,
      _silent: true,
    });

    expect(result.success).toBe(true);
    expect(result.milestoneCount).toBe(1);
    expect(fs.existsSync(outputPath)).toBe(false);
  });

  it('fails gracefully when db path is invalid', async () => {
    const result = await generateChangelog({
      dbPath: path.join(tempDir, 'missing', 'knowledge.db'),
      _silent: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to generate changelog');
  });
});
