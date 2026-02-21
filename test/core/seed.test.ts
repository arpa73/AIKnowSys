import { describe, it, expect, beforeEach } from 'vitest';
import { SqliteStorage } from '../../lib/context/sqlite-storage.js';
import { seedDatabase } from '../../lib/commands/init/seed.js';
import path from 'path';
import os from 'os';
import { fs } from 'memfs';

describe('Database Seeding', () => {
    let storage: SqliteStorage;
    const testDbPath = ':memory:';

    beforeEach(async () => {
        storage = new SqliteStorage();
        await storage.init(testDbPath);
    });

    it('should seed all 8 base invariants', async () => {
        await seedDatabase(storage);

        const invariants = await storage.queryInvariants();

        expect(invariants).toHaveLength(8);
        expect(invariants[0].name).toBe('ES Modules Only');
        expect(invariants[7].name).toBe('Deliverables Consistency');
        expect(Array.isArray(invariants[0].details)).toBe(true);
    });

    it('should be idempotent (multiple seeds dont duplicate)', async () => {
        await seedDatabase(storage);
        await seedDatabase(storage);

        const invariants = await storage.queryInvariants();
        expect(invariants).toHaveLength(8);
    });
});
