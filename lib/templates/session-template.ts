/**
 * Session template generator with YAML frontmatter
 * Phase B Mini - Context Query Completion
 */

import { execSync } from 'child_process';

export interface SessionMetadata {
  date?: string;
  topics?: string[];
  plan?: string | null;
  author?: string;
  files?: string[];
  status?: 'in-progress' | 'complete' | 'abandoned';
  title?: string;
}

/**
 * Generate session file content with YAML frontmatter
 */
export function generateSessionTemplate(metadata: SessionMetadata = {}): string {
  const {
    date = new Date().toISOString().split('T')[0],
    topics = [],
    plan = null,
    author = detectUsername(),
    files = [],
    status = 'in-progress',
    title = 'Work Session'
  } = metadata;

  const dateFormatted = formatDate(new Date(date));

  // Build YAML frontmatter (manual to control formatting)
  let frontmatter = `---
date: "${date}"
topics: [${topics.map(t => t).join(', ')}]`;

  if (plan) {
    frontmatter += `\nplan: ${plan}`;
  }

  frontmatter += `
author: ${author}
files: [${files.map(f => f).join(', ')}]
status: ${status}
---`;

  return `${frontmatter}

# Session: ${title} (${dateFormatted})

## Goal
[Describe what you're trying to accomplish this session]

## Changes
[Document changes as you make them]

## Notes for Next Session
[Important context to remember]
`;
}

/**
 * Detect username from git config or system environment
 */
function detectUsername(): string {
  try {
    const gitUser = execSync('git config user.name', { encoding: 'utf-8' }).trim();
    if (gitUser) {
      return gitUser.toLowerCase().replace(/\s+/g, '-');
    }
  } catch (err) {
    // Git not available or not configured
  }

  // Fallback to system username
  return process.env.USER || process.env.USERNAME || 'unknown';
}

/**
 * Format date for session title (e.g., "Feb 7, 2026")
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
