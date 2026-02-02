#!/usr/bin/env node

/**
 * Pattern & Collaboration Migration Script
 * 
 * Migrates existing aiknowsys projects to:
 * 1. Personal/shared pattern split (Phase 1)
 * 2. Multi-developer collaboration (Phase 2)
 * 
 * This script:
 * 1. Creates .aiknowsys/personal/<username>/ directory
 * 2. Updates .gitignore to exclude personal patterns
 * 3. Creates personal/README.md with workflow docs
 * 4. Preserves existing .aiknowsys/learned/ patterns
 * 5. Creates .aiknowsys/plans/ directory for multi-dev plans
 * 6. Creates .aiknowsys/reviews/ directory for per-dev reviews
 * 7. Migrates CURRENT_PLAN.md to plans/active-<username>.md
 * 8. Migrates PENDING_REVIEW.md to reviews/PENDING_<username>.md
 * 
 * Usage:
 *   node scripts/migrate-learned-patterns.js
 *   npx aiknowsys migrate-patterns (via CLI integration)
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { createLogger } from '../lib/logger.js';
import { getGitUsername } from '../lib/utils/git-username.js';

/**
 * Migrate to personal/shared pattern split
 * @param {Object} options - Migration options
 * @param {string} [options._username] - Override git username (for testing)
 * @param {boolean} [options._silent] - Suppress output (for testing)
 * @returns {Promise<Object>} Migration result
 */
export async function migratePersonalPatterns(options = {}) {
  const log = createLogger(options._silent);
  const targetDir = process.cwd();
  
  if (!options._silent) {
    log.blank();
    log.header('Migrating to Personal/Shared Pattern Split', '🔄');
    log.blank();
  }
  
  try {
    // 1. Get username
    const username = options._username !== undefined 
      ? options._username 
      : getGitUsername();
    
    if (!username) {
      log.error('❌ No git username found. Cannot locate personal patterns.');
      log.cyan('💡 Configure git: git config user.name "Your Name"');
      return {
        success: false,
        error: 'No git username found. Please configure git config user.name'
      };
    }
    
    if (!options._silent) {
      log.success(`✅ Detected username: ${username}`);
    }
    
    // 2. Create personal/<username>/ directory
    const personalDir = path.join(targetDir, '.aiknowsys', 'personal', username);
    
    // Check if already migrated
    if (existsSync(personalDir)) {
      const readmePath = path.join(personalDir, 'README.md');
      if (existsSync(readmePath)) {
        if (!options._silent) {
          log.cyan('ℹ️  Personal directory already exists. Migration skipped.');
        }
        return {
          success: true,
          skipped: true,
          message: 'Personal directory already exists'
        };
      }
    }
    
    await fs.mkdir(personalDir, { recursive: true });
    if (!options._silent) {
      log.success(`✅ Created: .aiknowsys/personal/${username}/`);
    }
    
    // 3. Update .gitignore
    const gitignorePath = path.join(targetDir, '.gitignore');
    let gitignoreContent = '';
    
    if (existsSync(gitignorePath)) {
      gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
    }
    
    if (!gitignoreContent.includes('.aiknowsys/personal/')) {
      gitignoreContent += '\n# Personal learned patterns (not shared with team)\n.aiknowsys/personal/\n';
      await fs.writeFile(gitignorePath, gitignoreContent);
      if (!options._silent) {
        log.success('✅ Updated .gitignore');
      }
    } else {
      if (!options._silent) {
        log.cyan('ℹ️  .gitignore already includes personal/ pattern');
      }
    }
    
    // 4. Create personal/README.md
    const readmePath = path.join(personalDir, 'README.md');
    const readmeContent = `# Personal Learned Patterns

**Owner:** ${username}

This directory contains AI-discovered patterns that are **not shared with the team** (gitignored).

## Workflow

1. **AI discovers pattern** → Saves to \`personal/${username}/\` (automatic)
2. **Review your patterns** → \`npx aiknowsys list-patterns\`
3. **Share with team** → \`npx aiknowsys share-pattern <pattern-name>\`
4. **Team benefits** → Pattern available in \`.aiknowsys/learned/\` after git pull

## Why Personal?

- ✅ **Prevents merge conflicts** when multiple developers work simultaneously
- ✅ **Allows experimentation** without affecting team knowledge
- ✅ **Sharing is deliberate** (acts as quality gate)
- ✅ **You control** what becomes team standard

## Commands

\`\`\`bash
# List all patterns (personal + team)
npx aiknowsys list-patterns

# Share a personal pattern with team
npx aiknowsys share-pattern my-pattern

# Learn new pattern (saves to personal/ by default)
npx aiknowsys learn --extract my-pattern
\`\`\`

## ⚠️ Important

Personal patterns are **NOT backed up to git**. Share valuable patterns regularly so they:
- Benefit the team
- Survive local machine changes
- Become part of project knowledge

---

*Part of AIKnowSys personal/shared pattern collaboration system.*
`;
    
    await fs.writeFile(readmePath, readmeContent);
    if (!options._silent) {
      log.success('✅ Created personal/README.md');
    }
    
    // 5. Create plans/ directory (Phase 2: Multi-developer collaboration)
    const plansDir = path.join(targetDir, '.aiknowsys', 'plans');
    await fs.mkdir(plansDir, { recursive: true });
    
    // Create plans/README.md
    const plansReadmePath = path.join(plansDir, 'README.md');
    if (!existsSync(plansReadmePath)) {
      const plansReadme = `# Developer Plans

Per-developer plan tracking for multi-developer teams.

## How It Works

**Your plan:** \`active-${username}.md\` (points to your active PLAN_*.md)  
**Team index:** \`../CURRENT_PLAN.md\` (aggregates all developers' plans)

## Workflow

1. Create plan: \`PLAN_<name>.md\` in \`.aiknowsys/\`
2. Update your pointer: Edit \`active-${username}.md\`
3. Sync team index: \`npx aiknowsys sync-plans\`
4. Team sees your progress (no merge conflicts!)

## Why Per-Developer Files?

- ✅ No merge conflicts (each dev has own file)
- ✅ Clear ownership (who's working on what)
- ✅ Team visibility (sync-plans aggregates)
- ✅ Git-tracked (committed to repository)

---

*Part of AIKnowSys multi-developer collaboration system (Phase 2).*
`;
      await fs.writeFile(plansReadmePath, plansReadme);
      if (!options._silent) {
        log.success('✅ Created plans/README.md');
      }
    }
    
    // Create active-<username>.md if it doesn't exist
    const normalizedUsername = username.toLowerCase().replace(/\s+/g, '-');
    const activePlanPath = path.join(plansDir, `active-${normalizedUsername}.md`);
    
    // Migrate existing CURRENT_PLAN.md if present
    const currentPlanPath = path.join(targetDir, '.aiknowsys', 'CURRENT_PLAN.md');
    if (existsSync(currentPlanPath) && !existsSync(activePlanPath)) {
      const currentPlan = await fs.readFile(currentPlanPath, 'utf-8');
      const match = currentPlan.match(/\*\*Currently Working On:\*\*\s*(.+)/);
      
      if (match) {
        const activePlanContent = `# Active Plan: ${normalizedUsername}

**Currently Working On:** ${match[1].trim()}
**Last Updated:** ${new Date().toISOString().split('T')[0]}

---

*Migrated from CURRENT_PLAN.md*  
*Update this file to point to your active plan.*  
*Run \`npx aiknowsys sync-plans\` to regenerate team index.*
`;
        await fs.writeFile(activePlanPath, activePlanContent);
        if (!options._silent) {
          log.success(`✅ Migrated CURRENT_PLAN.md → plans/active-${normalizedUsername}.md`);
        }
      }
    }
    
    if (!options._silent) {
      log.success('✅ Created plans/ directory');
    }
    
    // 6. Create reviews/ directory
    const reviewsDir = path.join(targetDir, '.aiknowsys', 'reviews');
    await fs.mkdir(reviewsDir, { recursive: true });
    
    // Create reviews/README.md
    const reviewsReadmePath = path.join(reviewsDir, 'README.md');
    if (!existsSync(reviewsReadmePath)) {
      const reviewsReadme = `# Architect Reviews

Per-developer review files for multi-developer teams.

## How It Works

**Your review:** \`PENDING_${normalizedUsername}.md\` (architect writes here)  
**Status:** Gitignored (ephemeral, deleted after addressing)

## Workflow

1. Architect reviews your code
2. Architect writes to \`PENDING_${normalizedUsername}.md\`
3. You read review and address issues
4. You delete review file after completion
5. Update session file with brief status

## Why Per-Developer Files?

- ✅ No overwrites (each dev has own file)
- ✅ Concurrent reviews possible
- ✅ Gitignored (reviews are temporary)
- ✅ Clean workflow (create → address → delete)

---

*Part of AIKnowSys multi-developer collaboration system (Phase 2).*
`;
      await fs.writeFile(reviewsReadmePath, reviewsReadme);
      if (!options._silent) {
        log.success('✅ Created reviews/README.md');
      }
    }
    
    // Update .gitignore for reviews/
    if (existsSync(gitignorePath)) {
      gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
      
      if (!gitignoreContent.includes('.aiknowsys/reviews/')) {
        gitignoreContent += '\n# Per-developer architect reviews (ephemeral)\n.aiknowsys/reviews/\n!.aiknowsys/reviews/README.md\n';
        await fs.writeFile(gitignorePath, gitignoreContent);
        if (!options._silent) {
          log.success('✅ Updated .gitignore for reviews/');
        }
      }
    }
    
    // Migrate existing PENDING_REVIEW.md if present
    const pendingReviewPath = path.join(targetDir, '.aiknowsys', 'PENDING_REVIEW.md');
    if (existsSync(pendingReviewPath)) {
      const review = await fs.readFile(pendingReviewPath, 'utf-8');
      const userReviewPath = path.join(reviewsDir, `PENDING_${normalizedUsername}.md`);
      await fs.writeFile(userReviewPath, review);
      if (!options._silent) {
        log.success(`✅ Migrated PENDING_REVIEW.md → reviews/PENDING_${normalizedUsername}.md`);
        log.cyan('⚠️  Old PENDING_REVIEW.md can be deleted manually');
      }
    }
    
    if (!options._silent) {
      log.success('✅ Created reviews/ directory');
    }
    
    // 7. Summary
    if (!options._silent) {
      log.blank();
      log.header('Migration Complete!', '🎉');
      log.blank();
      log.white('📁 Phase 1 - Personal/Shared Patterns:');
      log.dim(`   • Created .aiknowsys/personal/${username}/`);
      log.dim('   • Updated .gitignore');
      log.dim('   • Created personal/README.md');
      log.blank();
      log.white('📁 Phase 2 - Multi-Developer Collaboration:');
      log.dim('   • Created .aiknowsys/plans/ (per-developer plan tracking)');
      log.dim('   • Created .aiknowsys/reviews/ (per-developer reviews)');
      if (existsSync(path.join(plansDir, `active-${normalizedUsername}.md`))) {
        log.dim(`   • Migrated CURRENT_PLAN.md → plans/active-${normalizedUsername}.md`);
      }
      if (existsSync(path.join(reviewsDir, `PENDING_${normalizedUsername}.md`))) {
        log.dim(`   • Migrated PENDING_REVIEW.md → reviews/PENDING_${normalizedUsername}.md`);
      }
      log.blank();
      log.white('📝 Next steps:');
      log.dim('   1. Run: npx aiknowsys sync-plans (to regenerate team index)');
      log.dim('   2. New patterns will save to personal/ by default');
      log.dim('   3. Share patterns: npx aiknowsys share-pattern <name>');
      log.dim('   4. List patterns: npx aiknowsys list-patterns');
      log.blank();
      log.cyan('ℹ️  Existing .aiknowsys/learned/ patterns remain shared (no change needed)');
      log.blank();
    }
    
    return {
      success: true,
      username,
      normalizedUsername,
      personalDir,
      plansDir,
      reviewsDir,
      created: true,
      migrated: {
        plan: existsSync(path.join(plansDir, `active-${normalizedUsername}.md`)),
        review: existsSync(path.join(reviewsDir, `PENDING_${normalizedUsername}.md`))
      }
    };
    
  } catch (error) {
    log.error(`❌ Migration failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run as standalone script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migratePersonalPatterns()
    .then(result => {
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
