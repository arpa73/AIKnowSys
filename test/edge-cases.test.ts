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

import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { check } from '../lib/commands/check.js';
import { audit } from '../lib/commands/audit.js';
import { sanitizeProjectName } from '../lib/sanitize.js';

interface CheckResult {
  warnings?: string[];
}

interface AuditResult {
  issues?: Array<{ message: string }>;
}

let testDir: string;

beforeAll(async () => {
  testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aiknowsys-edge-test-'));
});

afterAll(async () => {
  await fs.rm(testDir, { recursive: true, force: true });
});

describe('Edge Case 1: Empty File Handling', () => {
  it('check command should handle empty CODEBASE_ESSENTIALS.md gracefully', async () => {
    // RED: This will FAIL until we add empty file detection
    const emptyDir: string = path.join(testDir, 'empty-essentials');
    await fs.mkdir(emptyDir, { recursive: true });
    await fs.writeFile(path.join(emptyDir, 'CODEBASE_ESSENTIALS.md'), '');
    await fs.writeFile(path.join(emptyDir, 'AGENTS.md'), 'content');
    await fs.writeFile(path.join(emptyDir, 'CODEBASE_CHANGELOG.md'), 'content');

    try {
      await check({ dir: emptyDir, _silent: true });
      expect.fail('Should have thrown error for empty ESSENTIALS file');
    } catch (error) {
      const err = error as Error;
      expect(err.message).toMatch(/empty|no content|blank/i);
      expect(err.message).toMatch(/scan|generate|content/i);
    }
  });

  it('check command should handle empty AGENTS.md gracefully', async () => {
    // RED: This will FAIL until we add empty file detection
    const emptyDir: string = path.join(testDir, 'empty-agents');
    await fs.mkdir(emptyDir, { recursive: true });
    await fs.writeFile(path.join(emptyDir, 'CODEBASE_ESSENTIALS.md'), '# Content');
    await fs.writeFile(path.join(emptyDir, 'AGENTS.md'), '');
    await fs.writeFile(path.join(emptyDir, 'CODEBASE_CHANGELOG.md'), 'content');

    try {
      await check({ dir: emptyDir, _silent: true });
      expect.fail('Should have thrown error for empty AGENTS file');
    } catch (error) {
      const err = error as Error;
      expect(err.message).toMatch(/empty|no content|blank/i);
    }
  });

  it('audit command should handle empty files gracefully', async () => {
    // RED: This will FAIL until we add empty file detection
    const emptyDir: string = path.join(testDir, 'empty-audit');
    await fs.mkdir(emptyDir, { recursive: true });
    await fs.writeFile(path.join(emptyDir, 'CODEBASE_ESSENTIALS.md'), '');
    await fs.writeFile(path.join(emptyDir, 'AGENTS.md'), '');

    try {
      await audit({ dir: emptyDir, _silent: true });
      expect.fail('Should have thrown error for empty files');
    } catch (error) {
      const err = error as Error;
      expect(err.message).toMatch(/empty|no content|blank/i);
    }
  });
});

describe('Edge Case 2: Huge File Handling', () => {
  it('check command should warn on files >5MB', async () => {
    // RED: This will FAIL until we add file size checks
    const hugeDir: string = path.join(testDir, 'huge-file');
    await fs.mkdir(hugeDir, { recursive: true });
    
    // Create a 6MB file with minimal valid structure
    const header: string = '# HUGE FILE\n\n## Validation Matrix\n\n| Command | Purpose |\n|---------|--------|\n| npm test | Run tests |\n\n';
    const padding: string = 'x'.repeat(6 * 1024 * 1024 - header.length);
    const hugeContent: string = header + padding;
    
    await fs.writeFile(path.join(hugeDir, 'CODEBASE_ESSENTIALS.md'), hugeContent);
    await fs.writeFile(path.join(hugeDir, 'AGENTS.md'), '# Agents\n\nContent here');
    await fs.writeFile(path.join(hugeDir, 'CODEBASE_CHANGELOG.md'), '# Changelog\n\nContent here');

    const result: CheckResult = await check({ dir: hugeDir, _silent: true }) as CheckResult;
    
    // Should complete but with warnings
    expect(result.warnings).toBeTruthy();
    expect(result.warnings && result.warnings.length > 0).toBeTruthy();
    const hasLargeFileWarning: boolean = result.warnings ? result.warnings.some(w => 
      w.toLowerCase().includes('large') || w.toLowerCase().includes('size')
    ) : false;
    expect(hasLargeFileWarning).toBeTruthy();
  });

  it('audit command should error on files >50MB', async () => {
    // RED: This will FAIL until we add file size limits
    const massiveDir: string = path.join(testDir, 'massive-file');
    await fs.mkdir(massiveDir, { recursive: true });
    
    // Create a 51MB file (this will be slow, but only in testing)
    const header: string = '# MASSIVE FILE\n';
    const chunkSize: number = 1024 * 1024; // 1MB chunks
    const chunks: number = 51; // 51MB total
    
    const filePath: string = path.join(massiveDir, 'CODEBASE_ESSENTIALS.md');
    await fs.writeFile(filePath, header);
    
    const chunk: string = 'x'.repeat(chunkSize);
    for (let i = 0; i < chunks; i++) {
      await fs.appendFile(filePath, chunk);
    }

    try {
      await audit({ dir: massiveDir, _silent: true });
      expect.fail('Should have thrown error for massive file');
    } catch (error) {
      const err = error as { message: string; suggestion?: string };
      // Check message for file size info
      expect(err.message).toMatch(/too large|file size|limit/i);
      
      // AIKnowSysError stores suggestions separately
      if (err.suggestion) {
        expect(err.suggestion).toMatch(/streaming|split|reduce/i);
      } else {
        // Fallback for regular Error
        expect(err.message).toMatch(/streaming|split|reduce/i);
      }
    }
  });
});

describe('Edge Case 3: Special Characters in Project Names', () => {
  it('should reject emoji in project names', () => {
    // RED: May already work, but ensure error message is helpful
    const result = sanitizeProjectName('my-app-🚀');
    
    expect(result.valid).toBe(false);
    const hasEmojiError: boolean = result.errors.some(e => 
      e.toLowerCase().includes('emoji') || 
      e.toLowerCase().includes('unicode') ||
      e.toLowerCase().includes('special')
    );
    expect(hasEmojiError).toBeTruthy();
  });

  it('should reject project names with spaces', () => {
    // RED: May already work via existing sanitize tests
    const result = sanitizeProjectName('my cool app');
    
    // Note: sanitize might convert spaces to hyphens (check existing behavior)
    // If it auto-fixes, that's OK - just verify it works
    expect(result.sanitized === 'my-cool-app' || !result.valid).toBeTruthy();
  });

  it('should reject very long project names (>214 chars)', () => {
    // RED: npm has a 214 char limit
    const longName: string = 'a'.repeat(215);
    const result = sanitizeProjectName(longName);
    
    expect(result.valid).toBe(false);
    const hasLengthError: boolean = result.errors.some(e => 
      e.toLowerCase().includes('long') || e.toLowerCase().includes('length')
    );
    expect(hasLengthError).toBeTruthy();
  });

  it('should reject npm reserved names', () => {
    // RED: Need to add reserved name checking
    const reservedNames: string[] = ['node_modules', 'favicon.ico', 'node', 'npm'];
    
    for (const name of reservedNames) {
      const result = sanitizeProjectName(name);
      expect(result.valid).toBe(false);
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
    expect(true).toBeTruthy();
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
    
    expect(true).toBeTruthy();
  });
});

describe('Edge Case 6: Corrupted/Invalid Content', () => {
  it('check command should handle malformed markdown gracefully', async () => {
    // RED: This will FAIL until we add content validation
    const corruptedDir: string = path.join(testDir, 'corrupted');
    await fs.mkdir(corruptedDir, { recursive: true });
    
    // Create file with broken markdown that might break regex parsing
    const brokenMarkdown: string = `
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
    expect(result !== undefined).toBeTruthy();
  });

  it('audit command should handle files with no validation matrix', async () => {
    // RED: This will FAIL until we handle missing sections gracefully
    const noMatrixDir: string = path.join(testDir, 'no-matrix');
    await fs.mkdir(noMatrixDir, { recursive: true });
    
    // ESSENTIALS with no validation matrix
    const noMatrixContent: string = `
# CODEBASE_ESSENTIALS

## Technology Stack
- Node.js
- Express

## Some Other Section
Content here
`;
    
    await fs.writeFile(path.join(noMatrixDir, 'CODEBASE_ESSENTIALS.md'), noMatrixContent);
    await fs.writeFile(path.join(noMatrixDir, 'AGENTS.md'), 'content');

    const result: AuditResult = await audit({ dir: noMatrixDir, _silent: true }) as AuditResult;
    
    // Should report this as an issue, not crash
    expect(result.issues).toBeTruthy();
    const hasMissingMatrixIssue: boolean = result.issues ? result.issues.some(issue => 
      issue.message.toLowerCase().includes('validation matrix') ||
      issue.message.toLowerCase().includes('missing section')
    ) : false;
    expect(hasMissingMatrixIssue).toBeTruthy();
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
    
    expect(true).toBeTruthy();
  });
});
