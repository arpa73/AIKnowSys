/**
 * lib/core/update-plan.ts
 * Pure business logic for plan updates (NO console.log, NO process.exit)
 * 
 * Phase 2 Batch 1: Mutation Commands
 * Pattern: Direct import from lib/core (10-100x faster than subprocess)
 */

import { promises as fs } from 'fs';
import path from 'path';
import { parseFrontmatter, updateFrontmatter } from '../utils/yaml-frontmatter.js';
import { JsonStorage } from '../context/json-storage.js';
import { detectUsername } from '../utils/git-utils.js';
import { existsSync } from 'fs';
import { enforceConstraints } from './constraints.js';
import { DatabaseLocator } from '../context/database-locator.js';
import type { SqliteStorage } from '../context/sqlite-storage.js';

// Define valid plan statuses (single source of truth)
const VALID_STATUSES = ['PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETE', 'CANCELLED'] as const;
type PlanStatus = typeof VALID_STATUSES[number];

/**
 * Options for updating a plan
 */
export interface UpdatePlanCoreOptions {
  planId?: string;           // Plan ID or auto-detect from ACTIVE status
  setStatus?: PlanStatus;
  append?: string;           // Append progress note
  appendFile?: string;       // Append from file
  prepend?: string;          // Prepend critical update
  updates?: Record<string, any>; // Arbitrary frontmatter updates
  author?: string;           // Author for auto-detection
  targetDir?: string;
  storage?: SqliteStorage;
  writeMarkdown?: boolean;
}

/**
 * Result of plan update
 */
export interface UpdatePlanCoreResult {
  planId: string;
  filePath: string | null;
  updated: boolean;
  changes?: string[];
  metadata?: {
    status?: string;
    started?: string;
    completed?: string;
  };
}

/**
 * Update plan status and progress
 * 
 * Pure function - NO side effects:
 * - NO console.log (caller handles output)
 * - NO process.exit (throws errors instead)
 * - Returns structured data (not stdout strings)
 * 
 * @param options - Plan update options
 * @returns Promise resolving to plan update result
 * @throws Error if plan not found or invalid parameters
 */
export async function updatePlanCore(
  options: UpdatePlanCoreOptions
): Promise<UpdatePlanCoreResult> {
  const {
    planId: providedPlanId,
    setStatus,
    append,
    appendFile: appendFileOption,
    prepend,
    updates: providedUpdates,
    author = detectUsername(),
    targetDir = process.cwd(),
    storage,
    writeMarkdown
  } = options;

  const shouldWriteMarkdown = writeMarkdown ?? !storage;

  // Always resolve to absolute path
  const resolvedTargetDir = path.resolve(targetDir);

  // Determine plan ID (provided or auto-detect from ACTIVE status)
  let planId = providedPlanId;
  if (!planId) {
    const activePlans = storage
      ? await storage.queryPlans({ status: 'ACTIVE', author })
      : await (async () => {
        const jsonStorage = new JsonStorage();
        await jsonStorage.init(resolvedTargetDir);
        return jsonStorage.queryPlans({ status: 'ACTIVE', author });
      })();

    const firstActive = activePlans.plans[0];

    if (!firstActive) {
      throw new Error(`No active plan found for ${author}. Specify plan ID or activate a plan first.`);
    }

    planId = firstActive.id;
  }

  // Phase 2: Enforce constraints for Plan Completion
  // Must pass validation checks and have no pending reviews
  if (setStatus === 'COMPLETE') {
    const locator = new DatabaseLocator();
    // Resolve project config to get ID
    const config = await locator.getDatabaseConfig(resolvedTargetDir);

    await enforceConstraints('COMPLETE_PLAN', {
      userId: author, // Using author as user ID
      projectId: config.projectId,
      targetId: planId
    });
  }

  // Find plan file
  const planPath = path.join(resolvedTargetDir, '.aiknowsys', `${planId}.md`);

  // Validate status if provided
  if (setStatus && !VALID_STATUSES.includes(setStatus)) {
    throw new Error(
      `Invalid status: ${setStatus}. Valid statuses: ${VALID_STATUSES.join(', ')}`
    );
  }

  let content: string;
  if (storage) {
    const plan = await storage.getPlanById(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    content = plan.content || '';
  } else {
    if (!existsSync(planPath)) {
      throw new Error(`Plan not found: ${planId}`);
    }
    content = await fs.readFile(planPath, 'utf-8');
  }

  const { frontmatter } = parseFrontmatter(content);

  // Track changes
  const changes: string[] = [];
  const updates: Record<string, any> = providedUpdates ? { ...providedUpdates } : {};

  // Status update
  if (setStatus) {
    const oldStatus = frontmatter.status || 'PLANNED';
    updates.status = setStatus;
    changes.push(`Status: ${oldStatus} → ${setStatus}`);

    // Add timestamps based on status transitions
    const date = new Date().toISOString().split('T')[0];

    // Add started date when moving to ACTIVE (if not already set)
    if (setStatus === 'ACTIVE' && !frontmatter.started) {
      updates.started = date;
    }

    // Add completed date when moving to COMPLETE or CANCELLED
    if ((setStatus === 'COMPLETE' || setStatus === 'CANCELLED') && !frontmatter.completed) {
      updates.completed = date;
    }
  }

  // Progress append
  let updatedBody = content;
  if (append || appendFileOption) {
    const date = new Date().toISOString().split('T')[0];
    let progressNote = '';

    // Get content to append
    if (appendFileOption) {
      progressNote = await fs.readFile(appendFileOption, 'utf-8');
    } else if (append) {
      progressNote = `**${date}:** ${append}`;
    }

    // Find or create ## Progress section
    const progressSectionMatch = updatedBody.match(/## Progress[\s\S]*?(?=\n## |$)/);

    if (progressSectionMatch) {
      // Append to existing section
      const existingSection = progressSectionMatch[0];
      const updatedSection = existingSection.trimEnd() + '\n\n' + progressNote;
      updatedBody = updatedBody.replace(existingSection, updatedSection);
    } else {
      // Create new ## Progress section
      const firstHeadingMatch = updatedBody.match(/\n## /);
      if (firstHeadingMatch && firstHeadingMatch.index) {
        const insertPos = firstHeadingMatch.index;
        updatedBody = updatedBody.slice(0, insertPos) +
          '\n\n## Progress\n\n' + progressNote + '\n' +
          updatedBody.slice(insertPos);
      } else {
        // No headings found, append at end
        updatedBody = updatedBody.trimEnd() + '\n\n## Progress\n\n' + progressNote + '\n';
      }
    }

    changes.push('Added progress note');
  }

  // Prepend critical update
  if (prepend) {
    const date = new Date().toISOString().split('T')[0];
    const prependNote = `**${date}:** ${prepend}`;

    // Find the first heading to insert right before it, or just at the top of the body
    const firstHeadingMatch = updatedBody.match(/\n## /);
    if (firstHeadingMatch && firstHeadingMatch.index !== undefined) {
      const insertPos = firstHeadingMatch.index;
      updatedBody = updatedBody.slice(0, insertPos) +
        '\n\n' + prependNote + '\n\n' +
        updatedBody.slice(insertPos);
    } else {
      updatedBody = '\n' + prependNote + '\n\n' + updatedBody.trimStart();
    }
    changes.push('Prepended critical update');
  }

  // Update plan content
  const updatedContent = updateFrontmatter(updatedBody, updates);

  if (storage) {
    await storage.updatePlan({
      id: planId,
      status: setStatus,
      content: updatedContent,
      updated_at: new Date().toISOString(),
    });
  }

  if (shouldWriteMarkdown) {
    await fs.mkdir(path.join(resolvedTargetDir, '.aiknowsys'), { recursive: true });
    await fs.writeFile(planPath, updatedContent, 'utf-8');

    const jsonStorage = new JsonStorage();
    await jsonStorage.init(resolvedTargetDir);
    await jsonStorage.rebuildIndex();
  }

  // Return structured result
  return {
    planId,
    filePath: shouldWriteMarkdown ? planPath : null,
    updated: true,
    changes,
    metadata: {
      status: updates.status as string,
      started: updates.started as string,
      completed: updates.completed as string
    }
  };
}
