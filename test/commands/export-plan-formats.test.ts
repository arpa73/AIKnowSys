import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { exportPlan } from '../../lib/commands/export-plan.js';
import { SqliteStorage } from '../../lib/context/sqlite-storage.js';

describe('export-plan formats', () => {
  let tempDir: string;
  let dbPath: string;
  let storage: SqliteStorage;

  beforeEach(async () => {
    tempDir = path.join(process.cwd(), `test-tmp-export-plan-formats-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    dbPath = path.join(tempDir, 'knowledge.db');
    storage = new SqliteStorage();
    await storage.init(dbPath);

    const now = new Date('2026-02-18T10:00:00Z').toISOString();

    await storage.insertProject({
      id: 'test-project',
      name: 'Test Project',
      path: tempDir,
      created_at: now,
      updated_at: now
    });

    await storage.insertPlan({
      id: 'PLAN_export_format',
      project_id: 'test-project',
      title: 'Plan Format Export',
      status: 'ACTIVE',
      author: 'tester',
      created: now,
      updated: now,
      topics: ['format', 'export'],
      description: 'Plan format export tests',
      priority: 'high',
      type: 'feature',
      content: '## Steps\n- Build\n- Validate'
    });

    await storage.insertSession({
      id: 'sess-plan-format-001',
      project_id: 'test-project',
      date: '2026-02-18',
      topic: 'Plan format session',
      status: 'active',
      plan: 'PLAN_export_format',
      content: '',
      created: now,
      updated: now
    });

    await storage.insertReview({
      id: 'review-plan-format-001',
      project_id: 'test-project',
      target_id: 'PLAN_export_format',
      author: 'architect',
      status: 'PENDING',
      content: 'Review pending',
      created_at: now,
      updated_at: now
    });
  });

  afterEach(async () => {
    await storage.close();
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should export timeline format', async () => {
    const result = await exportPlan({
      planId: 'PLAN_export_format',
      dbPath,
      format: 'timeline'
    });

    expect(result.success).toBe(true);
    expect(result.markdown).toContain('# Plan: Plan Format Export');
    expect(result.markdown).toContain('## Timeline');
    expect(result.markdown).toContain('sess-plan-format-001');
    expect(result.markdown).toContain('review-plan-format-001');
  });

  it('should export grouped format', async () => {
    const result = await exportPlan({
      planId: 'PLAN_export_format',
      dbPath,
      format: 'grouped'
    });

    expect(result.success).toBe(true);
    expect(result.markdown).toContain('## Grouped View');
    expect(result.markdown).toContain('### Sessions');
  });

  it('should export custom format scaffold', async () => {
    const result = await exportPlan({
      planId: 'PLAN_export_format',
      dbPath,
      format: 'custom'
    });

    expect(result.success).toBe(true);
    expect(result.markdown).toContain('# Plan: Plan Format Export');
    expect(result.markdown).toContain('> **Format:** custom (scaffold — equivalent to narrative until custom rendering is implemented).');
    expect(result.markdown?.indexOf('# Plan: Plan Format Export')).toBeLessThan(
      result.markdown?.indexOf('## Goal') ?? Number.POSITIVE_INFINITY
    );
  });

  it('should reject unknown format', async () => {
    const result = await exportPlan({
      planId: 'PLAN_export_format',
      dbPath,
      format: 'unknown' as never
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid format 'unknown'");
  });
});
