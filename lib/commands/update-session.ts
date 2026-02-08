/**
 * update-session command - Modify session YAML frontmatter
 * Phase B Mini - Context Query Completion
 */

import { promises as fs } from 'fs';
import path from 'path';
import { parseFrontmatter, updateFrontmatter } from '../utils/yaml-frontmatter.js';
import { JsonStorage } from '../context/json-storage.js';
import { createLogger } from '../logger.js';
import { checkFileExists } from '../utils/file-utils.js';

export interface UpdateSessionOptions {
  addTopic?: string;
  addFile?: string;
  setStatus?: 'in-progress' | 'complete' | 'abandoned';
  // Content manipulation options (v0.11.0)
  appendSection?: string;  // Section title (## Title)
  content?: string;         // Markdown content for section
  appendFile?: string;      // Path to markdown file to append
  // Advanced insertion options (Phase 1)
  prependSection?: string;  // Section title to prepend
  insertAfter?: string;     // Pattern to insert after
  insertBefore?: string;    // Pattern to insert before
  // Shortcuts (Phase 4.2)
  done?: boolean;           // Shortcut for --set-status complete
  wip?: boolean;            // Shortcut for --set-status in-progress
  append?: string;          // Shortcut for --appendSection "Update" + content/file
  json?: boolean;
  targetDir?: string;
  _silent?: boolean;
}

export interface UpdateSessionResult {
  filePath: string;
  updated: boolean;
  changes?: string[];
  message?: string;
}

const VALID_STATUSES = ['in-progress', 'complete', 'abandoned'] as const;

export async function updateSession(options: UpdateSessionOptions = {}): Promise<UpdateSessionResult> {
  // === Phase 4.2: Expand shortcuts ===
  const expandedOptions = { ...options };

  // --done shortcut → --set-status complete
  if (expandedOptions.done) {
    expandedOptions.setStatus = 'complete';
    delete expandedOptions.done;
  }

  // --wip shortcut → --set-status in-progress
  if (expandedOptions.wip) {
    expandedOptions.setStatus = 'in-progress';
    delete expandedOptions.wip;
  }

  // --append shortcut → --appendSection "Update" + auto-detect content/file
  if (expandedOptions.append) {
    expandedOptions.appendSection = '## Update';
    
    // Auto-detect: is it a file path or content?
    const appendValue = expandedOptions.append;
    const looksLikeFile = appendValue.includes('/') || appendValue.includes('\\') || 
                          appendValue.endsWith('.md') || appendValue.endsWith('.txt');
    
    if (looksLikeFile) {
      // Try to read as file (will fail later if doesn't exist)
      expandedOptions.appendFile = appendValue;
    } else {
      // Treat as inline content
      expandedOptions.content = appendValue;
    }
    
    delete expandedOptions.append;
  }

  // === Original destructuring (now using expanded options) ===
  const {
    addTopic,
    addFile,
    setStatus,
    appendSection,
    content: sectionContent,  // Renamed from 'content' to avoid shadowing the file content variable (line 87)
    appendFile: appendFileOption,
    prependSection,
    insertAfter,
    insertBefore,
    json = false,
    targetDir = process.cwd(),
    _silent = false
  } = expandedOptions;

  // Always resolve to absolute path (Invariant #2)
  const resolvedTargetDir = path.resolve(targetDir);

  const log = createLogger(_silent || json);

  // Validation: content requires appendSection or prependSection
  // Optional Enhancement: Better error messages with multi-line formatting
  if (sectionContent && !appendSection && !prependSection && !insertAfter && !insertBefore) {
    throw new Error(
      'content requires a section option:\n' +
      '  --appendSection <title>    (append at end)\n' +
      '  --prependSection <title>   (prepend at start)\n' +
      '  --insert-after <pattern>   (insert after section)\n' +
      '  --insert-before <pattern>  (insert before section)'
    );
  }

  // Find today's session
  const date = new Date().toISOString().split('T')[0];
  const filename = `${date}-session.md`;
  const filepath = path.join(resolvedTargetDir, '.aiknowsys', 'sessions', filename);

  // Check if session exists
  const exists = await checkFileExists(filepath);
  if (!exists) {
    const error = new Error(
      `No session file found for today (${date}). Create one first with: create-session`
    );
    if (!json && !_silent) {
      log.error(error.message);
    }
    throw error;
  }

  // Validate status if provided
  if (setStatus && !VALID_STATUSES.includes(setStatus)) {
    const error = new Error(
      `Invalid status: ${setStatus}. Valid statuses: ${VALID_STATUSES.join(', ')}`
    );
    if (!json && !_silent) {
      log.error(error.message);
    }
    throw error;
  }

  // Read current content
  const content = await fs.readFile(filepath, 'utf-8');
  const { frontmatter } = parseFrontmatter(content);

  // Track changes
  const changes: string[] = [];
  const updates: Record<string, any> = {};

  // Add topic
  if (addTopic) {
    const topics = (frontmatter.topics as string[]) || [];
    if (!topics.includes(addTopic)) {
      updates.topics = [...topics, addTopic];
      changes.push(`Added topic: ${addTopic}`);
    }
  }

  // Add file
  if (addFile) {
    const files = (frontmatter.files as string[]) || [];
    if (!files.includes(addFile)) {
      updates.files = [...files, addFile];
      changes.push(`Added file: ${addFile}`);
    }
  }

  // Set status
  if (setStatus) {
    const currentStatus = frontmatter.status || 'in-progress';
    if (currentStatus !== setStatus) {
      updates.status = setStatus;
      changes.push(`Status: ${currentStatus} → ${setStatus}`);
    }
  }

  // Content manipulation (v0.11.0)
  let contentToAppend = '';
  let contentToPrepend = '';
  let insertionMode: 'append' | 'prepend' | 'after' | 'before' | null = null;
  let insertionPattern = '';

  // Determine insertion mode
  if (prependSection) {
    insertionMode = 'prepend';
    contentToPrepend += `${prependSection}\n`;
    if (sectionContent) {
      contentToPrepend += `\n${sectionContent}\n`;
    }
    contentToPrepend += '\n';
    changes.push(`Prepended section: ${prependSection}`);
  } else if (insertAfter) {
    insertionMode = 'after';
    insertionPattern = insertAfter;
    contentToAppend += `\n${appendSection || '## Update'}\n`;
    if (sectionContent) {
      contentToAppend += `\n${sectionContent}\n`;
    }
    contentToAppend += '\n';
    changes.push(`Inserted section after: ${insertAfter}`);
  } else if (insertBefore) {
    insertionMode = 'before';
    insertionPattern = insertBefore;
    contentToAppend += `\n${appendSection || '## Update'}\n`;
    if (sectionContent) {
      contentToAppend += `\n${sectionContent}\n`;
    }
    contentToAppend += '\n';
    changes.push(`Inserted section before: ${insertBefore}`);
  } else if (appendSection) {
    // Standard append (existing behavior)
    insertionMode = 'append';
    contentToAppend += `\n\n${appendSection}\n`;
    if (sectionContent) {
      contentToAppend += `\n${sectionContent}\n`;
    }
    changes.push(`Appended section: ${appendSection}`);
  } else if (appendFileOption || sectionContent) {
    // File/content without section: default to append
    insertionMode = 'append';
  }

  // Append content from file
  if (appendFileOption) {
    const resolvedFilePath = path.resolve(resolvedTargetDir, appendFileOption);
    const fileExists = await checkFileExists(resolvedFilePath);
    if (!fileExists) {
      throw new Error(`File not found: ${appendFileOption}`);
    }
    const fileContent = await fs.readFile(resolvedFilePath, 'utf-8');
    if (insertionMode === 'prepend') {
      contentToPrepend += `\n${fileContent}\n`;
    } else {
      contentToAppend += `\n\n${fileContent}\n`;
    }
    changes.push(`Appended content from: ${appendFileOption}`);
  }

  // Check if any changes
  if (changes.length === 0) {
    const result = {
      filePath: filepath,
      updated: false,
      message: 'No changes needed'
    };

    if (json) {
      console.log(JSON.stringify(result, null, 2));
    } else if (!_silent) {
      log.info('No changes needed');
    }

    return result;
  }

  // Apply updates
  let newContent = content as string; // Start with original file content

  // Update frontmatter if there are metadata changes
  if (Object.keys(updates).length > 0) {
    newContent = updateFrontmatter(content as string, updates);
  }

  // Handle content insertion
  if (insertionMode === 'append' && contentToAppend) {
    // Standard append to end
    newContent = newContent + contentToAppend;
  } else if (insertionMode === 'prepend' && contentToPrepend) {
    // Prepend after YAML frontmatter
    const parts = newContent.split(/^---$/m);
    if (parts.length >= 3) {
      // Has frontmatter: parts[0] = before first ---, parts[1] = yaml, parts[2+] = content
      newContent = `---${parts[1]}---\n${contentToPrepend}${parts.slice(2).join('---')}`;
    } else {
      // No frontmatter (shouldn't happen, but handle gracefully)
      newContent = contentToPrepend + newContent;
    }
  } else if (insertionMode === 'after' && contentToAppend && insertionPattern) {
    // Insert after pattern (after the entire section, not just the heading line)
    // Optional Enhancement: Multi-match detection with line number hints
    const patternIndex = newContent.indexOf(insertionPattern);
    if (patternIndex === -1) {
      throw new Error(`Pattern not found: ${insertionPattern}`);
    }
    
    // Check for multiple matches
    const secondMatch = newContent.indexOf(insertionPattern, patternIndex + 1);
    if (secondMatch !== -1) {
      // Count total matches and get line numbers
      const matches: number[] = [];
      const lines = newContent.split('\n');
      lines.forEach((line, index) => {
        if (line.includes(insertionPattern)) {
          matches.push(index + 1); // 1-based line numbers
        }
      });
      throw new Error(
        `Pattern '${insertionPattern}' found ${matches.length} times at lines: ${matches.join(', ')}.\n` +
        'Use a more specific pattern to identify the exact location.'
      );
    }
    
    // Find end of section: look for next ## heading or end of file
    const afterPattern = newContent.indexOf('\n', patternIndex);
    const nextHeadingMatch = newContent.substring(afterPattern + 1).match(/\n## /);
    let insertPosition;
    if (nextHeadingMatch && nextHeadingMatch.index !== undefined) {
      // Insert before next heading
      insertPosition = afterPattern + 1 + nextHeadingMatch.index + 1; // +1 for the \n we want to keep
    } else {
      // No next heading, insert at end
      insertPosition = newContent.length;
    }
    newContent = newContent.slice(0, insertPosition) + contentToAppend + newContent.slice(insertPosition);
  } else if (insertionMode === 'before' && contentToAppend && insertionPattern) {
    // Insert before pattern
    // Optional Enhancement: Multi-match detection with line number hints
    const patternIndex = newContent.indexOf(insertionPattern);
    if (patternIndex === -1) {
      throw new Error(`Pattern not found: ${insertionPattern}`);
    }
    
    // Check for multiple matches
    const secondMatch = newContent.indexOf(insertionPattern, patternIndex + 1);
    if (secondMatch !== -1) {
      // Count total matches and get line numbers
      const matches: number[] = [];
      const lines = newContent.split('\n');
      lines.forEach((line, index) => {
        if (line.includes(insertionPattern)) {
          matches.push(index + 1); // 1-based line numbers
        }
      });
      throw new Error(
        `Pattern '${insertionPattern}' found ${matches.length} times at lines: ${matches.join(', ')}.\n` +
        'Use a more specific pattern to identify the exact location.'
      );
    }
    
    newContent = newContent.slice(0, patternIndex) + contentToAppend + newContent.slice(patternIndex);
  }

  await fs.writeFile(filepath, newContent, 'utf-8');

  // Update index
  const storage = new JsonStorage();
  await storage.init(resolvedTargetDir);
  await storage.rebuildIndex();

  // Prepare response
  const result: UpdateSessionResult = {
    filePath: filepath,
    updated: true,
    changes
  };

  // Output
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (!_silent) {
    // Phase 4.5: Visual output improvements
    log.success('✅ Session Updated\n');
    log.info('📝 Changes:');
    changes.forEach(change => log.info(`   • ${change}`));
    log.info(`\n📂 File: ${filename}`);
  }

  return result;
}
