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
export function wrapDatabaseError(
  error: unknown,
  operation: string,
  dbPath: string
): Error {
  const originalError = error instanceof Error ? error : new Error(String(error));
  const originalMessage = originalError.message;
  
  // Detect common error patterns and provide specific guidance
  if (originalMessage.includes('not a database') || originalMessage.includes('file is not a database')) {
    return new Error(
      `Database file is corrupted or invalid\n\n` +
      `Operation: ${operation}\n` +
      `Database path: ${dbPath}\n` +
      `Original error: ${originalMessage}\n\n` +
      `Troubleshooting:\n` +
     `  1. Backup current database: mv ${dbPath} ${dbPath}.backup\n` +
      `  2. Recreate database: npx aiknowsys migrate-to-sqlite\n` +
      `  3. If data is critical, try SQLite recovery tools\n\n` +
      `Common causes:\n` +
      `  • File was manually edited (SQLite is binary format)\n` +
      `  • Incomplete write (disk full, process killed)\n` +
      `  • File permissions changed mid-operation`
    );
  }
  
  if (originalMessage.includes('SQLITE_CANTOPEN') || originalMessage.includes('unable to open')) {
    return new Error(
      `Cannot open database file\n\n` +
      `Operation: ${operation}\n` +
      `Database path: ${dbPath}\n` +
      `Original error: ${originalMessage}\n\n` +
      `Troubleshooting:\n` +
      `  1. Check file exists: ls -la ${dbPath}\n` +
      `  2. Check permissions: Make sure file is readable/writable\n` +
      `  3. Check disk space: df -h\n` +
      `  4. Try creating database: npx aiknowsys migrate-to-sqlite\n\n` +
      `Common causes:\n` +
      `  • Database file doesn't exist yet\n` +
      `  • Insufficient file permissions\n` +
      `  • Disk is full\n` +
      `  • File system mounted read-only`
    );
  }
  
  if (originalMessage.includes('SQLITE_BUSY') || originalMessage.includes('database is locked')) {
    return new Error(
      `Database is locked by another process\n\n` +
      `Operation: ${operation}\n` +
      `Database path: ${dbPath}\n` +
      `Original error: ${originalMessage}\n\n` +
      `Troubleshooting:\n` +
      `  1. Check for other processes: lsof ${dbPath}\n` +
      `  2. Wait a moment and retry\n` +
      `  3. Check for stale lock files: ls -la ${dbPath}*\n` +
      `  4. If safe, remove lock: rm ${dbPath}-shm ${dbPath}-wal\n\n` +
      `Common causes:\n` +
      `  • Another MCP server instance is running\n` +
      `  • Long-running transaction in progress\n` +
      `  • Stale lock from crashed process`
    );
  }
  
  if (originalMessage.includes('SQLITE_READONLY') || originalMessage.includes('readonly database')) {
    return new Error(
      `Database is read-only\n\n` +
      `Operation: ${operation}\n` +
      `Database path: ${dbPath}\n` +
      `Original error: ${originalMessage}\n\n` +
      `Troubleshooting:\n` +
      `  1. Check file permissions: ls -la ${dbPath}\n` +
      `  2. Add write permission: chmod 644 ${dbPath}\n` +
      `  3. Check directory permissions: ls -la $(dirname ${dbPath})\n` +
      `  4. Make sure file system isn't mounted read-only\n\n` +
      `Common causes:\n` +
      `  • File permissions set to read-only\n` +
      `  • Directory permissions prevent writes\n` +
      `  • File system mounted with ro option`
    );
  }
  
  // Generic database error - still provide context
  return new Error(
    `Database operation failed\n\n` +
    `Operation: ${operation}\n` +
    `Database path: ${dbPath}\n` +
    `Error: ${originalMessage}\n\n` +
    `Troubleshooting:\n` +
    `  1. Check database exists: ls -la ${dbPath}\n` +
    `  2. Verify database integrity: sqlite3 ${dbPath} "PRAGMA integrity_check;"\n` +
    `  3. Check disk space: df -h\n` +
    `  4. Try recreating database: npx aiknowsys migrate-to-sqlite\n\n` +
    `If issue persists, please report at: https://github.com/arpa73/AIKnowSys/issues`
  );
}

