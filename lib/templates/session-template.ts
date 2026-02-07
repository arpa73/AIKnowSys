/**
 * Session template generator with YAML frontmatter
 * Phase B Mini - Context Query Completion
 */

import { detectUsername } from '../utils/git-utils.js';

export interface SessionTemplateMetadata {
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
export function generateSessionTemplate(metadata: SessionTemplateMetadata = {}): string {
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
topics: [${topics.map(t => `"${t}"`).join(', ')}]`;

  if (plan) {
    frontmatter += `\nplan: "${plan}"`;
  }

  frontmatter += `
author: "${author}"
files: [${files.map(f => `"${f}"`).join(', ')}]
status: "${status}"
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
 * Format date for session title (e.g., "Feb 7, 2026")
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
