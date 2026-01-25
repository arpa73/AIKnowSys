import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

describe('check command', () => {
  let testDir;

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
    const agentsPath = path.join(testDir, 'AGENTS.md');
    fs.writeFileSync(agentsPath, `# Agents

| Trigger Words | Skill to Read |
|---------------|---------------|
{{SKILL_MAPPING}}

## Validation Matrix
{{VALIDATION_MATRIX}}
`);

    // Create minimal CODEBASE_ESSENTIALS.md
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    fs.writeFileSync(essentialsPath, `# Essentials

## 2. Validation Matrix

| Command | Purpose |
|---------|---------|
| npm test | Tests |
`);

    // Create CODEBASE_CHANGELOG.md
    const changelogPath = path.join(testDir, 'CODEBASE_CHANGELOG.md');
    fs.writeFileSync(changelogPath, '# Changelog\n\nHistory here.');

    // Run check command
    const output = execSync(`node bin/cli.js check --dir ${testDir}`, {
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
    const agentsPath = path.join(testDir, 'AGENTS.md');
    fs.writeFileSync(agentsPath, `# Agents

| Trigger Words | Skill to Read |
|---------------|---------------|
| "test" | tdd-workflow |
`);

    // Create CODEBASE_ESSENTIALS.md without placeholders
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    fs.writeFileSync(essentialsPath, `# Essentials

## 2. Validation Matrix

| Command | Purpose |
|---------|---------|
| npm test | Run tests |
`);

    // Create CODEBASE_CHANGELOG.md
    const changelogPath = path.join(testDir, 'CODEBASE_CHANGELOG.md');
    fs.writeFileSync(changelogPath, '# Changelog\n\nHistory here.');

    // Run check command
    const output = execSync(`node bin/cli.js check --dir ${testDir}`, {
      cwd: projectRoot,
      encoding: 'utf-8'
    });

    // Should pass placeholder check
    assert.ok(output.includes('✓') || output.includes('No placeholders'), 'Should pass when no placeholders remain');
  });
});
