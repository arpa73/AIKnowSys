/**
 * AutoIndexer - Auto-rebuild on stale index detection
 * Phase A.6 - Context Query Completion
 *
 * Provides transparent index rebuilding when files are newer than index.
 * Supports lazy rebuild (on-demand) and optional git hooks (proactive).
 */
import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
/**
 * AutoIndexer - Automatically rebuilds index when stale
 *
 * Staleness detection: Compares index mtime with newest file mtime in source directories
 * Rebuild strategy: Lazy (check on query) + optional git hooks (proactive)
 */
export class AutoIndexer {
    targetDir;
    constructor(targetDir = process.cwd()) {
        this.targetDir = targetDir;
    }
    /**
     * Ensure index is fresh, rebuild if stale
     * @param storage - JsonStorage instance to check/rebuild
     * @param options - Auto-index configuration options
     * @returns Promise resolving to true if index was rebuilt, false if already fresh
     */
    async ensureFreshIndex(storage, options = {}) {
        const { force = false, verbose = false } = options;
        // Force rebuild if requested
        if (force) {
            if (verbose) {
                console.log('🔄 Force rebuilding index...');
            }
            await storage.rebuildIndex();
            if (verbose) {
                console.log('✅ Index rebuilt successfully');
            }
            return true;
        }
        // Check staleness
        const stale = await this.isIndexStale(storage);
        if (stale) {
            if (verbose) {
                console.log('⚠️  Index is stale (files changed since last rebuild)');
                console.log('🔄 Rebuilding index automatically...');
            }
            const startTime = Date.now();
            await storage.rebuildIndex();
            const duration = Date.now() - startTime;
            if (verbose) {
                console.log(`✅ Index rebuilt in ${duration}ms`);
            }
            return true;
        }
        return false; // Was already fresh
    }
    /**
     * Check if index is stale (files newer than index)
     * @param storage - JsonStorage instance to check staleness for
     * @returns Promise resolving to true if index needs rebuild, false if fresh
     */
    async isIndexStale(storage) {
        try {
            // Check if index exists
            const indexPath = storage.getIndexPath();
            let indexMtime;
            try {
                const indexStat = await fs.stat(indexPath);
                indexMtime = indexStat.mtime;
            }
            catch (err) {
                // Index doesn't exist = definitely stale
                if (err.code === 'ENOENT') {
                    return true;
                }
                throw err;
            }
            // Check all source directories for newer files
            const sourceDirs = [
                path.join(this.targetDir, '.aiknowsys'),
                path.join(this.targetDir, '.aiknowsys', 'plans'),
                path.join(this.targetDir, '.aiknowsys', 'sessions'),
                path.join(this.targetDir, '.aiknowsys', 'learned'),
                path.join(this.targetDir, 'personal') // Personal patterns (if exists)
            ];
            for (const dir of sourceDirs) {
                try {
                    // Find all .md files in directory
                    const pattern = path.join(dir, '**/*.md').replace(/\\/g, '/');
                    const files = await glob(pattern, { posix: true });
                    for (const file of files) {
                        try {
                            const fileStat = await fs.stat(file);
                            // If any file is newer than index, index is stale
                            if (fileStat.mtime > indexMtime) {
                                return true;
                            }
                        }
                        catch (err) {
                            // File might have been deleted, skip it
                            if (err.code !== 'ENOENT') {
                                throw err;
                            }
                        }
                    }
                }
                catch (err) {
                    // Directory doesn't exist, skip it
                    if (err.code !== 'ENOENT') {
                        throw err;
                    }
                }
            }
            // All files older than or equal to index
            return false;
        }
        catch (err) {
            // On error, assume stale (safe default)
            console.error('Error checking index staleness:', err);
            return true;
        }
    }
    /**
     * Get index path (delegates to storage adapter)
     */
    getIndexPath(storage) {
        return storage.getIndexPath();
    }
}
//# sourceMappingURL=auto-index.js.map