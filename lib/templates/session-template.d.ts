/**
 * Session template generator with YAML frontmatter
 * Phase B Mini - Context Query Completion
 *
 * YAML Frontmatter Format:
 * The generated session files use a simplified YAML subset for frontmatter:
 * - Simple key-value pairs (date, status, author)
 * - Arrays using inline bracket notation: ["item1", "item2"]
 * - String values are quoted for consistency
 *
 * Supported YAML features:
 * ✅ Simple strings (quoted)
 * ✅ Arrays with inline syntax: ["a", "b"]
 * ✅ Empty arrays: []
 *
 * Not supported (will cause parsing errors):
 * ❌ Nested objects
 * ❌ Multi-line array syntax ("- item")
 * ❌ Unquoted strings with special characters
 * ❌ YAML anchors/references
 *
 * If you need to manually edit session frontmatter, stick to the inline format:
 * topics: ["topic1", "topic2"]
 * files: ["path/to/file.ts"]
 */
export interface SessionTemplateMetadata {
    date?: string;
    topics?: string[];
    plan?: string | null;
    author?: string;
    files?: string[];
    status?: 'in-progress' | 'complete' | 'abandoned';
    title?: string;
}
/**
 * Generate session file content with YAML frontmatter
 */
export declare function generateSessionTemplate(metadata?: SessionTemplateMetadata): string;
//# sourceMappingURL=session-template.d.ts.map