/**
 * Centralized logging utility
 * Provides silent mode support and consistent formatting
 */
import chalk from 'chalk';

/**
 * Logger class with silent mode support
 */
class Logger {
  constructor(silent = false) {
    this.silent = silent;
  }

  /**
   * Set silent mode
   * @param {boolean} silent - Whether to suppress output
   */
  setSilent(silent) {
    this.silent = silent;
  }

  /**
   * Log a message (only if not silent)
   * @param {...any} args - Arguments to log
   */
  log(...args) {
    if (!this.silent) {
      console.log(...args);
    }
  }

  /**
   * Log an error (always shown, even in silent mode)
   * @param {...any} args - Arguments to log
   */
  error(...args) {
    console.error(...args);
  }

  /**
   * Log a warning
   * @param {...any} args - Arguments to log
   */
  warn(...args) {
    if (!this.silent) {
      console.warn(...args);
    }
  }

  /**
   * Log info message
   * @param {...any} args - Arguments to log
   */
  info(...args) {
    if (!this.silent) {
      console.info(...args);
    }
  }

  /**
   * Log a blank line
   */
  blank() {
    if (!this.silent) {
      console.log('');
    }
  }

  /**
   * Log a header message
   * @param {string} message - Header message
   * @param {string} icon - Optional icon emoji
   */
  header(message, icon = '🎯') {
    if (!this.silent) {
      console.log('');
      console.log(chalk.cyan.bold(`${icon} ${message}`));
      console.log('');
    }
  }

  /**
   * Log a success message
   * @param {string} message - Success message
   */
  success(message) {
    if (!this.silent) {
      console.log(chalk.green.bold(`✅ ${message}`));
    }
  }

  /**
   * Log an error message with formatting
   * @param {string} message - Error message
   */
  errorMsg(message) {
    console.error(chalk.red(`❌ ${message}`));
  }

  /**
   * Log a warning message with formatting
   * @param {string} message - Warning message
   */
  warnMsg(message) {
    if (!this.silent) {
      console.log(chalk.yellow(`⚠️  ${message}`));
    }
  }

  /**
   * Log an info message with formatting
   * @param {string} message - Info message
   */
  infoMsg(message) {
    if (!this.silent) {
      console.log(chalk.blue(`ℹ️  ${message}`));
    }
  }

  /**
   * Log a gray/dimmed message
   * @param {string} message - Message to dim
   */
  dim(message) {
    if (!this.silent) {
      console.log(chalk.gray(message));
    }
  }

  /**
   * Log a cyan message
   * @param {string} message - Message
   */
  cyan(message) {
    if (!this.silent) {
      console.log(chalk.cyan(message));
    }
  }

  /**
   * Log a section title
   * @param {string} title - Section title
   * @param {string} icon - Optional icon
   */
  section(title, icon = '📋') {
    if (!this.silent) {
      console.log('');
      console.log(chalk.white.bold(`${icon} ${title}:`));
    }
  }
}

/**
 * Create a logger instance
 * @param {boolean} silent - Whether to suppress output
 * @returns {Logger} Logger instance
 */
export function createLogger(silent = false) {
  return new Logger(silent);
}

/**
 * Default logger instance (not silent)
 */
export const logger = new Logger(false);
