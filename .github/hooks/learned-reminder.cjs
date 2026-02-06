#!/usr/bin/env node

/**
 * Git pre-commit hook: Learned Patterns Reminder
 * 
 * Reminds developers to share valuable personal patterns with the team.
 * Non-blocking - provides helpful reminder but allows commit to proceed.
 * 
 * Triggers when:
 * - 3+ unshared personal patterns exist
 * - High-value patterns detected (5+ uses)
 */

const { existsSync, readdirSync, readFileSync } = require('fs');
const { execSync } = require('child_process');
const { join } = require('path');

// Get username from git config or environment
function getUsername() {
  // Check if current directory is a git repository (not parent directories)
  const isGitRepo = existsSync(join(process.cwd(), '.git'));
  
  // If in a git repo, use git config
  if (isGitRepo) {
    try {
      const gitName = execSync('git config user.name', { encoding: 'utf-8' }).trim();
      if (gitName) {
        return normalizeUsername(gitName);
      }
    } catch {
      // Git command failed, will fall through
    }
  }
  
  // Fall back to GIT_AUTHOR_NAME environment variable
  if (process.env.GIT_AUTHOR_NAME) {
    return normalizeUsername(process.env.GIT_AUTHOR_NAME);
  }
  
  return null;
}

/**
 * Normalize username to directory-safe format
 * @param {string} name - Raw username from git config or environment
 * @returns {string} Normalized username (lowercase, spaces→hyphens, no leading/trailing hyphens)
 * @example
 * normalizeUsername('John Doe') // → 'john-doe'
 * normalizeUsername('alice_smith') // → 'alice-smith'
 * normalizeUsername('--bob--') // → 'bob'
 */
function normalizeUsername(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Main hook logic
function main() {
  const username = getUsername();
  if (!username) {
    // Can't detect user, skip hook
    process.exit(0);
  }

  // Check personal patterns directory
  const personalDir = join(process.cwd(), '.aiknowsys', 'personal', username);
  if (!existsSync(personalDir)) {
    // No personal directory, skip
    process.exit(0);
  }

  // Get all pattern files (exclude README.md)
  let files;
  try {
    files = readdirSync(personalDir);
  } catch {
    // Can't read directory, skip
    process.exit(0);
  }

  const personalPatterns = files.filter(f => 
    f.endsWith('.md') && f !== 'README.md'
  );

  if (personalPatterns.length === 0) {
    // No patterns, skip
    process.exit(0);
  }

  // Detect high-value patterns (5+ uses)
  const highValuePatterns = [];
  for (const file of personalPatterns) {
    try {
      const content = readFileSync(join(personalDir, file), 'utf-8');
      const usageMatch = content.match(/\*\*Used (\d+) times?\*\*|used (\d+) times?/i);
      if (usageMatch) {
        const count = parseInt(usageMatch[1] || usageMatch[2], 10);
        if (count >= 5) {
          highValuePatterns.push({ file, count });
        }
      }
    } catch {
      // Skip files that can't be read
      continue;
    }
  }

  // Show reminder if 3+ patterns OR high-value patterns exist
  if (personalPatterns.length >= 3 || highValuePatterns.length > 0) {
    console.log('\n📚 Learned Patterns Reminder');
    console.log('─'.repeat(50));
    
    if (personalPatterns.length >= 3) {
      console.log(`\n💡 You have ${personalPatterns.length} unshared personal patterns:`);
      personalPatterns.slice(0, 5).forEach(f => {
        console.log(`   • ${f.replace('.md', '')}`);
      });
      if (personalPatterns.length > 5) {
        console.log(`   ... (${personalPatterns.length - 5} more)`);
      }
    }
    
    if (highValuePatterns.length > 0) {
      console.log('\n⭐ High-value patterns worth sharing:');
      highValuePatterns.forEach(({ file, count }) => {
        console.log(`   • ${file.replace('.md', '')} (used ${count} times)`);
      });
    }
    
    console.log('\nShare with team: npx aiknowsys share-pattern <name>');
    console.log('List patterns: npx aiknowsys list-patterns\n');
  }

  // Non-blocking - allow commit to proceed
  process.exit(0);
}

// Run hook when executed directly
if (require.main === module) {
  main();
}

module.exports = { getUsername, normalizeUsername };
