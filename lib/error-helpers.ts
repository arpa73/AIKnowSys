/**
 * Error handling utilities for AIKnowSys
 * Provides structured errors with helpful suggestions and documentation links
 */

/**
 * Logger interface for error formatting
 */
interface Logger {
  error(message: string): void;
  info(message: string): void;
  white(message: string): void;
  cyan(message: string): void;
  blank(): void;
}

/**
 * AIKnowSys structured error with helpful suggestions
 * 
 * @example
 * throw new AIKnowSysError(
 *   'CODEBASE_ESSENTIALS.md not found',
 *   'Create it by running:\n  aiknowsys scan  (from existing code)\n  aiknowsys init   (from scratch)',
 *   'https://github.com/arpa73/AIKnowSys#getting-started'
 * );
 */
export class AIKnowSysError extends Error {
  public readonly suggestion: string;
  public readonly learnMore: string | null;

  /**
   * @param message - What went wrong
   * @param suggestion - How to fix it
   * @param learnMore - URL to documentation (optional)
   */
  constructor(message: string, suggestion: string, learnMore: string | null = null) {
    super(message);
    this.suggestion = suggestion;
    this.learnMore = learnMore;
    this.name = 'AIKnowSysError';
    
    // Maintain proper stack trace (V8 engine)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AIKnowSysError);
    }
  }
  
  /**
   * Format error with logger for consistent display
   * @param log - Logger instance with error(), info() methods
   */
  format(log: Logger): void {
    log.error(this.message);
    log.blank();
    
    if (this.suggestion) {
      log.info('💡 How to fix:');
      // Split multi-line suggestions and indent them
      const lines = this.suggestion.split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          log.white(`   ${line}`);
        } else {
          log.blank();
        }
      });
      log.blank();
    }
    
    if (this.learnMore) {
      log.cyan(`📚 Learn more: ${this.learnMore}`);
      log.blank();
    }
  }
  
  /**
   * Get plain text version (for silent mode or testing)
   * @returns Formatted error message
   */
  toPlainText(): string {
    let text = `✗ ${this.message}\n`;
    
    if (this.suggestion) {
      text += `\n💡 How to fix:\n${this.suggestion}\n`;
    }
    
    if (this.learnMore) {
      text += `\n📚 Learn more: ${this.learnMore}\n`;
    }
    
    return text;
  }
}

/**
 * Common error templates for consistency
 */
export const ErrorTemplates = {
  /**
   * File not found error
   * @param filename - Name of missing file
   * @param suggestions - Array of command suggestions
   * @returns AIKnowSysError instance
   */
  fileNotFound(filename: string, suggestions: string[] = []): AIKnowSysError {
    const defaultSuggestions = [
      'aiknowsys scan    # Generate from existing codebase',
      'aiknowsys init    # Start from scratch',
    ];
    
    const suggestionText = (suggestions.length > 0 ? suggestions : defaultSuggestions)
      .map((s, i) => `${i + 1}. ${s}`)
      .join('\n');
    
    return new AIKnowSysError(
      `${filename} not found`,
      `This file is required for AIKnowSys to work. Create it by running:\n\n${suggestionText}`,
      'https://github.com/arpa73/AIKnowSys#getting-started'
    );
  },
  
  /**
   * Empty file error
   * @param filename - Name of empty file
   * @returns AIKnowSysError instance
   */
  emptyFile(filename: string): AIKnowSysError {
    return new AIKnowSysError(
      `${filename} is empty or has no content`,
      'Generate content by running:\n\n1. aiknowsys scan    # Analyze existing codebase\n2. Fill in manually  # Copy template and customize',
      'https://github.com/arpa73/AIKnowSys#scanning-existing-projects'
    );
  },
  
  /**
   * File too large error
   * @param filename - Name of large file
   * @param sizeMB - File size in megabytes
   * @returns AIKnowSysError instance
   */
  fileTooLarge(filename: string, sizeMB: number): AIKnowSysError {
    return new AIKnowSysError(
      `${filename} is too large (${sizeMB.toFixed(1)}MB)`,
      'Files larger than 50MB can cause performance issues.\n\nConsider:\n1. Split content into multiple files\n2. Move detailed examples to separate docs\n3. Use references/links instead of inline content',
      'https://github.com/arpa73/AIKnowSys/wiki/Best-Practices#keeping-files-lean'
    );
  },
  
  /**
   * Missing section error
   * @param section - Name of missing section
   * @param filename - File that should contain the section
   * @returns AIKnowSysError instance
   */
  missingSection(section: string, filename: string): AIKnowSysError {
    return new AIKnowSysError(
      `Required section "${section}" not found in ${filename}`,
      `Add this section to your ${filename}:\n\n1. Copy from template:\n   cp node_modules/aiknowsys/templates/${filename.replace('.md', '.template.md')} ./${filename}\n\n2. Or update to latest:\n   aiknowsys update --templates`,
      'https://github.com/arpa73/AIKnowSys#codebase-essentials-structure'
    );
  },
  
  /**
   * Validation failed error
   * @param failedCount - Number of failed checks
   * @param failures - Array of failure descriptions
   * @returns AIKnowSysError instance
   */
  validationFailed(failedCount: number, failures: string[] = []): AIKnowSysError {
    const failureList = failures.length > 0
      ? failures.map((f, i) => `${i + 1}. ${f}`).join('\n')
      : 'See details above';
    
    return new AIKnowSysError(
      `Health check failed: ${failedCount} check(s) failed`,
      `Fix the following issues:\n\n${failureList}\n\nThen run:\n  aiknowsys check    # Verify fixes`,
      'https://github.com/arpa73/AIKnowSys#health-checks'
    );
  },
  
  /**
   * No knowledge system found error
   * @returns AIKnowSysError instance
   */
  noKnowledgeSystem(): AIKnowSysError {
    return new AIKnowSysError(
      'No knowledge system found in this directory',
      'Initialize AIKnowSys by running:\n\n1. aiknowsys init      # Interactive setup\n2. aiknowsys init --yes # Quick setup with defaults\n3. aiknowsys migrate    # Migrate existing project',
      'https://github.com/arpa73/AIKnowSys#quick-start'
    );
  }
};
