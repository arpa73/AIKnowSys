/**
 * lib/core/create-session.ts
 *
 * Pure business logic for session creation.
 * No console.log, no process.exit - just pure functions with structured returns.
 *
 * TDD Step 2: Implement minimal code to pass tests (GREEN phase)
 */
import { promises as fs } from 'fs';
import path from 'path';
import { generateSessionTemplate } from '../templates/session-template.js';
import { JsonStorage } from '../context/json-storage.js';
import { checkFileExists } from '../utils/file-utils.js';
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
export async function createSessionCore(options) {
    const { title, topics, plan, targetDir = process.cwd() } = options;
    // Validation (throw errors, don't log)
    if (!title || title.length < 3) {
        throw new Error('Session title must be at least 3 characters');
    }
    // Always resolve to absolute path (Invariant #2)
    const resolvedTargetDir = path.resolve(targetDir);
    // Generate filename
    const date = new Date().toISOString().split('T')[0];
    const filename = `${date}-session.md`;
    const filepath = path.join(resolvedTargetDir, '.aiknowsys', 'sessions', filename);
    // Check if session already exists
    const exists = await checkFileExists(filepath);
    if (exists) {
        return {
            filePath: filepath,
            created: false,
            message: 'Session already exists'
        };
    }
    // Generate session content
    const content = generateSessionTemplate({
        topics,
        plan,
        title,
        date
    });
    // Create sessions directory if needed
    await fs.mkdir(path.join(resolvedTargetDir, '.aiknowsys', 'sessions'), { recursive: true });
    // Write file
    await fs.writeFile(filepath, content, 'utf-8');
    // Update index (pure function call)
    const storage = new JsonStorage();
    await storage.init(resolvedTargetDir);
    await storage.rebuildIndex();
    await storage.close();
    // Return structured data (no logging!)
    return {
        filePath: filepath,
        created: true,
        metadata: {
            date,
            topics,
            plan,
            title
        }
    };
}
//# sourceMappingURL=create-session.js.map