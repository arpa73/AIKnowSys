import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
const projectRoot: string = path.join(__dirname, '..');

describe('check command', () => {
  let testDir: string;

  before(() => {
    testDir = path.join(__dirname, 'tmp', `check-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
  });

  after(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should detect placeholders in AGENTS.md', () => {
    // Create minimal AGENTS.md with placeholder
    const agentsPath: string = path.join(testDir, 'AGENTS.md');
    fs.writeFileSync(agentsPath, `# Agents

| Trigger Words | Skill to Read |
|---------------|---------------|
{{SKILL_MAPPING}}

## Validation Matrix
{{VALIDATION_MATRIX}}
`);

    // Create minimal CODEBASE_ESSENTIALS.md
    const essentialsPath: string = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    fs.writeFileSync(essentialsPath, `# Essentials

## 2. Validation Matrix

| Command | Purpose |
|---------|---------|
| npm test | Tests |
`);

    // Create CODEBASE_CHANGELOG.md
    const changelogPath: string = path.join(testDir, 'CODEBASE_CHANGELOG.md');
    fs.writeFileSync(changelogPath, '# Changelog\n\nHistory here.');

    // Run check command
    const output: string = execSync(`node bin/cli.js check --dir ${testDir}`, {
      cwd: projectRoot,
      encoding: 'utf-8'
    });

    // Should detect placeholders in AGENTS.md
    assert.ok(output.includes('AGENTS.md'), 'Should mention AGENTS.md file');
    assert.ok(output.includes('SKILL_MAPPING') || output.includes('placeholders'), 'Should detect SKILL_MAPPING placeholder');
    assert.ok(output.includes('⚠') || output.includes('warnings'), 'Should show warning for placeholders');
  });

  it('should pass when no placeholders remain', () => {
    // Create AGENTS.md without placeholders
    const agentsPath: string = path.join(testDir, 'AGENTS.md');
    fs.writeFileSync(agentsPath, `# Agents

| Trigger Words | Skill to Read |
|---------------|---------------|
| "test" | tdd-workflow |
`);

    // Create CODEBASE_ESSENTIALS.md without placeholders
    const essentialsPath: string = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    fs.writeFileSync(essentialsPath, `# Essentials

## 2. Validation Matrix

| Command | Purpose |
|---------|---------|
| npm test | Run tests |
`);

    // Create CODEBASE_CHANGELOG.md
    const changelogPath: string = path.join(testDir, 'CODEBASE_CHANGELOG.md');
    fs.writeFileSync(changelogPath, '# Changelog\n\nHistory here.');

    // Run check command
    const output: string = execSync(`node bin/cli.js check --dir ${testDir}`, {
      cwd: projectRoot,
      encoding: 'utf-8'
    });

    // Should pass placeholder check
    assert.ok(output.includes('✓') || output.includes('No placeholders'), 'Should pass when no placeholders remain');
  });

  it('should detect bloated ESSENTIALS (>800 lines)', () => {
    // Create bloated CODEBASE_ESSENTIALS.md (1000 lines)
    const essentialsPath: string = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    const bloatedContent: string = `# Codebase Essentials

## 1. Technology Snapshot

Some content here.

## 2. Validation Matrix

| Command | Purpose |
|---------|---------|
| npm test | Run tests |

## 3. Core Patterns

${Array.from({ length: 900 }, (_, i) => `Line ${i + 1} of content\n`).join('')}
`;
    fs.writeFileSync(essentialsPath, bloatedContent);

    // Create other required files
    fs.writeFileSync(path.join(testDir, 'AGENTS.md'), '# Agents\n');
    fs.writeFileSync(path.join(testDir, 'CODEBASE_CHANGELOG.md'), '# Changelog\n');

    // Run check command
    const output: string = execSync(`node bin/cli.js check --dir ${testDir}`, {
      cwd: projectRoot,
      encoding: 'utf-8'
    });

    // Should warn about file size
    assert.ok(output.includes('⚠') || output.includes('warning'), 'Should show warning');
    assert.ok(output.includes('800') || output.includes('lines') || output.includes('size'), 'Should mention line count or file size');
  });

  it('should detect verbose sections (>150 lines)', () => {
    // Create ESSENTIALS with one verbose section
    const essentialsPath: string = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    const verboseSection: string = `# Codebase Essentials

## 1. Technology Snapshot

Small section.

## 2. Validation Matrix

| Command | Purpose |
|---------|---------|
| npm test | Run tests |

## 3. Verbose Section

${Array.from({ length: 200 }, (_, i) => `Verbose line ${i + 1}\n`).join('')}

## 4. Another Section

Small section.
`;
    fs.writeFileSync(essentialsPath, verboseSection);

    // Create other required files
    fs.writeFileSync(path.join(testDir, 'AGENTS.md'), '# Agents\n');
    fs.writeFileSync(path.join(testDir, 'CODEBASE_CHANGELOG.md'), '# Changelog\n');

    // Run check command
    const output: string = execSync(`node bin/cli.js check --dir ${testDir}`, {
      cwd: projectRoot,
      encoding: 'utf-8'
    });

    // Should warn about verbose section
    assert.ok(output.includes('⚠') || output.includes('Verbose'), 'Should warn about verbose section');
    assert.ok(output.includes('150') || output.includes('section'), 'Should mention section size limit');
  });

  it('should suggest compression command when bloated', () => {
    // Create bloated ESSENTIALS with validation matrix
    const essentialsPath: string = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    const bloatedContent: string = `# Codebase Essentials

## 2. Validation Matrix

| Command | Purpose |
|---------|---------|
| npm test | Run tests |

${Array.from({ length: 990 }, (_, i) => `Line ${i + 1}\n`).join('')}
`;
    fs.writeFileSync(essentialsPath, bloatedContent);

    // Create other required files
    fs.writeFileSync(path.join(testDir, 'AGENTS.md'), '# Agents\n');
    fs.writeFileSync(path.join(testDir, 'CODEBASE_CHANGELOG.md'), '# Changelog\n');

    // Run check command
    const output: string = execSync(`node bin/cli.js check --dir ${testDir}`, {
      cwd: projectRoot,
      encoding: 'utf-8'
    });

    // Should suggest compression
    assert.ok(output.includes('compress') || output.includes('Compress'), 'Should suggest compression command');
  });

  it('should not warn for reasonably-sized ESSENTIALS (<800 lines)', () => {
    // Create reasonable ESSENTIALS (500 lines)
    const essentialsPath: string = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    const reasonableContent: string = `# Codebase Essentials

## 1. Technology Snapshot

Some content.

## 2. Validation Matrix

| Command | Purpose |
|---------|---------|
| npm test | Run tests |

## 3. Core Patterns

${Array.from({ length: 450 }, (_, i) => `Line ${i + 1}\n`).join('')}
`;
    fs.writeFileSync(essentialsPath, reasonableContent);

    // Create other required files
    fs.writeFileSync(path.join(testDir, 'AGENTS.md'), '# Agents\n');
    fs.writeFileSync(path.join(testDir, 'CODEBASE_CHANGELOG.md'), '# Changelog\n');

    // Run check command
    const output: string = execSync(`node bin/cli.js check --dir ${testDir}`, {
      cwd: projectRoot,
      encoding: 'utf-8'
    });

    // Should NOT warn about ESSENTIALS size (only other possible warnings)
    const lines: string[] = output.split('\n');
    const essentialsLines: string[] = lines.filter(l => l.includes('ESSENTIALS') || l.includes('Essentials'));
    
    // The ESSENTIALS line should show a checkmark, not a warning
    const hasEssentialsWarning: boolean = essentialsLines.some(l => 
      (l.includes('⚠') || l.includes('warning')) && 
      (l.includes('size') || l.includes('lines') || l.includes('800'))
    );
    
    assert.ok(!hasEssentialsWarning, 'Should not warn about ESSENTIALS size when under 800 lines');
  });
});
