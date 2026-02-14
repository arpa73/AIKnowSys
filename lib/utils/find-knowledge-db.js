import fs from 'fs';
import path from 'path';
/**
 * Find the AIKnowSys knowledge database by walking up the directory tree
 *
 * @param startDir - Directory to start searching from (defaults to process.cwd())
 * @returns Absolute path to knowledge.db
 * @throws Error if database not found
 *
 * @example
 * ```javascript
 * const dbPath = findKnowledgeDb();
 * // Returns: /home/user/project/.aiknowsys/knowledge.db
 *
 * const dbPath = findKnowledgeDb('/home/user/project/src/utils');
 * // Returns: /home/user/project/.aiknowsys/knowledge.db (found in ancestor)
 * ```
 */
export function findKnowledgeDb(startDir = process.cwd()) {
    let currentDir = path.resolve(startDir);
    const root = path.parse(currentDir).root;
    // Walk up directory tree until we find .aiknowsys/knowledge.db or hit root
    while (currentDir !== root) {
        const dbPath = path.join(currentDir, '.aiknowsys', 'knowledge.db');
        if (fs.existsSync(dbPath)) {
            return dbPath;
        }
        // Move up one directory
        const parentDir = path.dirname(currentDir);
        // Safety check: prevent infinite loop
        if (parentDir === currentDir) {
            break;
        }
        currentDir = parentDir;
    }
    // Check root directory as well
    const rootDbPath = path.join(root, '.aiknowsys', 'knowledge.db');
    if (fs.existsSync(rootDbPath)) {
        return rootDbPath;
    }
    // Database not found - throw helpful error
    throw new Error('Database not found: .aiknowsys/knowledge.db\n\n' +
        `Searched from: ${startDir}\n` +
        `Current directory: ${process.cwd()}\n\n` +
        'Troubleshooting:\n' +
        '  1. Run \'npx aiknowsys migrate-to-sqlite\' to create the database\n' +
        '  2. Make sure you\'re in a project using AIKnowSys\n' +
        '  3. Check that .aiknowsys/ directory exists\n\n' +
        'Expected database location: <project-root>/.aiknowsys/knowledge.db');
}
//# sourceMappingURL=find-knowledge-db.js.map