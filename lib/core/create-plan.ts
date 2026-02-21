/**
 * lib/core/create-plan.ts
 * Pure business logic for plan creation (NO console.log, NO process.exit)
 * 
 * Phase 2 Batch 1: Mutation Commands
 * Pattern: Direct import from lib/core (10-100x faster than subprocess)
 */

import { promises as fs } from 'fs';
import path from 'path';
import { generatePlanTemplate } from '../templates/plan-template.js';
import { JsonStorage } from '../context/json-storage.js';
import type { SqliteStorage } from '../context/sqlite-storage.js';
import { detectUsername } from '../utils/git-utils.js';
import { generatePlanId } from '../utils/plan-utils.js';
import { existsSync } from 'fs';
import { isSqliteConstraintError } from '../utils/sqlite-utils.js';

/**
 * Options for creating a plan
 */
export interface CreatePlanCoreOptions {
  title: string;
  author?: string;
  topics?: string[];
  targetDir?: string;
  storage?: SqliteStorage;
  writeMarkdown?: boolean;
}

/**
 * Result of plan creation
 */
export interface CreatePlanCoreResult {
  planId: string;
  filePath: string;
  created: boolean;
  metadata?: {
    title: string;
    author: string;
    topics: string[];
    status: string;
  };
}

/**
 * Create a new implementation plan
 * 
 * Pure function - NO side effects:
 * - NO console.log (caller handles output)
 * - NO process.exit (throws errors instead)
 * - Returns structured data (not stdout strings)
 * 
 * @param options - Plan creation options
 * @returns Promise resolving to plan creation result
 * @throws Error if title is invalid or file operations fail
 */
export async function createPlanCore(
  options: CreatePlanCoreOptions
): Promise<CreatePlanCoreResult> {
  const {
    title,
    author = detectUsername(),
    topics = [],
    targetDir = process.cwd(),
    storage,
    writeMarkdown
  } = options;

  const shouldWriteMarkdown = writeMarkdown ?? !storage;

  // Validation: title must be at least 3 characters
  if (!title || title.length < 3) {
    throw new Error('Plan title must be at least 3 characters');
  }

  // Always resolve to absolute path
  const resolvedTargetDir = path.resolve(targetDir);

  // Generate plan ID and filename
  const planId = generatePlanId(title);
  const filename = `${planId}.md`;
  const filepath = path.join(resolvedTargetDir, '.aiknowsys', filename);

  // Check if plan already exists (database-first if storage is available)
  if (storage && typeof storage.getPlanById === 'function') {
    const existingPlan = await storage.getPlanById(planId);
    if (existingPlan) {
      return {
        planId,
        filePath: filepath,
        created: false
      };
    }
  } else if (existsSync(filepath)) {
    return {
      planId,
      filePath: filepath,
      created: false
    };
  }

  // Generate plan content
  const content = generatePlanTemplate({
    id: planId,
    title,
    author,
    topics,
    status: 'PLANNED'
  });

  const now = new Date().toISOString();
  const projectId = path.basename(resolvedTargetDir);

  // Write to SQLite first when storage is available
  if (storage) {
    try {
      await storage.insertProject({
        id: projectId,
        name: projectId,
        path: resolvedTargetDir,
        created_at: now,
        updated_at: now
      });
    } catch (error: unknown) {
      if (!isSqliteConstraintError(error)) {
        throw error;
      }
    }

    await storage.insertPlan({
      id: planId,
      project_id: projectId,
      title,
      status: 'PLANNED',
      author,
      created: now,
      updated: now,
      content,
      topics,
      description: title,
      type: 'feature'
    });
  }

  if (shouldWriteMarkdown) {
    // Create .aiknowsys directory if needed
    await fs.mkdir(path.join(resolvedTargetDir, '.aiknowsys'), { recursive: true });

    // Write plan file
    await fs.writeFile(filepath, content, 'utf-8');

    // Update context index for markdown workflows
    const jsonStorage = new JsonStorage();
    await jsonStorage.init(resolvedTargetDir);
    await jsonStorage.rebuildIndex();
  }

  // Return structured result
  return {
    planId,
    filePath: shouldWriteMarkdown ? filepath : `sqlite://plans/${planId}`,
    created: true,
    metadata: {
      title,
      author,
      topics,
      status: 'PLANNED'
    }
  };
}
