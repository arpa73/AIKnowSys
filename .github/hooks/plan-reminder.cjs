#!/usr/bin/env node
/**
 * Pre-commit hook: Team Plan Reminder
 * Shows teammates' active plans before committing to avoid duplicate work.
 * Part of AIKnowSys Phase 2 collaboration features.
 * 
 * Non-blocking: Always exits with code 0 (warning only).
 * Requires Phase 2 structure (.aiknowsys/plans/ directory).
 */

const { existsSync, readdirSync, readFileSync } = require('fs');
const { execSync } = require('child_process');
const { join } = require('path');

/**
 * Get current git username and normalize it
 * @returns {string|null} Normalized username or null if unavailable
 */
function getUsername() {
  // Try environment variable first (set by git or tests)
  if (process.env.GIT_AUTHOR_NAME) {
    return normalizeUsername(process.env.GIT_AUTHOR_NAME);
  }

  // Fall back to git config
  try {
    const username = execSync('git config user.name', { encoding: 'utf-8' }).trim();
    return normalizeUsername(username);
  } catch {
    return null;
  }
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
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Main hook logic
 */
function main() {
  // Get current user
  const username = getUsername();
  if (!username) {
    process.exit(0);  // Can't detect user, skip hook
  }

  // Check for Phase 2 plans directory
  const plansDir = join(process.cwd(), '.aiknowsys', 'plans');
  if (!existsSync(plansDir)) {
    process.exit(0);  // Phase 2 not installed, skip
  }

  // Find teammate active plans (exclude own plan)
  const planFiles = readdirSync(plansDir)
    .filter(f => f.startsWith('active-') && f.endsWith('.md'))
    .filter(f => !f.includes(username));

  if (planFiles.length === 0) {
    process.exit(0);  // No teammates or solo developer
  }

  // Parse teammates' plans
  const teammatePlans = [];
  for (const file of planFiles) {
    const content = readFileSync(join(plansDir, file), 'utf-8');
    const nameMatch = file.match(/active-(.+)\.md/);
    const planMatch = content.match(/\*\*Currently Working On:\*\* (.+)/);

    if (nameMatch && planMatch) {
      teammatePlans.push({
        developer: nameMatch[1],
        currentWork: planMatch[1].trim()
      });
    }
  }

  if (teammatePlans.length === 0) {
    process.exit(0);  // No valid plans found
  }

  // Display reminder
  console.log('\n📋 Team Plans Reminder');
  console.log('─'.repeat(50));
  console.log('\nYour teammates are currently working on:\n');

  for (const plan of teammatePlans) {
    console.log(`  👤 ${plan.developer}`);
    console.log(`     → ${plan.currentWork}\n`);
  }

  console.log('Check for overlaps: npx aiknowsys sync-plans');
  console.log('View all plans: cat .aiknowsys/CURRENT_PLAN.md\n');

  // Non-blocking - allow commit
  process.exit(0);
}

main();
