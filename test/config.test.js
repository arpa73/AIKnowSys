import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getDefaultConfig,
  loadConfig,
  saveConfig,
  validateConfig,
  isFeatureEnabled
} from '../lib/config.js';
import { enableFeature, disableFeature, uninstall } from '../lib/commands/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Config Utilities', () => {
  let testDir;

  before(() => {
    testDir = path.join(__dirname, 'tmp', `config-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
  });

  after(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('getDefaultConfig', () => {
    it('should return default configuration object', () => {
      const config = getDefaultConfig();
      
      assert.ok(config.version, 'Should have version');
      assert.ok(config.features, 'Should have features object');
      assert.ok(config.preferences, 'Should have preferences object');
      
      // Check default features
      assert.strictEqual(config.features.agents, true, 'Agents should be enabled by default');
      assert.strictEqual(config.features.skills, true, 'Skills should be enabled by default');
      assert.strictEqual(config.features.vscodeHooks, true, 'VSCode hooks should be enabled by default');
      assert.strictEqual(config.features.sessionPersistence, true, 'Session persistence should be enabled by default');
      assert.strictEqual(config.features.tddEnforcement, true, 'TDD enforcement should be enabled by default');
      assert.strictEqual(config.features.openspec, false, 'OpenSpec should be disabled by default');
      assert.strictEqual(config.features.context7, false, 'Context7 should be disabled by default');
    });

    it('should return new object each time (not shared reference)', () => {
      const config1 = getDefaultConfig();
      const config2 = getDefaultConfig();
      
      assert.notStrictEqual(config1, config2, 'Should return new object');
      config1.features.agents = false;
      assert.strictEqual(config2.features.agents, true, 'Modifying one should not affect other');
    });
  });

  describe('loadConfig', () => {
    it('should return default config when file does not exist', async () => {
      const config = await loadConfig(testDir);
      const defaults = getDefaultConfig();
      
      assert.deepStrictEqual(config, defaults, 'Should return defaults when no config file exists');
    });

    it('should load and parse valid config file', async () => {
      const configPath = path.join(testDir, '.aiknowsys.config.json');
      const customConfig = {
        version: '1.0',
        features: {
          agents: false,
          skills: true,
          vscodeHooks: false,
          sessionPersistence: true,
          tddEnforcement: true,
          openspec: true,
          context7: false
        },
        preferences: {
          templateType: 'minimal',
          stackName: 'nextjs'
        }
      };
      
      fs.writeFileSync(configPath, JSON.stringify(customConfig, null, 2));
      
      const loaded = await loadConfig(testDir);
      assert.deepStrictEqual(loaded, customConfig, 'Should load custom config');
    });

    it('should handle malformed JSON gracefully', async () => {
      const configPath = path.join(testDir, '.aiknowsys.config.json');
      fs.writeFileSync(configPath, '{ invalid json }');
      
      const config = await loadConfig(testDir);
      const defaults = getDefaultConfig();
      
      assert.deepStrictEqual(config, defaults, 'Should return defaults on malformed JSON');
    });

    it('should merge partial config with defaults', async () => {
      const configPath = path.join(testDir, '.aiknowsys.config.json');
      const partialConfig = {
        version: '1.0',
        features: {
          agents: false
        }
      };
      
      fs.writeFileSync(configPath, JSON.stringify(partialConfig, null, 2));
      
      const loaded = await loadConfig(testDir);
      
      assert.strictEqual(loaded.features.agents, false, 'Should use custom value');
      assert.strictEqual(loaded.features.skills, true, 'Should use default for missing values');
      assert.ok(loaded.preferences, 'Should have default preferences');
    });
  });

  describe('saveConfig', () => {
    let configPath;

    beforeEach(() => {
      configPath = path.join(testDir, '.aiknowsys.config.json');
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
      }
    });

    it('should create config file with pretty-printed JSON', async () => {
      const config = getDefaultConfig();
      config.features.agents = false;
      
      await saveConfig(testDir, config);
      
      assert.ok(fs.existsSync(configPath), 'Config file should exist');
      
      const content = fs.readFileSync(configPath, 'utf8');
      const parsed = JSON.parse(content);
      
      assert.deepStrictEqual(parsed, config, 'Saved config should match input');
      assert.ok(content.includes('\n'), 'Should be pretty-printed');
    });

    it('should overwrite existing config file', async () => {
      const config1 = getDefaultConfig();
      await saveConfig(testDir, config1);
      
      const config2 = getDefaultConfig();
      config2.features.agents = false;
      await saveConfig(testDir, config2);
      
      const loaded = await loadConfig(testDir);
      assert.strictEqual(loaded.features.agents, false, 'Should have overwritten');
    });
  });

  describe('validateConfig', () => {
    it('should validate correct config structure', () => {
      const config = getDefaultConfig();
      const result = validateConfig(config);
      
      assert.strictEqual(result.valid, true, 'Valid config should pass');
      assert.strictEqual(result.errors.length, 0, 'Valid config should have no errors');
    });

    it('should reject config without version', () => {
      const config = { features: {}, preferences: {} };
      const result = validateConfig(config);
      
      assert.strictEqual(result.valid, false, 'Should reject config without version');
      assert.ok(result.errors.length > 0, 'Should have error messages');
      assert.ok(result.errors.some(e => e.includes('version')), 'Should mention missing version');
    });

    it('should reject config without features object', () => {
      const config = { version: '1.0', preferences: {} };
      const result = validateConfig(config);
      
      assert.strictEqual(result.valid, false, 'Should reject config without features');
      assert.ok(result.errors.some(e => e.includes('features')), 'Should mention missing features');
    });

    it('should warn about unknown features but still validate', () => {
      const config = getDefaultConfig();
      config.features.unknownFeature = true;
      const result = validateConfig(config);
      
      // Should still be valid (permissive validation)
      assert.strictEqual(result.valid, true, 'Should be permissive about unknown features');
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return true for enabled features', () => {
      const config = getDefaultConfig();
      
      assert.strictEqual(isFeatureEnabled(config, 'agents'), true);
      assert.strictEqual(isFeatureEnabled(config, 'skills'), true);
    });

    it('should return false for disabled features', () => {
      const config = getDefaultConfig();
      config.features.openspec = false;
      
      assert.strictEqual(isFeatureEnabled(config, 'openspec'), false);
    });

    it('should default to true for unknown features (backward compatibility)', () => {
      const config = getDefaultConfig();
      
      assert.strictEqual(isFeatureEnabled(config, 'nonexistentFeature'), true, 
        'Unknown features should default to enabled for backward compatibility');
    });

    it('should handle missing features object gracefully', () => {
      const config = { version: '1.0' };
      
      assert.strictEqual(isFeatureEnabled(config, 'agents'), true, 
        'Should default to enabled when features object missing');
    });
  });

  describe('Config Commands', () => {
    let tempDir;
    
    beforeEach(async () => {
      // Create temp directory for each test
      tempDir = fs.mkdtempSync(path.join(__dirname, 'tmp-config-'));
      
      // Create minimal project structure
      fs.mkdirSync(path.join(tempDir, '.github'), { recursive: true });
      fs.mkdirSync(path.join(tempDir, '.aiknowsys'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'AGENTS.md'), '# Agents\n\n{{SKILL_MAPPING}}');
      
      // Create default config with all features disabled
      const config = getDefaultConfig();
      config.features = {
        agents: false,
        skills: false,
        vscodeHooks: false,
        sessionPersistence: false,
        tddEnforcement: false,
        openspec: false,
        context7: false
      };
      await saveConfig(tempDir, config);
    });
    
    // afterEach runs after each test in this describe block
    afterEach(() => {
      // Clean up temp directory
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
    
    describe('enableFeature', () => {
      it('should enable a disabled feature in config', async () => {
        const result = await enableFeature('sessionPersistence', { 
          dir: tempDir, 
          _silent: true 
        });
        
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.installed, true);
        
        // Verify config was updated
        const configPath = path.join(tempDir, '.aiknowsys.config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        assert.strictEqual(config.features.sessionPersistence, true);
      });
      
      it('should handle already enabled feature', async () => {
        // Enable first time
        await enableFeature('sessionPersistence', { 
          dir: tempDir, 
          _silent: true 
        });
        
        // Try enabling again
        const result = await enableFeature('sessionPersistence', { 
          dir: tempDir, 
          _silent: true 
        });
        
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.alreadyEnabled, true);
      });
      
      it('should reject invalid feature name', async () => {
        await assert.rejects(
          async () => {
            await enableFeature('invalidFeature', { 
              dir: tempDir, 
              _silent: true 
            });
          },
          { message: /Invalid feature/ }
        );
      });
      
      it('should install sessionPersistence directories', async () => {
        await enableFeature('sessionPersistence', { 
          dir: tempDir, 
          _silent: true 
        });
        
        assert.ok(fs.existsSync(path.join(tempDir, '.aiknowsys', 'sessions')));
        assert.ok(fs.existsSync(path.join(tempDir, '.aiknowsys', 'learned')));
      });
    });
    
    describe('disableFeature', () => {
      it('should disable an enabled feature in config', async () => {
        // Enable first
        await enableFeature('sessionPersistence', { 
          dir: tempDir, 
          _silent: true 
        });
        
        // Then disable
        const result = await disableFeature('sessionPersistence', { 
          dir: tempDir, 
          _silent: true,
          keepFiles: true
        });
        
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.filesRemoved, false);
        
        // Verify config was updated
        const configPath = path.join(tempDir, '.aiknowsys.config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        assert.strictEqual(config.features.sessionPersistence, false);
      });
      
      it('should handle already disabled feature', async () => {
        const result = await disableFeature('sessionPersistence', { 
          dir: tempDir, 
          _silent: true 
        });
        
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.alreadyDisabled, true);
      });
      
      it('should reject invalid feature name', async () => {
        await assert.rejects(
          async () => {
            await disableFeature('invalidFeature', { 
              dir: tempDir, 
              _silent: true 
            });
          },
          { message: /Invalid feature/ }
        );
      });
    });
    
    describe('uninstall', () => {
      it('should remove core AIKnowSys files', async () => {
        // Create some files to remove
        fs.writeFileSync(path.join(tempDir, 'CODEBASE_ESSENTIALS.md'), '# Essentials');
        fs.writeFileSync(path.join(tempDir, 'CODEBASE_CHANGELOG.md'), '# Changelog');
        
        const result = await uninstall({ 
          dir: tempDir, 
          _silent: true,
          yes: true,
          _keepData: true
        });
        
        assert.strictEqual(result.success, true);
        assert.ok(result.filesRemoved > 0);
        
        // Verify core files removed
        assert.ok(!fs.existsSync(path.join(tempDir, 'CODEBASE_ESSENTIALS.md')));
        assert.ok(!fs.existsSync(path.join(tempDir, 'AGENTS.md')));
        assert.ok(!fs.existsSync(path.join(tempDir, '.aiknowsys.config.json')));
      });
      
      it('should preserve user data when requested', async () => {
        // Create user data
        const sessionsDir = path.join(tempDir, '.aiknowsys', 'sessions');
        fs.mkdirSync(sessionsDir, { recursive: true });
        fs.writeFileSync(path.join(sessionsDir, 'session.md'), '# Session');
        
        await uninstall({ 
          dir: tempDir, 
          _silent: true,
          yes: true,
          _keepData: true
        });
        
        // Verify user data preserved
        assert.ok(fs.existsSync(path.join(tempDir, '.aiknowsys', 'sessions', 'session.md')));
      });
      
      it('should remove user data when not requested to keep', async () => {
        // Create user data
        const sessionsDir = path.join(tempDir, '.aiknowsys', 'sessions');
        fs.mkdirSync(sessionsDir, { recursive: true });
        fs.writeFileSync(path.join(sessionsDir, 'session.md'), '# Session');
        
        await uninstall({ 
          dir: tempDir, 
          _silent: true,
          yes: true,
          _keepData: false
        });
        
        // Verify user data removed
        assert.ok(!fs.existsSync(path.join(tempDir, '.aiknowsys')));
      });
    });
  });
});
