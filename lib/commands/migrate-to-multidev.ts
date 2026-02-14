import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createLogger } from '../logger.js';
// @ts-ignore - git-username.js not yet migrated to TypeScript
import { getGitUsername } from '../utils/git-username.js';
import { syncPlans } from './sync-plans.js';

export interface MigrateToMultidevOptions {
  dir?: string;
  _silent?: boolean;
  username?: string; // Override for testing
}

interface MigrateToMultidevResult {
  success: boolean;
  migrated?: boolean;
  alreadyMigrated?: boolean;
  username?: string;
  plansCreated?: number;
  reviewsMigrated?: boolean;
  createdDefaultPlan?: boolean;
}

/**
 * Migrate project from single-dev to mandatory multi-dev pattern
 * 
 * @param options - Command options
 * @returns Migration result
 */
export async function migrateToMultidev(options: MigrateToMultidevOptions = {}): Promise<MigrateToMultidevResult> {
  const targetDir = resolve(options.dir || process.cwd());
  const silent = options._silent || false;
  const log = createLogger(silent);

  // Paths
  const aiknowsysDir = join(targetDir, '.aiknowsys');
  const plansDir = join(aiknowsysDir, 'plans');
  const reviewsDir = join(aiknowsysDir, 'reviews');
  const oldPlanPath = join(aiknowsysDir, 'CURRENT_PLAN.md');
  const oldReviewPath = join(aiknowsysDir, 'PENDING_REVIEW.md');
  const gitignorePath = join(targetDir, '.gitignore');

  log.header('Migrate to Multi-Dev', '🔄');

  try {
    // Check if already migrated
    if (existsSync(plansDir)) {
      log.info('✓ Already migrated to multi-dev pattern');
      return { success: true, alreadyMigrated: true };
    }

    // Get username
    const username = options.username || getGitUsername();
    if (!username) {
      log.error('Could not determine git username. Please configure git or use --username flag.');
      throw new Error('Git username not configured');
    }
    const normalizedUsername = normalizeUsername(username);

    log.info(`Migrating for user: ${normalizedUsername}`);

    // Create directories
    log.info('Creating multi-dev directory structure...');
    mkdirSync(plansDir, { recursive: true });
    mkdirSync(reviewsDir, { recursive: true });

    // Create README files
    createPlansReadme(plansDir);
    createReviewsReadme(reviewsDir);

    // Migrate CURRENT_PLAN.md
    let createdDefaultPlan = false;
    const newPlanPath = join(plansDir, `active-${normalizedUsername}.md`);

    if (existsSync(oldPlanPath)) {
      log.info('Migrating CURRENT_PLAN.md → plans/active-<username>.md...');
      const content = readFileSync(oldPlanPath, 'utf-8');
      
      // Transform content to per-developer format
      const transformedContent = transformToPlanPointer(content, normalizedUsername);
      writeFileSync(newPlanPath, transformedContent, 'utf-8');
    } else {
      log.info('Creating default plan pointer...');
      const defaultContent = createDefaultPlanPointer(normalizedUsername);
      writeFileSync(newPlanPath, defaultContent, 'utf-8');
      createdDefaultPlan = true;
    }

    // Migrate PENDING_REVIEW.md (if exists)
    let reviewsMigrated = false;
    if (existsSync(oldReviewPath)) {
      log.info('Migrating PENDING_REVIEW.md → reviews/PENDING_<username>.md...');
      const newReviewPath = join(reviewsDir, `PENDING_${normalizedUsername}.md`);
      renameSync(oldReviewPath, newReviewPath);
      reviewsMigrated = true;
    }

    // Update .gitignore
    updateGitignore(gitignorePath, log);

    // Regenerate CURRENT_PLAN.md as team index
    log.info('Regenerating CURRENT_PLAN.md as team index...');
    await syncPlans({ dir: targetDir, _silent: true });

    // Success message
    log.success('Migration complete! 🎉');
    log.cyan('\n📖 Next steps:');
    log.info('  1. Review .aiknowsys/plans/active-<username>.md');
    log.info('  2. Run: npx aiknowsys sync-plans');
    log.info('  3. Commit changes to .aiknowsys/');

    return {
      success: true,
      migrated: true,
      alreadyMigrated: false,
      username: normalizedUsername,
      plansCreated: 1,
      reviewsMigrated,
      createdDefaultPlan,
    };

  } catch (error) {
    log.error(`Migration failed: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Normalize username for file naming
 * @param username - Raw username
 * @returns Normalized username
 */
function normalizeUsername(username: string): string {
  return username
    .toLowerCase()
    .replace(/[\s_]+/g, '-')  // Convert spaces and underscores to hyphens
    .replace(/[^a-z0-9-]/g, '');  // Remove other special chars
}

/**
 * Create plans/README.md explaining multi-dev workflow
 * @param plansDir - Plans directory path
 */
function createPlansReadme(plansDir: string): void {
  const content = `# Multi-Developer Plan Management

This directory contains per-developer plan pointers for team collaboration.

## How It Works

**File Pattern:** \`active-<username>.md\`

Each developer has their own plan pointer file that tracks:
- What they're currently working on
- Link to full implementation plan (PLAN_*.md)
- Status and last update timestamp

## Workflow

1. **Solo Developer:**
   - Single file: \`active-yourname.md\`
   - Points to your current PLAN_*.md

2. **Team:**
   - Multiple files: \`active-alice.md\`, \`active-bob.md\`, etc.
   - Each points to respective developer's current plan
   - \`CURRENT_PLAN.md\` (at root) is auto-generated team index

## Commands

\`\`\`bash
# Regenerate team index
npx aiknowsys sync-plans

# View team overview
cat ../.aiknowsys/CURRENT_PLAN.md
\`\`\`

## Files

- \`active-<username>.md\` - Plan pointer (committed)
- \`../CURRENT_PLAN.md\` - Auto-generated team index (committed)
- \`../PLAN_*.md\` - Implementation plans (committed)

---

*Part of AIKnowSys multi-developer collaboration.*
`;

  writeFileSync(join(plansDir, 'README.md'), content, 'utf-8');
}

/**
 * Create reviews/README.md explaining review workflow
 * @param reviewsDir - Reviews directory path
 */
function createReviewsReadme(reviewsDir: string): void {
  const content = `# Code Review Workflow

This directory contains per-developer code review feedback (gitignored).

## How It Works

**File Pattern:** \`PENDING_<username>.md\`

When an architect reviews code, the feedback is written to:
- \`PENDING_<username>.md\` (for that specific developer)

This keeps reviews:
- ✅ Scoped to individual developers
- ✅ Gitignored (ephemeral, not committed)
- ✅ Cleaned up after addressing issues

## Workflow

1. **Developer** implements feature
2. **Developer** requests review: \`@SeniorArchitect please review...\`
3. **Architect** writes review to \`reviews/PENDING_<username>.md\`
4. **Developer** addresses issues
5. **Developer** deletes review file once complete

## Commands

\`\`\`bash
# Check for pending reviews
ls .aiknowsys/reviews/

# Read your pending review
cat .aiknowsys/reviews/PENDING_yourname.md

# Delete after addressing (manual)
rm .aiknowsys/reviews/PENDING_yourname.md
\`\`\`

## Files

- \`PENDING_<username>.md\` - Review feedback (gitignored)
- Should be deleted after addressing issues

---

*Part of AIKnowSys multi-developer collaboration.*
`;

  writeFileSync(join(reviewsDir, 'README.md'), content, 'utf-8');
}

/**
 * Transform old CURRENT_PLAN.md to new plan pointer format
 * @param content - Old CURRENT_PLAN.md content
 * @param username - Developer username
 * @returns Transformed content for active-<username>.md
 */
function transformToPlanPointer(content: string, username: string): string {
  // If content looks like old manual plan, just wrap it
  // Don't try to parse - preserve everything
  const now = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Just add header and footer around existing content
  return `# ${username}'s Active Plan

**Last Updated:** ${now}

---

${content}

---

*Migrated from CURRENT_PLAN.md. Part of AIKnowSys multi-dev workflow.*
`;
}

/**
 * Create default plan pointer for new migration
 * @param username - Developer username
 * @returns Default plan pointer content
 */
function createDefaultPlanPointer(username: string): string {
  const now = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return `# ${username}'s Active Plan

**Currently Working On:** None  
**Status:** 📋 READY  
**Last Updated:** ${now}

---

## Getting Started

This file tracks what ${username} is currently working on.

**To start a plan:**
1. Create \`PLAN_<feature-name>.md\` in \`.aiknowsys/\`
2. Update "Currently Working On" above with link to plan
3. Run: \`npx aiknowsys sync-plans\`

## Example

\`\`\`markdown
**Currently Working On:** [Feature Implementation](../PLAN_feature_implementation.md)  
**Status:** 🎯 ACTIVE
\`\`\`

---

*Auto-generated plan pointer. Part of AIKnowSys multi-dev workflow.*
`;
}

/**
 * Update .gitignore with multi-dev patterns
 * @param gitignorePath - Path to .gitignore
 * @param log - Logger instance
 */
function updateGitignore(gitignorePath: string, log: ReturnType<typeof createLogger>): void {
  let content = '';

  if (existsSync(gitignorePath)) {
    content = readFileSync(gitignorePath, 'utf-8');
  }

  const patterns = [
    '.aiknowsys/reviews/',
    '.aiknowsys/personal/',
  ];

  let modified = false;

  for (const pattern of patterns) {
    if (!content.includes(pattern)) {
      if (!modified) {
        content += '\n# AIKnowSys - Multi-developer collaboration\n';
        modified = true;
      }
      content += `${pattern}\n`;
      log.info(`Added to .gitignore: ${pattern}`);
    }
  }

  if (modified) {
    writeFileSync(gitignorePath, content, 'utf-8');
  }
}
