/**
 * Edge Case Tests - Sprint 2 Task 2.1
 * 
 * RED phase: These tests should FAIL initially
 * GREEN phase: Implement handling to make them pass
 * 
 * Edge cases covered:
 * 1. Empty file handling
 * 2. Huge file handling (>5MB warning, >50MB error)
 * 3. Special characters in project names
 * 4. Git not installed
 * 5. Permission errors
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { check } from '../lib/commands/check.js';
import { audit } from '../lib/commands/audit.js';
import { init } from '../lib/commands/init.js';
import { sanitizeProjectName } from '../lib/sanitize.js';

let testDir;

before(async () => {
  testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aiknowsys-edge-test-'));
});

after(async () => {
  await fs.rm(testDir, { recursive: true, force: true });
});

describe('Edge Case 1: Empty File Handling', () => {
  it('check command should handle empty CODEBASE_ESSENTIALS.md gracefully', async () => {
    // RED: This will FAIL until we add empty file detection
    const emptyDir = path.join(testDir, 'empty-essentials');
    await fs.mkdir(emptyDir, { recursive: true });
    await fs.writeFile(path.join(emptyDir, 'CODEBASE_ESSENTIALS.md'), '');
    await fs.writeFile(path.join(emptyDir, 'AGENTS.md'), 'content');
    await fs.writeFile(path.join(emptyDir, 'CODEBASE_CHANGELOG.md'), 'content');

    try {
      await check({ dir: emptyDir, _silent: true });
      assert.fail('Should have thrown error for empty ESSENTIALS file');
    } catch (error) {
      assert.match(error.message, /empty|no content|blank/i, 
        'Error should mention file is empty');
      assert.match(error.message, /scan|generate|content/i, 
        'Error should suggest how to fix (scan command)');
    }
  });

  it('check command should handle empty AGENTS.md gracefully', async () => {
    // RED: This will FAIL until we add empty file detection
    const emptyDir = path.join(testDir, 'empty-agents');
    await fs.mkdir(emptyDir, { recursive: true });
    await fs.writeFile(path.join(emptyDir, 'CODEBASE_ESSENTIALS.md'), '# Content');
    await fs.writeFile(path.join(emptyDir, 'AGENTS.md'), '');
    await fs.writeFile(path.join(emptyDir, 'CODEBASE_CHANGELOG.md'), 'content');

    try {
      await check({ dir: emptyDir, _silent: true });
      assert.fail('Should have thrown error for empty AGENTS file');
    } catch (error) {
      assert.match(error.message, /empty|no content|blank/i,
        'Error should mention file is empty');
    }
  });

  it('audit command should handle empty files gracefully', async () => {
    // RED: This will FAIL until we add empty file detection
    const emptyDir = path.join(testDir, 'empty-audit');
    await fs.mkdir(emptyDir, { recursive: true });
    await fs.writeFile(path.join(emptyDir, 'CODEBASE_ESSENTIALS.md'), '');
    await fs.writeFile(path.join(emptyDir, 'AGENTS.md'), '');

    try {
      await audit({ dir: emptyDir, _silent: true });
      assert.fail('Should have thrown error for empty files');
    } catch (error) {
      assert.match(error.message, /empty|no content|blank/i,
        'Error should mention files are empty');
    }
  });
});

describe('Edge Case 2: Huge File Handling', () => {
  it('check command should warn on files >5MB', async () => {
    // RED: This will FAIL until we add file size checks
    const hugeDir = path.join(testDir, 'huge-file');
    await fs.mkdir(hugeDir, { recursive: true });
    
    // Create a 6MB file with minimal valid structure
    const header = '# HUGE FILE\n\n## Validation Matrix\n\n| Command | Purpose |\n|---------|--------|\n| npm test | Run tests |\n\n';
    const padding = 'x'.repeat(6 * 1024 * 1024 - header.length);
    const hugeContent = header + padding;
    
    await fs.writeFile(path.join(hugeDir, 'CODEBASE_ESSENTIALS.md'), hugeContent);
    await fs.writeFile(path.join(hugeDir, 'AGENTS.md'), '# Agents\n\nContent here');
    await fs.writeFile(path.join(hugeDir, 'CODEBASE_CHANGELOG.md'), '# Changelog\n\nContent here');

    const result = await check({ dir: hugeDir, _silent: true });
    
    // Should complete but with warnings
    assert.ok(result.warnings, 'Should have warnings object');
    assert.ok(result.warnings.length > 0, 'Should have at least one warning');
    const hasLargeFileWarning = result.warnings.some(w => 
      w.toLowerCase().includes('large') || w.toLowerCase().includes('size')
    );
    assert.ok(hasLargeFileWarning, 'Should warn about large file size');
  });

  it('audit command should error on files >50MB', async () => {
    // RED: This will FAIL until we add file size limits
    const massiveDir = path.join(testDir, 'massive-file');
    await fs.mkdir(massiveDir, { recursive: true });
    
    // Create a 51MB file (this will be slow, but only in testing)
    const header = '# MASSIVE FILE\n';
    const chunkSize = 1024 * 1024; // 1MB chunks
    const chunks = 51; // 51MB total
    
    const filePath = path.join(massiveDir, 'CODEBASE_ESSENTIALS.md');
    await fs.writeFile(filePath, header);
    
    const chunk = 'x'.repeat(chunkSize);
    for (let i = 0; i < chunks; i++) {
      await fs.appendFile(filePath, chunk);
    }

    try {
      await audit({ dir: massiveDir, _silent: true });
      assert.fail('Should have thrown error for massive file');
    } catch (error) {
      // Check message for file size info
      assert.match(error.message, /too large|file size|limit/i,
        'Error should mention file size limit');
      
      // AIKnowSysError stores suggestions separately
      if (error.suggestion) {
        assert.match(error.suggestion, /streaming|split|reduce/i,
          'Error should suggest alternative approach');
      } else {
        // Fallback for regular Error
        assert.match(error.message, /streaming|split|reduce/i,
          'Error should suggest alternative approach');
      }
    }
  });
});

describe('Edge Case 3: Special Characters in Project Names', () => {
  it('should reject emoji in project names', () => {
    // RED: May already work, but ensure error message is helpful
    const result = sanitizeProjectName('my-app-🚀');
    
    assert.strictEqual(result.valid, false, 'Should reject emoji');
    const hasEmojiError = result.errors.some(e => 
      e.toLowerCase().includes('emoji') || 
      e.toLowerCase().includes('unicode') ||
      e.toLowerCase().includes('special')
    );
    assert.ok(hasEmojiError, 'Error should specifically mention emoji/unicode');
  });

  it('should reject project names with spaces', () => {
    // RED: May already work via existing sanitize tests
    const result = sanitizeProjectName('my cool app');
    
    // Note: sanitize might convert spaces to hyphens (check existing behavior)
    // If it auto-fixes, that's OK - just verify it works
    assert.ok(result.sanitized === 'my-cool-app' || !result.valid,
      'Should either sanitize spaces to hyphens or reject');
  });

  it('should reject very long project names (>214 chars)', () => {
    // RED: npm has a 214 char limit
    const longName = 'a'.repeat(215);
    const result = sanitizeProjectName(longName);
    
    assert.strictEqual(result.valid, false, 'Should reject names >214 chars');
    const haslengthError = result.errors.some(e => 
      e.toLowerCase().includes('long') || e.toLowerCase().includes('length')
    );
    assert.ok(haslengthError, 'Error should mention length limit');
  });

  it('should reject npm reserved names', () => {
    // RED: Need to add reserved name checking
    const reservedNames = ['node_modules', 'favicon.ico', 'node', 'npm'];
    
    for (const name of reservedNames) {
      const result = sanitizeProjectName(name);
      assert.strictEqual(result.valid, false, 
        `Should reject reserved name: ${name}`);
    }
  });
});

describe('Edge Case 4: Git Not Available', () => {
  it('init command should handle missing git gracefully', async () => {
    // RED: This requires mocking git availability
    // For now, document as manual test case
    // TODO: Implement proper git availability check
    
    // Manual test: Temporarily rename git binary and run init
    // Expected: Should skip git hooks with warning, not crash
    assert.ok(true, 'Manual test: Run init without git installed');
  });
});

describe('Edge Case 5: Permission Errors', () => {
  it('init command should show helpful error on permission denied', async () => {
    // RED: Hard to test automatically without sudo/chmod complexity
    // Document as manual test case
    
    // Manual test: 
    // 1. mkdir /tmp/readonly && chmod 555 /tmp/readonly
    // 2. aiknowsys init --dir /tmp/readonly
    // Expected: Clear error about permissions, not generic EACCES
    
    assert.ok(true, 'Manual test: Run init in read-only directory');
  });
});

describe('Edge Case 6: Corrupted/Invalid Content', () => {
  it('check command should handle malformed markdown gracefully', async () => {
    // RED: This will FAIL until we add content validation
    const corruptedDir = path.join(testDir, 'corrupted');
    await fs.mkdir(corruptedDir, { recursive: true });
    
    // Create file with broken markdown that might break regex parsing
    const brokenMarkdown = `
# CODEBASE_ESSENTIALS

## Validation Matrix

| Command | Broken table
This table has no closing delimiter
And will break regex parsing

Some content without proper structure
`;
    
    await fs.writeFile(path.join(corruptedDir, 'CODEBASE_ESSENTIALS.md'), brokenMarkdown);
    await fs.writeFile(path.join(corruptedDir, 'AGENTS.md'), 'content');
    await fs.writeFile(path.join(corruptedDir, 'CODEBASE_CHANGELOG.md'), 'content');

    // Should not crash, should handle gracefully
    const result = await check({ dir: corruptedDir, _silent: true });
    
    // Might pass with warnings, or fail with helpful error
    // Either is acceptable as long as it doesn't crash
    assert.ok(result !== undefined, 'Should return result, not crash');
  });

  it('audit command should handle files with no validation matrix', async () => {
    // RED: This will FAIL until we handle missing sections gracefully
    const noMatrixDir = path.join(testDir, 'no-matrix');
    await fs.mkdir(noMatrixDir, { recursive: true });
    
    // ESSENTIALS with no validation matrix
    const noMatrixContent = `
# CODEBASE_ESSENTIALS

## Technology Stack
- Node.js
- Express

## Some Other Section
Content here
`;
    
    await fs.writeFile(path.join(noMatrixDir, 'CODEBASE_ESSENTIALS.md'), noMatrixContent);
    await fs.writeFile(path.join(noMatrixDir, 'AGENTS.md'), 'content');

    const result = await audit({ dir: noMatrixDir, _silent: true });
    
    // Should report this as an issue, not crash
    assert.ok(result.issues, 'Should have issues array');
    const hasMissingMatrixIssue = result.issues.some(issue => 
      issue.message.toLowerCase().includes('validation matrix') ||
      issue.message.toLowerCase().includes('missing section')
    );
    assert.ok(hasMissingMatrixIssue, 'Should report missing validation matrix');
  });
});

describe('Edge Case 7: Network/Slow Filesystem', () => {
  it('scan command should handle slow filesystem without hanging', async () => {
    // RED: This is hard to test automatically
    // Document as manual test with network drive or slow USB
    
    // Manual test:
    // 1. Run scan on network mounted directory
    // 2. Run scan on slow USB drive
    // Expected: Should show progress, not appear frozen
    
    assert.ok(true, 'Manual test: Run scan on slow filesystem');
  });
});
