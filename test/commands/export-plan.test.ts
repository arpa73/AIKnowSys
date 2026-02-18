import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { exportPlan } from '../../dist/lib/commands/export-plan.js';
import { SqliteStorage } from '../../dist/lib/context/sqlite-storage.js';
import type { ExportPlanOptions } from '../../dist/lib/types/index.js';

describe('export-plan command', () => {
  let tempDir: string;
  let dbPath: string;
  let storage: SqliteStorage;

  beforeEach(async () => {
    tempDir = path.join(process.cwd(), `test-tmp-export-plan-${Date.now()}`);
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
  });

  afterEach(async () => {
    if (storage) {
      await storage.close();
    }

    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should export plan with linked sessions and reviews to markdown', async () => {
    const now = new Date().toISOString();

    await storage.insertPlan({
      id: 'PLAN_export_test',
      project_id: 'test-project',
      title: 'Export Plan Test',
      status: 'ACTIVE',
      author: 'tester',
      created: now,
      updated: now,
      topics: ['json-only', 'export'],
      description: 'Validate export plan command',
      priority: 'high',
      type: 'feature',
      content: '## Steps\n- Build\n- Test'
    });

    await storage.insertSession({
      id: 'sess-plan-001',
      project_id: 'test-project',
      date: '2026-02-17',
      topic: 'Work Session',
      status: 'active',
      plan: 'PLAN_export_test',
      content: '',
      created: now,
      updated: now
    });

    await storage.insertReview({
      id: 'review-001',
      project_id: 'test-project',
      target_id: 'PLAN_export_test',
      author: 'architect',
      status: 'PENDING',
      content: 'Looks good so far',
      created_at: now,
      updated_at: now
    });

    const options: ExportPlanOptions = {
      planId: 'PLAN_export_test',
      dbPath,
      verbose: false
    };

    const result = await exportPlan(options);

    expect(result.success).toBe(true);
    expect(result.markdown).toContain('# Plan: Export Plan Test');
    expect(result.markdown).toContain('**Plan ID:** PLAN_export_test');
    expect(result.markdown).toContain('## Linked Sessions');
    expect(result.markdown).toContain('sess-plan-001');
    expect(result.markdown).toContain('## Reviews');
    expect(result.markdown).toContain('review-001');
    expect(result.sessionCount).toBe(1);
    expect(result.reviewCount).toBe(1);
  });

  it('should write markdown to output file when provided', async () => {
    const now = new Date().toISOString();

    await storage.insertPlan({
      id: 'PLAN_export_file',
      project_id: 'test-project',
      title: 'Export To File',
      status: 'COMPLETE',
      author: 'tester',
      created: now,
      updated: now,
      content: 'File export content'
    });

    const outputPath = path.join(tempDir, 'plan-export.md');
    const relativeOutputPath = path.relative(process.cwd(), outputPath);
    const options: ExportPlanOptions = {
      planId: 'PLAN_export_file',
      dbPath,
      output: relativeOutputPath,
      verbose: false
    };

    const result = await exportPlan(options);

    expect(result.success).toBe(true);
    expect(result.outputPath).toBe(outputPath);
    expect(fs.existsSync(outputPath)).toBe(true);

    const fileContent = fs.readFileSync(outputPath, 'utf-8');
    expect(fileContent).toContain('# Plan: Export To File');
  });

  it('should return missing required error for blank plan id', async () => {
    const options: ExportPlanOptions = {
      planId: '   ',
      dbPath,
      verbose: false
    };

    const result = await exportPlan(options);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Missing required parameter 'planId'");
  });

  it('should return error when plan is not found', async () => {
    const options: ExportPlanOptions = {
      planId: 'PLAN_missing',
      dbPath,
      verbose: false
    };

    const result = await exportPlan(options);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Plan PLAN_missing not found');
  });
});
