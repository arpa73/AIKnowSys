/**
 * Query Mode Utilities
 * 
 * Shared utilities for progressive detail mode queries.
 * Extracts common logic to follow DRY (Don't Repeat Yourself) principle.
 */

import type { QueryMode } from '../types/index.js';

/**
 * Determine effective query mode from options
 * Handles legacy includeContent flag for backward compatibility
 * 
 * @param options - Options object with optional mode and includeContent
 * @returns Resolved query mode ('preview' | 'metadata' | 'section' | 'full')
 * 
 * @example
 * // Default to metadata
 * resolveQueryMode({}) // => 'metadata'
 * 
 * // Explicit mode
 * resolveQueryMode({ mode: 'preview' }) // => 'preview'
 * 
 * // Legacy support
 * resolveQueryMode({ includeContent: true }) // => 'full'
 * 
 * // Legacy takes precedence over mode
 * resolveQueryMode({ mode: 'preview', includeContent: true }) // => 'full'
 */
export function resolveQueryMode(
  options: { mode?: QueryMode; includeContent?: boolean }
): QueryMode {
  // Legacy flag takes precedence for backward compatibility
  if (options.includeContent === true) {
    return 'full';
  }
  
  // Use explicit mode or default to metadata (most efficient default)
  return options.mode || 'metadata';
}

/**
 * Extract specific section from markdown content
 * 
 * Finds a markdown heading and extracts content until the next heading of same or higher level.
 * 
 * @param content - Full markdown content
 * @param sectionHeading - Section to extract (e.g., "## Progress", "### Implementation")
 * @returns Object with extracted section content and found status
 * 
 * @example
 * const markdown = `
 * # Document
 * 
 * ## Goal
 * Implement feature
 * 
 * ## Progress
 * Step 1 complete
 * Step 2 in progress
 * 
 * ## Next Steps
 * Continue implementation
 * `;
 * 
 * extractMarkdownSection(markdown, '## Progress')
 * // => {
 * //   content: '## Progress\nStep 1 complete\nStep 2 in progress',
 * //   found: true
 * // }
 * 
 * extractMarkdownSection(markdown, '## Unknown')
 * // => { content: '', found: false }
 */
export function extractMarkdownSection(
  content: string,
  sectionHeading: string
): { content: string; found: boolean } {
  // Escape special regex characters in heading
  const escapedHeading = sectionHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Match heading (case-insensitive, allow trailing whitespace)
  const sectionRegex = new RegExp(`^${escapedHeading}\\s*$`, 'gim');
  const sectionMatch = content.match(sectionRegex);
  
  if (!sectionMatch) {
    return { content: '', found: false };
  }
  
  // Find section start position
  const sectionStart = content.indexOf(sectionMatch[0]);
  
  // Find next heading at same or higher level
  // E.g., if looking for "## Progress", stop at next "##" or "#"
  const headingLevel = (sectionHeading.match(/^#+/) || [''])[0].length;
  const nextHeadingPattern = `^#{1,${headingLevel}}\\s`;
  const nextHeadingRegex = new RegExp(nextHeadingPattern, 'gm');
  
  // Search for next heading AFTER our section starts
  const remainingContent = content.substring(sectionStart + sectionMatch[0].length);
  const nextHeadingMatch = remainingContent.match(nextHeadingRegex);
  
  let sectionEnd: number;
  if (nextHeadingMatch) {
    // Stop before next heading of same/higher level
    sectionEnd = sectionStart + sectionMatch[0].length + remainingContent.indexOf(nextHeadingMatch[0]);
  } else {
    // No next heading - extract to end of document
    sectionEnd = content.length;
  }
  
  const extractedContent = content.substring(sectionStart, sectionEnd).trim();
  
  return {
    content: extractedContent,
    found: true
  };
}

/**
 * Query mode constants (magic numbers replaced with named constants)
 */
export const QUERY_LIMITS = {
  /** Maximum sessions shown in preview mode (ultra-lightweight browsing) */
  PREVIEW_SESSION_LIMIT: 20,
  
  /** Maximum plans shown in preview mode (ultra-lightweight browsing) */
  PREVIEW_PLAN_LIMIT: 20,
  
  /** Maximum unique topics in stats aggregation (top N most used) */
  MAX_UNIQUE_TOPICS: 10,
  
  /** Default search result limit */
  DEFAULT_SEARCH_LIMIT: 10,
} as const;
