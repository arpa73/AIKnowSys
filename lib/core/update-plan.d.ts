/**
 * lib/core/update-plan.ts
 * Pure business logic for plan updates (NO console.log, NO process.exit)
 *
 * Phase 2 Batch 1: Mutation Commands
 * Pattern: Direct import from lib/core (10-100x faster than subprocess)
 */
declare const VALID_STATUSES: readonly ["PLANNED", "ACTIVE", "PAUSED", "COMPLETE", "CANCELLED"];
type PlanStatus = typeof VALID_STATUSES[number];
/**
 * Options for updating a plan
 */
export interface UpdatePlanCoreOptions {
    planId?: string;
    setStatus?: PlanStatus;
    append?: string;
    appendFile?: string;
    author?: string;
    targetDir?: string;
}
/**
 * Result of plan update
 */
export interface UpdatePlanCoreResult {
    planId: string;
    filePath: string;
    updated: boolean;
    changes?: string[];
    metadata?: {
        status?: string;
        started?: string;
        completed?: string;
    };
}
/**
 * Update plan status and progress
 *
 * Pure function - NO side effects:
 * - NO console.log (caller handles output)
 * - NO process.exit (throws errors instead)
 * - Returns structured data (not stdout strings)
 *
 * @param options - Plan update options
 * @returns Promise resolving to plan update result
 * @throws Error if plan not found or invalid parameters
 */
export declare function updatePlanCore(options: UpdatePlanCoreOptions): Promise<UpdatePlanCoreResult>;
export {};
//# sourceMappingURL=update-plan.d.ts.map