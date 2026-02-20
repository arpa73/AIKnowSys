/**
 * update-plan command - Modify plan status and progress
 * Phase 1: Core update-plan Command
 */

import { promises as fs } from 'fs';
import path from 'path';
import { parseFrontmatter, updateFrontmatter } from '../utils/yaml-frontmatter.js';
import { JsonStorage } from '../context/json-storage.js';
import { createLogger } from '../logger.js';
import { checkFileExists } from '../utils/file-utils.js';
import { detectUsername } from '../utils/git-utils.js';

// Define valid plan statuses (single source of truth)
const VALID_STATUSES = ['PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETE', 'CANCELLED'] as const;
type PlanStatus = typeof VALID_STATUSES[number];

export interface UpdatePlanOptions {
  planId?: string;              // Plan ID (PLAN_xyz) or auto-detect from ACTIVE status
  setStatus?: PlanStatus;
  append?: string;              // Append to ## Progress section (Phase 1.3)
  appendFile?: string;          // Append from file (Phase 1.3)
  author?: string;              // Author for auto-detection
  json?: boolean;
  targetDir?: string;
  _silent?: boolean;
}

export interface UpdatePlanResult {
  planId: string;
  filePath: string;
  updated: boolean;
  changes?: string[];
  message?: string;
}

/**
 * Update plan status and progress via mutation command
 * 
 * Manages plan lifecycle transitions and progress tracking.
 * Uses plan status metadata as source of truth and rebuilds context index.
 * 
 * @param options - Configuration options for plan update
 * @param options.planId - Plan identifier (PLAN_xyz) or omit to auto-detect from ACTIVE status
 * @param options.setStatus - New status (PLANNED|ACTIVE|PAUSED|COMPLETE|CANCELLED)
 * @param options.append - Inline progress note to append (auto-timestamped)
 * @param options.appendFile - Path to file containing progress notes to append
 * @param options.author - Plan author for auto-detection (defaults to git user)
 * @param options.json - Output JSON format for AI agents
 * @param options.targetDir - Target directory (defaults to current working directory)
 * @param options._silent - Suppress console output
 * 
 * @returns Promise resolving to update result with changes summary
 * 
 * @throws Error if plan not found
 * @throws Error if invalid status value provided
 * @throws Error if no active plan exists when auto-detecting
 * 
 * @example
 * // Activate a plan
 * await updatePlan({ planId: 'PLAN_feature_xyz', setStatus: 'ACTIVE' });
 * 
 * @example
 * // Auto-detect ACTIVE plan and add progress
 * await updatePlan({ append: 'Phase 1 complete: all tests passing' });
 * 
 * @example
 * // Complete plan and add final notes
 * await updatePlan({ 
 *   planId: 'PLAN_feature_xyz',
 *   setStatus: 'COMPLETE',
 *   append: 'Feature deployed to production'
 * });
 * 
 * @example
 * // Append progress from file
 * await updatePlan({
 *   planId: 'PLAN_feature_xyz',
 *   appendFile: './sprint-notes.md'
 * });
 */
export async function updatePlan(options: UpdatePlanOptions = {}): Promise<UpdatePlanResult> {
  const {
    planId: providedPlanId,
    setStatus,
    append,
    appendFile: appendFileOption,
    author = detectUsername(),
    json = false,
    targetDir = process.cwd(),
    _silent = false
  } = options;

  // Always resolve to absolute path (Invariant #2)
  const resolvedTargetDir = path.resolve(targetDir);

  const log = createLogger(_silent || json);

  if (!json && !_silent) {
    log.warn('Human CLI command: for AI/programmatic workflows, prefer MCP mutation tools (mcp_aiknowsys_set_plan_status / mcp_aiknowsys_append_to_plan).');
  }

  // Determine plan ID (provided or auto-detect from ACTIVE status)
  let planId = providedPlanId;
  if (!planId) {
    const storage = new JsonStorage();
    await storage.init(resolvedTargetDir);
    const activePlans = await storage.queryPlans({ status: 'ACTIVE', author });

    const firstActive = activePlans.plans[0];
    if (!firstActive) {
      const error = new Error(`No active plan found for ${author}. Specify plan ID or activate a plan first.`);
      if (!json && !_silent) {
        log.error(error.message);
      }
      throw error;
    }

    planId = firstActive.id;
  }

  // Find plan file
  const planPath = path.join(resolvedTargetDir, '.aiknowsys', `${planId}.md`);
  const exists = await checkFileExists(planPath, { onExists: 'return' });
  
  if (!exists) {
    const error = new Error(`Plan not found: ${planId}`);
    if (!json && !_silent) {
      log.error(error.message);
    }
    throw error;
  }

  // Validate status if provided
  if (setStatus && !VALID_STATUSES.includes(setStatus)) {
    const error = new Error(
      `Invalid status: ${setStatus}. Valid statuses: ${VALID_STATUSES.join(', ')}`
    );
    if (!json && !_silent) {
      log.error(error.message);
    }
    throw error;
  }

  // Read current plan content
  const content = await fs.readFile(planPath, 'utf-8');
  const { frontmatter } = parseFrontmatter(content);

  // Track changes
  const changes: string[] = [];
  const updates: Record<string, string | number> = {};

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
      // Insert before first ## heading after frontmatter, or at end
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

  // Update plan file
  const updatedContent = updateFrontmatter(updatedBody, updates);
  await fs.writeFile(planPath, updatedContent, 'utf-8');

  // Rebuild context index
  const storage = new JsonStorage();
  await storage.init(resolvedTargetDir);
  await storage.rebuildIndex();

  // Prepare response
  const result: UpdatePlanResult = {
    planId,
    filePath: planPath,
    updated: true,
    changes
  };

  // Output
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (!_silent) {
    log.header('Plan Updated', '✅');
    console.log('\n📝 Changes:');
    changes.forEach(change => console.log(`   • ${change}`));
    console.log(`\n📂 File: ${planPath}`);
    console.log('🔍 Index: Rebuilt automatically');
  }

  return result;
}
