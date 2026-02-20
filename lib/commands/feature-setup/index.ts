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
  getFeaturePreferences,
  getToolingDetails, 
  askManualQuestions 
} from './prompts.js';

export type { 
  ProjectAnswers,
  BasicProjectInfo,
  TechStackInfo,
  WorkflowPreferences,
  FeaturePreferences,
  ToolingDetails
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
  setupHooks 
} from './templates.js';

export type { InstallOptions } from './templates.js';


