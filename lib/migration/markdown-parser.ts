/**
 * Markdown parser with YAML frontmatter support
 * Parses .aiknowsys markdown files into structured data
 */

import yaml from 'yaml';

export interface ParseResult<T = Record<string, unknown>> {
  /** Parsed YAML frontmatter as object */
  frontmatter: T;
  
  /** Markdown content after frontmatter */
  content: string;
  
  /** Parse errors encountered (if any) */
  errors?: string[];
}

/**
 * Parser for markdown files with YAML frontmatter
 */
export class MarkdownParser {
  /**
   * Parse markdown with YAML frontmatter
   * @param markdown - Raw markdown string
   * @returns ParseResult object containing:
   *   - frontmatter: Parsed YAML frontmatter (empty object if no frontmatter)
   *   - content: Markdown content after frontmatter
   *   - errors: Array of parse errors (empty if no errors)
   * 
   * @example
   * ```typescript
   * // Parse with typed frontmatter
   * const result = parser.parse<SessionFrontmatter>(markdown);
   * console.log(result.frontmatter.status); // Type-safe!
   * 
   * // Parse with generic frontmatter
   * const result = parser.parse(markdown);
   * console.log(result.frontmatter); // Record<string, unknown>
   * ```
   */
  parse<T = Record<string, unknown>>(markdown: string): ParseResult<T> {
    const result: ParseResult<T> = {
      frontmatter: {} as T,
      content: '',
      errors: []
    };
    
    // Normalize line endings (CRLF → LF)
    const normalized = markdown.replace(/\r\n/g, '\n');
    
    // Check for frontmatter delimiters (handles empty frontmatter too)
    const frontmatterMatch = normalized.match(/^---\n([\s\S]*?)^---\n?([\s\S]*)$/m);
    
    if (!frontmatterMatch) {
      // No frontmatter - entire content is markdown
      result.content = normalized.trim();
      return result;
    }
    
    const [, frontmatterStr, contentStr] = frontmatterMatch;
    
    // Parse YAML frontmatter
    if (frontmatterStr.trim()) {
      try {
        result.frontmatter = yaml.parse(frontmatterStr) || {};
      } catch (error) {
        result.errors?.push(`YAML parse error: ${(error as Error).message}`);
        // Continue with empty frontmatter
        result.frontmatter = {} as T;
      }
    }
    
    // Extract content (trim leading/trailing whitespace)
    result.content = contentStr.trim();
    
    return result;
  }
  
  /**
   * Convert frontmatter and content back to markdown
   * @param frontmatter - Frontmatter object (will be serialized to YAML)
   * @param content - Markdown content
   * @returns Combined markdown string with frontmatter delimiters
   * 
   * @example
   * ```typescript
   * const markdown = parser.stringify(
   *   { date: '2026-02-12', status: 'active' },
   *   '# Content'
   * );
   * // Returns:
   * // ---
   * // date: 2026-02-12
   * // status: active
   * // ---
   * // 
   * // # Content
   * ```
   */
  stringify(frontmatter: Record<string, unknown>, content: string): string {
    // If no frontmatter, return content as-is
    if (Object.keys(frontmatter).length === 0) {
      return content;
    }
    
    // Serialize frontmatter to YAML
    const yamlStr = yaml.stringify(frontmatter);
    
    // Combine with delimiters
    return `---\n${yamlStr}---\n\n${content}`;
  }
}
