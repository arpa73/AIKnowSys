/**
 * Logger class with silent mode support
 */
declare class Logger {
    private silent;
    constructor(silent?: boolean);
    /**
     * Set silent mode
     * @param silent - Whether to suppress output
     */
    setSilent(silent: boolean): void;
    /**
     * Log a plain message (only if not silent)
     * @param args - Arguments to log
     */
    log(...args: unknown[]): void;
    /**
     * Log an error message with ❌ icon
     * @param message - Error message
     *
     * @example
     * log.error('Failed to load configuration');
     * // Outputs: ❌ Failed to load configuration (only if not silent)
     */
    error(message: string): void;
    /**
     * Log a warning message with ⚠️ icon
     * @param message - Warning message
     */
    warn(message: string): void;
    /**
     * Log an info message with ℹ️ icon
     * @param message - Info message
     */
    info(message: string): void;
    /**
     * Log a success message with ✅ icon
     * @param message - Success message
     */
    success(message: string): void;
    /**
     * Log a blank line
     */
    blank(): void;
    /**
     * Log a header message with custom icon
     * @param message - Header message
     * @param icon - Optional icon emoji (default: 🎯)
     */
    header(message: string, icon?: string): void;
    /**
     * Log a dimmed/gray message
     * @param message - Message to dim
     */
    dim(message: string): void;
    /**
     * Log a cyan message
     * @param message - Message
     */
    cyan(message: string): void;
    /**
     * Log a white message
     * @param message - Message
     */
    white(message: string): void;
    /**
     * Log a yellow message
     * @param message - Message
     */
    yellow(message: string): void;
    /**
     * Log a green message
     * @param message - Message
     */
    green(message: string): void;
    /**
     * Log a section title with icon
     * @param title - Section title
     * @param icon - Optional icon (default: 📋)
     */
    section(title: string, icon?: string): void;
}
/**
 * Create a logger instance
 * @param silent - Whether to suppress output
 * @returns Logger instance
 */
export declare function createLogger(silent?: boolean): Logger;
/**
 * Default logger instance (not silent)
 */
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map