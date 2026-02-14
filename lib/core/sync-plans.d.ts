/**
 * lib/core/sync-plans.ts
 * Pure business logic for syncing developer plans into team index
 *
 * Phase 2 Batch 1: Architectural Fix
 * Extracted from lib/commands/sync-plans.ts to fix circular dependency
 */
/**
 * Developer plan info
 */
interface DeveloperPlan {
    username: string;
    plan: string;
    status: string;
    lastUpdated: string;
    file: string;
}
/**
 * Options for sync plans core logic
 */
export interface SyncPlansCoreOptions {
    targetDir?: string;
}
/**
 * Result from sync plans operation
 */
export interface SyncPlansCoreResult {
    success: boolean;
    planCount: number;
    outputPath: string;
    developers?: DeveloperPlan[];
}
/**
 * Sync individual developer plans into team index (CURRENT_PLAN.md)
 *
 * Pure function - NO side effects:
 * - NO console.log (caller handles output)
 * - NO process.exit (throws errors instead)
 * - Returns structured data (not stdout strings)
 *
 * @param options - Sync options
 * @returns Promise resolving to sync result
 * @throws Error if file operations fail
 */
export declare function syncPlansCore(options?: SyncPlansCoreOptions): Promise<SyncPlansCoreResult>;
export {};
//# sourceMappingURL=sync-plans.d.ts.map