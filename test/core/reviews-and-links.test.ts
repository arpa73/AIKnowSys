import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { SqliteStorage } from '../../dist/lib/context/sqlite-storage.js';

describe('Review and Link Storage Operations', () => {
    let storage: SqliteStorage;
    let testDir: string;

    beforeEach(async () => {
        testDir = path.join(process.cwd(), `test-tmp-reviews-${Date.now()}`);
        await fs.mkdir(testDir, { recursive: true });

        storage = new SqliteStorage();
        await storage.init(testDir);

        // Setup project and plan for test relations
        await storage.insertProject({
            id: 'test-proj',
            name: 'Test Project',
            path: '/tmp/test',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        await storage.insertPlan({
            id: 'PLAN_test_plan',
            project_id: 'test-proj',
            title: 'Test Plan',
            status: 'ACTIVE',
            author: 'Tester',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            content: 'Plan stuff'
        });
    });

    afterEach(async () => {
        await storage.close();
        await fs.rm(testDir, { recursive: true, force: true });
    });

    describe('Reviews', () => {
        it('should insert and query a review', async () => {
            const reviewId = 'rev-001';
            await storage.insertReview({
                id: reviewId,
                project_id: 'test-proj',
                target_id: 'PLAN_test_plan',
                author: 'architect',
                status: 'PENDING',
                content: '# Review\nLGTM except for the tests',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

            const { reviews } = await storage.queryReviews({ targetId: 'PLAN_test_plan' });
            expect(reviews).toHaveLength(1);
            expect(reviews[0].id).toBe(reviewId);
            expect(reviews[0].status).toBe('PENDING');
            expect(reviews[0].content).toContain('LGTM');
        });

        it('should update a review status', async () => {
            const reviewId = 'rev-002';
            await storage.insertReview({
                id: reviewId,
                project_id: 'test-proj',
                target_id: 'PLAN_test_plan',
                author: 'architect',
                status: 'PENDING',
                content: 'Review needs work',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

            await storage.updateReviewStatus(reviewId, 'ADDRESSED', new Date().toISOString());

            const { reviews } = await storage.queryReviews({ targetId: 'PLAN_test_plan' });
            expect(reviews[0].status).toBe('ADDRESSED');
        });
    });

    describe('Links', () => {
        it('should insert and query a link', async () => {
            await storage.insertLink({
                source_id: 'sess-001',
                target_id: 'sess-002',
                type: 'relates_to',
                metadata: { info: 'context' },
                created_at: new Date().toISOString()
            });

            const { links } = await storage.queryLinks({ sourceId: 'sess-001' });
            expect(links).toHaveLength(1);
            expect(links[0].targetId).toBe('sess-002');
            expect(links[0].type).toBe('relates_to');
            expect(links[0].metadata).toEqual({ info: 'context' });
        });
    });
});
