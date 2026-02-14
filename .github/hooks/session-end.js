#!/usr/bin/env node

/**
 * VSCode Hook: sessionEnd
 * 
 * Executed when GitHub Copilot coding agent session ends.
 * Creates/updates today's session file with timestamp.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get sessions directory (allow override via environment variable for testing)
const projectRoot = process.env.SESSIONS_DIR 
  ? path.dirname(process.env.SESSIONS_DIR)
  : path.resolve(__dirname, '../..');
const sessionsDir = process.env.SESSIONS_DIR || path.join(projectRoot, '.aiknowsys', 'sessions');

// Session file template
const SESSION_TEMPLATE = (date, time) => `# Session: ${date}

**Date:** ${date}
**Started:** ${time}
**Last Updated:** ${time}

---

## Current State

[Describe what you're working on]

### Completed
- [ ]

### In Progress
- [ ]

### Notes for Next Session
-
`;

try {
  // Ensure sessions directory exists
  if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
  }

  // Get today's date and current time
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM format
  const sessionFile = path.join(sessionsDir, `${today}-session.md`);

  if (fs.existsSync(sessionFile)) {
    // Update existing session file's timestamp
    const content = fs.readFileSync(sessionFile, 'utf-8');
    const updatedContent = content.replace(
      /\*\*Last Updated:\*\* \d{2}:\d{2}/,
      `**Last Updated:** ${currentTime}`
    );
    fs.writeFileSync(sessionFile, updatedContent, 'utf-8');
    console.error(`[SessionEnd] Updated session file: ${sessionFile}`);
  } else {
    // Create new session file from template
    const content = SESSION_TEMPLATE(today, currentTime);
    fs.writeFileSync(sessionFile, content, 'utf-8');
    console.error(`[SessionEnd] Created session file: ${sessionFile}`);
  }

  process.exit(0);
} catch (error) {
  // Fail gracefully - don't block session end
  console.error(`[SessionEnd] Error: ${error.message}`);
  process.exit(1);
}
