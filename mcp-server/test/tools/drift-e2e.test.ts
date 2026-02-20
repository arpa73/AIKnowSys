import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { SqliteStorage } from '../../../lib/context/sqlite-storage.js';
import { findPattern } from '../../src/tools/enhanced-query.js';
import { checkTddCompliance } from '../../src/tools/validation.js';

describe('MCP tool drift E2E', () => {
  let tempDir: string;
  const originalCwd = process.cwd();

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aiknowsys-mcp-drift-'));
    await fs.mkdir(path.join(tempDir, '.aiknowsys'), { recursive: true });
    process.chdir(tempDir);

    const storage = new SqliteStorage();
    await storage.init(tempDir);

    const now = new Date().toISOString();
    const projectId = 'drift_test_project';

    await storage.insertProject({
      id: projectId,
      name: 'drift-test',
      path: tempDir,
      created_at: now,
      updated_at: now,
    });

    await storage.insertPlan({
      id: 'learned_sqlite_constraint_guard',
      project_id: projectId,
      title: 'SQLite constraint guard',
      status: 'COMPLETE',
      author: 'drift-test',
      created: now,
      updated: now,
      content: 'Pattern for sqlite constraint handling',
      topics: ['sqlite', 'constraint', 'tooling'],
      type: 'project_specific',
    });

    await storage.close();
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('find_pattern returns filtered DB results without relying on unsupported CLI flags', async () => {
    const result = await findPattern({
      keywords: ['sqlite', 'constraint'],
      category: 'project_specific',
    });

    expect(result.isError).not.toBe(true);
    const data = JSON.parse(result.content[0].text) as {
      count: number;
      patterns: Array<{ id: string; category: string }>;
    };

    expect(data.count).toBeGreaterThan(0);
    expect(data.patterns.some((pattern) => pattern.id === 'learned_sqlite_constraint_guard')).toBe(true);
    expect(data.patterns.every((pattern) => pattern.category === 'project_specific')).toBe(true);
  });

  it('check_tdd_compliance enforces lib→test pairing semantics', async () => {
    const violation = await checkTddCompliance({
      changedFiles: ['lib/core/update-plan.ts'],
    });

    expect(violation.isError).not.toBe(true);
    expect(violation.content[0].text).toContain('TDD violation');

    const compliant = await checkTddCompliance({
      changedFiles: ['lib/core/update-plan.ts', 'test/core/update-plan.test.ts'],
    });

    expect(compliant.isError).not.toBe(true);
    expect(compliant.content[0].text).toContain('TDD compliant');
  });
});
