/**
 * create-session command - Create new session file with YAML frontmatter
 * Phase B Mini - Context Query Completion
 */

import { promises as fs } from 'fs';
import path from 'path';
import { generateSessionTemplate } from '../templates/session-template.js';
import { JsonStorage } from '../context/json-storage.js';
import { createLogger } from '../logger.js';

export interface CreateSessionOptions {
  topics?: string[];
  plan?: string | null;
  title?: string;
  json?: boolean;
  targetDir?: string;
  _silent?: boolean;
}

export interface CreateSessionResult {
  filePath: string;
  created: boolean;
  message?: string;
  metadata?: {
    date: string;
    topics: string[];
    plan: string | null;
    title: string;
  };
}

export async function createSession(options: CreateSessionOptions = {}): Promise<CreateSessionResult> {
  const {
    topics = [],
    plan = null,
    title = 'Work Session',
    json = false,
    targetDir = process.cwd(),
    _silent = false
  } = options;

  const log = createLogger(_silent || json);

  // Generate filename
  const date = new Date().toISOString().split('T')[0];
  const filename = `${date}-session.md`;
  const filepath = path.join(targetDir, '.aiknowsys', 'sessions', filename);

  // Check if session already exists
  try {
    await fs.access(filepath);
    
    // Session exists
    if (json) {
      console.log(JSON.stringify({
        filePath: filepath,
        created: false,
        message: 'Session already exists'
      }, null, 2));
    } else if (!_silent) {
      log.info(`Session file already exists: ${filename}`);
      log.info('Use update-session to modify metadata');
    }
    
    return {
      filePath: filepath,
      created: false,
      message: 'Session already exists'
    };
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      throw err; // Unexpected error
    }
    // Session doesn't exist, continue to create
  }

  // Generate session content
  const content = generateSessionTemplate({
    topics,
    plan,
    title,
    date
  });

  // Create sessions directory if needed
  await fs.mkdir(path.join(targetDir, '.aiknowsys', 'sessions'), { recursive: true });

  // Write file
  await fs.writeFile(filepath, content, 'utf-8');

  // Update index
  const storage = new JsonStorage();
  await storage.init(targetDir);
  await storage.rebuildIndex();

  // Prepare response
  const metadata = {
    date,
    topics,
    plan,
    title
  };

  // Output
  if (json) {
    console.log(JSON.stringify({
      filePath: filepath,
      created: true,
      metadata
    }, null, 2));
  } else if (!_silent) {
    log.success(`✅ Created session: ${filename}`);
    log.info(`📄 File: ${filepath}`);
    log.info(`📝 Edit session content in the file`);
  }

  return {
    filePath: filepath,
    created: true,
    metadata
  };
}
