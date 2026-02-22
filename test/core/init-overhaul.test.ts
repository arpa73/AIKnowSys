import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createKnowledgeSystemFiles } from '../../lib/commands/feature-setup/templates.js';
import { SqliteStorage } from '../../lib/context/sqlite-storage.js';
import { seedDatabase } from '../../lib/commands/init/seed.js';

// Mocks removed for real integration testing


describe('Init Flow Overhaul (Phase 2)', () => {
    const targetDir = '/tmp/aks-init-test';
    const answers = {
        projectName: 'Test Project',
        projectType: 'web-app',
        language: 'typescript',
        framework: 'nextjs',
        useTDD: true
    };

    beforeEach(() => {
        vi.clearAllMocks();
        if (fs.existsSync(targetDir)) {
            fs.rmSync(targetDir, { recursive: true, force: true });
        }
        fs.mkdirSync(targetDir, { recursive: true });
    });

    it('should NOT create CODEBASE_ESSENTIALS.md by default', async () => {
        await createKnowledgeSystemFiles(targetDir, answers as any, 'minimal');

        const essentialsPath = path.join(targetDir, 'CODEBASE_ESSENTIALS.md');
        expect(fs.existsSync(essentialsPath)).toBe(false);
    });

    it('should still create AGENTS.md and other core files', async () => {
        await createKnowledgeSystemFiles(targetDir, answers as any, 'minimal', { skipDb: true });

        expect(fs.existsSync(path.join(targetDir, 'AGENTS.md'))).toBe(true);
        expect(fs.existsSync(path.join(targetDir, 'CODEBASE_CHANGELOG.md'))).toBe(true);
        expect(fs.existsSync(path.join(targetDir, 'SETUP_GUIDE.md'))).toBe(true);
    });

    it('should seed the database by default', async () => {
        await createKnowledgeSystemFiles(targetDir, answers as any, 'minimal');

        const dbPath = path.join(targetDir, '.aiknowsys', 'knowledge.db');
        expect(fs.existsSync(dbPath)).toBe(true);

        const storage = new SqliteStorage();
        await storage.init(targetDir);
        const storageInternal = storage as unknown as {
            db: {
                prepare(sql: string): {
                    all(...params: unknown[]): unknown[];
                };
            } | null;
        };
        const projectId = path.basename(path.resolve(targetDir));
        const configRows = storageInternal.db
            ?.prepare('SELECT key FROM project_config WHERE project_id = ?')
            .all(projectId) as Array<{ key: string }> | undefined;

        expect((configRows || []).length).toBeGreaterThanOrEqual(2);
        expect((configRows || []).map((row) => row.key)).toContain('validation_matrix');
        expect((configRows || []).map((row) => row.key)).toContain('critical_invariants');

        await storage.close();
    });
});
