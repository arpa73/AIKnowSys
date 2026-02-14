/**
 * Git and system utilities
 * Phase B Mini - Context Query Completion
 */
import { execSync } from 'child_process';
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
export function detectUsername() {
    try {
        const gitUser = execSync('git config user.name', { encoding: 'utf-8' }).trim();
        if (gitUser) {
            return gitUser.toLowerCase().replace(/\s+/g, '-');
        }
    }
    catch (err) {
        // Git not available or not configured
    }
    // Fallback to system username
    return process.env.USER || process.env.USERNAME || 'unknown';
}
//# sourceMappingURL=git-utils.js.map