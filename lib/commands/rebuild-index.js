import { createLogger } from '../logger.js';
import { createStorage } from '../context/index.js';
import path from 'path';
/**
 * Rebuild context index from markdown files
 *
 * Scans .aiknowsys/ directory for plans, sessions, and learned patterns,
 * extracts metadata, and writes to context-index.json.
 *
 * @param options - Rebuild options (directory, output format)
 * @returns Summary of indexing operation
 *
 * @example
 * ```typescript
 * // Rebuild team index
 * await rebuildIndex({ json: true });
 *
 * // Rebuild in specific directory
 * await rebuildIndex({ dir: '/path/to/project', json: true });
 * ```
 */
export async function rebuildIndex(options = {}) {
    const log = createLogger(options._silent);
    // Get target directory (absolute path)
    const targetDir = options.dir ? path.resolve(options.dir) : process.cwd();
    try {
        // Create storage adapter
        const storage = await createStorage(targetDir, { autoRebuild: false });
        // Rebuild index from markdown files
        const result = await storage.rebuildIndex();
        await storage.close();
        // JSON output for AI agents
        if (options.json) {
            return {
                plansIndexed: result.plansIndexed,
                sessionsIndexed: result.sessionsIndexed,
                learnedIndexed: result.learnedIndexed || 0
            };
        }
        // Human-readable output
        log.success('Context index rebuilt successfully');
        log.blank();
        log.info(`📋 Plans indexed: ${result.plansIndexed}`);
        log.info(`📅 Sessions indexed: ${result.sessionsIndexed}`);
        if (result.learnedIndexed && result.learnedIndexed > 0) {
            log.info(`🧠 Learned patterns indexed: ${result.learnedIndexed}`);
        }
        log.blank();
        log.info('Index saved to: .aiknowsys/context-index.json');
        return {
            plansIndexed: result.plansIndexed,
            sessionsIndexed: result.sessionsIndexed,
            learnedIndexed: result.learnedIndexed || 0
        };
    }
    catch (error) {
        const err = error;
        log.error(`Failed to rebuild index: ${err.message}`);
        throw error;
    }
}
//# sourceMappingURL=rebuild-index.js.map