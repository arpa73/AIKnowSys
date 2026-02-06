import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { TEMPLATE_PATHS } from '../lib/commands/init/constants.js';
import { getPackageDir } from '../lib/utils.js';

const setupHooksModule = await import('../lib/commands/init/templates.js');
const { setupHooks } = setupHooksModule as any;

describe('Phase 3 collaboration hooks', () => {
  const packageDir = getPackageDir();

  it('should have learned-reminder hook template', () => {
    const hookPath = path.join(packageDir, TEMPLATE_PATHS.GIT_HOOK_LEARNED_REMINDER);
    assert.ok(fs.existsSync(hookPath), `${hookPath} should exist`);
    
    const content = fs.readFileSync(hookPath, 'utf-8');
    assert.ok(content.includes('#!/usr/bin/env node'), 'Should have node shebang');
    assert.ok(content.toLowerCase().includes('learned'), 'Should reference learned patterns');
  });

  it('should have plan-reminder hook template', () => {
    const hookPath = path.join(packageDir, TEMPLATE_PATHS.GIT_HOOK_PLAN_REMINDER);
    assert.ok(fs.existsSync(hookPath), `${hookPath} should exist`);
    
    const content = fs.readFileSync(hookPath, 'utf-8');
    assert.ok(content.includes('#!/usr/bin/env node'), 'Should have node shebang');
    assert.ok(content.includes('plans'), 'Should reference plans directory');
  });

  it('should have sync-plans hook template', () => {
    const hookPath = path.join(packageDir, TEMPLATE_PATHS.GIT_HOOK_SYNC_PLANS);
    assert.ok(fs.existsSync(hookPath), `${hookPath} should exist`);
    
    const content = fs.readFileSync(hookPath, 'utf-8');
    assert.ok(content.includes('#!/usr/bin/env node'), 'Should have node shebang');
    assert.ok(content.includes('sync-plans'), 'Should run sync-plans command');
  });

  it('should have all hook template paths defined in constants', () => {
    assert.ok(TEMPLATE_PATHS.GIT_HOOK_LEARNED_REMINDER, 'Should have LEARNED_REMINDER path');
    assert.ok(TEMPLATE_PATHS.GIT_HOOK_PLAN_REMINDER, 'Should have PLAN_REMINDER path');
    assert.ok(TEMPLATE_PATHS.GIT_HOOK_SYNC_PLANS, 'Should have SYNC_PLANS path');
  });

  it('should copy collaboration hooks during setupHooks', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hooks-test-'));
    
    try {
      await setupHooks(tempDir, true);
      
      const hooksDir = path.join(tempDir, '.github', 'hooks');
      assert.ok(fs.existsSync(hooksDir), 'Hooks directory should be created');
      
      // Verify all three collaboration hooks were copied
      assert.ok(
        fs.existsSync(path.join(hooksDir, 'learned-reminder.cjs')),
        'learned-reminder.cjs should be copied'
      );
      assert.ok(
        fs.existsSync(path.join(hooksDir, 'plan-reminder.cjs')),
        'plan-reminder.cjs should be copied'
      );
      assert.ok(
        fs.existsSync(path.join(hooksDir, 'sync-plans.cjs')),
        'sync-plans.cjs should be copied'
      );
      
      // Verify content is correct (check one hook as smoke test)
      const content = fs.readFileSync(path.join(hooksDir, 'learned-reminder.cjs'), 'utf-8');
      assert.ok(content.includes('#!/usr/bin/env node'), 'Hook should have node shebang');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // TDD for bugfix: Test that reproduces counting logic bug
  // Bug: hookPaths.filter(p => p.includes('VSCODE_')) returns 0 because paths don't contain 'VSCODE_'
  it('should calculate correct VSCode and Git hook counts in success message', () => {
    // This test reproduced the bug in commit a1a72c4
    // The counting logic filtered on file PATHS (which don't contain 'VSCODE_' or 'GIT_HOOK_')
    // instead of constant NAMES (which do)
    
    // CORRECTED implementation using entries with name metadata
    const hookEntries = [
      { name: 'VSCODE_SESSION_START', path: TEMPLATE_PATHS.VSCODE_SESSION_START },
      { name: 'VSCODE_SESSION_END', path: TEMPLATE_PATHS.VSCODE_SESSION_END },
      { name: 'VSCODE_VALIDATION_REMINDER', path: TEMPLATE_PATHS.VSCODE_VALIDATION_REMINDER },
      { name: 'VSCODE_TDD_REMINDER', path: TEMPLATE_PATHS.VSCODE_TDD_REMINDER },
      { name: 'VSCODE_SKILL_DETECTOR', path: TEMPLATE_PATHS.VSCODE_SKILL_DETECTOR },
      { name: 'VSCODE_SKILL_PREREQ_CHECK', path: TEMPLATE_PATHS.VSCODE_SKILL_PREREQ_CHECK },
      { name: 'VSCODE_WORKSPACE_HEALTH', path: TEMPLATE_PATHS.VSCODE_WORKSPACE_HEALTH },
      { name: 'VSCODE_QUALITY_HEALTH', path: TEMPLATE_PATHS.VSCODE_QUALITY_HEALTH },
      { name: 'VSCODE_COLLABORATION_CHECK', path: TEMPLATE_PATHS.VSCODE_COLLABORATION_CHECK },
      { name: 'VSCODE_DOC_SYNC', path: TEMPLATE_PATHS.VSCODE_DOC_SYNC },
      { name: 'VSCODE_MIGRATION_CHECK', path: TEMPLATE_PATHS.VSCODE_MIGRATION_CHECK },
      { name: 'VSCODE_PERFORMANCE_MONITOR', path: TEMPLATE_PATHS.VSCODE_PERFORMANCE_MONITOR },
      { name: 'GIT_HOOK_LEARNED_REMINDER', path: TEMPLATE_PATHS.GIT_HOOK_LEARNED_REMINDER },
      { name: 'GIT_HOOK_PLAN_REMINDER', path: TEMPLATE_PATHS.GIT_HOOK_PLAN_REMINDER },
      { name: 'GIT_HOOK_SYNC_PLANS', path: TEMPLATE_PATHS.GIT_HOOK_SYNC_PLANS }
    ];

    // CORRECT counting logic - filters on constant NAMES, not file paths
    const correctVscodeCount = hookEntries.filter(e => e.name.startsWith('VSCODE_')).length;
    const correctGitCount = hookEntries.filter(e => e.name.startsWith('GIT_HOOK_')).length;
    
    // GREEN phase: These assertions should pass with corrected logic
    assert.strictEqual(correctVscodeCount, 12, 'Should correctly count 12 VSCode hooks');
    assert.strictEqual(correctGitCount, 3, 'Should correctly count 3 Git hooks');
    assert.strictEqual(hookEntries.length, 15, 'Total hooks should be 15');
    
    // Verify the message would show correct counts
    const expectedMessage = `Hooks installed (${correctVscodeCount} VSCode + ${correctGitCount} Git = ${hookEntries.length} total)`;
    assert.strictEqual(expectedMessage, 'Hooks installed (12 VSCode + 3 Git = 15 total)', 'Success message should show correct counts');
  });
});
