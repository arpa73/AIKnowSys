#!/usr/bin/env node

/**
 * VSCode Hook: sessionStart
 * 
 * Executed when GitHub Copilot coding agent session starts.
 * Checks for recent session files and notifies user/AI to load context.
 * Also checks if Context7 MCP is available for enhanced library documentation.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Context7 detection if available
let isContext7Available = null;
try {
  const context7Module = await import('../../lib/context7/index.js');
  isContext7Available = context7Module.isContext7Available;
} catch (err) {
  // Context7 utilities not available - skip detection
}

// Get sessions directory (allow override via environment variable for testing)
const projectRoot = process.env.SESSIONS_DIR 
  ? path.dirname(process.env.SESSIONS_DIR)
  : path.resolve(__dirname, '../..');
const sessionsDir = process.env.SESSIONS_DIR || path.join(projectRoot, '.aiknowsys', 'sessions');

try {
  // Check if sessions directory exists
  if (!fs.existsSync(sessionsDir)) {
    // Silent exit - no sessions yet
    process.exit(0);
  }

  // Find session files modified in last 7 days
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const files = fs.readdirSync(sessionsDir);
  
  const recentSessions = files
    .filter(file => file.endsWith('.md') || file.endsWith('.tmp'))
    .map(file => {
      const filePath = path.join(sessionsDir, file);
      const stats = fs.statSync(filePath);
      return { file, path: filePath, mtime: stats.mtimeMs };
    })
    .filter(({ mtime }) => mtime > sevenDaysAgo)
    .sort((a, b) => b.mtime - a.mtime); // Most recent first

  if (recentSessions.length > 0) {
    const mostRecent = recentSessions[0];
    console.error(`[SessionStart] Found recent session: ${mostRecent.file}`);
    console.error(`[SessionStart] Read it to load context from previous work`);
    console.error(`[SessionStart] Path: ${mostRecent.path}`);
  }

  // Check if Context7 MCP is available
  if (isContext7Available) {
    const context7Status = await isContext7Available();
    if (context7Status.available) {
      console.error(`[SessionStart] Context7 MCP detected (${context7Status.source})`);
      console.error(`[SessionStart] Use @context7-usage skill for up-to-date library documentation`);
    }
  }

  process.exit(0);
} catch (error) {
  // Fail gracefully - don't block session start
  console.error(`[SessionStart] Warning: ${error.message}`);
  process.exit(0);
}
