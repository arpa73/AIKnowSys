import { describe, it, beforeEach, afterEach, expect } from 'vitest';
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
    
    expect(output).toMatch(/test-12345/);
    expect(output).toMatch(/temp-abc/);
    expect(output).toMatch(/Found: 3/);
    expect(output).toMatch(/Would delete/);
  });

  it('should NOT delete in dry-run mode', () => {
    execSync(`bash ${scriptPath} --dry-run ${tempWorkspace}`);
    
    expect(fs.existsSync(path.join(tempWorkspace, 'test-12345'))).toBeTruthy();
    expect(fs.existsSync(path.join(tempWorkspace, 'temp-abc'))).toBeTruthy();
  });

  it('should delete test directories when run without dry-run', () => {
    execSync(`bash ${scriptPath} --force ${tempWorkspace}`);
    
    expect(!fs.existsSync(path.join(tempWorkspace, 'test-12345'))).toBeTruthy();
    expect(!fs.existsSync(path.join(tempWorkspace, 'temp-abc'))).toBeTruthy();
    expect(!fs.existsSync(path.join(tempWorkspace, 'tmp-xyz'))).toBeTruthy();
  });

  it('should protect actual test/ directory', () => {
    execSync(`bash ${scriptPath} --force ${tempWorkspace}`);
    
    expect(fs.existsSync(path.join(tempWorkspace, 'test'))).toBeTruthy();
    expect(fs.existsSync(path.join(tempWorkspace, 'test', 'important.test.js'))).toBeTruthy();
  });

  it('should report correct deletion count', () => {
    const output = execSync(`bash ${scriptPath} --force ${tempWorkspace}`, {
      encoding: 'utf-8'
    });
    
    expect(output).toMatch(/Deleted: 3/);
  });

  it('should handle empty workspace gracefully', () => {
    // Create clean workspace with no test directories
    const cleanWorkspace = fs.mkdtempSync(path.join('/tmp', 'cleanup-clean-'));
    
    try {
      const output = execSync(`bash ${scriptPath} --force ${cleanWorkspace}`, {
        encoding: 'utf-8'
      });
      
      expect(output).toMatch(/Workspace is clean/);
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
    
    expect(testDirExists).toBeTruthy();
    expect(testFileExists).toBeTruthy();
  });
});
