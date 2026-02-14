/**
 * Plan utility functions
 * Shared utilities for plan ID generation and normalization
 *
 * Addresses architect feedback: Extract duplicated generatePlanId logic
 * from create-plan.ts and plan-template.ts
 */
/**
 * Normalize title to plan ID format (e.g., "Bug Fix" → "bug_fix")
 *
 * Converts title to lowercase, replaces non-alphanumeric characters with underscores,
 * and removes leading/trailing underscores.
 *
 * @param title - Plan title to normalize
 * @returns Normalized ID without PLAN_ prefix
 *
 * @example
 * normalizePlanId("Bug Fix: Performance Issue") // "bug_fix_performance_issue"
 * normalizePlanId("Sprint 2024 Q1") // "sprint_2024_q1"
 */
export declare function normalizePlanId(title: string): string;
/**
 * Generate full plan ID with PLAN_ prefix (e.g., "Bug Fix" → "PLAN_bug_fix")
 *
 * @param title - Plan title to convert
 * @returns Full plan ID with PLAN_ prefix
 *
 * @example
 * generatePlanId("Bug Fix Session") // "PLAN_bug_fix_session"
 * generatePlanId("Feature: API Integration") // "PLAN_feature_api_integration"
 */
export declare function generatePlanId(title: string): string;
//# sourceMappingURL=plan-utils.d.ts.map