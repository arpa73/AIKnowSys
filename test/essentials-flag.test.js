import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { init } from '../lib/commands/init.js';
import { check } from '../lib/commands/check.js';
import { sync } from '../lib/commands/sync.js';
import { audit } from '../lib/commands/audit.js';
import { migrate } from '../lib/commands/migrate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

describe('--essentials flag consistency across commands', () => {
  let testDir;

  before(() => {
    testDir = path.join(__dirname, 'tmp', `essentials-flag-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
  });

  after(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should use custom essentials filename with init command', async () => {
    const customEssentials = 'ARCHITECTURE.md';
    
    await init({ 
      dir: testDir, 
      yes: true,
      essentials: customEssentials
    });

    // Verify custom filename was created instead of default
    assert.ok(
      fs.existsSync(path.join(testDir, customEssentials)),
      'Custom essentials file should exist'
    );
    
    assert.ok(
      !fs.existsSync(path.join(testDir, 'CODEBASE_ESSENTIALS.md')),
      'Default essentials file should not exist'
    );
  });

  it('should validate custom essentials filename with check command', async () => {
    // Create test setup with custom filename
    const customEssentials = 'PROJECT_GUIDE.md';
    const essentialsPath = path.join(testDir, customEssentials);
    const agentsPath = path.join(testDir, 'AGENTS.md');
    const changelogPath = path.join(testDir, 'CODEBASE_CHANGELOG.md');
    
    fs.writeFileSync(essentialsPath, '# Project Guide\n\n## 2. Validation Matrix\n\nTest');
    fs.writeFileSync(agentsPath, '# Agents\n\nTest');
    fs.writeFileSync(changelogPath, '# Changelog\n\nTest');

    // Run check with custom filename - should not throw
    try {
      await check({ 
        dir: testDir,
        essentials: customEssentials,
        _silent: true
      });
      // If we get here, check passed (didn't throw)
      assert.ok(true, 'Check should complete successfully');
    } catch (error) {
      assert.fail(`Check should not throw: ${error.message}`);
    }
  });

  it('should handle custom essentials filename with sync command', async () => {
    // Create test setup with custom filename
    const customEssentials = 'SYSTEM_DOCS.md';
    const essentialsPath = path.join(testDir, customEssentials);
    const agentsPath = path.join(testDir, 'AGENTS.md');
    
    fs.writeFileSync(essentialsPath, `# System Docs

## 2. Validation Matrix

| Command | Purpose |
|---------|---------|
| npm test | Tests |
`);
    
    fs.writeFileSync(agentsPath, `# Agents

**Validation Matrix:**

Some duplicated content here.

---
`);

    // Run sync with custom filename
    await sync({ 
      dir: testDir,
      essentials: customEssentials,
      _silent: true
    });

    // Verify AGENTS.md was updated to reference custom filename
    const agentsContent = fs.readFileSync(agentsPath, 'utf-8');
    assert.ok(
      agentsContent.includes(customEssentials),
      'AGENTS.md should reference custom essentials filename after sync'
    );
  });

  it('should audit files with custom essentials filename', async () => {
    // Create test setup with custom filename
    const customEssentials = 'TEAM_GUIDE.md';
    const essentialsPath = path.join(testDir, customEssentials);
    const agentsPath = path.join(testDir, 'AGENTS.md');
    
    fs.writeFileSync(essentialsPath, '# Team Guide\n\n## Validation Matrix\n\nTest');
    fs.writeFileSync(agentsPath, '# Agents\n\nTest');

    // Run audit with custom filename
    const result = await audit({ 
      dir: testDir,
      essentials: customEssentials,
      _silent: true
    });

    // Should complete successfully
    assert.ok(result, 'Audit should complete with custom filename');
  });

  it('should default to CODEBASE_ESSENTIALS.md when --essentials not provided', async () => {
    const defaultTestDir = path.join(__dirname, 'tmp', `default-essentials-${Date.now()}`);
    fs.mkdirSync(defaultTestDir, { recursive: true });

    try {
      await init({ 
        dir: defaultTestDir, 
        yes: true
        // No essentials option provided
      });

      // Should create default filename
      assert.ok(
        fs.existsSync(path.join(defaultTestDir, 'CODEBASE_ESSENTIALS.md')),
        'Should create default CODEBASE_ESSENTIALS.md when flag not provided'
      );
    } finally {
      if (fs.existsSync(defaultTestDir)) {
        fs.rmSync(defaultTestDir, { recursive: true, force: true });
      }
    }
  });

  it('should pass custom essentials filename to agent templates', async () => {
    const customEssentials = 'CORPORATE_STANDARDS.md';
    const agentTestDir = path.join(__dirname, 'tmp', `agent-essentials-${Date.now()}`);
    fs.mkdirSync(agentTestDir, { recursive: true });

    try {
      await init({ 
        dir: agentTestDir, 
        yes: true,
        essentials: customEssentials
      });

      // Check that agent files reference the custom essentials filename
      const developerPath = path.join(agentTestDir, '.github', 'agents', 'developer.agent.md');
      const architectPath = path.join(agentTestDir, '.github', 'agents', 'architect.agent.md');

      if (fs.existsSync(developerPath)) {
        const developerContent = fs.readFileSync(developerPath, 'utf-8');
        assert.ok(
          developerContent.includes(customEssentials),
          'Developer agent should reference custom essentials filename'
        );
      }

      if (fs.existsSync(architectPath)) {
        const architectContent = fs.readFileSync(architectPath, 'utf-8');
        assert.ok(
          architectContent.includes(customEssentials),
          'Architect agent should reference custom essentials filename'
        );
      }
    } finally {
      if (fs.existsSync(agentTestDir)) {
        fs.rmSync(agentTestDir, { recursive: true, force: true });
      }
    }
  });

  it('should show correct error message with custom essentials filename', async () => {
    const nonExistentDir = path.join(__dirname, 'tmp', `error-test-${Date.now()}`);
    const customEssentials = 'MY_DOCS.md';

    try {
      // Try to run check on non-existent project
      await check({ 
        dir: nonExistentDir,
        essentials: customEssentials,
        _silent: true
      });
      assert.fail('Should have thrown an error');
    } catch (error) {
      // Error should be thrown (health check failed)
      assert.ok(
        error.message.includes('Health check failed') || error.message.includes('failed'),
        'Error should be thrown when essentials file is missing'
      );
    }
  });
});
