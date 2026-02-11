/**
 * Query Plans Command
 * 
 * Query plan metadata with filters (status, author, topic, date range)
 * Returns structured JSON for AI agents or human-readable table
 * 
 * This is a CLI wrapper around queryPlansCore with logger output.
 */

import { createLogger } from '../logger.js';
import { queryPlansCore, type QueryPlansOptions as CoreOptions } from '../core/query-plans.js';

/**
 * CLI command options (extends core options with CLI-specific flags)
 */
export interface QueryPlansOptions extends CoreOptions {
  /** Output JSON (for AI agents) */
  json?: boolean;
  
  /** Silent mode (for testing) */
  _silent?: boolean;
}

/**
 * Query plans with filters
 * 
 * @param options - Query options
 * @returns Query results with count and plans array
 * 
 * @example
 * ```typescript
 * // Find active plans
 * const result = await queryPlans({ status: 'ACTIVE', json: true });
 * console.log(`Found ${result.count} active plans`);
 * 
 * // Find plans by author
 * const alicePlans = await queryPlans({ author: 'alice', json: true });
 * 
 * // Combine filters
 * const recent = await queryPlans({
 *   status: 'ACTIVE',
 *   updatedAfter: '2026-02-01',
 *   json: true
 * });
 * ```
 */
export async function queryPlans(options: QueryPlansOptions = {}) {
  const log = createLogger(options._silent);
  
  try {
    // Call pure business logic function
    const result = await queryPlansCore(options);
    
    // JSON output for AI agents
    if (options.json) {
      return result;
    }
    
    // Human-readable output
    if (result.count === 0) {
      log.warn('No plans found matching filters');
      if (options.status) log.info(`  Status: ${options.status}`);
      if (options.author) log.info(`  Author: ${options.author}`);
      if (options.topic) log.info(`  Topic: ${options.topic}`);
      return result;
    }
    
    log.success(`Found ${result.count} plan(s):`);
    log.blank();
    
    // Note: Plans use verbose output format showing all core fields (status, author, updated)
    // because these are always present and critical for plan management.
    // Sessions use compact format with conditional fields since they have more optional metadata.
    result.plans.forEach(plan => {
      const statusEmoji = {
        ACTIVE: '🎯',
        PAUSED: '🔄',
        PLANNED: '📋',
        COMPLETE: '✅',
        CANCELLED: '❌'
      }[plan.status] || '•';
      
      log.info(`${statusEmoji} ${plan.title} (${plan.id})`);
      log.info(`  Status: ${plan.status} | Author: ${plan.author}`);
      log.info(`  Updated: ${plan.updated}`);
      if (plan.topics && plan.topics.length > 0) {
        log.info(`  Topics: ${plan.topics.join(', ')}`);
      }
      log.info(`  File: ${plan.file}`);
      log.blank();
    });
    
    return result;
    
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to query plans: ${err.message}`);
    throw error;
  }
}
