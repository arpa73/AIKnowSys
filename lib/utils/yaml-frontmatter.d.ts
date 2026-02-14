/**
 * YAML frontmatter parsing and modification utilities
 * Phase B Mini - Context Query Completion
 */
/**
 * Parse YAML frontmatter from markdown file
 * @returns Frontmatter object and remaining content
 */
export declare function parseFrontmatter(fileContent: string): {
    frontmatter: Record<string, any>;
    content: string;
};
/**
 * Update frontmatter and regenerate file content
 */
export declare function updateFrontmatter(fileContent: string, updates: Record<string, any>): string;
//# sourceMappingURL=yaml-frontmatter.d.ts.map