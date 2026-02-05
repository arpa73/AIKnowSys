/**
 * Shared utilities for parsing CODEBASE_ESSENTIALS.md
 * Used by check.ts and compress-essentials.ts
 */

export interface EssentialsSection {
  name: string;
  startLine: number;
  endLine: number;
  lines: number;
  content: string;
}

/**
 * Parse ESSENTIALS markdown into sections with line counts
 * @param content - Full ESSENTIALS file content
 * @returns Array of section objects with name, startLine, endLine, lines, content
 */
export function parseEssentialsSections(content: string): EssentialsSection[] {
  const lines: string[] = content.split('\n');
  const sections: EssentialsSection[] = [];
  let currentSection: EssentialsSection | null = null;
  let sectionStartLine = 0;
  let sectionContent: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line: string = lines[i];
    
    // Detect section headers (## Something)
    if (line.match(/^##\s+/)) {
      if (currentSection) {
        currentSection.lines = i - sectionStartLine;
        currentSection.content = sectionContent.join('\n');
        currentSection.endLine = i - 1;
        sections.push(currentSection);
      }
      
      currentSection = {
        name: line.replace(/^##\s+/, '').replace(/^\d+\.\s+/, '').trim(),
        startLine: i,
        lines: 0,
        content: '',
        endLine: 0
      };
      sectionStartLine = i;
      sectionContent = [line];
    } else if (currentSection) {
      sectionContent.push(line);
    }
  }
  
  // Add last section
  if (currentSection) {
    currentSection.lines = lines.length - sectionStartLine;
    currentSection.content = sectionContent.join('\n');
    currentSection.endLine = lines.length - 1;
    sections.push(currentSection);
  }
  
  return sections;
}

/**
 * Compression thresholds and configuration
 */
export const COMPRESSION_THRESHOLDS = {
  // Total file size thresholds
  TOTAL_WARN: 800,           // Warn when file exceeds this line count
  TOTAL_ERROR: 1500,         // Error when file exceeds this line count
  
  // Section size thresholds
  SECTION_VERBOSE: 150,      // Lines before section is considered verbose
  SECTION_CODE_BLOCK: 100,   // Lines threshold for sections with code blocks
  
  // Savings estimation percentages
  VERBOSE_SAVINGS_PCT: 0.7,  // 70% savings for sections with code examples
  DEFAULT_SAVINGS_PCT: 0.3,  // 30% savings for text-only verbose sections
  
  // Future: Auto-extraction threshold
  AUTO_EXTRACT_THRESHOLD: 20 // Lines for auto mode (Phase 3.5)
} as const;
