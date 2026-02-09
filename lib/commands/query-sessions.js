/**
 * Query Sessions Command
 *
 * Query session history with filters (date, topic, plan reference)
 * Returns structured JSON for AI agents or human-readable output
 */
import path from 'path';
import { createLogger } from '../logger.js';
import { createStorage } from '../context/index.js';
/**
 * Validate date format (YYYY-MM-DD)
 */
function isValidDate(dateStr) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr))
        return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
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
export async function querySessions(options = {}) {
    const log = createLogger(options._silent);
    // Validate date if provided
    if (options.date && !isValidDate(options.date)) {
        const error = new Error(`Invalid date format: ${options.date}. Expected YYYY-MM-DD`);
        log.error(error.message);
        throw error;
    }
    if (options.dateAfter && !isValidDate(options.dateAfter)) {
        const error = new Error(`Invalid dateAfter format: ${options.dateAfter}. Expected YYYY-MM-DD`);
        log.error(error.message);
        throw error;
    }
    if (options.dateBefore && !isValidDate(options.dateBefore)) {
        const error = new Error(`Invalid dateBefore format: ${options.dateBefore}. Expected YYYY-MM-DD`);
        log.error(error.message);
        throw error;
    }
    // Get target directory
    const targetDir = options.dir ? path.resolve(options.dir) : process.cwd();
    try {
        // Create storage adapter
        const storage = await createStorage(targetDir, { autoRebuild: true });
        // Build filters
        const filters = {};
        // Handle --days convenience filter
        if (options.days !== undefined) {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - options.days);
            filters.dateAfter = cutoff.toISOString().split('T')[0];
        }
        // Apply other filters
        if (options.date)
            filters.date = options.date;
        if (options.dateAfter)
            filters.dateAfter = options.dateAfter;
        if (options.dateBefore)
            filters.dateBefore = options.dateBefore;
        if (options.topic)
            filters.topic = options.topic;
        if (options.plan)
            filters.plan = options.plan;
        // Query sessions
        const result = await storage.querySessions(filters);
        // Sort sessions by date descending (newest first)
        result.sessions.sort((a, b) => b.date.localeCompare(a.date));
        // Cleanup
        await storage.close();
        // JSON output for AI agents
        if (options.json) {
            return result;
        }
        // Human-readable output
        if (result.count === 0) {
            log.warn('No sessions found matching filters');
            if (options.date)
                log.info(`  Date: ${options.date}`);
            if (options.dateAfter)
                log.info(`  After: ${options.dateAfter}`);
            if (options.dateBefore)
                log.info(`  Before: ${options.dateBefore}`);
            if (options.topic)
                log.info(`  Topic: ${options.topic}`);
            if (options.plan)
                log.info(`  Plan: ${options.plan}`);
            if (options.days !== undefined)
                log.info(`  Last ${options.days} days`);
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
    }
    catch (error) {
        const err = error;
        log.error(`Failed to query sessions: ${err.message}`);
        throw error;
    }
}
//# sourceMappingURL=query-sessions.js.map