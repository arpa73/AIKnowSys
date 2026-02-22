/**
 * MCP Server Public API
 * 
 * Barrel export for clean imports from outside the mcp-server directory.
 * 
 * @example
 * // Instead of:
 * import { querySessionsSqlite } from './dist/mcp-server/src/tools/sqlite-query.js'
 * 
 * // Use:
 * import { querySessionsSqlite } from './dist/mcp-server/api.js'
 */

// SQLite Query Tools
export {
  querySessions,
  queryPlans,
  queryLearnedPatterns,
  searchContext,
  getDbStats
} from './tools/sqlite-query.js';

// Context Tools
export {
  getCriticalInvariants,
  getValidationMatrix
} from './tools/context.js';


// Skills Tools
export {
  findSkillForTask
} from './tools/skills.js';

// Utility Functions  
export {
  parseQueryParams
} from './utils/query-parser.js';

export {
  parseTimeExpression,
  formatDate
} from './utils/time-parser.js';
