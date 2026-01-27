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
   * Log a plain message (only if not silent)
   * @param {...any} args - Arguments to log
   * @returns {void}
   */
  log(...args) {
    if (!this.silent) {
      console.log(...args);
    }
  }

  /**
   * Log an error message with ❌ icon
   * @param {string} message - Error message
   * @returns {void}
   * 
   * @example
   * log.error('Failed to load configuration');
   * // Outputs: ❌ Failed to load configuration (only if not silent)
   */
  error(message) {
    if (!this.silent) {
      console.error(chalk.red(`❌ ${message}`));
    }
  }

  /**
   * Log a warning message with ⚠️ icon
   * @param {string} message - Warning message
   * @returns {void}
   */
  warn(message) {
    if (!this.silent) {
      console.log(chalk.yellow(`⚠️  ${message}`));
    }
  }

  /**
   * Log an info message with ℹ️ icon
   * @param {string} message - Info message
   * @returns {void}
   */
  info(message) {
    if (!this.silent) {
      console.log(chalk.blue(`ℹ️  ${message}`));
    }
  }

  /**
   * Log a success message with ✅ icon
   * @param {string} message - Success message
   * @returns {void}
   */
  success(message) {
    if (!this.silent) {
      console.log(chalk.green(`✅ ${message}`));
    }
  }

  /**
   * Log a blank line
   * @returns {void}
   */
  blank() {
    if (!this.silent) {
      console.log('');
    }
  }

  /**
   * Log a header message with custom icon
   * @param {string} message - Header message
   * @param {string} icon - Optional icon emoji (default: 🎯)
   * @returns {void}
   */
  header(message, icon = '🎯') {
    if (!this.silent) {
      console.log('');
      console.log(chalk.cyan.bold(`${icon} ${message}`));
      console.log('');
    }
  }

  /**
   * Log a dimmed/gray message
   * @param {string} message - Message to dim
   * @returns {void}
   */
  dim(message) {
    if (!this.silent) {
      console.log(chalk.gray(message));
    }
  }

  /**
   * Log a cyan message
   * @param {string} message - Message
   * @returns {void}
   */
  cyan(message) {
    if (!this.silent) {
      console.log(chalk.cyan(message));
    }
  }

  /**
   * Log a white message
   * @param {string} message - Message
   * @returns {void}
   */
  white(message) {
    if (!this.silent) {
      console.log(chalk.white(message));
    }
  }

  /**
   * Log a yellow message
   * @param {string} message - Message
   * @returns {void}
   */
  yellow(message) {
    if (!this.silent) {
      console.log(chalk.yellow(message));
    }
  }

  /**
   * Log a green message
   * @param {string} message - Message
   * @returns {void}
   */
  green(message) {
    if (!this.silent) {
      console.log(chalk.green(message));
    }
  }

  /**
   * Log a section title with icon
   * @param {string} title - Section title
   * @param {string} icon - Optional icon (default: 📋)
   * @returns {void}
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
