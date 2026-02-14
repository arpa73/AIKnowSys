/**
 * Result from sync-plans command
 */
export interface SyncPlansResult {
    success: boolean;
    planCount: number;
    outputPath: string;
}
/**
 * Options for sync-plans command
 */
export interface SyncPlansOptions {
    dir?: string;
    _silent?: boolean;
}
/**
 * Sync individual developer plans into a team index (CURRENT_PLAN.md)
 *
 * CLI wrapper around core sync-plans logic
 */
export declare function syncPlans(options?: SyncPlansOptions): Promise<SyncPlansResult>;
//# sourceMappingURL=sync-plans.d.ts.map