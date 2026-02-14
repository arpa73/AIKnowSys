import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { init } from '../lib/commands/init.js';
import { check } from '../lib/commands/check.js';
import { sync } from '../lib/commands/sync.js';
import { audit } from '../lib/commands/audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('--essentials flag consistency across commands', () => {
  let testDir: string;

  beforeAll(() => {
    testDir = path.join(__dirname, 'tmp', `essentials-flag-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
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
    expect(fs.existsSync(path.join(testDir, customEssentials))).toBeTruthy();
    
    expect(!fs.existsSync(path.join(testDir, 'CODEBASE_ESSENTIALS.md'))).toBeTruthy();
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
      expect(true).toBeTruthy();
    } catch (error) {
      expect.fail(`Check should not throw: ${(error as Error).message}`);
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
    expect(agentsContent.includes(customEssentials)).toBeTruthy();
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
    expect(result).toBeTruthy();
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
      expect(fs.existsSync(path.join(defaultTestDir, 'CODEBASE_ESSENTIALS.md'))).toBeTruthy();
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
        expect(developerContent.includes(customEssentials)).toBeTruthy();
      }

      if (fs.existsSync(architectPath)) {
        const architectContent = fs.readFileSync(architectPath, 'utf-8');
        expect(architectContent.includes(customEssentials)).toBeTruthy();
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
      expect.fail('Should have thrown an error');
    } catch (error) {
      // Error should be thrown (health check failed)
      expect((error as Error).message.includes('Health check failed') || (error as Error).message.includes('failed')).toBeTruthy();
    }
  });
});
