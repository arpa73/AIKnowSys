#!/usr/bin/env node
/**
 * Collaboration Check Hook - Detect concurrent work
 * 
 * Runs at sessionStart to warn about recent changes by other developers.
 * Helps prevent merge conflicts and coordination issues.
 * 
 * Checks:
 * - Recent changes to CURRENT_PLAN.md
 * - Recent changes to session files
 * - Git branch divergence
 * 
 * @hook sessionStart
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

// Configuration
const COLLABORATION_WARNING_HOURS = 4;

/**
 * Check if we're in a git repository
 */
async function isGitRepo() {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get last modification info from git for a file
 * @param {string} filePath - Path to file
 * @returns {Object|null} { timeAgo, author, hash } or null if not in git
 */
function getLastGitChange(filePath) {
  try {
    const output = execSync(
      `git log -1 --format="%cr|%an|%h" -- "${filePath}"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();
    
    if (!output) return null;
    
    const [timeAgo, author, hash] = output.split('|');
    return { timeAgo, author, hash };
  } catch {
    return null;
  }
}

/**
 * Check for recent changes to plan files
 */
async function checkPlanChanges() {
  const planFile = '.aiknowsys/CURRENT_PLAN.md';
  
  try {
    await fs.access(planFile);
  } catch {
    return; // No plan file, skip check
  }
  
  const change = getLastGitChange(planFile);
  
  if (!change) return; // File not in git yet
  
  // Warn if changed within configured hours
  if (change.timeAgo.includes('minutes ago') || 
      change.timeAgo.includes('hour ago') ||
      (change.timeAgo.includes('hours ago') && parseInt(change.timeAgo) <= COLLABORATION_WARNING_HOURS)) {
    
    console.error('[Hook] ⚠️  Collaboration Notice');
    console.error(`[Hook] CURRENT_PLAN.md modified ${change.timeAgo} by ${change.author}`);
    console.error(`[Hook] Commit: ${change.hash}`);
    console.error('[Hook] Review changes before continuing to avoid conflicts');
    console.error('[Hook]');
  }
}

/**
 * Check for recent session file activity
 */
async function checkSessionActivity() {
  const sessionsDir = '.aiknowsys/sessions';
  
  try {
    await fs.access(sessionsDir);
  } catch {
    return; // No sessions directory
  }
  
  // Find today's session file
  const today = new Date().toISOString().split('T')[0];
  const todaySession = path.join(sessionsDir, `${today}-*.md`);
  
  try {
    const files = await fs.readdir(sessionsDir);
    const todaySessions = files.filter(f => f.startsWith(today));
    
    if (todaySessions.length > 0) {
      const sessionFile = path.join(sessionsDir, todaySessions[0]);
      const change = getLastGitChange(sessionFile);
      
      if (change && 
          (change.timeAgo.includes('minutes ago') || change.timeAgo.includes('hour ago'))) {
        console.error('[Hook] ℹ️  Active session detected');
        console.error(`[Hook] Last update ${change.timeAgo} by ${change.author}`);
        console.error('[Hook]');
      }
    }
  } catch {
    // Ignore errors reading sessions
  }
}

/**
 * Check if local branch is behind remote
 */
async function checkBranchDivergence() {
  try {
    // Fetch remote quietly
    execSync('git fetch origin --quiet', { stdio: 'ignore' });
    
    // Get current branch
    const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
    
    if (!branch) return; // Detached HEAD state
    
    // Check if remote branch exists
    try {
      execSync(`git rev-parse origin/${branch}`, { stdio: 'ignore' });
    } catch {
      return; // No remote tracking branch
    }
    
    // Count commits behind/ahead
    const behind = parseInt(
      execSync(`git rev-list --count HEAD..origin/${branch}`, { encoding: 'utf-8' }).trim()
    );
    
    if (behind > 0) {
      console.error('[Hook] ⚠️  Branch Divergence');
      console.error(`[Hook] Your branch is ${behind} commit(s) behind origin/${branch}`);
      console.error('[Hook] Consider pulling latest changes: git pull');
      console.error('[Hook]');
    }
  } catch {
    // Ignore errors (offline, no remote, etc.)
  }
}

/**
 * Main hook execution
 */
async function main() {
  // Only run in git repositories
  if (!await isGitRepo()) {
    return;
  }
  
  // Run all checks
  await Promise.all([
    checkPlanChanges(),
    checkSessionActivity(),
    checkBranchDivergence(),
  ]);
}

// Run hook
main().catch(() => {
  // Silently fail - don't block on errors
});
