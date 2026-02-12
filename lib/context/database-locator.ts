/**
 * Database location and configuration resolver
 * Determines where the SQLite database should be created
 * Supports user-level, per-project, and custom locations
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

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
export class DatabaseLocator {
  /**
   * Get database configuration for a project
   * @param targetDir - Project directory (will be resolved to absolute path)
   * @returns Database configuration with path and project metadata
   */
  async getDatabaseConfig(targetDir: string): Promise<DatabaseConfig> {
    // Resolve to absolute path (Critical Invariant #2)
    const resolvedDir = path.resolve(targetDir);
    
    let dbPath: string;
    let projectId: string;
    let projectName: string;
    
    // Priority 1: Environment variable
    if (process.env.AIKNOWSYS_DB_PATH) {
      dbPath = path.resolve(process.env.AIKNOWSYS_DB_PATH);
      projectId = await this.getProjectId(resolvedDir);
      projectName = await this.getProjectName(resolvedDir);
    } else {
      // Priority 2: .aiknowsys.config file
      const config = await this.readConfig(resolvedDir);
      if (config?.databasePath) {
        // Resolve relative paths against project root
        dbPath = path.isAbsolute(config.databasePath)
          ? config.databasePath
          : path.join(resolvedDir, config.databasePath);
        projectId = config.projectId || await this.getProjectId(resolvedDir);
        projectName = config.projectName || await this.getProjectName(resolvedDir);
      } else {
        // Priority 3: User-level default (~/.aiknowsys/knowledge.db)
        // Use process.env.HOME if available (for testing), otherwise os.homedir()
        const homeDir = process.env.HOME || os.homedir();
        dbPath = path.join(homeDir, '.aiknowsys', 'knowledge.db');
        projectId = config?.projectId || await this.getProjectId(resolvedDir);
        projectName = config?.projectName || await this.getProjectName(resolvedDir);
      }
    }
    
    // Ensure database directory exists (single call)
    await this.ensureDatabaseDirectory(dbPath);
    
    return { dbPath, projectId, projectName };
  }
  
  /**
   * Get project identifier (sanitized for database use)
   * Tries git remote first, falls back to directory name
   * @param targetDir - Project directory
   * @returns Sanitized project ID (lowercase, no spaces)
   */
  async getProjectId(targetDir: string): Promise<string> {
    const resolvedDir = path.resolve(targetDir);
    
    // Try to extract from git remote
    const gitId = await this.getGitProjectId(resolvedDir);
    if (gitId) {
      return this.sanitizeProjectId(gitId);
    }
    
    // Fall back to directory name
    const dirName = path.basename(resolvedDir);
    return this.sanitizeProjectId(dirName);
  }
  
  /**
   * Get human-readable project name
   * @param targetDir - Project directory
   * @returns Project name (from config or directory name)
   */
  private async getProjectName(targetDir: string): Promise<string> {
    const resolvedDir = path.resolve(targetDir);
    const config = await this.readConfig(resolvedDir);
    
    if (config?.projectName) {
      return config.projectName;
    }
    
    return path.basename(resolvedDir);
  }
  
  /**
   * Read .aiknowsys.config file if it exists
   * @param targetDir - Project directory
   * @returns Parsed config or null if not found/invalid
   */
  private async readConfig(targetDir: string): Promise<AiknowsysConfig | null> {
    try {
      const configPath = path.join(targetDir, '.aiknowsys.config');
      const configContent = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(configContent) as AiknowsysConfig;
    } catch (error) {
      // Config doesn't exist or is invalid - this is fine
      return null;
    }
  }
  
  /**
   * Extract project ID from git remote URL
   * @param targetDir  - Project directory
   * @returns Project ID from git remote (e.g., "owner-repo") or null if no git
   */
  private async getGitProjectId(targetDir: string): Promise<string | null> {
    try {
      const gitConfigPath = path.join(targetDir, '.git', 'config');
      const gitConfig = await fs.readFile(gitConfigPath, 'utf-8');
      
      // Parse git remote URL
      // Format: url = git@github.com:owner/repo.git
      // or:     url = https://github.com/owner/repo.git
      const remoteMatch = gitConfig.match(/url\s*=\s*(?:git@|https:\/\/).*[:/]([^/]+)\/([^/\s]+?)(?:\.git)?\s*$/m);
      
      if (remoteMatch) {
        const owner = remoteMatch[1];
        const repo = remoteMatch[2].replace('.git', '');
        return `${owner}-${repo}`;
      }
      
      return null;
    } catch (error) {
      // No git directory - this is fine
      return null;
    }
  }
  
  /**
   * Sanitize project ID for use in database/filesystem
   * @param rawId - Raw project identifier
   * @returns Sanitized ID (lowercase, hyphens instead of spaces/special chars)
   */
  private sanitizeProjectId(rawId: string): string {
    return rawId
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')  // Replace non-alphanumeric with hyphens
      .replace(/-+/g, '-')           // Collapse multiple hyphens
      .replace(/^-|-$/g, '')         // Remove leading/trailing hyphens
      ;
  }
  
  /**
   * Ensure database directory exists
   * @param dbPath - Database file path
   */
  private async ensureDatabaseDirectory(dbPath: string): Promise<void> {
    const dbDir = path.dirname(dbPath);
    await fs.mkdir(dbDir, { recursive: true });
  }
}
