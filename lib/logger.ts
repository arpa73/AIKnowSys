/**
 * Centralized logging utility
 * Provides silent mode support and consistent formatting
 */
import chalk from 'chalk';

/**
 * Logger class with silent mode support
 */
class Logger {
  private silent: boolean;

  constructor(silent = false) {
    this.silent = silent;
  }

  /**
   * Set silent mode
   * @param silent - Whether to suppress output
   */
  setSilent(silent: boolean): void {
    this.silent = silent;
  }

  /**
   * Log a plain message (only if not silent)
   * @param args - Arguments to log
   */
  log(...args: unknown[]): void {
    if (!this.silent) {
      console.log(...args);
    }
  }

  /**
   * Log an error message with ❌ icon
   * @param message - Error message
   * 
   * @example
   * log.error('Failed to load configuration');
   * // Outputs: ❌ Failed to load configuration (only if not silent)
   */
  error(message: string): void {
    if (!this.silent) {
      console.error(chalk.red(`❌ ${message}`));
    }
  }

  /**
   * Log a warning message with ⚠️ icon
   * @param message - Warning message
   */
  warn(message: string): void {
    if (!this.silent) {
      console.log(chalk.yellow(`⚠️  ${message}`));
    }
  }

  /**
   * Log an info message with ℹ️ icon
   * @param message - Info message
   */
  info(message: string): void {
    if (!this.silent) {
      console.log(chalk.blue(`ℹ️  ${message}`));
    }
  }

  /**
   * Log a success message with ✅ icon
   * @param message - Success message
   */
  success(message: string): void {
    if (!this.silent) {
      console.log(chalk.green(`✅ ${message}`));
    }
  }

  /**
   * Log a blank line
   */
  blank(): void {
    if (!this.silent) {
      console.log('');
    }
  }

  /**
   * Log a header message with custom icon
   * @param message - Header message
   * @param icon - Optional icon emoji (default: 🎯)
   */
  header(message: string, icon = '🎯'): void {
    if (!this.silent) {
      console.log('');
      console.log(chalk.cyan.bold(`${icon} ${message}`));
      console.log('');
    }
  }

  /**
   * Log a dimmed/gray message
   * @param message - Message to dim
   */
  dim(message: string): void {
    if (!this.silent) {
      console.log(chalk.gray(message));
    }
  }

  /**
   * Log a cyan message
   * @param message - Message
   */
  cyan(message: string): void {
    if (!this.silent) {
      console.log(chalk.cyan(message));
    }
  }

  /**
   * Log a white message
   * @param message - Message
   */
  white(message: string): void {
    if (!this.silent) {
      console.log(chalk.white(message));
    }
  }

  /**
   * Log a yellow message
   * @param message - Message
   */
  yellow(message: string): void {
    if (!this.silent) {
      console.log(chalk.yellow(message));
    }
  }

  /**
   * Log a green message
   * @param message - Message
   */
  green(message: string): void {
    if (!this.silent) {
      console.log(chalk.green(message));
    }
  }

  /**
   * Log a section title with icon
   * @param title - Section title
   * @param icon - Optional icon (default: 📋)
   */
  section(title: string, icon = '📋'): void {
    if (!this.silent) {
      console.log('');
      console.log(chalk.white.bold(`${icon} ${title}:`));
    }
  }
}

/**
 * Create a logger instance
 * @param silent - Whether to suppress output
 * @returns Logger instance
 */
export function createLogger(silent = false): Logger {
  return new Logger(silent);
}

/**
 * Default logger instance (not silent)
 */
export const logger = new Logger(false);
