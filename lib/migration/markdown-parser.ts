/**
 * Markdown parser with YAML frontmatter support
 * Parses .aiknowsys markdown files into structured data
 */

import yaml from 'yaml';

export interface ParseResult {
  /** Parsed YAML frontmatter as object */
  frontmatter: Record<string, any>;
  
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
   * @returns Parsed frontmatter and content
   */
  parse(markdown: string): ParseResult {
    const result: ParseResult = {
      frontmatter: {},
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
        result.frontmatter = {};
      }
    }
    
    // Extract content (trim leading/trailing whitespace)
    result.content = contentStr.trim();
    
    return result;
  }
  
  /**
   * Convert frontmatter and content back to markdown
   * @param frontmatter - Frontmatter object
   * @param content - Markdown content
   * @returns Combined markdown string with frontmatter
   */
  stringify(frontmatter: Record<string, any>, content: string): string {
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
