import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

describe('Feature Preferences Prompts', () => {
  let originalInquirer: any;
  let mockPrompt: any;

  before(async () => {
    // Save original inquirer
    const inquirerModule = await import('inquirer');
    originalInquirer = inquirerModule.default.prompt;
    
    // Create mock
    mockPrompt = async (questions: any) => {
      // Return mock answers based on the question
      if (Array.isArray(questions)) {
        const result: any = {};
        for (const q of questions) {
          if (q.name === 'features' && q.type === 'checkbox') {
            // Return default features
            result.features = q.default || [];
          }
        }
        return result;
      }
      return {};
    };
    
    // Replace inquirer.prompt
    inquirerModule.default.prompt = mockPrompt;
  });

  after(async () => {
    // Restore original
    const inquirerModule = await import('inquirer');
    inquirerModule.default.prompt = originalInquirer;
  });

  describe('getFeaturePreferences', () => {
    it('should export getFeaturePreferences function', async () => {
      const prompts = await import('../lib/commands/init/prompts.js');
      assert.ok(typeof prompts.getFeaturePreferences === 'function', 'getFeaturePreferences should be a function');
    });

    it('should return feature selections', async () => {
      const prompts = await import('../lib/commands/init/prompts.js');
      const { getFeaturePreferences } = prompts as any;
      
      const result = await getFeaturePreferences();
      assert.ok(result, 'Should return result');
      assert.ok(result.features, 'Should have features property');
      assert.ok(Array.isArray(result.features), 'features should be an array');
    });

    it('should include core features in defaults', async () => {
      const prompts = await import('../lib/commands/init/prompts.js');
      const { getFeaturePreferences } = prompts as any;
      
      const result = await getFeaturePreferences();
      
      // Default features should be selected
      assert.ok(result.features.includes('agents'), 'agents should be in defaults');
      assert.ok(result.features.includes('skills'), 'skills should be in defaults');
      assert.ok(result.features.includes('vscodeHooks'), 'vscodeHooks should be in defaults');
      assert.ok(result.features.includes('sessionPersistence'), 'sessionPersistence should be in defaults');
      assert.ok(result.features.includes('tddEnforcement'), 'tddEnforcement should be in defaults');
    });
  });
});
