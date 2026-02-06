import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const projectRoot = join(import.meta.dirname, '../..');

describe('learned-reminder hook', () => {
  let testDir: string;
  let hookPath: string;

  beforeEach(() => {
    testDir = join(import.meta.dirname, 'tmp', `learned-reminder-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    hookPath = join(projectRoot, 'templates', 'hooks', 'learned-reminder.cjs');
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Non-blocking behavior', () => {
    it('should exit 0 when no personal directory', () => {
      // Hook should not block commits when no personal patterns exist
      const result = execSync(`node "${hookPath}"`, {
        cwd: testDir,
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      expect(result !== undefined).toBeTruthy();
    });

    it('should exit 0 when personal directory is empty', () => {
      // Create empty personal directory
      const aiknowsysDir = join(testDir, '.aiknowsys', 'personal', 'test-user');
      mkdirSync(aiknowsysDir, { recursive: true });

      const result = execSync(`node "${hookPath}"`, {
        cwd: testDir,
        encoding: 'utf-8',
        stdio: 'pipe',
        env: { ...process.env, GIT_AUTHOR_NAME: 'Test User' }
      });

      expect(result !== undefined).toBeTruthy();
    });
  });

  describe('Pattern detection', () => {
    it('should show reminder when 3+ unshared patterns exist', () => {
      // Create personal directory with 3 patterns
      const aiknowsysDir = join(testDir, '.aiknowsys', 'personal', 'test-user');
    mkdirSync(aiknowsysDir, { recursive: true });

    writeFileSync(join(aiknowsysDir, 'pattern1.md'), '# Pattern 1\n\nContent');
    writeFileSync(join(aiknowsysDir, 'pattern2.md'), '# Pattern 2\n\nContent');
    writeFileSync(join(aiknowsysDir, 'pattern3.md'), '# Pattern 3\n\nContent');

    const output = execSync(`node "${hookPath}"`, {
      cwd: testDir,
      encoding: 'utf-8',
      env: { ...process.env, GIT_AUTHOR_NAME: 'Test User' }
    });

    expect(output.includes('Learned Patterns Reminder')).toBeTruthy();
    expect(output.includes('unshared personal patterns')).toBeTruthy();
    expect(output.includes('share-pattern')).toBeTruthy();
    });

    it('should detect high-value patterns (5+ uses)', () => {
      const aiknowsysDir = join(testDir, '.aiknowsys', 'personal', 'test-user');
      mkdirSync(aiknowsysDir, { recursive: true });

      // Pattern with usage tracking
      writeFileSync(join(aiknowsysDir, 'popular-pattern.md'), 
        '# Popular Pattern\n\n**Used 7 times**\n\nContent');

      const output = execSync(`node "${hookPath}"`, {
        cwd: testDir,
        encoding: 'utf-8',
        env: { ...process.env, GIT_AUTHOR_NAME: 'Test User' }
      });

      expect(output.includes('High-value patterns')).toBeTruthy();
      expect(output.includes('popular-pattern')).toBeTruthy();
      expect(output.includes('used 7 times')).toBeTruthy();
    });

    it('should skip README.md files', () => {
      const aiknowsysDir = join(testDir, '.aiknowsys', 'personal', 'test-user');
      mkdirSync(aiknowsysDir, { recursive: true });

      writeFileSync(join(aiknowsysDir, 'README.md'), '# README\n\nDocs');
      writeFileSync(join(aiknowsysDir, 'pattern1.md'), '# Pattern 1\n\nContent');
      writeFileSync(join(aiknowsysDir, 'pattern2.md'), '# Pattern 2\n\nContent');
      writeFileSync(join(aiknowsysDir, 'pattern3.md'), '# Pattern 3\n\nContent');

      const output = execSync(`node "${hookPath}"`, {
        cwd: testDir,
        encoding: 'utf-8',
        env: { ...process.env, GIT_AUTHOR_NAME: 'Test User' }
      });

      expect(!output.includes('README')).toBeTruthy();
      expect(output.includes('3 unshared')).toBeTruthy();
    });
  });

  describe('Output formatting', () => {
    it('should list pattern names without .md extension', () => {
    const aiknowsysDir = join(testDir, '.aiknowsys', 'personal', 'test-user');
    mkdirSync(aiknowsysDir, { recursive: true });

    writeFileSync(join(aiknowsysDir, 'api-retry.md'), '# API Retry\n\nContent');
    writeFileSync(join(aiknowsysDir, 'database-pool.md'), '# DB Pool\n\nContent');
    writeFileSync(join(aiknowsysDir, 'cache-warming.md'), '# Cache\n\nContent');

    const output = execSync(`node "${hookPath}"`, {
      cwd: testDir,
      encoding: 'utf-8',
      env: { ...process.env, GIT_AUTHOR_NAME: 'Test User' }
    });

    expect(output.includes('api-retry')).toBeTruthy();
    expect(output.includes('database-pool')).toBeTruthy();
    expect(!output.includes('.md')).toBeTruthy();
    });

    it('should limit displayed patterns to 5', () => {
    const aiknowsysDir = join(testDir, '.aiknowsys', 'personal', 'test-user');
    mkdirSync(aiknowsysDir, { recursive: true });

    // Create 8 patterns
    for (let i = 1; i <= 8; i++) {
      writeFileSync(join(aiknowsysDir, `pattern${i}.md`), `# Pattern ${i}\n\nContent`);
    }

    const output = execSync(`node "${hookPath}"`, {
      cwd: testDir,
      encoding: 'utf-8',
      env: { ...process.env, GIT_AUTHOR_NAME: 'Test User' }
    });

    expect(output.includes('8 unshared')).toBeTruthy();
    expect(output.includes('(3 more)')).toBeTruthy();
    });
  });

  describe('Username handling', () => {
    it('should normalize username from git config', () => {
    const aiknowsysDir = join(testDir, '.aiknowsys', 'personal', 'john-doe');
    mkdirSync(aiknowsysDir, { recursive: true });

    writeFileSync(join(aiknowsysDir, 'pattern1.md'), '# Pattern 1\n\nContent');
    writeFileSync(join(aiknowsysDir, 'pattern2.md'), '# Pattern 2\n\nContent');
    writeFileSync(join(aiknowsysDir, 'pattern3.md'), '# Pattern 3\n\nContent');

    const output = execSync(`node "${hookPath}"`, {
      cwd: testDir,
      encoding: 'utf-8',
      env: { ...process.env, GIT_AUTHOR_NAME: 'John Doe' }
    });

    expect(output.includes('unshared personal patterns')).toBeTruthy();
    });
  });
});
