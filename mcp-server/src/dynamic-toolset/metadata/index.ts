import type { ToolMetadata } from '../tool-registry.js';
import { CONTEXT_TOOLS } from './context-tools.js';
import { QUERY_TOOLS } from './query-tools.js';
import { SQLITE_TOOLS } from './sqlite-tools.js';
import { MUTATION_TOOLS } from './mutation-tools.js';
import { VALIDATION_TOOLS } from './validation-tools.js';

/**
 * Aggregated tool metadata from all categories
 * Exported for use by ToolRegistry and external modules
 */
export const TOOL_METADATA: ToolMetadata[] = [
  ...CONTEXT_TOOLS,
  ...QUERY_TOOLS,
  ...SQLITE_TOOLS,
  ...MUTATION_TOOLS,
  ...VALIDATION_TOOLS,
];

/**
 * Tool category definitions
 * Used for grouping and filtering tools
 */
export const TOOL_CATEGORIES = {
  context: {
    name: 'Context Discovery',
    description:
      'Load critical rules, plans, sessions, and skills without reading files',
  },
  query: {
    name: 'Query Operations',
    description: 'Search and query plans, sessions, patterns using file-based indexes',
  },
  sqlite: {
    name: 'SQLite Operations',
    description:
      'High-performance SQLite queries for sessions, plans, and patterns (10-100x faster)',
  },
  mutation: {
    name: 'Mutation Operations',
    description: 'Create and modify sessions and plans with atomic updates',
  },
  validation: {
    name: 'Validation Operations',
    description: 'Validate deliverables, TDD compliance, and skill formats',
  },
} as const;

export type ToolCategory = keyof typeof TOOL_CATEGORIES;

// Re-export category arrays for granular imports
export { CONTEXT_TOOLS, QUERY_TOOLS, SQLITE_TOOLS, MUTATION_TOOLS, VALIDATION_TOOLS };
