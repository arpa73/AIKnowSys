import { describe, it, beforeAll, afterAll, beforeEach, afterEach, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getDefaultConfig,
  loadConfig,
  saveConfig,
  validateConfig,
  isFeatureEnabled
} from '../dist/lib/config.js';
import { enableFeature, disableFeature, uninstall } from '../dist/lib/commands/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Config Utilities', () => {
  let testDir;

  beforeAll(() => {
    testDir = path.join(__dirname, 'tmp', `config-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('getDefaultConfig', () => {
    it('should return default configuration object', () => {
      const config = getDefaultConfig();
      
      expect(config.version).toBeTruthy();
      expect(config.features).toBeTruthy();
      expect(config.preferences).toBeTruthy();
      
      // Check default features
      expect(config.features.agents).toBe(true);
      expect(config.features.skills).toBe(true);
      expect(config.features.vscodeHooks).toBe(true);
      expect(config.features.sessionPersistence).toBe(true);
      expect(config.features.tddEnforcement).toBe(true);
      expect(config.features.openspec).toBe(false);
    });

    it('should return new object each time (not shared reference)', () => {
      const config1 = getDefaultConfig();
      const config2 = getDefaultConfig();
      
      expect(config1).not.toBe(config2);
      config1.features.agents = false;
      expect(config2.features.agents).toBe(true);
    });
  });

  describe('loadConfig', () => {
    it('should return default config when file does not exist', async () => {
      const config = await loadConfig(testDir);
      const defaults = getDefaultConfig();
      
      expect(config).toStrictEqual(defaults);
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
          openspec: true
        },
        preferences: {
          templateType: 'minimal',
          stackName: 'nextjs'
        }
      };
      
      fs.writeFileSync(configPath, JSON.stringify(customConfig, null, 2));
      
      const loaded = await loadConfig(testDir);
      expect(loaded).toStrictEqual(customConfig);
    });

    it('should handle malformed JSON gracefully', async () => {
      const configPath = path.join(testDir, '.aiknowsys.config.json');
      fs.writeFileSync(configPath, '{ invalid json }');
      
      const config = await loadConfig(testDir);
      const defaults = getDefaultConfig();
      
      expect(config).toStrictEqual(defaults);
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
      
      expect(loaded.features.agents).toBe(false);
      expect(loaded.features.skills).toBe(true);
      expect(loaded.preferences).toBeTruthy();
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
      
      expect(fs.existsSync(configPath)).toBeTruthy();
      
      const content = fs.readFileSync(configPath, 'utf8');
      const parsed = JSON.parse(content);
      
      expect(parsed).toStrictEqual(config);
      expect(content.includes('\n')).toBeTruthy();
    });

    it('should overwrite existing config file', async () => {
      const config1 = getDefaultConfig();
      await saveConfig(testDir, config1);
      
      const config2 = getDefaultConfig();
      config2.features.agents = false;
      await saveConfig(testDir, config2);
      
      const loaded = await loadConfig(testDir);
      expect(loaded.features.agents).toBe(false);
    });
  });

  describe('validateConfig', () => {
    it('should validate correct config structure', () => {
      const config = getDefaultConfig();
      const result = validateConfig(config);
      
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject config without version', () => {
      const config = { features: {}, preferences: {} };
      const result = validateConfig(config);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length > 0).toBeTruthy();
      expect(result.errors.some(e => e.includes('version'))).toBeTruthy();
    });

    it('should reject config without features object', () => {
      const config = { version: '1.0', preferences: {} };
      const result = validateConfig(config);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('features'))).toBeTruthy();
    });

    it('should warn about unknown features but still validate', () => {
      const config = getDefaultConfig();
      config.features.unknownFeature = true;
      const result = validateConfig(config);
      
      // Should still be valid (permissive validation)
      expect(result.valid).toBe(true);
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return true for enabled features', () => {
      const config = getDefaultConfig();
      
      expect(isFeatureEnabled(config, 'agents')).toBe(true);
      expect(isFeatureEnabled(config, 'skills')).toBe(true);
    });

    it('should return false for disabled features', () => {
      const config = getDefaultConfig();
      config.features.openspec = false;
      
      expect(isFeatureEnabled(config, 'openspec')).toBe(false);
    });

    it('should default to true for unknown features (backward compatibility)', () => {
      const config = getDefaultConfig();
      
      expect(isFeatureEnabled(config, 'nonexistentFeature')).toBe(true);
    });

    it('should handle missing features object gracefully', () => {
      const config = { version: '1.0' };
      
      expect(isFeatureEnabled(config, 'agents')).toBe(true);
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
        openspec: false
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
        
        expect(result.success).toBe(true);
        expect(result.installed).toBe(true);
        
        // Verify config was updated
        const configPath = path.join(tempDir, '.aiknowsys.config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        expect(config.features.sessionPersistence).toBe(true);
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
        
        expect(result.success).toBe(true);
        expect(result.alreadyEnabled).toBe(true);
      });
      
      it('should reject invalid feature name', async () => {
        await expect(async () => {
                    await enableFeature('invalidFeature', { 
                      dir: tempDir, 
                      _silent: true 
                    });
                  }).rejects.toThrow(/Invalid feature/);
      });
      
      it('should install sessionPersistence directories', async () => {
        await enableFeature('sessionPersistence', { 
          dir: tempDir, 
          _silent: true 
        });
        
        expect(fs.existsSync(path.join(tempDir, '.aiknowsys', 'sessions'))).toBeTruthy();
        expect(fs.existsSync(path.join(tempDir, '.aiknowsys', 'learned'))).toBeTruthy();
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
        
        expect(result.success).toBe(true);
        expect(result.filesRemoved).toBe(false);
        
        // Verify config was updated
        const configPath = path.join(tempDir, '.aiknowsys.config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        expect(config.features.sessionPersistence).toBe(false);
      });
      
      it('should handle already disabled feature', async () => {
        const result = await disableFeature('sessionPersistence', { 
          dir: tempDir, 
          _silent: true 
        });
        
        expect(result.success).toBe(true);
        expect(result.alreadyDisabled).toBe(true);
      });
      
      it('should reject invalid feature name', async () => {
        await expect(async () => {
                    await disableFeature('invalidFeature', { 
                      dir: tempDir, 
                      _silent: true 
                    });
                  }).rejects.toThrow(/Invalid feature/);
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
        
        expect(result.success).toBe(true);
        expect(result.filesRemoved > 0).toBeTruthy();
        
        // Verify core files removed
        expect(!fs.existsSync(path.join(tempDir, 'CODEBASE_ESSENTIALS.md'))).toBeTruthy();
        expect(!fs.existsSync(path.join(tempDir, 'AGENTS.md'))).toBeTruthy();
        expect(!fs.existsSync(path.join(tempDir, '.aiknowsys.config.json'))).toBeTruthy();
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
        expect(fs.existsSync(path.join(tempDir, '.aiknowsys', 'sessions', 'session.md'))).toBeTruthy();
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
        expect(!fs.existsSync(path.join(tempDir, '.aiknowsys'))).toBeTruthy();
      });
    });
  });
});
