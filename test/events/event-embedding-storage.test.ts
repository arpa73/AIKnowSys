/**
 * Event Embedding Storage Tests
 * Phase 2.4: Verify embeddings are stored with events and can be retrieved
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { SqliteStorage } from '../../dist/lib/context/sqlite-storage.js';
import { EventFactory } from '../../dist/lib/events/event-factory.js';
import { EmbeddingGenerator } from '../../dist/lib/embeddings/generator.js';
import type { KnowledgeEvent } from '../../lib/events/types.js';

describe('Event Embedding Storage', () => {
  let storage: SqliteStorage;
  let testDir: string;
  let embeddingGenerator: EmbeddingGenerator;
  const projectId = 'test-project-id';

  beforeEach(async () => {
    // Create temporary test directory
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-embedding-storage-'));
    
    // Initialize storage
    storage = new SqliteStorage();
    await storage.init(testDir);
    
    // Create project record (required for foreign key constraints)
    await storage.insertProject({
      id: projectId,
      name: 'Test Project',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    // Initialize embedding generator
    embeddingGenerator = new EmbeddingGenerator();
  });

  afterEach(async () => {
    // Cleanup
    if (testDir) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  describe('Schema Validation', () => {
    it('should have embedding column in knowledge_events table', async () => {
      // Query schema to verify embedding column exists
      const tableInfo = await storage.getTableInfo('knowledge_events');
      
      const embeddingColumn = tableInfo.find(col => col.name === 'embedding');
      expect(embeddingColumn).toBeDefined();
      expect(embeddingColumn?.type).toBe('BLOB');
      expect(embeddingColumn?.notnull).toBe(0); // Nullable for backward compatibility
    });

    it('should have embedding column default to NULL', async () => {
      // Create event without embedding
      const event = EventFactory.taskCompleted({
        projectId,
        description: 'Test task',
        outcome: 'success'
      });

      await storage.insertEvent(event);
      
      // Retrieve event
      const stored = await storage.getEventById(event.eventId);
      expect(stored).toBeDefined();
      expect(stored?.embedding).toBeNull();
    });
  });

  describe(' Embedding Storage', () => {
    it('should store event with embedding', async () => {
      // Create event
      const event = EventFactory.taskCompleted({
        projectId,
        description: 'Implement JWT authentication',
        outcome: 'success'
      });

      // Generate embedding
      const embedding = await embeddingGenerator.embedEvent(event);
      
      // Store event with embedding
      await storage.insertEvent(event, embedding);
      
      // Retrieve and verify
      const stored = await storage.getEventById(event.eventId);
      expect(stored).toBeDefined();
      expect(stored?.embedding).toBeDefined();
      expect(stored!.embedding).toBeInstanceOf(Float32Array);
      expect(stored!.embedding!.length).toBe(384); // all-MiniLM-L6-v2 dimensions
    });

    it('should store multiple events with embeddings', async () => {
      // Create test events
      const events: KnowledgeEvent[] = [
        EventFactory.taskCompleted({
          projectId,
          description: ' Set up database schema',
          outcome: 'success'
        }),
        EventFactory.decisionMade({
          projectId,
          decision: 'Use PostgreSQL for production',
          rationale: 'Better scalability',
          alternatives: ['MySQL', 'SQLite']
        }),
        EventFactory.patternDiscovered({
          projectId,
          pattern: 'Repository pattern for data access',
          category: 'best_practice',
          solution: 'Clean architecture design',
          reusable: true
        })
      ];

      // Generate and store embeddings
      for (const event of events) {
        const embedding = await embeddingGenerator.embedEvent(event);
        await storage.insertEvent(event, embedding);
      }

      // Verify all stored with embeddings
      for (const event of events) {
        const stored = await storage.getEventById(event.eventId);
        expect(stored?.embedding).toBeDefined();
        expect(stored!.embedding!.length).toBe(384);
      }
    });

    it('should handle embedding as optional parameter', async () => {
      // Store event WITHOUT embedding
      const event = EventFactory.taskCompleted({
        projectId,
        description: 'Quick fix without embedding',
        outcome: 'success'
      });

      await storage.insertEvent(event); // No embedding
      
      const stored = await storage.getEventById(event.eventId);
      expect(stored?.embedding).toBeNull();
    });

    it('should preserve embedding data integrity', async () => {
      // Create event and generate embedding
      const event = EventFactory.taskCompleted({
        projectId,
        description: 'Test data integrity',
        outcome: 'success'
      });

      const originalEmbedding = await embeddingGenerator.embedEvent(event);
      
      // Store
      await storage.insertEvent(event, originalEmbedding);
      
      // Retrieve
      const stored = await storage.getEventById(event.eventId);
      
      // Verify exact match (using cosine similarity = 1.0)
      const similarity = cosineSimilarity(originalEmbedding, stored!.embedding!);
      expect(similarity).toBeCloseTo(1.0, 6); // Should be identical
    });
  });

  describe('Embedding Retrieval', () => {
    it('should retrieve embeddings with queryEvents', async () => {
      // Create and store events with embeddings
      const event = EventFactory.taskCompleted({
        projectId,
        description: 'Build feature X',
        outcome: 'success'
      });

      const embedding = await embeddingGenerator.embedEvent(event);
      await storage.insertEvent(event, embedding);

      // Query events
      const results = await storage.queryEvents({ projectId });
      
      expect(results).toHaveLength(1);
      expect(results[0].embedding).toBeDefined();
      expect(results[0].embedding!.length).toBe(384);
    });

    it('should retrieve embeddings filtered by event type', async () => {
      // Create mixed event types
      const taskEvent = EventFactory.taskCompleted({
        projectId,
        description: 'Complete task',
        outcome: 'success'
      });
      const decisionEvent = EventFactory.decisionMade({
        projectId,
        decision: 'Choose framework',
        rationale: 'Performance'
      });

      // Store with embeddings
      const taskEmbedding = await embeddingGenerator.embedEvent(taskEvent);
      const decisionEmbedding = await embeddingGenerator.embedEvent(decisionEvent);
      
      await storage.storeEvent(projectId, taskEvent, taskEmbedding);
      await storage.storeEvent(projectId, decisionEvent, decisionEmbedding);

      // Query only task_completed events
      const results = await storage.queryEvents({ 
        projectId,
        eventType: 'task_completed'
      });

      expect(results).toHaveLength(1);
      expect(results[0].eventType).toBe('task_completed');
      expect(results[0].embedding).toBeDefined();
    });

    it('should handle events without embeddings in mixed dataset', async () => {
      // Create events - some with, some without embeddings
      const withEmbedding = EventFactory.taskCompleted({
        projectId,
        description: 'Has embedding',
        outcome: 'success'
      });
      const withoutEmbedding = EventFactory.taskCompleted({
        projectId,
        description: 'No embedding',
        outcome: 'success'
      });

      const embedding = await embeddingGenerator.embedEvent(withEmbedding);
      await storage.storeEvent(projectId, withEmbedding, embedding);
      await storage.storeEvent(projectId, withoutEmbedding); // No embedding

      // Query all
      const results = await storage.queryEvents({ projectId });
      
      expect(results).toHaveLength(2);
      
      // Find each event
      const eventWith = results.find(e => e.eventId === withEmbedding.eventId);
      const eventWithout = results.find(e => e.eventId === withoutEmbedding.eventId);
      
      expect(eventWith?.embedding).toBeDefined();
      expect(eventWithout?.embedding).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid embedding dimensions', async () => {
      const event = EventFactory.taskCompleted({
        projectId,
        description: 'Test invalid embedding',
        outcome: 'success'
      });

      // Create invalid embedding (wrong dimensions)
      const invalidEmbedding = new Float32Array(256); // Should be 384

      await expect(
        storage.insertEvent(event, invalidEmbedding)
      ).rejects.toThrow(/embedding.*384.*dimensions/i);
    });

    it('should reject non-Float32Array embedding', async () => {
      const event = EventFactory.taskCompleted({
        projectId,
        description: 'Test invalid type',
        outcome: 'success'
      });

      // @ts-expect-error Testing runtime validation
      await expect(
        storage.insertEvent(event, [1, 2, 3])
      ).rejects.toThrow(/Float32Array/i);
    });

    it('should handle database corruption gracefully', async () => {
      // Store valid event
      const event = EventFactory.taskCompleted({
        projectId,
        description: 'Test corruption handling',
        outcome: 'success'
      });
      const embedding = await embeddingGenerator.embedEvent(event);
      
      await storage.insertEvent(event, embedding);

      // Manually corrupt embedding in database (simulate data corruption)
      const db = (storage as any).db;
      db.prepare('UPDATE knowledge_events SET embedding = ? WHERE event_id = ?')
        .run(Buffer.from([0, 0, 0]), event.eventId); // Invalid BLOB

      // Retrieval should detect corruption
      const stored = await storage.getEventById(event.eventId);
      
      // Should return null embedding rather than throwing
      expect(stored?.embedding).toBeNull();
    });
  });
});

/**
 * Compute cosine similarity between two embeddings
 * Assumes embeddings are normalized (L2 norm ≈ 1.0)
 */
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have same dimensions');
  }

  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }

  return dotProduct;
}
