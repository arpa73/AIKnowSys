/**
 * Query Sessions Command
 * 
 * Query session history with filters (date, topic, plan reference)
 * Returns structured JSON for AI agents or human-readable output
 * 
 * This is a CLI wrapper around querySessionsCore with logger output.
 */

import { createLogger } from '../logger.js';
import { querySessionsCore, type QuerySessionsOptions as CoreOptions } from '../core/query-sessions.js';

/**
 * CLI command options (extends core options with CLI-specific flags)
 */
export interface QuerySessionsOptions extends CoreOptions {
  /** Output JSON (for AI agents) */
  json?: boolean;
  
  /** Silent mode (for testing) */
  _silent?: boolean;
}

/**
 * Query sessions with filters
 * 
 * @param options - Query options
 * @returns Query results with count and sessions array
 * 
 * @example
 * ```typescript
 * // Find sessions from last 7 days
 * const result = await querySessions({ days: 7, json: true });
 * 
 * // Find sessions by topic
 * const tddSessions = await querySessions({ topic: 'TDD', json: true });
 * 
 * // Combine filters
 * const recent = await querySessions({
 *   dateAfter: '2026-02-01',
 *   topic: 'TypeScript',
 *   json: true
 * });
 * ```
 */
export async function querySessions(options: QuerySessionsOptions = {}) {
  const log = createLogger(options._silent);
  
  try {
    // Call pure business logic function
    const result = await querySessionsCore(options);
    
    // JSON output for AI agents
    if (options.json) {
      return result;
    }
    
    // Human-readable output
    if (result.count === 0) {
      log.warn('No sessions found matching filters');
      if (options.date) log.info(`  Date: ${options.date}`);
      if (options.dateAfter) log.info(`  After: ${options.dateAfter}`);
      if (options.dateBefore) log.info(`  Before: ${options.dateBefore}`);
      if (options.topic) log.info(`  Topic: ${options.topic}`);
      if (options.plan) log.info(`  Plan: ${options.plan}`);
      if (options.days !== undefined) log.info(`  Last ${options.days} days`);
      return result;
    }
    
    log.success(`Found ${result.count} session(s):`);
    log.blank();
    
    // Note: Sessions use compact output format with conditional fields to avoid clutter,
    // since duration/phases are optional. Plans show all core fields (status/author/updated).
    result.sessions.forEach(session => {
      log.info(`📅 ${session.date} - ${session.topic}`);
      if (session.plan) {
        log.info(`  Plan: ${session.plan}`);
      }
      if (session.duration) {
        log.info(`  Duration: ${session.duration}`);
      }
      if (session.phases && session.phases.length > 0) {
        log.info(`  Phases: ${session.phases.join(', ')}`);
      }
      log.info(`  File: ${session.file}`);
      log.blank();
    });
    
    return result;
    
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to query sessions: ${err.message}`);
    throw error;
  }
}
