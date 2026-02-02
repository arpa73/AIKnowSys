import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { TEMPLATE_PATHS } from '../lib/commands/init/constants.js';
import { getPackageDir } from '../lib/utils.js';
import { setupHooks } from '../lib/commands/init/templates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
});
