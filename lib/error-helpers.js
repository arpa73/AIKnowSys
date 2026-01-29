/**
 * Error handling utilities for AIKnowSys
 * Provides structured errors with helpful suggestions and documentation links
 */

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
  /**
   * @param {string} message - What went wrong
   * @param {string} suggestion - How to fix it
   * @param {string} learnMore - URL to documentation (optional)
   */
  constructor(message, suggestion, learnMore = null) {
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
   * @param {object} log - Logger instance with error(), info() methods
   */
  format(log) {
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
   * @returns {string} Formatted error message
   */
  toPlainText() {
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
   * @param {string} filename - Name of missing file
   * @param {string[]} suggestions - Array of command suggestions
   * @returns {AIKnowSysError}
   */
  fileNotFound(filename, suggestions = []) {
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
   * @param {string} filename - Name of empty file
   * @returns {AIKnowSysError}
   */
  emptyFile(filename) {
    return new AIKnowSysError(
      `${filename} is empty or has no content`,
      'Generate content by running:\n\n1. aiknowsys scan    # Analyze existing codebase\n2. Fill in manually  # Copy template and customize',
      'https://github.com/arpa73/AIKnowSys#scanning-existing-projects'
    );
  },
  
  /**
   * File too large error
   * @param {string} filename - Name of large file
   * @param {number} sizeMB - File size in megabytes
   * @returns {AIKnowSysError}
   */
  fileTooLarge(filename, sizeMB) {
    return new AIKnowSysError(
      `${filename} is too large (${sizeMB.toFixed(1)}MB)`,
      'Files larger than 50MB can cause performance issues.\n\nConsider:\n1. Split content into multiple files\n2. Move detailed examples to separate docs\n3. Use references/links instead of inline content',
      'https://github.com/arpa73/AIKnowSys/wiki/Best-Practices#keeping-files-lean'
    );
  },
  
  /**
   * Missing section error
   * @param {string} section - Name of missing section
   * @param {string} filename - File that should contain the section
   * @returns {AIKnowSysError}
   */
  missingSection(section, filename) {
    return new AIKnowSysError(
      `Required section "${section}" not found in ${filename}`,
      `Add this section to your ${filename}:\n\n1. Copy from template:\n   cp node_modules/aiknowsys/templates/${filename.replace('.md', '.template.md')} ./${filename}\n\n2. Or update to latest:\n   aiknowsys update --templates`,
      'https://github.com/arpa73/AIKnowSys#codebase-essentials-structure'
    );
  },
  
  /**
   * Validation failed error
   * @param {number} failedCount - Number of failed checks
   * @param {string[]} failures - Array of failure descriptions
   * @returns {AIKnowSysError}
   */
  validationFailed(failedCount, failures = []) {
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
   * @returns {AIKnowSysError}
   */
  noKnowledgeSystem() {
    return new AIKnowSysError(
      'No knowledge system found in this directory',
      'Initialize AIKnowSys by running:\n\n1. aiknowsys init      # Interactive setup\n2. aiknowsys init --yes # Quick setup with defaults\n3. aiknowsys migrate    # Migrate existing project',
      'https://github.com/arpa73/AIKnowSys#quick-start'
    );
  }
};
