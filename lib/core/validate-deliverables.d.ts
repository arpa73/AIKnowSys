/**
 * Core validation logic for deliverables (templates, schemas, patterns)
 * Phase 2 Batch 3: EXTRACTION
 *
 * Pure business logic - no logger dependency, returns structured results.
 * CLI wrapper in lib/commands/validate-deliverables.ts handles formatting.
 */
import type { DeliverableValidationOptions, DeliverableValidationResult } from '../types/index.js';
/**
 * Core validation logic for deliverables
 * Pure function - no side effects, no logger dependency
 */
export declare function validateDeliverablesCore(options?: DeliverableValidationOptions): Promise<DeliverableValidationResult>;
//# sourceMappingURL=validate-deliverables.d.ts.map