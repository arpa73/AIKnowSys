/**
 * Init command module barrel file
 * Re-exports all init-related functionality for cleaner imports
 */

export { 
  AVAILABLE_STACKS, 
  TEMPLATE_PATHS,
  getProjectTypeName, 
  getLanguageName, 
  getFrameworkName 
} from './constants.js';

// @ts-ignore - JavaScript module, will be migrated later
export { getBasicProjectInfo, getTechStack, getWorkflowPreferences, getToolingDetails, askManualQuestions } from './prompts.js';

export { 
  buildValidationMatrix, 
  displayProjectSummary, 
  displayAIBootstrapPrompt, 
  displayManualSetupInstructions 
} from './display.js';

export { setupOpenSpec } from './openspec.js';

// @ts-ignore - JavaScript module, will be migrated later
export { createKnowledgeSystemFiles, installAgentsAndSkills, setupSessionPersistence, setupTDDEnforcement, setupHooks } from './templates.js';
