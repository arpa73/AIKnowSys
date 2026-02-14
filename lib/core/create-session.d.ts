/**
 * lib/core/create-session.ts
 *
 * Pure business logic for session creation.
 * No console.log, no process.exit - just pure functions with structured returns.
 *
 * TDD Step 2: Implement minimal code to pass tests (GREEN phase)
 */
/**
 * Options for creating a session (pure)
 */
export interface CreateSessionCoreOptions {
    /** Session title */
    title: string;
    /** Session topics */
    topics: string[];
    /** Related plan ID (optional) */
    plan: string | null;
    /** Target directory (defaults to cwd) */
    targetDir?: string;
}
/**
 * Result from creating a session (pure)
 */
export interface CreateSessionCoreResult {
    /** Path to created/existing session file */
    filePath: string;
    /** True if file was created, false if already exists */
    created: boolean;
    /** Human-readable message (optional) */
    message?: string;
    /** Session metadata */
    metadata?: {
        date: string;
        topics: string[];
        plan: string | null;
        title: string;
    };
}
/**
 * Create a new session file (pure business logic)
 *
 * @param options - Session creation options
 * @returns Structured result with file path and metadata
 * @throws Error if title is invalid or file operations fail
 *
 * @example
 * ```typescript
 * const result = await createSessionCore({
 *   title: 'Phase 2 Implementation',
 *   topics: ['refactoring', 'performance'],
 *   plan: 'PLAN_mcp_only_architecture',
 *   targetDir: '/path/to/project'
 * });
 *
 * console.log(result.created); // true
 * console.log(result.metadata.date); // '2026-02-10'
 * ```
 */
export declare function createSessionCore(options: CreateSessionCoreOptions): Promise<CreateSessionCoreResult>;
//# sourceMappingURL=create-session.d.ts.map