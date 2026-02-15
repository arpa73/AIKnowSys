/**
 * Dynamic Toolset Pattern - Speakeasy Style
 * 
 * This module implements the 3-tool pattern for token-efficient MCP toolsets:
 * 1. Search tools (natural language discovery)
 * 2. Describe tools (lazy schema loading)
 * 3. Execute tools (dynamic invocation)
 * 
 * Benefits:
 * - 90%+ token reduction in tool definitions
 * - Constant token usage as toolset grows
 * - Natural language tool discovery
 * 
 * @module dynamic-toolset
 */

export { ToolRegistry } from './tool-registry.js';
export type { ToolMetadata, SearchResult } from './tool-registry.js';

export { ToolSearch } from './tool-search.js';
export type { SearchOptions } from './tool-search.js';

export { TOOL_METADATA, TOOL_CATEGORIES } from './tool-metadata.js';
export type { ToolCategory } from './tool-metadata.js';

export {
  searchToolsHandler,
  describeToolsHandler,
  executeToolHandler,
} from './handlers.js';
export type {
  SearchToolsResponse,
  DescribeToolsResponse,
  ExecuteToolResponse,
} from './handlers.js';
