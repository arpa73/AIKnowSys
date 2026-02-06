#!/usr/bin/env node
/**
 * Post-merge hook: Auto-Sync Plans
 * Regenerates CURRENT_PLAN.md team index after pulling/merging changes.
 * Part of AIKnowSys Phase 2 multi-developer collaboration features.
 * 
 * Non-blocking: Always exits with code 0 (warnings only, doesn't fail merge).
 * Requires Phase 2 structure (.aiknowsys/plans/ directory).
 */

const { existsSync } = require('fs');
const { execSync } = require('child_process');
const { join } = require('path');

/**
 * Main hook logic
 */
function main() {
  // Check if Phase 2 is installed (plans directory exists)
  const plansDir = join(process.cwd(), '.aiknowsys', 'plans');
  if (!existsSync(plansDir)) {
    process.exit(0);  // Phase 2 not installed, skip
  }

  // Try to run sync-plans command
  try {
    // Run sync-plans with --silent flag to avoid interactive prompts
    execSync('npx aiknowsys sync-plans --silent', {
      cwd: process.cwd(),
      encoding: 'utf-8',
      stdio: 'inherit'  // Show output for transparency
    });
  } catch (error) {
    // Non-blocking - don't fail the merge if sync fails
    // User can manually run sync-plans later if needed
    process.exit(0);
  }

  // Non-blocking - allow merge to complete
  process.exit(0);
}

main();
