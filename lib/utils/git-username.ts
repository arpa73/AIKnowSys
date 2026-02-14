/**
 * Git Username Utilities
 * Shared helper for getting and normalizing git usernames
 */

import { execSync } from 'child_process';

/**
 * Get git username and normalize it for directory naming
 * @returns Normalized username or null if git not configured
 */
export function getGitUsername(): string | null {
  try {
    let username: string;
    try {
      // Try local config first
      username = execSync('git config user.name', { 
        encoding: 'utf-8', 
        stdio: ['pipe', 'pipe', 'ignore'] 
      }).trim();
    } catch {
      // Fallback to global config (CI, fresh repos)
      username = execSync('git config --global user.name', { 
        encoding: 'utf-8', 
        stdio: ['pipe', 'pipe', 'ignore'] 
      }).trim();
    }
    
    if (!username) return null;
    
    // Normalize: lowercase, replace non-alphanumeric with hyphens, trim hyphens
    return username
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  } catch {
    return null;
  }
}
