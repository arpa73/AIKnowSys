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
    json = false,
    targetDir = process.cwd(),
    _silent = false
  } = expandedOptions;

  // Always resolve to absolute path (Invariant #2)
  const resolvedTargetDir = path.resolve(targetDir);

  const log = createLogger(_silent || json);

  // Validation: content requires appendSection
  if (sectionContent && !appendSection) {
    throw new Error('content requires appendSection to be specified');
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

  // Append section with content
  if (appendSection) {
    contentToAppend += `\n\n${appendSection}\n`;
    if (sectionContent) {
      contentToAppend += `\n${sectionContent}\n`;
    }
    changes.push(`Appended section: ${appendSection}`);
  }

  // Append content from file
  if (appendFileOption) {
    const resolvedFilePath = path.resolve(resolvedTargetDir, appendFileOption);
    const fileExists = await checkFileExists(resolvedFilePath);
    if (!fileExists) {
      throw new Error(`File not found: ${appendFileOption}`);
    }
    const fileContent = await fs.readFile(resolvedFilePath, 'utf-8');
    contentToAppend += `\n\n${fileContent}\n`;
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

  // Append content if specified
  if (contentToAppend) {
    newContent = newContent + contentToAppend;
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
