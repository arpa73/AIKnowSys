/**
 * Session template generator with YAML frontmatter
 * Phase B Mini - Context Query Completion
 *
 * YAML Frontmatter Format:
 * The generated session files use a simplified YAML subset for frontmatter:
 * - Simple key-value pairs (date, status, author)
 * - Arrays using inline bracket notation: ["item1", "item2"]
 * - String values are quoted for consistency
 *
 * Supported YAML features:
 * ✅ Simple strings (quoted)
 * ✅ Arrays with inline syntax: ["a", "b"]
 * ✅ Empty arrays: []
 *
 * Not supported (will cause parsing errors):
 * ❌ Nested objects
 * ❌ Multi-line array syntax ("- item")
 * ❌ Unquoted strings with special characters
 * ❌ YAML anchors/references
 *
 * If you need to manually edit session frontmatter, stick to the inline format:
 * topics: ["topic1", "topic2"]
 * files: ["path/to/file.ts"]
 */
import { detectUsername } from '../utils/git-utils.js';
/**
 * Generate session file content with YAML frontmatter
 */
export function generateSessionTemplate(metadata = {}) {
    const { date = new Date().toISOString().split('T')[0], topics = [], plan = null, author = detectUsername(), files = [], status = 'in-progress', title = 'Work Session' } = metadata;
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
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}
//# sourceMappingURL=session-template.js.map