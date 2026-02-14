/**
 * Database Error Handling Utilities
 *
 * Provides helpful error wrapping for database operations with:
 * - Troubleshooting steps
 * - Expected vs actual context
 * - Actionable suggestions
 */
/**
 * Wrap a database error with helpful context
 *
 * @param error - Original error from better-sqlite3
 * @param operation - What operation was being attempted
 * @param dbPath - Path to the database file
 * @returns Enhanced error with troubleshooting information
 */
export declare function wrapDatabaseError(error: unknown, operation: string, dbPath: string): Error;
//# sourceMappingURL=database-errors.d.ts.map