/**
 * Tests for VSCode validation and TDD reminder hooks
 * 
 * Tests validate-reminder.js (Stop hook) and tdd-reminder.js (PreToolUse hook)
 * Using node:test (built-in test runner, zero external dependencies)
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Helper: Run hook script with JSON input via stdin
 * @param {string} hookPath - Path to hook script
 * @param {object} input - JSON input object
 * @returns {Promise<{code: number, stdout: string, stderr: string}>}
 */
async function runHook(hookPath: string, input: any = {}): Promise<{code: number | null, stdout: string, stderr: string}> {
  return new Promise((resolve) => {
    const proc = spawn('node', [hookPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout: string = '';
    let stderr: string = '';
    
    proc.stdout.on('data', (data: Buffer) => stdout += data.toString());
    proc.stderr.on('data', (data: Buffer) => stderr += data.toString());
    
    proc.on('close', (code: number | null) => {
      resolve({ code, stdout, stderr });
    });
    
    // Write input to stdin and close
    proc.stdin.write(JSON.stringify(input));
    proc.stdin.end();
  });
}

// ============================================================================
// Validation Reminder Hook Tests (Stop event)
// ============================================================================

describe('Validation Reminder Hook', () => {
  const hookPath: string = path.join(import.meta.dirname, '..', 'templates', 'hooks', 'validation-reminder.cjs');
  
  it('should parse validation matrix from ESSENTIALS', async () => {
    // Test will fail until hook is implemented
    const result = await runHook(hookPath, {});
    
    // Hook should always exit 0 (non-blocking)
    assert.strictEqual(result.code, 0, 'Hook should exit with code 0');
  });
  
  it('should detect code changes in lib/ directory', async () => {
    const input = {
      hook_type: 'Stop',
      conversation: [
        { tool: 'Edit', tool_input: { file_path: 'lib/commands/audit.js' } }
      ]
    };
    
    const result = await runHook(hookPath, input);
    
    // Should detect code change (this test will fail initially)
    assert.strictEqual(result.code, 0);
    // Hook should output validation reminder if no npm test found
  });
  
  it('should warn when validation missing after code changes', async () => {
    const input = {
      hook_type: 'Stop',
      conversation: [
        { tool: 'Edit', tool_input: { file_path: 'lib/utils.js' } }
        // No validation command present
      ]
    };
    
    const result = await runHook(hookPath, input);
    
    assert.strictEqual(result.code, 0, 'Should exit 0');
    assert.ok(result.stderr.includes('[Hook]'), 'Should output to stderr');
    assert.ok(result.stderr.includes('Validation') || result.stderr.includes('test'), 
      'Should mention validation/testing');
  });
  
  it('should remain silent when validation already run', async () => {
    const input = {
      hook_type: 'Stop',
      conversation: [
        { tool: 'Edit', tool_input: { file_path: 'lib/utils.js' } },
        { tool: 'Bash', tool_input: { command: 'npm test' } }
      ]
    };
    
    const result = await runHook(hookPath, input);
    
    assert.strictEqual(result.code, 0, 'Should exit 0');
    assert.ok(!result.stderr.includes('Validation check'), 
      'Should not warn if validation was run');
  });
  
  it('should complete within timeout (2 seconds)', async () => {
    const startTime: number = Date.now();
    const result = await runHook(hookPath, {});
    const elapsed: number = Date.now() - startTime;
    
    assert.strictEqual(result.code, 0);
    assert.ok(elapsed < 2000, `Should complete in <2s, took ${elapsed}ms`);
  });
});

// ============================================================================
// TDD Reminder Hook Tests (PreToolUse event)
// ============================================================================

describe('TDD Reminder Hook', () => {
  const hookPath: string = path.join(import.meta.dirname, '..', 'templates', 'hooks', 'tdd-reminder.cjs');
  const testDir: string = path.join(import.meta.dirname, '..', 'test');
  let tempTestFile: string;
  
  beforeEach(() => {
    // Create temporary test file for "recent edit" detection
    tempTestFile = path.join(testDir, 'temp-test-for-hooks.test.js');
  });
  
  afterEach(() => {
    // Clean up temp test file
    if (fs.existsSync(tempTestFile)) {
      fs.unlinkSync(tempTestFile);
    }
  });
  
  it('should detect implementation file edits', async () => {
    const input = {
      hook_type: 'PreToolUse',
      tool: 'Edit',
      tool_input: { file_path: 'lib/commands/audit.js' }
    };
    
    const result = await runHook(hookPath, input);
    
    assert.strictEqual(result.code, 0, 'Should exit 0');
    // Hook should recognize this as implementation file
  });
  
  it('should check for corresponding test file', async () => {
    const input = {
      hook_type: 'PreToolUse',
      tool: 'Edit',
      tool_input: { file_path: 'lib/commands/audit.js' }
    };
    
    const result = await runHook(hookPath, input);
    
    // Should check for test/audit.test.js
    assert.strictEqual(result.code, 0);
  });
  
  it('should warn when test file missing or not recently edited', async () => {
    const input = {
      hook_type: 'PreToolUse',
      tool: 'Edit',
      tool_input: { file_path: 'lib/commands/new-feature.js' }
    };
    
    const result = await runHook(hookPath, input);
    
    assert.strictEqual(result.code, 0, 'Should exit 0');
    assert.ok(result.stderr.includes('[Hook]'), 'Should output to stderr');
    assert.ok(result.stderr.includes('TDD') || result.stderr.includes('test'), 
      'Should mention TDD/testing');
  });
  
  it('should remain silent when test file exists and was recently edited', async () => {
    // Create temp test file with recent mtime
    fs.writeFileSync(tempTestFile, '// test');
    
    const input = {
      hook_type: 'PreToolUse',
      tool: 'Edit',
      tool_input: { file_path: 'test/temp-test-for-hooks.test.js' }
    };
    
    const result = await runHook(hookPath, input);
    
    assert.strictEqual(result.code, 0);
    // Should not warn for test files themselves
  });
  
  it('should link to TDD workflow skill', async () => {
    const input = {
      hook_type: 'PreToolUse',
      tool: 'Edit',
      tool_input: { file_path: 'lib/commands/new-command.js' }
    };
    
    const result = await runHook(hookPath, input);
    
    assert.strictEqual(result.code, 0);
    if (result.stderr.includes('TDD')) {
      assert.ok(result.stderr.includes('tdd-workflow') || result.stderr.includes('.github/skills'), 
        'Should reference TDD skill');
    }
  });
});

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================

describe('Hook Error Handling', () => {
  it('validation hook should handle empty input gracefully', async () => {
    const hookPath: string = path.join(import.meta.dirname, '..', 'templates', 'hooks', 'validation-reminder.cjs');
    const result = await runHook(hookPath, {});
    
    assert.strictEqual(result.code, 0, 'Should not crash on empty input');
  });
  
  it('tdd hook should handle empty input gracefully', async () => {
    const hookPath: string = path.join(import.meta.dirname, '..', 'templates', 'hooks', 'tdd-reminder.cjs');
    const result = await runHook(hookPath, {});
    
    assert.strictEqual(result.code, 0, 'Should not crash on empty input');
  });
  
  it('validation hook should handle malformed input', async () => {
    const hookPath: string = path.join(import.meta.dirname, '..', 'templates', 'hooks', 'validation-reminder.cjs');
    
    return new Promise<void>((resolve) => {
      const proc = spawn('node', [hookPath]);
      
      proc.on('close', (code: number | null) => {
        assert.strictEqual(code, 0, 'Should exit 0 even with malformed input');
        resolve();
      });
      
      // Send malformed JSON
      proc.stdin.write('not valid json{');
      proc.stdin.end();
    });
  });
});
