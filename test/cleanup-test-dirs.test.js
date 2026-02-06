import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(__dirname, '../scripts/cleanup-test-dirs.sh');

describe('cleanup-test-dirs.sh', () => {
  let tempWorkspace;

  beforeEach(() => {
    // Create temporary workspace with test directories
    tempWorkspace = fs.mkdtempSync(path.join('/tmp', 'cleanup-test-'));
    
    // Create test directories that should be deleted
    fs.mkdirSync(path.join(tempWorkspace, 'test-12345'));
    fs.mkdirSync(path.join(tempWorkspace, 'temp-abc'));
    fs.mkdirSync(path.join(tempWorkspace, 'tmp-xyz'));
    
    // Create test directory that should NOT be deleted
    fs.mkdirSync(path.join(tempWorkspace, 'test'));
    fs.writeFileSync(path.join(tempWorkspace, 'test', 'important.test.js'), '// test');
  });

  afterEach(() => {
    // Cleanup
    if (tempWorkspace && fs.existsSync(tempWorkspace)) {
      fs.rmSync(tempWorkspace, { recursive: true, force: true });
    }
  });

  it('should identify test directories in dry-run mode', () => {
    const output = execSync(`bash ${scriptPath} --dry-run ${tempWorkspace}`, {
      encoding: 'utf-8'
    });
    
    assert.match(output, /test-12345/, 'Should find test-* directory');
    assert.match(output, /temp-abc/, 'Should find temp-* directory');
    assert.match(output, /Found: 3/, 'Should find 3 directories');
    assert.match(output, /Would delete/, 'Should show dry-run message');
  });

  it('should NOT delete in dry-run mode', () => {
    execSync(`bash ${scriptPath} --dry-run ${tempWorkspace}`);
    
    assert.ok(fs.existsSync(path.join(tempWorkspace, 'test-12345')), 'Directory should still exist');
    assert.ok(fs.existsSync(path.join(tempWorkspace, 'temp-abc')), 'Directory should still exist');
  });

  it('should delete test directories when run without dry-run', () => {
    execSync(`bash ${scriptPath} --force ${tempWorkspace}`);
    
    assert.ok(!fs.existsSync(path.join(tempWorkspace, 'test-12345')), 'test-* should be deleted');
    assert.ok(!fs.existsSync(path.join(tempWorkspace, 'temp-abc')), 'temp-* should be deleted');
    assert.ok(!fs.existsSync(path.join(tempWorkspace, 'tmp-xyz')), 'tmp-* should be deleted');
  });

  it('should protect actual test/ directory', () => {
    execSync(`bash ${scriptPath} --force ${tempWorkspace}`);
    
    assert.ok(fs.existsSync(path.join(tempWorkspace, 'test')), 'test/ should NOT be deleted');
    assert.ok(fs.existsSync(path.join(tempWorkspace, 'test', 'important.test.js')), 'test files should be safe');
  });

  it('should report correct deletion count', () => {
    const output = execSync(`bash ${scriptPath} --force ${tempWorkspace}`, {
      encoding: 'utf-8'
    });
    
    assert.match(output, /Deleted: 3/, 'Should report 3 deletions');
  });

  it('should handle empty workspace gracefully', () => {
    // Create clean workspace with no test directories
    const cleanWorkspace = fs.mkdtempSync(path.join('/tmp', 'cleanup-clean-'));
    
    try {
      const output = execSync(`bash ${scriptPath} --force ${cleanWorkspace}`, {
        encoding: 'utf-8'
      });
      
      assert.match(output, /Workspace is clean/, 'Should show clean message');
    } finally {
      fs.rmSync(cleanWorkspace, { recursive: true, force: true });
    }
  });

  it('should skip test/ directory even if it matches pattern', () => {
    // This test ensures the explicit protection for test/ directory works
    execSync(`bash ${scriptPath} --force ${tempWorkspace}`);
    
    // Verify test/ directory exists and has content
    const testDirExists = fs.existsSync(path.join(tempWorkspace, 'test'));
    const testFileExists = fs.existsSync(path.join(tempWorkspace, 'test', 'important.test.js'));
    
    assert.ok(testDirExists, 'test/ directory should be protected');
    assert.ok(testFileExists, 'Files in test/ should be preserved');
  });
});
