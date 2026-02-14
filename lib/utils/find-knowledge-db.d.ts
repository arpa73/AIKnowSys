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
export declare function findKnowledgeDb(startDir?: string): string;
//# sourceMappingURL=find-knowledge-db.d.ts.map