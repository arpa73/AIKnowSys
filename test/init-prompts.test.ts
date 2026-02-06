import { describe, it, beforeAll, afterAll, expect } from 'vitest';
describe('Feature Preferences Prompts', () => {
  let originalInquirer: any;
  let mockPrompt: any;

  beforeAll(async () => {
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

  afterAll(async () => {
    // Restore original
    const inquirerModule = await import('inquirer');
    inquirerModule.default.prompt = originalInquirer;
  });

  describe('getFeaturePreferences', () => {
    it('should export getFeaturePreferences function', async () => {
      const prompts = await import('../lib/commands/init/prompts.js');
      expect(typeof prompts.getFeaturePreferences === 'function').toBeTruthy();
    });

    it('should return feature selections', async () => {
      const prompts = await import('../lib/commands/init/prompts.js');
      const { getFeaturePreferences } = prompts as any;
      
      const result = await getFeaturePreferences();
      expect(result).toBeTruthy();
      expect(result.features).toBeTruthy();
      expect(Array.isArray(result.features)).toBeTruthy();
    });

    it('should include core features in defaults', async () => {
      const prompts = await import('../lib/commands/init/prompts.js');
      const { getFeaturePreferences } = prompts as any;
      
      const result = await getFeaturePreferences();
      
      // Default features should be selected
      expect(result.features.includes('agents')).toBeTruthy();
      expect(result.features.includes('skills')).toBeTruthy();
      expect(result.features.includes('vscodeHooks')).toBeTruthy();
      expect(result.features.includes('sessionPersistence')).toBeTruthy();
      expect(result.features.includes('tddEnforcement')).toBeTruthy();
    });
  });
});
