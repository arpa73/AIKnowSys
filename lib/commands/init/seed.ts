/**
 * Seeding logic for AIKnowSys
 * Populates newly created databases with base context
 */

import { BASE_INVARIANTS, BASE_PATTERNS } from '../../seeds/base.js';
import type { SqliteStorage } from '../../context/sqlite-storage.js';

/**
 * Seed database with critical context
 * @param storage - Initialized SqliteStorage instance
 */
export async function seedDatabase(storage: SqliteStorage): Promise<void> {
    const now = new Date().toISOString();

    // Ensure system project exists for base data
    await storage.insertProject({
        id: 'system',
        name: 'AIKnowSys System',
        created_at: now,
        updated_at: now
    });

    // Seed invariants
    for (const inv of BASE_INVARIANTS) {
        await storage.insertInvariant({
            ...inv,
            created_at: now,
            updated_at: now
        });
    }

    // Seed base patterns
    for (const pattern of BASE_PATTERNS) {
        const slug = pattern.title.toLowerCase().replace(/\s+/g, '-');
        await storage.insertPlan({
            id: `learned_${slug}`,
            project_id: 'system',
            title: pattern.title,
            status: 'ACTIVE',
            author: 'system',
            created: now,
            updated: now,
            content: pattern.solution,
            topics: pattern.keywords,
            type: pattern.category,
            description: pattern.pattern
        });
    }
}
