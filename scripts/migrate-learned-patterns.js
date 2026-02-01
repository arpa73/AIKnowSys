#!/usr/bin/env node

/**
 * Personal Pattern Migration Script
 * 
 * Migrates existing aiknowsys projects to personal/shared pattern split.
 * 
 * This script:
 * 1. Creates .aiknowsys/personal/<username>/ directory
 * 2. Updates .gitignore to exclude personal patterns
 * 3. Creates personal/README.md with workflow docs
 * 4. Preserves existing .aiknowsys/learned/ patterns
 * 
 * Usage:
 *   node scripts/migrate-learned-patterns.js
 *   npx aiknowsys migrate-patterns (via CLI integration)
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
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
    
    // 5. Summary
    if (!options._silent) {
      log.blank();
      log.header('Migration Complete!', '🎉');
      log.blank();
      log.white('📁 What changed:');
      log.dim(`   • Created .aiknowsys/personal/${username}/`);
      log.dim('   • Updated .gitignore');
      log.dim('   • Created personal/README.md');
      log.blank();
      log.white('📝 Next steps:');
      log.dim('   1. New patterns will save to personal/ by default');
      log.dim('   2. Share patterns: npx aiknowsys share-pattern <name>');
      log.dim('   3. List patterns: npx aiknowsys list-patterns');
      log.blank();
      log.cyan('ℹ️  Existing .aiknowsys/learned/ patterns remain shared (no change needed)');
      log.blank();
    }
    
    return {
      success: true,
      username,
      personalDir,
      created: true
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
