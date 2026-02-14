const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('sync-plans hook', () => {
  let tempDir;
  let hookScript;

  beforeEach(() => {
    // Create temp directory for testing
    tempDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'sync-plans-test-'));
    hookScript = path.join(__dirname, '../../templates/hooks/sync-plans.cjs');
  });

  afterEach(() => {
    // Cleanup temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Non-blocking behavior', () => {
    it('should exit successfully when no plans directory exists', () => {
      // Run hook in directory without .aiknowsys/plans/
      const result = execSync(`node "${hookScript}"`, {
        cwd: tempDir,
        encoding: 'utf-8',
        env: { ...process.env, GIT_AUTHOR_NAME: 'test-user' }
      });

      expect(result !== undefined).toBeTruthy();
    });

    it('should exit successfully when sync-plans command does not exist', () => {
      // Create plans directory but no sync-plans command
      const aiknowsysDir = path.join(tempDir, '.aiknowsys');
      const plansDir = path.join(aiknowsysDir, 'plans');
      fs.mkdirSync(plansDir, { recursive: true });

      // Create a dummy package.json without sync-plans command
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        scripts: {}
      };
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = execSync(`node "${hookScript}"`, {
        cwd: tempDir,
        encoding: 'utf-8',
        env: { ...process.env, GIT_AUTHOR_NAME: 'test-user' }
      });

      expect(result !== undefined).toBeTruthy();
    });

    it('should be non-blocking even if sync fails', () => {
      // Create plans directory
      const aiknowsysDir = path.join(tempDir, '.aiknowsys');
      const plansDir = path.join(aiknowsysDir, 'plans');
      fs.mkdirSync(plansDir, { recursive: true });

      // Create a fake sync-plans script that fails
      const binDir = path.join(tempDir, 'node_modules', '.bin');
      fs.mkdirSync(binDir, { recursive: true });
      
      const fakeSyncScript = path.join(binDir, 'aiknowsys');
      fs.writeFileSync(fakeSyncScript, '#!/usr/bin/env node\nprocess.exit(1);');
      fs.chmodSync(fakeSyncScript, '755');

      // Hook should still exit 0 even if sync fails
      const result = execSync(`node "${hookScript}"`, {
        cwd: tempDir,
        encoding: 'utf-8',
        env: { ...process.env, GIT_AUTHOR_NAME: 'test-user', PATH: `${binDir}:${process.env.PATH}` }
      });

      expect(result !== undefined).toBeTruthy();
    });
  });

  describe('Sync execution', () => {
    it('should run sync-plans command when plans directory exists', () => {
      // Create plans directory
      const aiknowsysDir = path.join(tempDir, '.aiknowsys');
      const plansDir = path.join(aiknowsysDir, 'plans');
      fs.mkdirSync(plansDir, { recursive: true });

      // Create active plan files
      fs.writeFileSync(
        path.join(plansDir, 'active-alice.md'),
        '**Currently Working On:** Feature A'
      );
      fs.writeFileSync(
        path.join(plansDir, 'active-bob.md'),
        '**Currently Working On:** Bug fix B'
      );

      // Create a fake sync-plans script that writes a marker file
      const binDir = path.join(tempDir, 'node_modules', '.bin');
      fs.mkdirSync(binDir, { recursive: true });
      
      const markerFile = path.join(tempDir, 'sync-executed.txt');
      const fakeSyncScript = path.join(binDir, 'aiknowsys');
      fs.writeFileSync(fakeSyncScript, `#!/usr/bin/env node
if (process.argv[2] === 'sync-plans') {
  require('fs').writeFileSync('${markerFile}', 'executed');
  process.exit(0);
}
process.exit(1);
`);
      fs.chmodSync(fakeSyncScript, '755');

      // Run hook
      execSync(`node "${hookScript}"`, {
        cwd: tempDir,
        encoding: 'utf-8',
        env: { ...process.env, GIT_AUTHOR_NAME: 'test-user', PATH: `${binDir}:${process.env.PATH}` }
      });

      // Verify sync was executed
      expect(fs.existsSync(markerFile)).toBeTruthy();
    });

    it('should run silently without user prompts', () => {
      // Create plans directory
      const aiknowsysDir = path.join(tempDir, '.aiknowsys');
      const plansDir = path.join(aiknowsysDir, 'plans');
      fs.mkdirSync(plansDir, { recursive: true });

      fs.writeFileSync(
        path.join(plansDir, 'active-charlie.md'),
        '**Currently Working On:** Refactoring C'
      );

      // Create fake sync script that captures output
      const binDir = path.join(tempDir, 'node_modules', '.bin');
      fs.mkdirSync(binDir, { recursive: true });
      
      const fakeSyncScript = path.join(binDir, 'aiknowsys');
      fs.writeFileSync(fakeSyncScript, `#!/usr/bin/env node
if (process.argv[2] === 'sync-plans' && process.argv[3] === '--silent') {
  console.log('SILENT_MODE_ACTIVE');
  process.exit(0);
}
process.exit(1);
`);
      fs.chmodSync(fakeSyncScript, '755');

      // Run hook and capture output
      const output = execSync(`node "${hookScript}"`, {
        cwd: tempDir,
        encoding: 'utf-8',
        env: { ...process.env, GIT_AUTHOR_NAME: 'test-user', PATH: `${binDir}:${process.env.PATH}` }
      });

      // Verify --silent flag was used
      expect(output.includes('SILENT_MODE_ACTIVE')).toBeTruthy();
    });
  });

  describe('Hook integration', () => {
    it('should be executable as a post-merge git hook', () => {
      // Verify hook file exists and has shebang
      const hookContent = fs.readFileSync(hookScript, 'utf-8');
      expect(hookContent.startsWith('#!/usr/bin/env node')).toBeTruthy();
    });

    it('should skip gracefully in non-Phase-2 projects', () => {
      // Create .aiknowsys but no plans/ subdirectory
      const aiknowsysDir = path.join(tempDir, '.aiknowsys');
      fs.mkdirSync(aiknowsysDir, { recursive: true });
      fs.writeFileSync(
        path.join(aiknowsysDir, 'CURRENT_PLAN.md'),
        '# Single-dev project'
      );

      // Should exit cleanly without trying to sync
      const result = execSync(`node "${hookScript}"`, {
        cwd: tempDir,
        encoding: 'utf-8',
        env: { ...process.env, GIT_AUTHOR_NAME: 'test-user' }
      });

      expect(result !== undefined).toBeTruthy();
    });
  });
});
