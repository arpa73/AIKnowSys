import { resolve } from 'node:path';
import { createLogger } from '../logger.js';
import { syncPlansCore } from '../core/sync-plans.js';
/**
 * Sync individual developer plans into a team index (CURRENT_PLAN.md)
 *
 * CLI wrapper around core sync-plans logic
 */
export async function syncPlans(options = {}) {
    const targetDir = resolve(options.dir || process.cwd());
    const silent = options._silent || false;
    const log = createLogger(silent);
    // Header
    log.header('Sync Plans', '🔄');
    try {
        // Call core business logic
        const result = await syncPlansCore({ targetDir });
        // Log results
        if (result.planCount === 0) {
            log.warn('No active plan files found. Created minimal CURRENT_PLAN.md');
        }
        else {
            // Log each developer's plan
            if (result.developers) {
                for (const dev of result.developers) {
                    log.info(`Found plan: ${dev.username} → ${dev.plan}`);
                }
            }
            log.success(`Synced ${result.planCount} developer plan(s) → CURRENT_PLAN.md`);
        }
        log.cyan(`\n📖 Team index: ${result.outputPath}`);
        return { success: result.success, planCount: result.planCount, outputPath: result.outputPath };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.error(`Sync failed: ${errorMessage}`);
        throw error;
    }
}
//# sourceMappingURL=sync-plans.js.map