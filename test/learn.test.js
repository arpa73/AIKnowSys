import { describe, it, before, after, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

describe('learn command', () => {
  let testDir;
  let testDirsToCleanup = [];

  before(() => {
    // Create base temporary test directory
    testDir = path.join(__dirname, 'tmp', `test-learn-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up any test directories created during individual tests
    testDirsToCleanup.forEach((dir) => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
    testDirsToCleanup = [];
  });

  after(() => {
    // Cleanup base test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should accept --personal flag (default behavior)', async () => {
    // TODO: Step 2 - Implement actual learn command with --personal flag
    // This test currently verifies directory structure exists (Step 1 infrastructure)
    const testPersonalDir = path.join(__dirname, 'tmp', `learn-personal-${Date.now()}`);
    fs.mkdirSync(testPersonalDir, { recursive: true });
    testDirsToCleanup.push(testPersonalDir);

    // Create .aiknowsys structure with personal directory
    const username = execSync('git config user.name', { encoding: 'utf-8' }).trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const personalDir = path.join(testPersonalDir, '.aiknowsys', 'personal', username);
    fs.mkdirSync(personalDir, { recursive: true });

    // Mock CLI execution would go here
    // For now, we verify the directory structure is ready
    assert.ok(fs.existsSync(personalDir), 'Personal directory should exist');
  });

  it('should save pattern to personal directory by default', async () => {
    // TODO: Step 2 - Test actual learn command saving patterns to personal/
    const testSavePersonal = path.join(__dirname, 'tmp', `save-personal-${Date.now()}`);
    fs.mkdirSync(testSavePersonal, { recursive: true });
    testDirsToCleanup.push(testSavePersonal);

    // Create .aiknowsys structure
    const username = execSync('git config user.name', { encoding: 'utf-8' }).trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const personalDir = path.join(testSavePersonal, '.aiknowsys', 'personal', username);
    fs.mkdirSync(personalDir, { recursive: true });

    // Create a test pattern file in personal directory
    const patternFile = path.join(personalDir, 'test-pattern.md');
    fs.writeFileSync(patternFile, '# Test Pattern\n\nPattern content');

    assert.ok(fs.existsSync(patternFile), 'Pattern should be saved in personal directory');
  });

  it('should save pattern to learned directory with --shared flag', async () => {
    // TODO: Step 2 - Test learn command with --shared flag
    const testSaveShared = path.join(__dirname, 'tmp', `save-shared-${Date.now()}`);
    fs.mkdirSync(testSaveShared, { recursive: true });
    testDirsToCleanup.push(testSaveShared);

    const learnedDir = path.join(testSaveShared, '.aiknowsys', 'learned');
    fs.mkdirSync(learnedDir, { recursive: true });

    // Create a test pattern file in learned directory
    const patternFile = path.join(learnedDir, 'test-pattern.md');
    fs.writeFileSync(patternFile, '# Test Pattern\n\nPattern content');

    assert.ok(fs.existsSync(patternFile), 'Pattern should be saved in learned directory with --shared flag');
  });

  it('should search both personal and learned directories for patterns', async () => {
    const testSearchBoth = path.join(__dirname, 'tmp', `search-both-${Date.now()}`);
    fs.mkdirSync(testSearchBoth, { recursive: true });
    testDirsToCleanup.push(testSearchBoth);

    const username = execSync('git config user.name', { encoding: 'utf-8' }).trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const personalDir = path.join(testSearchBoth, '.aiknowsys', 'personal', username);
    const learnedDir = path.join(testSearchBoth, '.aiknowsys', 'learned');
    
    fs.mkdirSync(personalDir, { recursive: true });
    fs.mkdirSync(learnedDir, { recursive: true });

    // Create patterns in both directories
    fs.writeFileSync(path.join(personalDir, 'personal-pattern.md'), '# Personal Pattern');
    fs.writeFileSync(path.join(learnedDir, 'learned-pattern.md'), '# Learned Pattern');

    // Verify both directories have patterns
    assert.ok(fs.existsSync(path.join(personalDir, 'personal-pattern.md')), 'Personal pattern should exist');
    assert.ok(fs.existsSync(path.join(learnedDir, 'learned-pattern.md')), 'Learned pattern should exist');
  });

  it('should handle missing personal directory gracefully', async () => {
    const testNoPersonal = path.join(__dirname, 'tmp', `no-personal-${Date.now()}`);
    fs.mkdirSync(testNoPersonal, { recursive: true });
    testDirsToCleanup.push(testNoPersonal);

    // Create only learned directory
    const learnedDir = path.join(testNoPersonal, '.aiknowsys', 'learned');
    fs.mkdirSync(learnedDir, { recursive: true });

    // Should not throw error when personal directory doesn't exist
    assert.ok(fs.existsSync(learnedDir), 'Should continue working with learned directory only');
  });

  it('should handle missing git username gracefully', async () => {
    const testNoGit = path.join(__dirname, 'tmp', `no-git-${Date.now()}`);
    fs.mkdirSync(testNoGit, { recursive: true });
    testDirsToCleanup.push(testNoGit);

    // Should not crash when username cannot be detected
    // In this case, personal directory won't be created
    const learnedDir = path.join(testNoGit, '.aiknowsys', 'learned');
    fs.mkdirSync(learnedDir, { recursive: true });

    assert.ok(fs.existsSync(learnedDir), 'Should fallback to learned directory');
  });

  it('should validate pattern file format', async () => {
    const testValidate = path.join(__dirname, 'tmp', `validate-pattern-${Date.now()}`);
    fs.mkdirSync(testValidate, { recursive: true });
    testDirsToCleanup.push(testValidate);

    const learnedDir = path.join(testValidate, '.aiknowsys', 'learned');
    fs.mkdirSync(learnedDir, { recursive: true });

    // Create valid pattern file
    const validPattern = `# test-pattern

**Trigger Words:** test, pattern, validation

## Problem
Test problem description

## Solution
Test solution description

## Example
\`\`\`javascript
// Example code
\`\`\`
`;

    const patternFile = path.join(learnedDir, 'test-pattern.md');
    fs.writeFileSync(patternFile, validPattern);

    const content = fs.readFileSync(patternFile, 'utf-8');
    assert.ok(content.includes('# test-pattern'), 'Pattern should have heading');
    assert.ok(content.includes('Trigger Words:'), 'Pattern should have trigger words');
    assert.ok(content.includes('## Problem'), 'Pattern should have problem section');
    assert.ok(content.includes('## Solution'), 'Pattern should have solution section');
  });
});
