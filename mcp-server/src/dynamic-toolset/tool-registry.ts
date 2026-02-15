import type { z } from 'zod';

/**
 * Tool metadata for dynamic toolset registration
 */
export interface ToolMetadata {
  /** Unique tool name (e.g., 'get_critical_invariants') */
  name: string;

  /** Human-readable description for search */
  description: string;

  /** Category for filtering (context, query, mutation, validation, sqlite) */
  category: string;

  /** Tags for additional filtering and search */
  tags: string[];

  /** Zod schema for input validation (any Zod type) */
  inputSchema: z.ZodTypeAny;

  /** Tool implementation handler */
  handler: (args: any) => Promise<any>;
}

/**
 * Search result with tool metadata and relevance score
 */
export interface SearchResult extends ToolMetadata {
  /** Relevance score (higher = better match) */
  score: number;
}

/**
 * Tool registry for dynamic toolset pattern
 * Stores tool metadata and provides search/retrieval operations
 */
export class ToolRegistry {
  private tools: Map<string, ToolMetadata>;
  private categoryIndex: Map<string, Set<string>>;

  constructor() {
    this.tools = new Map();
    this.categoryIndex = new Map();
  }

  /**
   * Register a tool with metadata
   * If tool already exists, it will be updated
   */
  register(tool: ToolMetadata): void {
    // Store tool
    this.tools.set(tool.name, tool);

    // Update category index
    if (!this.categoryIndex.has(tool.category)) {
      this.categoryIndex.set(tool.category, new Set());
    }
    this.categoryIndex.get(tool.category)!.add(tool.name);
  }

  /**
   * Get a tool by exact name
   * Returns undefined if not found
   */
  get(name: string): ToolMetadata | undefined {
    if (!name) {
      return undefined;
    }
    return this.tools.get(name);
  }

  /**
   * Search for tools using keywords and filters
   * @param query - Search query (supports "category:name" prefix)
   * @param filters - Optional filters (tags)
   * @returns Array of matching tools, ranked by relevance
   */
  search(
    query: string,
    filters?: { tags?: string[] }
  ): SearchResult[] {
    // Handle empty query - return empty array
    if (!query || query.trim().length === 0) {
      return [];
    }

    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();

    // Check for category filter (category:name)
    const categoryMatch = queryLower.match(/^category:(\w+)$/);
    if (categoryMatch) {
      const categoryName = categoryMatch[1];
      const toolNames = this.categoryIndex.get(categoryName);
      if (toolNames) {
        for (const name of toolNames) {
          const tool = this.tools.get(name)!;
          
          // Apply tag filters if provided
          if (filters?.tags && filters.tags.length > 0) {
            const hasAllTags = filters.tags.every((tag) =>
              tool.tags.includes(tag)
            );
            if (!hasAllTags) {
              continue;
            }
          }

          results.push({ ...tool, score: 100 }); // Category match = high score
        }
      }
      return results;
    }

    // Keyword-based search
    const keywords = queryLower.split(/\s+/).filter((k) => k.length > 0);

    for (const tool of this.tools.values()) {
      // Apply tag filters if provided
      if (filters?.tags && filters.tags.length > 0) {
        const hasAllTags = filters.tags.every((tag) =>
          tool.tags.includes(tag)
        );
        if (!hasAllTags) {
          continue;
        }
      }

      let score = 0;
      const nameLower = tool.name.toLowerCase();
      const descLower = tool.description.toLowerCase();
      const tagsLower = tool.tags.map((t) => t.toLowerCase());

      for (const keyword of keywords) {
        // Exact name match (highest priority)
        if (nameLower === keyword) {
          score += 100;
        }
        // Name contains keyword
        else if (nameLower.includes(keyword)) {
          score += 50;
        }

        // Description contains keyword
        if (descLower.includes(keyword)) {
          score += 20;
        }

        // Tag matches keyword
        if (tagsLower.some((tag) => tag.includes(keyword))) {
          score += 10;
        }
      }

      if (score > 0) {
        results.push({ ...tool, score });
      }
    }

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);

    return results;
  }

  /**
   * Get overview of all categories and tool counts
   * Returns formatted string for display
   */
  getCategoriesOverview(): string {
    if (this.categoryIndex.size === 0) {
      return 'No tools registered yet';
    }

    const lines: string[] = ['Available tool categories:'];

    for (const [category, toolNames] of this.categoryIndex.entries()) {
      lines.push(`  - ${category}: ${toolNames.size} tool${toolNames.size !== 1 ? 's' : ''}`);
    }

    return lines.join('\n');
  }

  /**
   * Get all registered tools
   * Returns array of all tool metadata
   */
  getAllTools(): ToolMetadata[] {
    return Array.from(this.tools.values());
  }
}
