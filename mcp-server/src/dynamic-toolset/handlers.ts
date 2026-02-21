import type { ToolRegistry } from './tool-registry.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { AIFriendlyErrorBuilder } from '../../../lib/utils/error-builder.js';

/**
 * Response types for dynamic toolset handlers
 */
export interface SearchToolsResponse {
  success: boolean;
  tools: Array<{
    name: string;
    description: string;
    category: string;
    relevance_score: number;
  }>;
  categories_overview: string;
  total_found: number;
}

export interface DescribeToolsResponse {
  success: boolean;
  tools: Array<{
    name: string;
    description?: string;
    category?: string;
    tags?: string[];
    inputSchema?: any;
    error?: string;
  }>;
}

export interface ExecuteToolResponse {
  success: boolean;
  result?: any;
  error?: string;
  details?: any;
}

/**
 * Handler for aiknowsys_search_tools
 * Search for tools using natural language queries
 */
export async function searchToolsHandler(
  registry: ToolRegistry,
  args: {
    query: string;
    tags?: string[];
    limit?: number;
  }
) {
  const limit = args.limit ?? 5;
  
  // Search using registry
  const results = registry.search(args.query, { tags: args.tags });
  
  // Format results
  const tools = results.slice(0, limit).map((result) => ({
    name: result.name,
    description: result.description,
    category: result.category,
    relevance_score: result.score,
  }));
  
  const response = {
    success: true,
    tools,
    categories_overview: registry.getCategoriesOverview(),
    total_found: results.length,
  };

  return {
    content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
  };
}

/**
 * Handler for aiknowsys_describe_tools
 * Get detailed schemas for specific tools (lazy loading)
 */
export async function describeToolsHandler(
  registry: ToolRegistry,
  args: {
    tools: string[];
  }
) {
  const tools = args.tools.map((name) => {
    const tool = registry.get(name);
    
    if (!tool) {
      // Suggest similar tools
      const similar = registry.search(name, {}).slice(0, 3).map(t => t.name);
      const errorResponse = AIFriendlyErrorBuilder.toolNotFound(name, similar);
      return {
        name,
        ...errorResponse.error,
      };
    }
    
    return {
      name: tool.name,
      description: tool.description,
      category: tool.category,
      tags: tool.tags,
      inputSchema: zodToJsonSchema(tool.inputSchema),
    };
  });
  
  const response = {
    success: true,
    tools,
  };

  return {
    content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
  };
}

/**
 * Handler for aiknowsys_execute_tool
 * Execute a specific tool with validated arguments
 */
export async function executeToolHandler(
  registry: ToolRegistry,
  args: {
    tool: string;
    arguments: Record<string, any>;
  }
) {
  const tool = registry.get(args.tool);
  
  if (!tool) {
    // Suggest similar tools based on search
    const similar = registry.search(args.tool, {}).slice(0, 3).map(t => t.name);
    const errorResponse = AIFriendlyErrorBuilder.toolNotFound(args.tool, similar);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(errorResponse, null, 2) }],
    };
  }
  
  // Validate arguments against schema
  const validation = tool.inputSchema.safeParse(args.arguments);
  
  if (!validation.success) {
    // Create detailed error message with field names
    const firstIssue = validation.error.issues[0];
    const field = firstIssue.path.join('.') || 'arguments';
    const errors = validation.error.issues.map((issue) => {
      const fieldPath = issue.path.join('.');
      return fieldPath ? `${fieldPath}: ${issue.message}` : issue.message;
    });
    
    const errorResponse = AIFriendlyErrorBuilder.validationFailed(
      field,
      errors.join(', '),
      `Use aiknowsys_describe_tools to see the schema for '${args.tool}'`
    );
    
    // Include validation details for debugging
    // Only add details if error object supports it
    (errorResponse.error as any).details = validation.error.format();
    
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(errorResponse, null, 2) }],
    };
  }
  
  // Execute the tool
  try {
    const result = await tool.handler(validation.data);
    const response = {
      success: true,
      result,
    };
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
    };
  } catch (error: any) {
    const response = {
      success: false,
      error: error.message || 'Tool execution failed',
    };
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
    };
  }
}
