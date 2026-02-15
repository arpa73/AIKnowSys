/**
 * Export session command - Export session events as markdown
 * Phase 3: Markdown Exports
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { SqliteStorage, type SessionRow } from '../context/sqlite-storage.js';
import { MarkdownGenerator } from '../events/markdown-generator.js';
import type { ExportSessionOptions, ExportSessionResult } from '../types/index.js';

/**
 * Export a single session as markdown
 * 
 * @param options - Export options
 * @returns Export result with markdown content or error
 * 
 * @example
 * // Export to stdout
 * const result = await exportSession({
 *   sessionId: 'sess-2026-02-15-001',
 *   dbPath: './knowledge.db',
 *   verbose: false
 * });
 * 
 * @example
 * // Export to file
 * const result = await exportSession({
 *   sessionId: 'sess-2026-02-15-001',
 *   dbPath: './knowledge.db',
 *   output: '/tmp/session.md',
 *   verbose: true
 * });
 * 
 * @example
 * // Export by date
 * const result = await exportSession({
 *   date: '2026-02-15',
 *   dbPath: './knowledge.db',
 *   verbose: false
 * });
 */
export async function exportSession(
  options: ExportSessionOptions
): Promise<ExportSessionResult> {
  const { sessionId, date, dbPath, output, verbose } = options;

  try {
    // Validate options
    if (!sessionId && !date) {
      return {
        success: false,
        error: 'Either sessionId or date must be provided'
      };
    }

    if (sessionId && date) {
      return {
        success: false,
        error: 'Cannot specify both sessionId and date'
      };
    }

    // Initialize storage
    const storage = new SqliteStorage();
    
    try {
      await storage.init(dbPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to connect to database at ${dbPath}: ${message}`
      };
    }

    try {
      // Find session by ID or date using proper public APIs
      let session: SessionRow | null = null;
      let warning: string | undefined;

      if (sessionId) {
        session = await storage.getSessionById(sessionId);
        
        if (!session) {
          return {
            success: false,
            error: `Session ${sessionId} not found. Use query-sessions to list available sessions.`
          };
        }
      } else if (date) {
        // Query sessions by date
        const sessions = await storage.querySessionsByDate(date);

        if (sessions.length === 0) {
          return {
            success: false,
            error: `No session found for date ${date}. Use query-sessions to list available sessions.`
          };
        }

        if (sessions.length > 1) {
          warning = `Found multiple sessions for ${date} - exporting first one (${sessions[0].id}). Use --session-id to specify which one.`;
        }
        
        session = sessions[0];
      }

      if (!session) {
        return {
          success: false,
          error: 'Failed to determine session'
        };
      }

      // Query events for session
      const events = await storage.queryEvents({ sessionId: session.id });

      // Sort events chronologically (ASC) for markdown generation
      // queryEvents returns DESC order, but MarkdownGenerator expects ASC
      const sortedEvents = events.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Generate markdown
      const generator = new MarkdownGenerator();
      const markdown = generator.generateSessionMarkdown(
        sortedEvents,
        session.topic
      );

      // Write to file if output path provided
      if (output) {
        try {
          // Ensure directory exists
          const dir = path.dirname(output);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          fs.writeFileSync(output, markdown, 'utf-8');

          return {
            success: true,
            markdown,
            sessionId: session.id,
            eventCount: events.length,
            outputPath: output,
            warning,
            verbose
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return {
            success: false,
            error: `Failed to write to ${output}: ${message}`
          };
        }
      }

      // Return markdown for stdout output
      return {
        success: true,
        markdown,
        sessionId: session.id,
        eventCount: events.length,
        warning,
        verbose
      };

    } finally {
      await storage.close();
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Export failed: ${message}`
    };
  }
}
