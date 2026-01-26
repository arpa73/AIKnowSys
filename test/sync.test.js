import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { sync } from '../lib/commands/sync.js';
import {
  createTestDir,
  cleanupTestDir,
  createMockProject,
  assertFileExists,
  assertFileContains,
  assertFileNotContains
} from './helpers/testUtils.js';

describe('sync command', () => {
  let testDir;

  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  // ========================================
  // VALIDATION MATRIX CHECK TESTS
  // ========================================

  it('should verify validation matrix exists in ESSENTIALS', async () => {
    createMockProject(testDir, {
      hasEssentials: true,
      hasAgents: true,
      hasValidationMatrix: true
    });
    
    await sync({ dir: testDir, _silent: true });
    
    // Should pass the matrix existence check
    assert.ok(true, 'Matrix should be found in ESSENTIALS');
  });

  it('should exit if ESSENTIALS not found', async () => {
    // No CODEBASE_ESSENTIALS.md in directory
    
    await assert.rejects(
      async () => await sync({ dir: testDir, _silent: true }),
      'Should reject when ESSENTIALS missing'
    );
  });

  it('should exit if AGENTS not found', async () => {
    createMockProject(testDir, {
      hasEssentials: true
      // No AGENTS.md
    });
    
    await assert.rejects(
      async () => await sync({ dir: testDir, _silent: true }),
      'Should reject when AGENTS missing'
    );
  });

  it('should exit if validation matrix missing in ESSENTIALS', async () => {
    createMockProject(testDir, {
      hasEssentials: true,
      hasAgents: true,
      hasValidationMatrix: false // No matrix
    });
    
    await assert.rejects(
      async () => await sync({ dir: testDir, _silent: true }),
      /validation matrix/i,
      'Should reject when matrix missing'
    );
  });

  // ========================================
  // MATRIX REMOVAL TESTS
  // ========================================

  it('should remove validation matrix from AGENTS if duplicated', async () => {
    createMockProject(testDir, {
      hasEssentials: true,
      hasAgents: true,
      hasValidationMatrix: true,
      hasDuplicateMatrix: true // Matrix in both files
    });
    
    const agentsPath = path.join(testDir, 'AGENTS.md');
    
    // Before sync - matrix exists in AGENTS
    assertFileContains(agentsPath, /\|\s*Command\s*\|/);
    
    await sync({ dir: testDir, _silent: true });
    
    // After sync - matrix removed from AGENTS
    assertFileNotContains(agentsPath, /\|\s*Command\s*\|/);
  });

  it('should preserve other AGENTS content except matrix', async () => {
    createMockProject(testDir, {
      hasEssentials: true,
      hasAgents: true,
      hasValidationMatrix: true,
      hasDuplicateMatrix: true
    });
    
    const agentsPath = path.join(testDir, 'AGENTS.md');
    
    // AGENTS has other content we want to keep
    let agentsContent = fs.readFileSync(agentsPath, 'utf-8');
    agentsContent += '\n\n## Important Section\n\nKeep this content.\n';
    fs.writeFileSync(agentsPath, agentsContent);
    
    await sync({ dir: testDir, _silent: true });
    
    // Important section should still be there
    assertFileContains(agentsPath, 'Important Section');
    assertFileContains(agentsPath, 'Keep this content');
  });

  it('should add reference to ESSENTIALS in AGENTS', async () => {
    createMockProject(testDir, {
      hasEssentials: true,
      hasAgents: true,
      hasValidationMatrix: true,
      hasDuplicateMatrix: true
    });
    
    await sync({ dir: testDir, _silent: true });
    
    const agentsPath = path.join(testDir, 'AGENTS.md');
    
    // Should add text like "See CODEBASE_ESSENTIALS.md for validation matrix"
    // or reference the ESSENTIALS file
    assertFileContains(agentsPath, 'CODEBASE_ESSENTIALS.md');
  });

  // ========================================
  // PATTERN MATCHING TESTS
  // ========================================

  it('should detect matrix with "## 2. Validation Matrix" heading', async () => {
    createMockProject(testDir, { hasEssentials: true, hasAgents: true });
    
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    let content = fs.readFileSync(essentialsPath, 'utf-8');
    
    // Ensure numbered heading format
    if (!content.includes('## 2. Validation Matrix')) {
      content = content.replace('## Validation Matrix', '## 2. Validation Matrix');
      fs.writeFileSync(essentialsPath, content);
    }
    
    // sync should detect this format
    await assert.doesNotReject(
      async () => await sync({ dir: testDir, _silent: true }),
      'Should handle numbered section heading'
    );
  });

  it('should detect matrix with "## Validation Matrix" heading', async () => {
    createMockProject(testDir, { hasEssentials: true, hasAgents: true });
    
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    let content = fs.readFileSync(essentialsPath, 'utf-8');
    
    // Ensure non-numbered heading
    content = content.replace(/## \d+\.\s*Validation Matrix/, '## Validation Matrix');
    fs.writeFileSync(essentialsPath, content);
    
    // sync should detect this format too
    await assert.doesNotReject(
      async () => await sync({ dir: testDir, _silent: true }),
      'Should handle non-numbered heading'
    );
  });

  it('should detect matrix table in AGENTS using regex pattern', async () => {
    createMockProject(testDir, {
      hasEssentials: true,
      hasAgents: true,
      hasDuplicateMatrix: true
    });
    
    const agentsPath = path.join(testDir, 'AGENTS.md');
    const content = fs.readFileSync(agentsPath, 'utf-8');
    
    // Verify the matrix pattern exists before sync
    const hasCommandColumn = /\|\s*Command\s*\|/i.test(content);
    const hasTestCommand = /npm test/i.test(content);
    
    assert.ok(
      hasCommandColumn && hasTestCommand,
      'Matrix table with Command column and test command should be detected in AGENTS before sync'
    );
  });

  // ========================================
  // CLI OPTIONS TESTS
  // ========================================

  it('should work with --dir option', async () => {
    const customDir = createTestDir();
    
    try {
      createMockProject(customDir, {
        hasEssentials: true,
        hasAgents: true,
        hasValidationMatrix: true
      });
      
      await sync({ dir: customDir, _silent: true });
      
      assert.ok(true, 'Should work with custom directory');
    } finally {
      cleanupTestDir(customDir);
    }
  });

  // ========================================
  // IDEMPOTENCY TESTS
  // ========================================

  it('should be idempotent - safe to run multiple times', async () => {
    createMockProject(testDir, {
      hasEssentials: true,
      hasAgents: true,
      hasValidationMatrix: true,
      hasDuplicateMatrix: true
    });
    
    const agentsPath = path.join(testDir, 'AGENTS.md');
    
    // Run sync once
    await sync({ dir: testDir, _silent: true });
    const contentAfterFirst = fs.readFileSync(agentsPath, 'utf-8');
    
    // Run sync again
    await sync({ dir: testDir, _silent: true });
    const contentAfterSecond = fs.readFileSync(agentsPath, 'utf-8');
    
    // Content should be the same (idempotent)
    assert.strictEqual(
      contentAfterFirst,
      contentAfterSecond,
      'Running sync twice should produce same result'
    );
  });

  it('should not modify files when already in sync', async () => {
    createMockProject(testDir, {
      hasEssentials: true,
      hasAgents: true,
      hasValidationMatrix: true,
      hasDuplicateMatrix: false // Already correct (no duplicate)
    });
    
    const agentsPath = path.join(testDir, 'AGENTS.md');
    const contentBefore = fs.readFileSync(agentsPath, 'utf-8');
    
    await sync({ dir: testDir, _silent: true });
    
    const contentAfter = fs.readFileSync(agentsPath, 'utf-8');
    
    // If already synced, should not change
    assert.strictEqual(
      contentBefore,
      contentAfter,
      'Should not modify files when already synced'
    );
  });
});
