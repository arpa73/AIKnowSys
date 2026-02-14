/**
 * Update Session - Pure Business Logic
 *
 * Phase 2 Batch 2: Most complex mutation command extraction
 * Created following strict TDD workflow (tests written first in RED phase)
 *
 * Features:
 * - Frontmatter updates (topics, files, status)
 * - Multiple insertion modes (append, prepend, insert-after, insert-before)
 * - Shortcuts (done, wip, append)
 * - File content appending
 * - Pattern matching with multi-match detection
 * - Section boundary detection
 *
 * @pure - NO side effects, NO console.log, NO process.exit
 */
/**
 * Options for updating a session
 */
export interface UpdateSessionOptions {
    targetDir?: string;
    date?: string;
    addTopic?: string;
    addFile?: string;
    setStatus?: 'in-progress' | 'complete' | 'abandoned';
    appendSection?: string;
    prependSection?: string;
    insertAfter?: string;
    insertBefore?: string;
    content?: string;
    appendFile?: string;
    done?: boolean;
    wip?: boolean;
    append?: string;
}
/**
 * Result from updateSessionCore
 */
export interface UpdateSessionCoreResult {
    updated: boolean;
    filePath: string;
    message?: string;
    changes?: string[];
}
/**
 * Update session file - Pure business logic
 */
export declare function updateSessionCore(options: UpdateSessionOptions): Promise<UpdateSessionCoreResult>;
//# sourceMappingURL=update-session.d.ts.map