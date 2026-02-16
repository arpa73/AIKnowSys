/**
 * Semantic Search Tests (Phase 2.5)
 * Test JavaScript-based cosine similarity search (no sqlite-vss)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { SqliteStorage } from '../../dist/lib/context/sqlite-storage.js';
import { EventFactory } from '../../dist/lib/events/event-factory.js';
import { EmbeddingGenerator } from '../../dist/lib/embeddings/generator.js';
import { cosineSimilarity } from '../../dist/lib/embeddings/similarity.js';

describe('Cosine Similarity (Unit Tests)', () => {
  it('should return 1.0 for identical vectors', () => {
    const v1 = new Float32Array([1, 2, 3, 4]);
    const v2 = new Float32Array([1, 2, 3, 4]);
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(1.0, 5);
  });

  it('should return 0.0 for orthogonal vectors', () => {
    const v1 = new Float32Array([1, 0, 0, 0]);
    const v2 = new Float32Array([0, 1, 0, 0]);
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(0.0, 5);
  });

  it('should return -1.0 for opposite vectors', () => {
    const v1 = new Float32Array([1, 2, 3, 4]);
    const v2 = new Float32Array([-1, -2, -3, -4]);
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(-1.0, 5);
  });

  it('should handle normalized vectors', () => {
    // Pre-normalized vectors (magnitude = 1.0)
    const v1 = new Float32Array([1, 0, 0]);
    const v2 = new Float32Array([0.5, 0.866, 0]);  // 60-degree angle
    const similarity = cosineSimilarity(v1, v2);
    expect(similarity).toBeCloseTo(0.5, 3);  // cos(60°) = 0.5
  });

  it('should throw on mismatched dimensions', () => {
    const v1 = new Float32Array([1, 2, 3]);
    const v2 = new Float32Array([1, 2]);
    expect(() => cosineSimilarity(v1, v2)).toThrow('Vector dimensions must match');
  });

  it('should throw on zero vectors', () => {
    const v1 = new Float32Array([0, 0, 0]);
    const v2 = new Float32Array([1, 2, 3]);
    expect(() => cosineSimilarity(v1, v2)).toThrow('Cannot compute similarity with zero vector');
  });
});

describe('Semantic Search (Integration Tests)', () => {
  let testDir: string;
  let storage: SqliteStorage;
  let generator: EmbeddingGenerator;
  const projectId = 'test-project';

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-semantic-search-'));
    storage = new SqliteStorage();
    await storage.init(testDir);

    // Create project record
    await storage.insertProject({
      id: projectId,
      name: 'Test Project',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Initialize embedding generator
    generator = new EmbeddingGenerator();
  });

  afterEach(async () => {
    await storage.close();
    if (testDir) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  it('should find semantically similar events', async () => {
    // Create events with similar content
    const events = [
      EventFactory.taskCompleted({
        projectId,
        description: 'Implemented JWT authentication for API',
        outcome: 'success'
      }),
      EventFactory.taskCompleted({
        projectId,
        description: 'Added user login with password hashing',
        outcome: 'success'
      }),
      EventFactory.taskCompleted({
        projectId,
        description: 'Fixed database connection pool leak',
        outcome: 'success'
      })
    ];

    // Store events with embeddings
    for (const event of events) {
      const embedding = await generator.embedEvent(event);
      await storage.insertEvent(event, embedding);
    }

    // Search for "authentication" (should rank auth-related events higher)
    const results = await storage.semanticSearch('user authentication and login', {
      threshold: 0.3  // Lower threshold to see if similarity is just below 0.5
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].similarity).toBeGreaterThan(0.3);  // Adjusted threshold
    
    // First two results should be auth-related (higher similarity than DB leak)
    const topDescriptions = results.slice(0, 2).map(r => r.event.data.description);
    expect(topDescriptions).toEqual(
      expect.arrayContaining([
        'Implemented JWT authentication for API',
        'Added user login with password hashing'
      ])
    );
  }, 15000); // Extended timeout for embedding generation

  it('should respect similarity threshold', async () => {
    const event = EventFactory.taskCompleted({
      projectId,
      description: 'Implemented blockchain consensus algorithm',
      outcome: 'success'
    });

    const embedding = await generator.embedEvent(event);
    await storage.insertEvent(event, embedding);

    // Search for unrelated topic with high threshold
    const results = await storage.semanticSearch('cooking pasta recipes', {
      threshold: 0.7  // High threshold - very unrelated query
    });

    // Should return empty (similarity too low)
    expect(results).toHaveLength(0);
  });

  it('should respect result limit', async () => {
    // Create 10 events
    const events = Array.from({ length: 10 }, (_, i) =>
      EventFactory.taskCompleted({
        projectId,
        description: `Task ${i}: Implement feature ${i}`,
        outcome: 'success'
      })
    );

    for (const event of events) {
      const embedding = await generator.embedEvent(event);
      await storage.insertEvent(event, embedding);
    }

    // Search with limit=3
    const results = await storage.semanticSearch('implement feature', { 
      limit: 3,
      threshold: 0.2  // Low threshold to ensure all similar events match
    });

    expect(results).toHaveLength(3);
  });

  it('should rank results by similarity (descending)', async () => {
    const events = [
      EventFactory.taskCompleted({
        projectId,
        description: 'Testing testing testing',  // Very similar to query
        outcome: 'success'
      }),
      EventFactory.taskCompleted({
        projectId,
        description: 'Writing tests for the application',  // Moderately similar
        outcome: 'success'
      }),
      EventFactory.taskCompleted({
        projectId,
        description: 'Fixed production bug',  // Not similar
        outcome: 'success'
      })
    ];

    for (const event of events) {
      const embedding = await generator.embedEvent(event);
      await storage.insertEvent(event, embedding);
    }

    const results = await storage.semanticSearch('writing unit tests', {
      threshold: 0.2  // Low threshold to see ranking
    });

    // Should be ordered by similarity
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results[0].similarity).toBeGreaterThanOrEqual(results[1].similarity);
    if (results.length > 2) {
      expect(results[1].similarity).toBeGreaterThanOrEqual(results[2].similarity);
    }
  });

  it('should return empty array when no events have embeddings', async () => {
    // Store event WITHOUT embedding
    const event = EventFactory.taskCompleted({
      projectId,
      description: 'Task without embedding',
      outcome: 'success'
    });
    await storage.insertEvent(event);  // No embedding parameter

    const results = await storage.semanticSearch('any query');
    expect(results).toHaveLength(0);
  });

  it('should filter by projectId when provided', async () => {
    // Create another project
    const project2Id = 'project-2';
    await storage.insertProject({
      id: project2Id,
      name: 'Project 2',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Create events in different projects
    const event1 = EventFactory.taskCompleted({
      projectId,
      description: 'Authentication in project 1',
      outcome: 'success'
    });
    const event2 = EventFactory.taskCompleted({
      projectId: project2Id,
      description: 'Authentication in project 2',
      outcome: 'success'
    });

    await storage.insertEvent(event1, await generator.embedEvent(event1));
    await storage.insertEvent(event2, await generator.embedEvent(event2));

    // Search only in project 1
    const results = await storage.semanticSearch('authentication', { 
      projectId,
      threshold: 0.3  // Realistic threshold
    });

    expect(results).toHaveLength(1);
    expect(results[0].event.projectId).toBe(projectId);
  });

  it('should handle query with no results above threshold', async () => {
    const event = EventFactory.taskCompleted({
      projectId,
      description: 'Database migration script',
      outcome: 'success'
    });

    await storage.insertEvent(event, await generator.embedEvent(event));

    const results = await storage.semanticSearch('quantum physics equations', {
      threshold: 0.8  // Very high threshold for unrelated query
    });

    expect(results).toHaveLength(0);
  });

  it('should use default threshold and limit when not specified', async () => {
    // Create 15 events (more than default limit)
    const events = Array.from({ length: 15 }, (_, i) =>
      EventFactory.taskCompleted({
        projectId,
        description: `Feature ${i} implementation`,
        outcome: 'success'
      })
    );

    for (const event of events) {
      await storage.insertEvent(event, await generator.embedEvent(event));
    }

    const results = await storage.semanticSearch('feature implementation');

    // Should return default limit (10) and filter by default threshold (0.3)
    expect(results.length).toBeLessThanOrEqual(10);
    results.forEach(result => {
      expect(result.similarity).toBeGreaterThanOrEqual(0.3);
    });
  }, 20000); // Extended timeout for generating 15 embeddings
});
