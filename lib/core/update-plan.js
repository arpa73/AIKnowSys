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
import { syncPlansCore } from './sync-plans.js';
import { detectUsername } from '../utils/git-utils.js';
import { existsSync } from 'fs';
// Define valid plan statuses (single source of truth)
const VALID_STATUSES = ['PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETE', 'CANCELLED'];
const STATUS_EMOJIS = {
    'PLANNED': '📋',
    'ACTIVE': '🎯',
    'PAUSED': '🔄',
    'COMPLETE': '✅',
    'CANCELLED': '❌'
};
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
export async function updatePlanCore(options) {
    const { planId: providedPlanId, setStatus, append, appendFile: appendFileOption, author = detectUsername(), targetDir = process.cwd() } = options;
    // Always resolve to absolute path
    const resolvedTargetDir = path.resolve(targetDir);
    // Determine plan ID (provided or auto-detect from active pointer)
    let planId = providedPlanId;
    if (!planId) {
        // Auto-detect from active pointer
        const pointerPath = path.join(resolvedTargetDir, '.aiknowsys', 'plans', `active-${author}.md`);
        if (!existsSync(pointerPath)) {
            throw new Error(`No active plan found for ${author}. Specify plan ID or activate a plan first.`);
        }
        // Read pointer to get plan ID
        const pointerContent = await fs.readFile(pointerPath, 'utf-8');
        const planMatch = pointerContent.match(/\[([^\]]+)\]\(\.\.\/PLAN_([^)]+)\.md\)/);
        if (planMatch && planMatch[2]) {
            planId = `PLAN_${planMatch[2]}`;
        }
        else {
            throw new Error(`No active plan found for ${author}.`);
        }
    }
    // Find plan file
    const planPath = path.join(resolvedTargetDir, '.aiknowsys', `${planId}.md`);
    if (!existsSync(planPath)) {
        throw new Error(`Plan not found: ${planId}`);
    }
    // Validate status if provided
    if (setStatus && !VALID_STATUSES.includes(setStatus)) {
        throw new Error(`Invalid status: ${setStatus}. Valid statuses: ${VALID_STATUSES.join(', ')}`);
    }
    // Read current plan content
    const content = await fs.readFile(planPath, 'utf-8');
    const { frontmatter } = parseFrontmatter(content);
    // Track changes
    const changes = [];
    const updates = {};
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
        }
        else if (append) {
            progressNote = `**${date}:** ${append}`;
        }
        // Find or create ## Progress section
        const progressSectionMatch = updatedBody.match(/## Progress[\s\S]*?(?=\n## |$)/);
        if (progressSectionMatch) {
            // Append to existing section
            const existingSection = progressSectionMatch[0];
            const updatedSection = existingSection.trimEnd() + '\n\n' + progressNote;
            updatedBody = updatedBody.replace(existingSection, updatedSection);
        }
        else {
            // Create new ## Progress section
            const firstHeadingMatch = updatedBody.match(/\n## /);
            if (firstHeadingMatch && firstHeadingMatch.index) {
                const insertPos = firstHeadingMatch.index;
                updatedBody = updatedBody.slice(0, insertPos) +
                    '\n\n## Progress\n\n' + progressNote + '\n' +
                    updatedBody.slice(insertPos);
            }
            else {
                // No headings found, append at end
                updatedBody = updatedBody.trimEnd() + '\n\n## Progress\n\n' + progressNote + '\n';
            }
        }
        changes.push('Added progress note');
    }
    // Update plan file
    const updatedContent = updateFrontmatter(updatedBody, updates);
    await fs.writeFile(planPath, updatedContent, 'utf-8');
    // Update active pointer if status changed
    if (setStatus) {
        await updateActivePointer(resolvedTargetDir, planId, setStatus, author, frontmatter.title || planId);
    }
    // Rebuild context index
    const storage = new JsonStorage();
    await storage.init(resolvedTargetDir);
    await storage.rebuildIndex();
    // Auto-sync plans to update CURRENT_PLAN.md
    await syncPlansCore({ targetDir: resolvedTargetDir });
    // Return structured result
    return {
        planId,
        filePath: planPath,
        updated: true,
        changes,
        metadata: {
            status: updates.status,
            started: updates.started,
            completed: updates.completed
        }
    };
}
/**
 * Update active pointer file based on status transition
 */
async function updateActivePointer(targetDir, planId, status, author, planTitle) {
    const pointerPath = path.join(targetDir, '.aiknowsys', 'plans', `active-${author}.md`);
    const date = new Date().toISOString().split('T')[0];
    const emoji = STATUS_EMOJIS[status] || '📋';
    // Determine pointer content based on status
    let pointerContent;
    if (status === 'COMPLETE' || status === 'CANCELLED') {
        // Clear active plan (set to None)
        pointerContent = `# Active Plan: ${author}

**Currently Working On:** None  
**Status:** ${emoji} ${status}  
**Last Updated:** ${date}

---

## Recent Work

Previously completed: **${planTitle}** (${date})

---

*Auto-generated by update-plan command*
`;
    }
    else if (status === 'ACTIVE' || status === 'PAUSED') {
        // Point to plan
        const planFile = `${planId}.md`;
        pointerContent = `# Active Plan: ${author}

**Currently Working On:** [${planTitle}](../${planFile})  
**Status:** ${emoji} ${status}  
**Last Updated:** ${date}

---

## Progress

[Update as you work through the plan]

---

*Auto-generated by update-plan command*
`;
    }
    else {
        // PLANNED or other - keep minimal pointer
        const planFile = `${planId}.md`;
        pointerContent = `# Active Plan: ${author}

**Currently Working On:** [${planTitle}](../${planFile})  
**Status:** ${emoji} ${status}  
**Last Updated:** ${date}

---

*Auto-generated by update-plan command*
`;
    }
    // Create plans directory if needed
    await fs.mkdir(path.dirname(pointerPath), { recursive: true });
    await fs.writeFile(pointerPath, pointerContent, 'utf-8');
}
//# sourceMappingURL=update-plan.js.map