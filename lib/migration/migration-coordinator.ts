/**
 * Migration coordinator for converting .aiknowsys markdown files to SQLite
 * Orchestrates file scanning, parsing, and database insertion
 */

import { FileScanner, type FileInfo } from './file-scanner.js';
import { MarkdownParser, type ParseResult } from './markdown-parser.js';
import { DatabaseLocator } from '../context/database-locator.js';
import type { SqliteStorage } from '../context/sqlite-storage.js';
import type { SessionFrontmatter, PlanFrontmatter, LearnedFrontmatter } from './types.js';
import { promises as fs } from 'fs';
import path from 'path';
import { EventFactory } from '../events/event-factory.js';
import { EventType } from '../events/types.js';

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
  private locator: DatabaseLocator;
  
  constructor(private storage: SqliteStorage) {
    this.scanner = new FileScanner();
    this.parser = new MarkdownParser();
    this.locator = new DatabaseLocator();
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
    
    // Get project ID from directory using DatabaseLocator
    const projectId = await this.locator.getProjectId(targetDir);
    const projectName = path.basename(path.resolve(targetDir));
    
    // Ensure project exists in database
    await this.ensureProjectExists(projectId, projectName, path.resolve(targetDir));
    
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
        const inserted = await this.insertPlan(fileInfo, parsed, planId, projectId);
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
        const inserted = await this.insertLearned(fileInfo, parsed, projectId);
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
        const inserted = await this.insertSession(fileInfo, parsed, projectId);
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
   * @param projectPath - Absolute path to project directory
   */
  private async ensureProjectExists(projectId: string, projectName: string, projectPath?: string): Promise<void> {
    try {
      // Try to insert project - will fail if already exists
      const now = new Date().toISOString();
      await this.storage.insertProject({
        id: projectId,
        name: projectName,
        path: projectPath,
        created_at: now,
        updated_at: now
      });
    } catch (error) {
      if ((error as Error).message.includes('UNIQUE constraint')) {
        // Project already exists - this is expected during re-migration
        // No action needed, project data is already in database
        return;
      }
      // Unexpected error - re-throw with context
      throw new Error(`Failed to create project ${projectId}: ${(error as Error).message}`);
    }
  }
  
  /**
   * Insert session into database
   * @param projectId - Project identifier for this session
   * @returns true if inserted, false if skipped (already exists)
   */
  private async insertSession(
    fileInfo: FileInfo,
    parsed: ParseResult<SessionFrontmatter>,
    projectId: string
  ): Promise<boolean> {
    if (!projectId || projectId.trim() === '') {
      throw new Error(`Cannot insert session: projectId is required but got "${projectId}"`);
    }
    
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
      project_id: projectId,
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
   * @param projectId - Project identifier for this plan
   * @returns true if inserted, false if skipped (already exists)
   */
  private async insertPlan(
    fileInfo: FileInfo,
    parsed: ParseResult<PlanFrontmatter>,
    planId: string,
    projectId: string
  ): Promise<boolean> {
    if (!projectId || projectId.trim() === '') {
      throw new Error(`Cannot insert plan: projectId is required but got "${projectId}"`);
    }
    
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
      project_id: projectId,
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
   * @param projectId - Project identifier for this learned pattern
   * @returns true if inserted, false if skipped (already exists)
   */
  private async insertLearned(
    fileInfo: FileInfo,
    parsed: ParseResult<LearnedFrontmatter>,
    projectId: string
  ): Promise<boolean> {
    if (!projectId || projectId.trim() === '') {
      throw new Error(`Cannot insert learned pattern: projectId is required but got "${projectId}"`);
    }
    
    const { frontmatter, content } = parsed;
    
    const category = this.normalizePatternCategory(frontmatter.category);
    const keywords = frontmatter.keywords || [];

    // Use stable IDs for learned patterns while preserving compatibility
    const legacyLearnedId = fileInfo.relativePath
      .replace(/\//g, '_')
      .replace('.md', '')
      .replace(/[^a-z0-9_]/g, '');

    const learnedId = legacyLearnedId.startsWith('learned_')
      ? legacyLearnedId
      : `learned_${legacyLearnId(legacyLearnedId)}`;

    // Check if already exists (query all and filter by ID)
    const allPlans = await this.storage.queryPlans({});
    const existing = allPlans.plans.find(p => p.id === learnedId || p.id === legacyLearnedId);
    const targetPlanId = existing?.id || learnedId;

    if (!existing) {
      // Get file timestamps
      const stats = await fs.stat(fileInfo.absolutePath);
      const created = stats.birthtime.toISOString();
      const updated = stats.mtime.toISOString();

      const inferredTitle = fileInfo.filename.replace('.md', '').replace(/[_-]+/g, ' ').trim() || 'Learned Pattern';

      await this.storage.insertPlan({
        id: targetPlanId,
        project_id: projectId,
        title: inferredTitle,
        status: 'COMPLETE',
        author: frontmatter.author || 'unknown',
        created: frontmatter.created || created,
        updated: frontmatter.updated || updated,
        topics: keywords,
        content,
        type: category,
        description: `Pattern from ${fileInfo.relativePath}`
      });
    }
    
    await this.ensurePatternDiscoveredEvent({
      fileInfo,
      frontmatter,
      content,
      projectId,
      planId: targetPlanId,
      category,
    });
    
    return !existing;
  }

  private normalizePatternCategory(category?: string): 'error_resolution' | 'best_practice' | 'workaround' | 'optimization' | 'project_specific' {
    const normalized = (category || 'project_specific').toLowerCase().replace(/-/g, '_');

    if (normalized === 'error_resolution' || normalized === 'best_practice' || normalized === 'workaround' || normalized === 'optimization' || normalized === 'project_specific') {
      return normalized;
    }

    if (normalized.includes('error')) return 'error_resolution';
    if (normalized.includes('workaround')) return 'workaround';
    if (normalized.includes('optimiz')) return 'optimization';
    if (normalized.includes('practice')) return 'best_practice';
    return 'project_specific';
  }

  private async ensurePatternDiscoveredEvent(params: {
    fileInfo: FileInfo;
    frontmatter: LearnedFrontmatter;
    content: string;
    projectId: string;
    planId: string;
    category: 'error_resolution' | 'best_practice' | 'workaround' | 'optimization' | 'project_specific';
  }): Promise<void> {
    const existingEvents = await this.storage.queryEvents({
      projectId: params.projectId,
      planId: params.planId,
      eventType: EventType.PATTERN_DISCOVERED,
      limit: 1,
    });

    if (existingEvents.length > 0) {
      return;
    }

    const inferredPattern = params.fileInfo.filename.replace('.md', '').replace(/[_-]+/g, ' ').trim() || 'learned pattern';
    const inferredSolution = params.content.trim() || `Migrated learned pattern from ${params.fileInfo.relativePath}`;

    const event = EventFactory.patternDiscovered({
      projectId: params.projectId,
      planId: params.planId,
      pattern: inferredPattern,
      category: params.category,
      trigger: params.fileInfo.relativePath,
      solution: inferredSolution,
      reusable: true,
      applicability: 'migrated_from_markdown',
    });

    await this.storage.insertEvent(event);
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

function legacyLearnId(id: string): string {
  return id.replace(/^learned_/, '');
}
