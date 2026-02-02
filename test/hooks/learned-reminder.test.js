import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

describe('learned-reminder hook', () => {
  let testDir;
  let hookPath;

  beforeEach(() => {
    testDir = join(__dirname, 'tmp', `learned-reminder-${Date.now()}`);
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

      assert.ok(result !== undefined, 'Hook should execute successfully');
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

      assert.ok(result !== undefined, 'Hook should execute successfully');
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

    assert.ok(output.includes('Learned Patterns Reminder'), 'Should show reminder header');
    assert.ok(output.includes('unshared personal patterns'), 'Should mention unshared patterns');
    assert.ok(output.includes('share-pattern'), 'Should mention share command');
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

      assert.ok(output.includes('High-value patterns'), 'Should show high-value section');
      assert.ok(output.includes('popular-pattern'), 'Should list high-value pattern');
      assert.ok(output.includes('used 7 times'), 'Should show usage count');
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

      assert.ok(!output.includes('README'), 'Should not count README.md');
      assert.ok(output.includes('3 unshared'), 'Should count only actual patterns');
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

    assert.ok(output.includes('api-retry'), 'Should show pattern name without extension');
    assert.ok(output.includes('database-pool'), 'Should show pattern name without extension');
    assert.ok(!output.includes('.md'), 'Should not include .md extension');
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

    assert.ok(output.includes('8 unshared'), 'Should show total count');
    assert.ok(output.includes('(3 more)'), 'Should show "more" indicator');
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

    assert.ok(output.includes('unshared personal patterns'), 'Should find patterns for normalized username');
    });
  });
});
  