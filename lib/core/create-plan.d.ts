/**
 * lib/core/create-plan.ts
 * Pure business logic for plan creation (NO console.log, NO process.exit)
 *
 * Phase 2 Batch 1: Mutation Commands
 * Pattern: Direct import from lib/core (10-100x faster than subprocess)
 */
/**
 * Options for creating a plan
 */
export interface CreatePlanCoreOptions {
    title: string;
    author?: string;
    topics?: string[];
    targetDir?: string;
}
/**
 * Result of plan creation
 */
export interface CreatePlanCoreResult {
    planId: string;
    filePath: string;
    pointerPath: string;
    created: boolean;
    metadata?: {
        title: string;
        author: string;
        topics: string[];
        status: string;
    };
}
/**
 * Create a new implementation plan
 *
 * Pure function - NO side effects:
 * - NO console.log (caller handles output)
 * - NO process.exit (throws errors instead)
 * - Returns structured data (not stdout strings)
 *
 * @param options - Plan creation options
 * @returns Promise resolving to plan creation result
 * @throws Error if title is invalid or file operations fail
 */
export declare function createPlanCore(options: CreatePlanCoreOptions): Promise<CreatePlanCoreResult>;
//# sourceMappingURL=create-plan.d.ts.map