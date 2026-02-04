import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import { installAgents } from '../lib/commands/install-agents.js';
import {
  createTestDir,
  cleanupTestDir,
  assertFileExists,
  assertFileNotExists,
  assertFileContains,
  assertFileNotContains,
  assertPlaceholderReplaced
} from './helpers/testUtils.js';

describe('install-agents command', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  // ========================================
  // DIRECTORY CREATION TESTS
  // ========================================

  it('should create .github/agents directory', async () => {
    const agentsDir = path.join(testDir, '.github', 'agents');
    
    assertFileNotExists(agentsDir);
    
    await installAgents({ dir: testDir, _silent: true });
    
    assertFileExists(agentsDir);
  });

  it('should not fail if .github/agents directory already exists', async () => {
    const agentsDir = path.join(testDir, '.github', 'agents');
    fs.mkdirSync(agentsDir, { recursive: true });
    
    assertFileExists(agentsDir);
    
    // Should not throw
    await assert.doesNotReject(
      async () => await installAgents({ dir: testDir, _silent: true }),
      'Should not fail when directory already exists'
    );
  });

  // ========================================
  // FILE COPYING TESTS
  // ========================================

  it('should copy developer.agent.md template', async () => {
    await installAgents({ dir: testDir, _silent: true });
    
    const developerPath = path.join(testDir, '.github', 'agents', 'developer.agent.md');
    assertFileExists(developerPath);
  });

  it('should copy architect.agent.md template', async () => {
    await installAgents({ dir: testDir, _silent: true });
    
    const architectPath = path.join(testDir, '.github', 'agents', 'architect.agent.md');
    assertFileExists(architectPath);
  });

  it('should copy USAGE.txt file', async () => {
    await installAgents({ dir: testDir, _silent: true });
    
    const usagePath = path.join(testDir, '.github', 'agents', 'USAGE.txt');
    assertFileExists(usagePath);
  });

  // Note: setup-agents.sh is not copied by install-agents command
  // It's used for legacy setup only

  // ========================================
  // PLACEHOLDER REPLACEMENT TESTS
  // ========================================

  it('should replace {{ESSENTIALS_FILE}} with default CODEBASE_ESSENTIALS.md', async () => {
    await installAgents({ dir: testDir, _silent: true });
    
    const developerPath = path.join(testDir, '.github', 'agents', 'developer.agent.md');
    assertFileExists(developerPath);
    assertPlaceholderReplaced(developerPath, 'ESSENTIALS_FILE');
    assertFileContains(developerPath, 'CODEBASE_ESSENTIALS.md');
  });

  it('should replace {{ESSENTIALS_FILE}} with custom filename when provided', async () => {
    await installAgents({ 
      dir: testDir, 
      essentials: 'CUSTOM_ESSENTIALS.md',
      _silent: true 
    });
    
    const developerPath = path.join(testDir, '.github', 'agents', 'developer.agent.md');
    assertFileContains(developerPath, 'CUSTOM_ESSENTIALS.md');
    assertFileNotContains(developerPath, 'CODEBASE_ESSENTIALS.md');
  });

  it('should not leave any {{PLACEHOLDERS}} in developer.agent.md', async () => {
    await installAgents({ dir: testDir, _silent: true });
    
    const developerPath = path.join(testDir, '.github', 'agents', 'developer.agent.md');
    const content = fs.readFileSync(developerPath, 'utf-8');
    
    const placeholders = content.match(/{{[A-Z_]+}}/g);
    assert.strictEqual(
      placeholders, 
      null, 
      `Found unreplaced placeholders: ${placeholders?.join(', ')}`
    );
  });

  it('should not leave any {{PLACEHOLDERS}} in architect.agent.md', async () => {
    await installAgents({ dir: testDir, _silent: true });
    
    const architectPath = path.join(testDir, '.github', 'agents', 'architect.agent.md');
    const content = fs.readFileSync(architectPath, 'utf-8');
    
    const placeholders = content.match(/{{[A-Z_]+}}/g);
    assert.strictEqual(
      placeholders,
      null,
      `Found unreplaced placeholders: ${placeholders?.join(', ')}`
    );
  });

  // ========================================
  // SILENT MODE TESTS
  // ========================================

  it('should not show console output in silent mode', async () => {
    // Capture console.log calls
    const logs: any[] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => logs.push(args);
    
    try {
      await installAgents({ dir: testDir, _silent: true });
      
      // In silent mode, should have minimal/no console output
      assert.ok(
        logs.length === 0 || logs.every(log => !log.join('').includes('Installing')),
        'Should not show "Installing" messages in silent mode'
      );
    } finally {
      console.log = originalLog;
    }
  });

  it('should show console output in normal mode', async () => {
    // Capture console.log calls
    const logs: any[] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => logs.push(args);
    
    try {
      await installAgents({ dir: testDir, _silent: false, yes: true });
      
      // In normal mode, should show installation messages
      const hasOutput = logs.some(log => 
        log.join('').includes('Installing') || log.join('').includes('Custom Agents')
      );
      assert.ok(hasOutput, 'Should show console output in normal mode');
    } finally {
      console.log = originalLog;
    }
  });

  // ========================================
  // CLI OPTIONS TESTS
  // ========================================

  it('should work with --dir option to target different directory', async () => {
    const customDir = createTestDir();
    
    try {
      await installAgents({ dir: customDir, _silent: true });
      
      const agentsDir = path.join(customDir, '.github', 'agents');
      assertFileExists(agentsDir);
      assertFileExists(path.join(agentsDir, 'developer.agent.md'));
    } finally {
      cleanupTestDir(customDir);
    }
  });

  it('should work with --essentials option for custom essentials filename', async () => {
    await installAgents({ 
      dir: testDir,
      essentials: 'MY_ESSENTIALS.md',
      _silent: true
    });
    
    const developerPath = path.join(testDir, '.github', 'agents', 'developer.agent.md');
    assertFileContains(developerPath, 'MY_ESSENTIALS.md');
  });

  // ========================================
  // FILE CONTENT VALIDATION TESTS
  // ========================================

  it('should preserve template structure in developer.agent.md', async () => {
    await installAgents({ dir: testDir, _silent: true });
    
    const developerPath = path.join(testDir, '.github', 'agents', 'developer.agent.md');
    
    // Verify key sections exist
    assertFileContains(developerPath, 'Developer');
    assertFileContains(developerPath, 'implement');
  });

  it('should preserve template structure in architect.agent.md', async () => {
    await installAgents({ dir: testDir, _silent: true });
    
    const architectPath = path.join(testDir, '.github', 'agents', 'architect.agent.md');
    
    // Verify key sections exist
    assertFileContains(architectPath, 'Architect');
    assertFileContains(architectPath, 'review');
  });
});
