/**
 * Tool metadata re-export module
 * 
 * This module maintains backward compatibility by re-exporting
 * tool metadata and categories from the metadata/ directory.
 * 
 * The actual tool definitions are now organized by category in:
 * - metadata/context-tools.ts (5 tools)
 * - metadata/query-tools.ts (10 tools)
 * - metadata/sqlite-tools.ts (5 tools)
 * - metadata/mutation-tools.ts (13 tools)
 * - metadata/validation-tools.ts (3 tools)
 */

export { TOOL_METADATA, TOOL_CATEGORIES } from './metadata/index.js';
export type { ToolCategory } from './metadata/index.js';
