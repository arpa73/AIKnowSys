/**
 * Export sessions command - Bulk export sessions as markdown
 * Phase 3: Markdown Exports
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { SqliteStorage } from '../context/sqlite-storage.js';
import { MarkdownGenerator } from '../events/markdown-generator.js';
import type { ExportSessionsOptions, ExportSessionsResult } from '../types/index.js';

/**
 * Export multiple sessions as markdown files
 * 
 * @param options - Export options
 * @returns Export result with statistics
 * 
 * @example
 * // Export all sessions to directory
 * const result = await exportSessions({
 *   dbPath: './knowledge.db',
 *   outputDir: '/tmp/sessions/'
 * });
 * 
 * @example
 * // Export date range
 * const result = await exportSessions({
 *   dbPath: './knowledge.db',
 *   outputDir: '/tmp/sessions/',
 *   from: '2026-02-01',
 *   to: '2026-02-15'
 * });
 * 
 * @example
 * // Filter by project with dry run
 * const result = await exportSessions({
 *   dbPath: './knowledge.db',
 *   outputDir: '/tmp/sessions/',
 *   projectId: 'my-project',
 *   dryRun: true,
 *   verbose: true
 * });
 */
export async function exportSessions(
  options: ExportSessionsOptions
): Promise<ExportSessionsResult> {
  const { dbPath, outputDir, from, to, projectId, dryRun, verbose } = options;

  let exported = 0;
  let failed = 0;
  let skipped = 0;
  const errors: Array<{ sessionId: string; error: string }> = [];

  try {
    // Initialize storage
    const storage = new SqliteStorage();
    
    try {
      await storage.init(dbPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        exported: 0,
        failed: 0,
        skipped: 0,
        error: `Failed to connect to database at ${dbPath}: ${message}`
      };
    }

    try {
      // Query sessions with filters using proper public API
      const sessions = await storage.querySessionsWithFilters({ from, to, projectId });

      if (verbose) {
        console.log(`Found ${sessions.length} session(s) to export`);
      }

      // Handle empty results
      if (sessions.length === 0) {
        if (verbose) {
          console.log('No sessions found matching filters');
        }
        await storage.close();
        return {
          success: true,
          exported: 0,
          failed: 0,
          skipped: 0,
          outputDir: dryRun ? undefined : outputDir
        };
      }

      // Create output directory if not in dry-run mode
      if (!dryRun) {
        try {
          fs.mkdirSync(outputDir, { recursive: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          await storage.close();
          return {
            success: false,
            exported: 0,
            failed: 0,
            skipped: 0,
            error: `Failed to create output directory ${outputDir}: ${message}`
          };
        }
      }

      // Export each session
      const generator = new MarkdownGenerator();

      for (const session of sessions) {
        try {
          if (verbose) {
            console.log(`${dryRun ? '[DRY RUN] ' : ''}Exporting ${session.id}...`);
          }

          // Query events for session
          const events = await storage.queryEvents({ sessionId: session.id });

          // Sort events chronologically (ASC) for markdown generation
          const sortedEvents = events.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          // Generate markdown
          const markdown = generator.generateSessionMarkdown(
            sortedEvents,
            session.topic
          );

          // Write to file (unless dry-run)
          if (!dryRun) {
            const filename = `${session.id}.md`;
            const filepath = path.join(outputDir, filename);

            try {
              fs.writeFileSync(filepath, markdown, 'utf-8');
              exported++;
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              failed++;
              errors.push({
                sessionId: session.id,
                error: `Failed to write file: ${message}`
              });
            }
          } else {
            // Dry-run: just count as exported
            exported++;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          failed++;
          errors.push({
            sessionId: session.id,
            error: message
          });

          if (verbose) {
            console.error(`Failed to export ${session.id}: ${message}`);
          }
        }
      }

      await storage.close();

      // Return success with statistics
      return {
        success: true,
        exported,
        failed,
        skipped,
        outputDir: dryRun ? undefined : outputDir,
        errors: errors.length > 0 ? errors : undefined
      };

    } finally {
      await storage.close();
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      exported,
      failed,
      skipped,
      error: `Export failed: ${message}`,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}
