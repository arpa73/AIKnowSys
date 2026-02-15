import type { ToolRegistry, SearchResult } from './tool-registry.js';

/**
 * Search options for tool discovery
 */
export interface SearchOptions {
  /** Filter by tags (all tags must match) */
  tags?: string[];

  /** Maximum results to return (default: unlimited) */
  limit?: number;
}

/**
 * Tool search engine for dynamic toolset pattern
 * Provides pattern-based search with relevance ranking
 */
export class ToolSearch {
  constructor(private registry: ToolRegistry) {}

  /**
   * Search for tools using natural language query
   * 
   * Supports:
   * - Category filtering: "category:query" or "category:mutation"
   * - Keyword matching in name, description, tags
   * - Relevance scoring and ranking
   * 
   * @param query - Search query string
   * @param options - Optional search filters and limits
   * @returns Array of matching tools, ranked by relevance
   * 
   * @example
   * ```typescript
   * const search = new ToolSearch(registry);
   * 
   * // Simple keyword search
   * const results = search.search('session query');
   * 
   * // Category filter
   * const sqliteTools = search.search('category:sqlite');
   * 
   * // Tag filtering with limit
   * const sessionTools = search.search('sessions', { 
   *   tags: ['sqlite'], 
   *   limit: 5 
   * });
   * ```
   */
  search(query: string, options?: SearchOptions): SearchResult[] {
    // Delegate to registry's search implementation
    const results = this.registry.search(query, { tags: options?.tags });

    // Apply limit if specified
    if (options?.limit && options.limit > 0) {
      return results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Search within a specific category
   * Convenience method for category-filtered search
   * 
   * @param category - Category name (context, query, mutation, validation, sqlite)
   * @param keywords - Optional keywords to filter within category
   * @returns Matching tools from the specified category
   */
  searchInCategory(
    category: string,
    keywords?: string
  ): SearchResult[] {
    const categoryQuery = `category:${category}`;
    
    if (keywords && keywords.trim().length > 0) {
      // For keyword search within category, we need to:
      // 1. Get all tools in category
      // 2. Filter by keywords
      const categoryResults = this.registry.search(categoryQuery);
      const keywordLower = keywords.toLowerCase();
      
      return categoryResults.filter((result) => {
        const nameLower = result.name.toLowerCase();
        const descLower = result.description.toLowerCase();
        const tagsLower = result.tags.map((t) => t.toLowerCase());
        
        return (
          nameLower.includes(keywordLower) ||
          descLower.includes(keywordLower) ||
          tagsLower.some((tag) => tag.includes(keywordLower))
        );
      });
    }

    return this.registry.search(categoryQuery);
  }

  /**
   * Get all available categories with tool counts
   * @returns Formatted string describing available categories
   */
  getAvailableCategories(): string {
    return this.registry.getCategoriesOverview();
  }
}
