/**
 * Database location and configuration resolver
 * Determines where the SQLite database should be created
 * Supports user-level, per-project, and custom locations
 */
export interface DatabaseConfig {
    /** Absolute path to SQLite database file */
    dbPath: string;
    /** Project identifier (sanitized, unique) */
    projectId: string;
    /** Human-readable project name */
    projectName: string;
}
export interface AiknowsysConfig {
    /** Custom database path (absolute or relative to project root) */
    databasePath?: string;
    /** Explicit project ID override */
    projectId?: string;
    /** Explicit project name override */
    projectName?: string;
}
/**
 * Locates and configures database path for AIKnowSys
 * Priority:
 * 1. AIKNOWSYS_DB_PATH environment variable
 * 2. .aiknowsys.config file in project root
 * 3. User-level ~/.aiknowsys/knowledge.db (default)
 */
export declare class DatabaseLocator {
    /**
     * Get database configuration for a project
     * @param targetDir - Project directory (will be resolved to absolute path)
     * @returns Database configuration with path and project metadata
     */
    getDatabaseConfig(targetDir: string): Promise<DatabaseConfig>;
    /**
     * Get project identifier (sanitized for database use)
     * Tries git remote first, falls back to directory name
     * @param targetDir - Project directory
     * @returns Sanitized project ID (lowercase, no spaces)
     */
    getProjectId(targetDir: string): Promise<string>;
    /**
     * Get human-readable project name
     * @param targetDir - Project directory
     * @returns Project name (from config or directory name)
     */
    private getProjectName;
    /**
     * Read .aiknowsys.config file if it exists
     * @param targetDir - Project directory
     * @returns Parsed config or null if not found/invalid
     */
    private readConfig;
    /**
     * Extract project ID from git remote URL
     * @param targetDir  - Project directory
     * @returns Project ID from git remote (e.g., "owner-repo") or null if no git
     */
    private getGitProjectId;
    /**
     * Sanitize project ID for use in database/filesystem
     * @param rawId - Raw project identifier
     * @returns Sanitized ID (lowercase, hyphens instead of spaces/special chars)
     */
    private sanitizeProjectId;
    /**
     * Ensure database directory exists
     * @param dbPath - Database file path
     */
    private ensureDatabaseDirectory;
}
//# sourceMappingURL=database-locator.d.ts.map