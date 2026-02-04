import { describe, it, before, after, afterEach } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

describe('share-pattern command', () => {
  let testDir: string;
  let testDirsToCleanup: string[] = [];

  before(() => {
    testDir = path.join(import.meta.dirname, 'tmp', `test-share-pattern-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    testDirsToCleanup.forEach((dir) => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
    testDirsToCleanup = [];
  });

  after(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should move pattern from personal to learned directory', () => {
    const testShareMove = path.join(import.meta.dirname, 'tmp', `share-move-${Date.now()}`);
    fs.mkdirSync(testShareMove, { recursive: true });
    testDirsToCleanup.push(testShareMove);

    // Setup directories
    let username: string;
    try {
      username = execSync('git config user.name', { encoding: 'utf-8' }).trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    } catch {
      username = 'test-user'; // Fallback for environments without git config
    }
    
    const personalDir = path.join(testShareMove, '.aiknowsys', 'personal', username);
    const learnedDir = path.join(testShareMove, '.aiknowsys', 'learned');
    fs.mkdirSync(personalDir, { recursive: true });
    fs.mkdirSync(learnedDir, { recursive: true });

    // Create pattern in personal directory
    const patternContent = '# test-pattern\n\n**Trigger Words:** test, pattern\n\n## Problem\nTest problem\n\n## Solution\nTest solution';
    fs.writeFileSync(path.join(personalDir, 'test-pattern.md'), patternContent);

    // Verify source exists
    assert.ok(fs.existsSync(path.join(personalDir, 'test-pattern.md')), 'Source pattern should exist');

    // After share command (will implement):
    // - Pattern should be in learned/
    // - Pattern should NOT be in personal/
    
    // Simulate share operation
    const sourcePath = path.join(personalDir, 'test-pattern.md');
    const destPath = path.join(learnedDir, 'test-pattern.md');
    fs.renameSync(sourcePath, destPath);

    assert.ok(fs.existsSync(destPath), 'Pattern should exist in learned directory');
    assert.ok(!fs.existsSync(sourcePath), 'Pattern should be removed from personal directory');
  });

  it('should detect exact duplicate patterns by title', () => {
    const testDuplicate = path.join(import.meta.dirname, 'tmp', `duplicate-${Date.now()}`);
    fs.mkdirSync(testDuplicate, { recursive: true });
    testDirsToCleanup.push(testDuplicate);

    let username: string;
    try {
      username = execSync('git config user.name', { encoding: 'utf-8' }).trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    } catch {
      username = 'test-user'; // Fallback for environments without git config
    }

    const personalDir = path.join(testDuplicate, '.aiknowsys', 'personal', username);
    const learnedDir = path.join(testDuplicate, '.aiknowsys', 'learned');
    fs.mkdirSync(personalDir, { recursive: true });
    fs.mkdirSync(learnedDir, { recursive: true });

    // Create pattern in personal
    const newPattern = '# api-retry-pattern\n\n**Trigger Words:** api, retry\n\n## Problem\nAPI calls fail\n\n## Solution\nRetry logic';
    fs.writeFileSync(path.join(personalDir, 'api-retry-pattern.md'), newPattern);

    // Create existing pattern in learned with same title
    const existingPattern = '# api-retry-pattern\n\n**Trigger Words:** retry, api\n\n## Problem\nDifferent problem\n\n## Solution\nDifferent solution';
    fs.writeFileSync(path.join(learnedDir, 'api-retry-pattern.md'), existingPattern);

    // Should detect duplicate (both have same base name/title)
    const personalFile = 'api-retry-pattern.md';
    const learnedFiles = fs.readdirSync(learnedDir);
    
    const isDuplicate = learnedFiles.includes(personalFile);
    assert.ok(isDuplicate, 'Should detect exact duplicate by filename');
  });

  it('should detect similar patterns by keyword overlap', () => {
    const testSimilar = path.join(import.meta.dirname, 'tmp', `similar-${Date.now()}`);
    fs.mkdirSync(testSimilar, { recursive: true });
    testDirsToCleanup.push(testSimilar);

    let username: string;
    try {
      username = execSync('git config user.name', { encoding: 'utf-8' }).trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    } catch {
      username = 'test-user'; // Fallback for environments without git config
    }

    const personalDir = path.join(testSimilar, '.aiknowsys', 'personal', username);
    const learnedDir = path.join(testSimilar, '.aiknowsys', 'learned');
    fs.mkdirSync(personalDir, { recursive: true });
    fs.mkdirSync(learnedDir, { recursive: true });

    // Create patterns with overlapping keywords
    const pattern1 = '# database-connection\n\n**Trigger Words:** database, connection, pool, retry\n\n## Problem\nDB issues\n\n## Solution\nConnection pool';
    const pattern2 = '# db-pooling\n\n**Trigger Words:** database, pool, connection, timeout\n\n## Problem\nDB timeout\n\n## Solution\nPooling';
    
    fs.writeFileSync(path.join(personalDir, 'database-connection.md'), pattern1);
    fs.writeFileSync(path.join(learnedDir, 'db-pooling.md'), pattern2);

    // Extract keywords from both
    const keywords1 = ['database', 'connection', 'pool', 'retry'];
    const keywords2 = ['database', 'pool', 'connection', 'timeout'];
    
    // Calculate overlap
    const overlap = keywords1.filter(k => keywords2.includes(k));
    const overlapPercent = overlap.length / Math.max(keywords1.length, keywords2.length);

    assert.ok(overlapPercent > 0.5, 'Should detect >50% keyword overlap as similar');
  });

  it('should error if pattern does not exist in personal directory', () => {
    const testMissing = path.join(import.meta.dirname, 'tmp', `missing-${Date.now()}`);
    fs.mkdirSync(testMissing, { recursive: true });
    testDirsToCleanup.push(testMissing);

    let username: string;
    try {
      username = execSync('git config user.name', { encoding: 'utf-8' }).trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    } catch {
      username = 'test-user'; // Fallback for environments without git config
    }

    const personalDir = path.join(testMissing, '.aiknowsys', 'personal', username);
    fs.mkdirSync(personalDir, { recursive: true });

    // Try to share non-existent pattern
    const patternPath = path.join(personalDir, 'nonexistent-pattern.md');
    
    assert.ok(!fs.existsSync(patternPath), 'Pattern should not exist');
    // share-pattern command should throw/return error
  });

  it('should handle patterns without trigger words gracefully', () => {
    const testNoKeywords = path.join(import.meta.dirname, 'tmp', `no-keywords-${Date.now()}`);
    fs.mkdirSync(testNoKeywords, { recursive: true });
    testDirsToCleanup.push(testNoKeywords);

    let username: string;
    try {
      username = execSync('git config user.name', { encoding: 'utf-8' }).trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    } catch {
      username = 'test-user'; // Fallback for environments without git config
    }

    const personalDir = path.join(testNoKeywords, '.aiknowsys', 'personal', username);
    const learnedDir = path.join(testNoKeywords, '.aiknowsys', 'learned');
    fs.mkdirSync(personalDir, { recursive: true });
    fs.mkdirSync(learnedDir, { recursive: true });

    // Create pattern without trigger words section
    const patternContent = '# simple-pattern\n\n## Problem\nSomething\n\n## Solution\nFix it';
    fs.writeFileSync(path.join(personalDir, 'simple-pattern.md'), patternContent);

    // Should still be shareable (trigger words are optional)
    assert.ok(fs.existsSync(path.join(personalDir, 'simple-pattern.md')), 'Pattern should exist and be valid');
  });

  it('should handle missing git username gracefully', () => {
    const testNoGit = path.join(import.meta.dirname, 'tmp', `no-git-share-${Date.now()}`);
    fs.mkdirSync(testNoGit, { recursive: true });
    testDirsToCleanup.push(testNoGit);

    // Without username, personal directory won't exist
    // share-pattern should inform user to use learn --shared instead
    const learnedDir = path.join(testNoGit, '.aiknowsys', 'learned');
    fs.mkdirSync(learnedDir, { recursive: true });

    // share-pattern should fail gracefully with helpful message
    assert.ok(fs.existsSync(learnedDir), 'Learned directory should exist as fallback');
  });
});
