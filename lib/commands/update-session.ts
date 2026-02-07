/**
 * update-session command - Modify session YAML frontmatter
 * Phase B Mini - Context Query Completion
 */

import { promises as fs } from 'fs';
import path from 'path';
import { parseFrontmatter, updateFrontmatter } from '../utils/yaml-frontmatter.js';
import { JsonStorage } from '../context/json-storage.js';
import { createLogger } from '../logger.js';

export interface UpdateSessionOptions {
  addTopic?: string;
  addFile?: string;
  setStatus?: 'in-progress' | 'complete' | 'abandoned';
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
  const {
    addTopic,
    addFile,
    setStatus,
    json = false,
    targetDir = process.cwd(),
    _silent = false
  } = options;

  // Always resolve to absolute path (Invariant #2)
  const resolvedTargetDir = path.resolve(targetDir);

  const log = createLogger(_silent || json);

  // Find today's session
  const date = new Date().toISOString().split('T')[0];
  const filename = `${date}-session.md`;
  const filepath = path.join(resolvedTargetDir, '.aiknowsys', 'sessions', filename);

  // Check if session exists
  try {
    await fs.access(filepath);
  } catch (err) {
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
  const newContent = updateFrontmatter(content, updates);
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
    log.success(`✅ Updated session: ${filename}`);
    changes.forEach(change => log.info(`  • ${change}`));
  }

  return result;
}
