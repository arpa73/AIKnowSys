import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { syncSkills } from '../../lib/commands/sync-skills.js';
import { SqliteStorage } from '../../lib/context/sqlite-storage.js';

describe('sync-skills command', () => {
  let tmpDir: string;
  let dbPath: string;

  beforeEach(async () => {
    tmpDir = path.join(process.cwd(), `test-tmp-sync-skills-${Date.now()}`);
    dbPath = path.join(tmpDir, '.aiknowsys', 'knowledge.db');

    await fs.mkdir(path.join(tmpDir, '.github', 'skills', 'feature-implementation'), { recursive: true });
    await fs.mkdir(path.join(tmpDir, '.github', 'skills', 'tdd-workflow'), { recursive: true });

    await fs.writeFile(
      path.join(tmpDir, '.github', 'skills', 'feature-implementation', 'SKILL.md'),
      '# Feature Implementation\n\nSkill content A',
      'utf-8'
    );

    await fs.writeFile(
      path.join(tmpDir, '.github', 'skills', 'tdd-workflow', 'SKILL.md'),
      '# TDD Workflow\n\nSkill content B',
      'utf-8'
    );
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('should sync skill markdown files into sqlite table', async () => {
    const result = await syncSkills({ dir: tmpDir, dbPath });

    expect(result.found).toBe(2);
    expect(result.synced).toBe(2);

    const storage = new SqliteStorage();
    await storage.init(dbPath);
    try {
      const featureSkill = await storage.getSkillByName('feature-implementation');
      const tddSkill = await storage.getSkillByName('tdd-workflow');

      expect(featureSkill?.content).toContain('Skill content A');
      expect(tddSkill?.content).toContain('Skill content B');
    } finally {
      await storage.close();
    }
  });

  it('should support dry-run mode', async () => {
    const result = await syncSkills({ dir: tmpDir, dbPath, dryRun: true });

    expect(result.found).toBe(2);
    expect(result.synced).toBe(0);
  });
});
