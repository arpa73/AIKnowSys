/**
 * Git and system utilities
 * Phase B Mini - Context Query Completion
 */
/**
 * Detect username from git config or system environment
 *
 * Tries git config first, then falls back to system environment variables.
 * Returns username in lowercase-with-hyphens format suitable for file paths.
 *
 * @returns Username in lowercase-with-hyphens format (e.g., "john-doe")
 *
 * @example
 * ```typescript
 * const author = detectUsername();
 * // "arno-paffen" from git config
 * // or "john-doe" from $USER
 * // or "unknown" if neither available
 * ```
 */
export declare function detectUsername(): string;
//# sourceMappingURL=git-utils.d.ts.map