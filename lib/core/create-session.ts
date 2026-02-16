/**
 * lib/core/create-session.ts
 * 
 * Pure business logic for session creation.
 * No console.log, no process.exit - just pure functions with structured returns.
 * 
 * TDD Step 2: Implement minimal code to pass tests (GREEN phase)
 */

import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { generateSessionTemplate } from '../templates/session-template.js';
import { JsonStorage } from '../context/json-storage.js';
import type { SqliteStorage } from '../context/sqlite-storage.js';
import { checkFileExists } from '../utils/file-utils.js';
import type { KnowledgeEvent } from '../events/types.js';
import { EventType } from '../events/types.js';
import { MarkdownGenerator } from '../events/markdown-generator.js';
import { AIFriendlyErrorBuilder } from '../utils/error-builder.js';

/**
 * Options for creating a session (pure)
 */
export interface CreateSessionCoreOptions {
  /** Session title */
  title: string;
  /** Session topics */
  topics: string[];
  /** Related plan ID (optional) */
  plan: string | null;
  /** Target directory (defaults to cwd) */
  targetDir?: string;
  /** SQLite storage adapter for hybrid storage (optional - Phase 2.1) */
  storage?: SqliteStorage;
}

/**
 * Result from creating a session (pure)
 */
export interface CreateSessionCoreResult {
  /** Path to created/existing session file */
  filePath: string;
  /** True if file was created, false if already exists */
  created: boolean;
  /** Human-readable message (optional) */
  message?: string;
  /** Session metadata */
  metadata?: {
    date: string;
    topics: string[];
    plan: string | null;
    title: string;
  };
}

/**
 * Create a new session file (pure business logic)
 * 
 * @param options - Session creation options
 * @returns Structured result with file path and metadata
 * @throws Error if title is invalid or file operations fail
 * 
 * @example
 * ```typescript
 * const result = await createSessionCore({
 *   title: 'Phase 2 Implementation',
 *   topics: ['refactoring', 'performance'],
 *   plan: 'PLAN_mcp_only_architecture',
 *   targetDir: '/path/to/project'
 * });
 * 
 * console.log(result.created); // true
 * console.log(result.metadata.date); // '2026-02-10'
 * ```
 */
export async function createSessionCore(
  options: CreateSessionCoreOptions
): Promise<CreateSessionCoreResult> {
  const {
    title,
    topics,
    plan,
    targetDir = process.cwd(),
    storage: sqliteStorage
  } = options;

  // Validation (throw errors, don't log)
  if (!title || title.length < 3) {
    throw new Error('Session title must be at least 3 characters');
  }

  // Always resolve to absolute path (Invariant #2)
  const resolvedTargetDir = path.resolve(targetDir);

  // Generate filename
  const date = new Date().toISOString().split('T')[0];
  const filename = `${date}-session.md`;
  const filepath = path.join(resolvedTargetDir, '.aiknowsys', 'sessions', filename);

  // Check if session already exists
  const exists = await checkFileExists(filepath);
  if (exists) {
    return {
      filePath: filepath,
      created: false,
      message: 'Session already exists'
    };
  }

  // Generate session content (hybrid storage or legacy)
  let content: string;
  
  if (sqliteStorage) {
    // Phase 2.1: Hybrid storage - create events and generate markdown from events
    const projectId = path.basename(resolvedTargetDir);
    const sessionId = path.basename(filename, '.md');
    const timestamp = new Date().toISOString();
    
    // Ensure project context exists (idempotent - ignore if already exists)
    try {
      await sqliteStorage.insertProject({
        id: projectId,
        name: projectId,
        created_at: timestamp,
        updated_at: timestamp
      });
    } catch (error: any) {
      // If it's not a duplicate key error (expected for existing projects), re-throw with context
      if (!error.message?.includes('UNIQUE constraint')) {
        throw AIFriendlyErrorBuilder.databaseError(
          `Failed to create project record for '${projectId}': ${error.message}`,
          'Check database permissions and ensure SQLite storage is initialized'
        );
      }
      // Silently ignore duplicate - project already exists (idempotent behavior)
    }
    
    // Create initial events with guaranteed unique IDs
    const events: KnowledgeEvent[] = [
      {
        eventId: `evt-${randomUUID()}`,
        projectId,
        sessionId,
        timestamp,
        eventType: EventType.SESSION_STARTED,
        data: { title, topics: topics || [] }
      },
      {
        eventId: `evt-${randomUUID()}`,
        projectId,
        sessionId,
        timestamp,
        eventType: EventType.GOAL_DEFINED,
        data: { goal: title }
      }
    ];
    
    // Generate markdown from events (before storing in DB)
    const generator = new MarkdownGenerator();
    content = generator.generateSessionMarkdown(events, title);
    
    // Create session record FIRST (events have FK constraint to sessions.id)
    await sqliteStorage.insertSession({
      id: sessionId,
      project_id: projectId,
      date,
      topic: title,
      status: 'active',
      content,
      created: timestamp,
      updated: timestamp
    });
    
    // NOW store events (FK constraint satisfied: events → sessions → projects)
    await Promise.all(events.map(event => sqliteStorage.insertEvent(event)));
  } else {
    // Legacy path: Use static template
    content = generateSessionTemplate({
      topics,
      plan,
      title,
      date
    });
  }

  // Create sessions directory if needed
  await fs.mkdir(path.join(resolvedTargetDir, '.aiknowsys', 'sessions'), { recursive: true });

  // Write file
  await fs.writeFile(filepath, content, 'utf-8');

  // Update index (pure function call)
  const storage = new JsonStorage();
  await storage.init(resolvedTargetDir);
  await storage.rebuildIndex();
  await storage.close();

  // Return structured data (no logging!)
  return {
    filePath: filepath,
    created: true,
    metadata: {
      date,
      topics,
      plan,
      title
    }
  };
}
