/**
 * Query Plans Command
 * 
 * Query plan metadata with filters (status, author, topic, date range)
 * Returns structured JSON for AI agents or human-readable table
 */

import path from 'path';
import { createLogger } from '../logger.js';
import { createStorage } from '../context/index.js';
import type { PlanFilters } from '../context/types.js';

/**
 * Command options for queryPlans
 */
export interface QueryPlansOptions {
  /** Target directory (defaults to current directory) */
  dir?: string;
  
  /** Filter by plan status */
  status?: 'ACTIVE' | 'PAUSED' | 'PLANNED' | 'COMPLETE' | 'CANCELLED';
  
  /** Filter by author */
  author?: string;
  
  /** Filter by topic (fuzzy match) */
  topic?: string;
  
  /** Filter by plans updated after this date (ISO format YYYY-MM-DD) */
  updatedAfter?: string;
  
  /** Filter by plans updated before this date (ISO format YYYY-MM-DD) */
  updatedBefore?: string;
  
  /** Output JSON (for AI agents) */
  json?: boolean;
  
  /** Silent mode (for testing) */
  _silent?: boolean;
}

/**
 * Valid plan statuses
 */
const VALID_STATUSES = ['ACTIVE', 'PAUSED', 'PLANNED', 'COMPLETE', 'CANCELLED'] as const;

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
  
  // Validate status if provided
  if (options.status && !VALID_STATUSES.includes(options.status)) {
    const error = new Error(
      `Invalid plan status: ${options.status}. ` +
      `Valid statuses: ${VALID_STATUSES.join(', ')}`
    );
    log.error(error.message);
    throw error;
  }
  
  // Get target directory
  const targetDir = options.dir ? path.resolve(options.dir) : process.cwd();
  
  try {
    // Create storage adapter
    const storage = await createStorage(targetDir, { autoRebuild: true });
    
    // Build filters
    const filters: PlanFilters = {};
    if (options.status) filters.status = options.status;
    if (options.author) filters.author = options.author;
    if (options.topic) filters.topic = options.topic;
    if (options.updatedAfter) filters.updatedAfter = options.updatedAfter;
    if (options.updatedBefore) filters.updatedBefore = options.updatedBefore;
    
    // Query plans
    const result = await storage.queryPlans(filters);
    
    // Cleanup
    await storage.close();
    
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
