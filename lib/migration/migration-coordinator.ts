/**
 * Migration coordinator for converting .aiknowsys markdown files to SQLite
 * Orchestrates file scanning, parsing, and database insertion
 */

import { FileScanner, type FileInfo } from './file-scanner.js';
import { MarkdownParser, type ParseResult } from './markdown-parser.js';
import type { SqliteStorage } from '../context/sqlite-storage.js';
import type { SessionFrontmatter, PlanFrontmatter, LearnedFrontmatter } from './types.js';
import { promises as fs } from 'fs';

export interface MigrationResult {
  /** Number of session files migrated */
  sessionsMigrated: number;
  
  /** Number of plan files migrated */
  plansMigrated: number;
  
  /** Number of learned pattern files migrated */
  learnedMigrated: number;
  
  /** Total files processed */
  totalFiles: number;
  
  /** Number of files skipped (already in database) */
  skipped: number;
  
  /** Errors encountered during migration */
  errors: string[];
}

/**
 * Coordinates migration from markdown files to SQLite database
 */
export class MigrationCoordinator {
  private scanner: FileScanner;
  private parser: MarkdownParser;
  
  constructor(private storage: SqliteStorage) {
    this.scanner = new FileScanner();
    this.parser = new MarkdownParser();
  }
  
  /**
   * Migrate all .aiknowsys markdown files to database
   * @param targetDir - Directory containing .aiknowsys folder
   * @returns Migration statistics and errors
   */
  async migrateFromDirectory(targetDir: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      sessionsMigrated: 0,
      plansMigrated: 0,
      learnedMigrated: 0,
      totalFiles: 0,
      skipped: 0,
      errors: []
    };
    
    // Ensure default project exists in database
    await this.ensureProjectExists('default', 'Default Project');
    
    // Scan directory for markdown files
    const scanResult = await this.scanner.scanDirectory(targetDir);
    
    // Add scan errors to result
    result.errors.push(...scanResult.errors);
    
    // Migrate plans FIRST (before sessions that might reference them)
    for (const fileInfo of scanResult.plans) {
      try {
        const content = await fs.readFile(fileInfo.absolutePath, 'utf-8');
        const parsed = this.parser.parse<PlanFrontmatter>(content);
        
        // Check for parse errors
        if (parsed.errors && parsed.errors.length > 0) {
          result.errors.push(`${fileInfo.filename}: ${parsed.errors.join(', ')}`);
        }
        
        // Extract plan ID from filename (PLAN_xyz.md -> xyz)
        const planId = this.extractPlanId(fileInfo.filename);
        
        // Insert into database
        const inserted = await this.insertPlan(fileInfo, parsed, planId);
        if (inserted) {
          result.plansMigrated++;
        } else {
          result.skipped++;
        }
        
        result.totalFiles++;
      } catch (error) {
        result.errors.push(`Error migrating ${fileInfo.filename}: ${(error as Error).message}`);
        result.totalFiles++;
      }
    }
    
    // Migrate learned patterns SECOND
    for (const fileInfo of scanResult.learned) {
      try {
        const content = await fs.readFile(fileInfo.absolutePath, 'utf-8');
        const parsed = this.parser.parse<LearnedFrontmatter>(content);
        
        // Check for parse errors
        if (parsed.errors && parsed.errors.length > 0) {
          result.errors.push(`${fileInfo.filename}: ${parsed.errors.join(', ')}`);
        }
        
        // Insert into database (learned patterns treated as searchable content)
        const inserted = await this.insertLearned(fileInfo, parsed);
        if (inserted) {
          result.learnedMigrated++;
        } else {
          result.skipped++;
        }
        
        result.totalFiles++;
      } catch (error) {
        result.errors.push(`Error migrating ${fileInfo.filename}: ${(error as Error).message}`);
        result.totalFiles++;
      }
    }
    
    // Migrate sessions LAST (after plans exist to satisfy foreign key constraints)
    for (const fileInfo of scanResult.sessions) {
      try {
        const content = await fs.readFile(fileInfo.absolutePath, 'utf-8');
        const parsed = this.parser.parse<SessionFrontmatter>(content);
        
        // Check for parse errors
        if (parsed.errors && parsed.errors.length > 0) {
          result.errors.push(`${fileInfo.filename}: ${parsed.errors.join(', ')}`);
        }
        
        // Insert into database
        const inserted = await this.insertSession(fileInfo, parsed);
        if (inserted) {
          result.sessionsMigrated++;
        } else {
          result.skipped++;
        }
        
        result.totalFiles++;
      } catch (error) {
        result.errors.push(`Error migrating ${fileInfo.filename}: ${(error as Error).message}`);
        result.totalFiles++;
      }
    }
    
    return result;
  }
  
  /**
   * Ensure a project exists in database
   * @param projectId - Project identifier
   * @param projectName - Project name
   */
  private async ensureProjectExists(projectId: string, projectName: string): Promise<void> {
    try {
      // Try to insert project - will fail if already exists
      const now = new Date().toISOString();
      await (this.storage as any).insertProject({
        id: projectId,
        name: projectName,
        created_at: now,
        updated_at: now
      });
    } catch (error) {
      // Ignore UNIQUE constraint errors (project already exists)
      if (!(error as Error).message.includes('UNIQUE constraint')) {
        throw error; // Re-throw other errors
      }
    }
  }
  
  /**
   * Insert session into database
   * @returns true if inserted, false if skipped (already exists)
   */
  private async insertSession(
    fileInfo: FileInfo,
    parsed: ParseResult<SessionFrontmatter>
  ): Promise<boolean> {
    const { frontmatter, content } = parsed;
    
    // Check if session already exists for this date
    const existing = await this.storage.querySessions({ date: frontmatter.date });
    if (existing.sessions.length > 0) {
      // Skip - already migrated
      return false;
    }
    
    // Get file timestamps
    const stats = await fs.stat(fileInfo.absolutePath);
    const created = stats.birthtime.toISOString();
    const updated = stats.mtime.toISOString();
    
    // Normalize plan reference (remove PLAN_ prefix to match plan IDs)
    let planId = frontmatter.plan;
    if (planId && planId.startsWith('PLAN_')) {
      planId = planId.replace('PLAN_', '');
    }
    
    // Insert session in database
    await this.storage.insertSession({
      id: frontmatter.date || `session-${Date.now()}`,
      project_id: 'default',
      date: frontmatter.date || 'unknown',
      topic: frontmatter.topic || 'Untitled',
      status: frontmatter.status || 'complete',
      created: frontmatter.created || created,
      updated: frontmatter.updated || updated,
      topics: frontmatter.topics || [],
      content,
      plan: planId,
      duration: frontmatter.duration,
      phases: frontmatter.phases
    });
    
    return true;
  }
  
  /**
   * Insert plan into database
   * @returns true if inserted, false if skipped (already exists)
   */
  private async insertPlan(
    fileInfo: FileInfo,
    parsed: ParseResult<PlanFrontmatter>,
    planId: string
  ): Promise<boolean> {
    const { frontmatter, content } = parsed;
    
    // Check if plan already exists (query all and filter by ID)
    const allPlans = await this.storage.queryPlans({});
    const existing = allPlans.plans.filter(p => p.id === planId);
    if (existing.length > 0) {
      // Skip - already migrated
      return false;
    }
    
    // Get file timestamps
    const stats = await fs.stat(fileInfo.absolutePath);
    const created = stats.birthtime.toISOString();
    const updated = stats.mtime.toISOString();
    
    // Insert plan in database
    await this.storage.insertPlan({
      id: planId,
      project_id: 'default',
      title: frontmatter.title || 'Untitled Plan',
      status: frontmatter.status || 'PLANNED',
      author: frontmatter.author || 'unknown',
      created: frontmatter.created || created,
      updated: frontmatter.updated || updated,
      topics: frontmatter.topics || [],
      content,
      description: frontmatter.description,
      priority: frontmatter.priority,
      type: frontmatter.type
    });
    
    return true;
  }
  
  /**
   * Insert learned pattern into database
   * @returns true if inserted, false if skipped (already exists)
   */
  private async insertLearned(
    fileInfo: FileInfo,
    parsed: ParseResult<LearnedFrontmatter>
  ): Promise<boolean> {
    const { frontmatter, content } = parsed;
    
    // For learned patterns, we'll store them as searchable content
    // Since there's no strict "learned" table, we can create a plan or session
    // OR just ensure this specific file becomes searchable
    
    // Extract category from frontmatter or use filename
    const category = frontmatter.category || 'learned';
    const keywords = frontmatter.keywords || [];
    
    // Create a plan entry for learned patterns
    // Use relative path as ID (sanitized)
    const learnedId = fileInfo.relativePath
      .replace(/\//g, '_')
      .replace('.md', '')
      .replace(/[^a-z0-9_]/g, '');
    
    // Check if already exists (query all and filter by ID)
    const allPlans = await this.storage.queryPlans({});
    const existing = allPlans.plans.filter(p => p.id === learnedId);
    if (existing.length > 0) {
      return false;
    }
    
    // Get file timestamps
    const stats = await fs.stat(fileInfo.absolutePath);
    const created = stats.birthtime.toISOString();
    const updated = stats.mtime.toISOString();
    
    await this.storage.insertPlan({
      id: learnedId,
      project_id: 'default',
      title: category,
      status: 'COMPLETE',
      author: frontmatter.author || 'unknown',
      created: frontmatter.created || created,
      updated: frontmatter.updated || updated,
      topics: keywords,
      content,
      type: 'learned-pattern',
      description: `Pattern from ${fileInfo.relativePath}`
    });
    
    return true;
  }
  
  /**
   * Extract plan ID from filename
   * PLAN_xyz.md -> xyz
   * active-user.md -> user
   */
  private extractPlanId(filename: string): string {
    if (filename.startsWith('PLAN_')) {
      return filename.replace('PLAN_', '').replace('.md', '');
    }
    
    if (filename.startsWith('active-')) {
      return filename.replace('active-', '').replace('.md', '');
    }
    
    // Fallback: use filename without extension
    return filename.replace('.md', '');
  }
}
