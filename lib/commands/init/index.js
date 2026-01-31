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

export { 
  getBasicProjectInfo, 
  getTechStack, 
  getWorkflowPreferences, 
  getToolingDetails,
  askManualQuestions 
} from './prompts.js';

export { 
  buildValidationMatrix, 
  displayProjectSummary, 
  displayAIBootstrapPrompt, 
  displayManualSetupInstructions 
} from './display.js';

export { setupOpenSpec } from './openspec.js';

export {
  createKnowledgeSystemFiles,
  installAgentsAndSkills,
  setupSessionPersistence,
  setupTDDEnforcement,
  setupVSCodeHooks
} from './templates.js';
