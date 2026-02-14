/**
 * File system utility functions
 * Extracted from create-session, update-session, create-plan to follow DRY principle
 */
export interface FileExistenceOptions {
    /**
     * How to handle file existence
     * - 'error': Throw error if file exists
     * - 'return': Return early if file exists (no error)
     * - 'continue': Just return boolean, let caller decide
     */
    onExists?: 'error' | 'return' | 'continue';
    /**
     * Custom error message when onExists='error'
     */
    message?: string;
}
/**
 * Check if file exists and handle accordingly
 *
 * Centralizes the pattern of checking file existence with fs.access()
 * and handling ENOENT errors. Prevents code duplication across commands.
 *
 * @param filepath - Path to check
 * @param options - How to handle existence
 * @returns true if exists, false if not
 * @throws Error if onExists='error' and file exists
 * @throws Error if access fails for reasons other than ENOENT
 *
 * @example
 * ```typescript
 * // Check if file exists without throwing
 * const exists = await checkFileExists('/path/to/file');
 * if (exists) { ... }
 *
 * // Throw error if file exists
 * await checkFileExists('/path/to/file', {
 *   onExists: 'error',
 *   message: 'File already exists'
 * });
 *
 * // Check if file exists, throw if missing
 * const exists = await checkFileExists('/path/to/file');
 * if (!exists) {
 *   throw new Error('File not found');
 * }
 * ```
 */
export declare function checkFileExists(filepath: string, options?: FileExistenceOptions): Promise<boolean>;
//# sourceMappingURL=file-utils.d.ts.map