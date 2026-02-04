import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir, readFile, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

describe('pre-commit-deliverables hook', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    // Create temporary directory
    testDir = await mkdtemp(join(tmpdir(), 'pre-commit-test-'));
    originalCwd = process.cwd();
    process.chdir(testDir);

    // Initialize git repo
    await execAsync('git init');
    await execAsync('git config user.email "test@example.com"');
    await execAsync('git config user.name "Test User"');

    // Create basic project structure
    await mkdir(join(testDir, 'bin'));
    await mkdir(join(testDir, 'lib/commands'), { recursive: true });
    await mkdir(join(testDir, 'templates/agents'), { recursive: true });
    await mkdir(join(testDir, '.git/hooks'), { recursive: true });

    // Create dummy CLI
    await writeFile(join(testDir, 'bin/cli.js'), `#!/usr/bin/env node
import { program } from 'commander';

program
  .command('validate-deliverables')
  .option('--silent', 'Silent mode')
  .action(async (options) => {
    const { validateDeliverables } = await import('../lib/commands/validate-deliverables.js');
    const result = await validateDeliverables({ _silent: options.silent });
    process.exit(result.exitCode);
  });

program.parse();
`);

    // Create dummy package.json
    await writeFile(join(testDir, 'package.json'), JSON.stringify({
      name: 'test-project',
      type: 'module',
      version: '1.0.0'
    }, null, 2));
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(testDir, { recursive: true, force: true });
  });

  it('should skip validation if no templates/ files are staged', async () => {
    // Create a hook that exits 99 if validation runs (shouldn't happen)
    const hookContent = `#!/bin/bash
# Only run if templates/ files changed
if ! git diff --cached --name-only | grep -q '^templates/'; then
  exit 0
fi
exit 99  # Validation would run
`;
    const hookPath = join(testDir, '.git/hooks/pre-commit');
    await writeFile(hookPath, hookContent);
    await chmod(hookPath, 0o755);

    // Stage a non-template file
    await writeFile(join(testDir, 'README.md'), '# Test');
    await execAsync('git add README.md');

    // Commit should succeed (hook exits 0 without running validation)
    await execAsync('git commit -m "test"');
  });

  it('should run validation if templates/ files are staged', async () => {
    // Create a hook that checks if validation command would be called
    const hookContent = `#!/bin/bash
# Only run if templates/ files changed
if ! git diff --cached --name-only | grep -q '^templates/'; then
  exit 0
fi

# Validation would run here
# For test, just check that we got to this point
echo "VALIDATION_TRIGGERED"
exit 1
`;
    const hookPath = join(testDir, '.git/hooks/pre-commit');
    await writeFile(hookPath, hookContent);
    await chmod(hookPath, 0o755);

    // Stage a template file
    await writeFile(join(testDir, 'templates/test.md'), '# Test Template');
    await execAsync('git add templates/test.md');

    // Commit should fail and show our marker (validation triggered)
    try {
      await execAsync('git commit -m "test"');
      assert.fail('Commit should have failed');
    } catch (error) {
      assert.match((error as Error).message, /VALIDATION_TRIGGERED/);
    }
  });

  it('should show helpful message on validation failure', async () => {
    // Create a hook that simulates validation failure
    const hookContent = `#!/bin/bash
if ! git diff --cached --name-only | grep -q '^templates/'; then
  exit 0
fi

echo "❌ Deliverables validation failed!"
echo "   Run: npx aiknowsys validate-deliverables"
echo "   Or skip: git commit --no-verify (not recommended)"
exit 1
`;
    const hookPath = join(testDir, '.git/hooks/pre-commit');
    await writeFile(hookPath, hookContent);
    await chmod(hookPath, 0o755);

    // Stage a template file
    await writeFile(join(testDir, 'templates/test.md'), '# Test Template');
    await execAsync('git add templates/test.md');

    // Commit should fail with helpful message
    try {
      await execAsync('git commit -m "test"');
      assert.fail('Commit should have failed');
    } catch (error) {
      assert.match((error as Error).message, /Deliverables validation failed/);
      assert.match((error as Error).message, /npx aiknowsys validate-deliverables/);
      assert.match((error as Error).message, /--no-verify/);
    }
  });

  it('should allow --no-verify bypass', async () => {
    // Create a hook that always fails
    const hookContent = `#!/bin/bash
exit 1
`;
    const hookPath = join(testDir, '.git/hooks/pre-commit');
    await writeFile(hookPath, hookContent);
    await chmod(hookPath, 0o755);

    // Stage a file
    await writeFile(join(testDir, 'test.md'), '# Test');
    await execAsync('git add test.md');

    // Commit with --no-verify should succeed
    await execAsync('git commit --no-verify -m "test"');
  });

  it('should execute actual validate-deliverables command when templates changed', async () => {
    // Copy actual validate-deliverables command from project
    const projectRoot = join(originalCwd);
    const validateDeliverablesSource = join(projectRoot, 'lib/commands/validate-deliverables.js');
    const validateDeliverablesTarget = join(testDir, 'lib/commands/validate-deliverables.js');
    
    // Copy all dependencies
    await writeFile(validateDeliverablesTarget, await readFile(validateDeliverablesSource, 'utf-8'));
    
    // Copy logger dependency
    await writeFile(
      join(testDir, 'lib/logger.js'),
      await readFile(join(projectRoot, 'lib/logger.js'), 'utf-8')
    );
    
    // Create a simplified hook that skips tests (test would fail in isolated env)
    const hookContent = `#!/bin/bash
set -e

if ! git rev-parse --git-dir > /dev/null 2>&1; then
  exit 0
fi

# Skip test step for this integration test
echo "📋 Tests: Skipped (integration test)"

# Deliverables validation (BLOCKING if templates/ changed)
echo "📋 Deliverables validation..."
if git diff --cached --name-only | grep -q '^templates/'; then
  echo "  📝 Templates changed - validating deliverables..."
  
  if command -v node > /dev/null 2>&1 && [ -f "bin/cli.js" ]; then
    if node bin/cli.js validate-deliverables --silent; then
      echo "  ✅ Deliverables validation passed"
    else
      echo ""
      echo "  ❌ Deliverables validation failed - commit blocked"
      echo ""
      echo "  Templates must match non-template equivalents."
      echo "  Run: npx aiknowsys validate-deliverables"
      echo "  Fix: npx aiknowsys validate-deliverables --fix"
      echo "  Or skip: git commit --no-verify (not recommended)"
      echo ""
      exit 1
    fi
  else
    echo "  ⊖ Deliverables check skipped (CLI not available)"
  fi
else
  echo "  ⊖ No template changes detected"
fi

exit 0
`;
    const hookTarget = join(testDir, '.git/hooks/pre-commit');
    await writeFile(hookTarget, hookContent);
    await chmod(hookTarget, 0o755);
    
    // Create a template with known issue (unresolved placeholder)
    await writeFile(
      join(testDir, 'templates/test.template.md'),
      'Content with {{UNRESOLVED_PLACEHOLDER}}'
    );
    await execAsync('git add templates/');
    
    // Should fail with actual deliverables validation error
    try {
      await execAsync('git commit -m "test"');
      assert.fail('Should have blocked commit due to validation failure');
    } catch (error) {
      // Verify it's the deliverables validation that failed
      assert.match((error as Error).message, /Deliverables validation failed/);
    }
  });
});
