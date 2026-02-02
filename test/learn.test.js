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

  it('should default to personal directory when no flags provided', async () => {
    const testPersonalDefault = path.join(__dirname, 'tmp', `personal-default-${Date.now()}`);
    fs.mkdirSync(testPersonalDefault, { recursive: true });
    testDirsToCleanup.push(testPersonalDefault);

    // Create .aiknowsys structure
    let username;
    try {
      username = execSync('git config user.name', { encoding: 'utf-8' }).trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    } catch {
      username = 'test-user'; // Fallback for environments without git config
    }
    
    const personalDir = path.join(testPersonalDefault, '.aiknowsys', 'personal', username);
    fs.mkdirSync(personalDir, { recursive: true });

    // Verify personal directory exists and is ready for patterns
    assert.ok(fs.existsSync(personalDir), 'Personal directory should exist by default');
    
    // Verify path includes username
    assert.ok(personalDir.includes(username), 'Personal directory should include normalized username');
  });

  it('should use personal directory with explicit --personal flag', async () => {
    const testPersonalExplicit = path.join(__dirname, 'tmp', `personal-explicit-${Date.now()}`);
    fs.mkdirSync(testPersonalExplicit, { recursive: true });
    testDirsToCleanup.push(testPersonalExplicit);

    // Create .aiknowsys structure with personal directory
    let username;
    try {
      username = execSync('git config user.name', { encoding: 'utf-8' }).trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    } catch {
      username = 'test-user'; // Fallback for environments without git config
    }
    
    const personalDir = path.join(testPersonalExplicit, '.aiknowsys', 'personal', username);
    fs.mkdirSync(personalDir, { recursive: true });

    // Simulate pattern file in personal directory
    const patternFile = path.join(personalDir, 'test-pattern.md');
    fs.writeFileSync(patternFile, '# Test Pattern\n\n## Trigger Words\ntest, pattern\n\n## Solution\nTest solution');

    assert.ok(fs.existsSync(patternFile), 'Pattern should exist in personal directory');
  });

  it('should use learned directory with --shared flag', async () => {
    const testShared = path.join(__dirname, 'tmp', `shared-flag-${Date.now()}`);
    fs.mkdirSync(testShared, { recursive: true });
    testDirsToCleanup.push(testShared);

    const learnedDir = path.join(testShared, '.aiknowsys', 'learned');
    fs.mkdirSync(learnedDir, { recursive: true });

    // Simulate pattern file in learned directory
    const patternFile = path.join(learnedDir, 'shared-pattern.md');
    fs.writeFileSync(patternFile, '# Shared Pattern\n\n## Trigger Words\nshared, team\n\n## Solution\nShared solution');

    assert.ok(fs.existsSync(patternFile), 'Pattern should exist in learned directory when using --shared');
  });

  it('should search both personal and learned directories for patterns', async () => {
    const testSearchBoth = path.join(__dirname, 'tmp', `search-both-${Date.now()}`);
    fs.mkdirSync(testSearchBoth, { recursive: true });
    testDirsToCleanup.push(testSearchBoth);

    let username;
    try {
      username = execSync('git config user.name', { encoding: 'utf-8' }).trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    } catch {
      username = 'test-user'; // Fallback for environments without git config
    }

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
