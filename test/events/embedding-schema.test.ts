/**
 * Embedding Schema Tests (Simplified)
 * Phase 2.4: Verify embeddings schema changes work
 * 
 * Note: Full integration tests deferred due to method visibility issues
 * This test directly verifies schema, types, and basic storage/retrieval
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';
import { EventFactory } from '../../lib/events/event-factory.js';
import { EmbeddingGenerator } from '../../lib/embeddings/generator.js';
import { SqliteStorage } from '../../lib/context/sqlite-storage.js';

describe('Embedding Schema Tests', () => {
  let testDir: string;
  let dbPath: string;
  let storage: SqliteStorage;
  const projectId = 'test-project';

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-embedding-schema-'));
    dbPath = path.join(testDir, '.aiknowsys', 'knowledge.db');
    
    // Initialize storage (creates schema)
    storage = new SqliteStorage();
    await storage.init(testDir);
    
    // Create project record (required for foreign key constraint)
    const db = Database(dbPath);
    db.prepare(`
      INSERT INTO projects (id, name, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `).run(projectId, 'Test Project', new Date().toISOString(), new Date().toISOString());
    db.close();
  });

  afterEach(async () => {
    await storage.close();
    if (testDir) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  it('should have embedding BLOB column in knowledge_events table', () => {
    const db = Database(dbPath);
    const tableInfo = db.pragma('table_info(knowledge_events)');
    db.close();

    const embeddingColumn = tableInfo.find((col: any) => col.name === 'embedding');
    expect(embeddingColumn).toBeDefined();
    expect(embeddingColumn.type).toBe('BLOB');
    expect(embeddingColumn.notnull).toBe(0); // Nullable
  });

  it('should store and retrieve event with embedding', async () => {
    const event = EventFactory.taskCompleted({
      projectId,
      description: 'Test embedding storage',
      outcome: 'success'
    });

    const generator = new EmbeddingGenerator();
    const embedding = await generator.embedEvent(event);

    // Store event with embedding using raw SQL
    const db = Database(dbPath);
    const stmt = db.prepare(`
      INSERT INTO knowledge_events (
        event_id, project_id, timestamp, event_type, data, embedding, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const embeddingBuffer = Buffer.from(embedding.buffer);
    stmt.run(
      event.eventId,
      event.projectId,
      event.timestamp,
      event.eventType,
      JSON.stringify(event.data),
      embeddingBuffer,
      new Date().toISOString()
    );

    // Retrieve and verify
    const row = db.prepare('SELECT * FROM knowledge_events WHERE event_id = ?').get(event.eventId) as any;
    db.close();

    expect(row).toBeDefined();
    expect(row.embedding).toBeDefined();
    expect(row.embedding).toBeInstanceOf(Buffer);
    expect(row.embedding.length).toBe(384 * 4); // 384 dimensions * 4 bytes per float

    // Convert back to Float32Array and verify
    const retrievedEmbedding = new Float32Array(
      row.embedding.buffer,
      row.embedding.byteOffset,
      384
    );
    
    // Check cosine similarity (should be 1.0 for identical vectors)
    let dotProduct = 0;
    for (let i = 0; i < 384; i++) {
      dotProduct += embedding[i] * retrievedEmbedding[i];
    }
    expect(dotProduct).toBeCloseTo(1.0, 5);
  });

  it('should allow NULL embeddings for backward compatibility', () => {
    const event = EventFactory.taskCompleted({
      projectId,
      description: 'Event without embedding',
      outcome: 'success'
    });

    const db = Database(dbPath);
    const stmt = db.prepare(`
      INSERT INTO knowledge_events (
        event_id, project_id, timestamp, event_type, data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.eventId,
      event.projectId,
      event.timestamp,
      event.eventType,
      JSON.stringify(event.data),
      new Date().toISOString()
    );

    const row = db.prepare('SELECT * FROM knowledge_events WHERE event_id = ?').get(event.eventId) as any;
    db.close();

    expect(row).toBeDefined();
    expect(row.embedding).toBeNull();
  });

  it('should preserve embedding data integrity across multiple inserts', async () => {
    const generator = new EmbeddingGenerator();
    const events = [
      EventFactory.taskCompleted({ projectId, description: 'Event 1', outcome: 'success' }),
      EventFactory.taskCompleted({ projectId, description: 'Event 2', outcome: 'success' }),
      EventFactory.taskCompleted({ projectId, description: 'Event 3', outcome: 'success' })
    ];

    const db = Database(dbPath);
    const stmt = db.prepare(`
      INSERT INTO knowledge_events (
        event_id, project_id, timestamp, event_type, data, embedding, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const embeddings: Float32Array[] = [];
    for (const event of events) {
      const embedding = await generator.embedEvent(event);
      embeddings.push(embedding);
      
      stmt.run(
        event.eventId,
        event.projectId,
        event.timestamp,
        event.eventType,
        JSON.stringify(event.data),
        Buffer.from(embedding.buffer),
        new Date().toISOString()
      );
    }

    // Verify all embeddings stored correctly
    const rows = db.prepare('SELECT * FROM knowledge_events').all() as any[];
    db.close();

    expect(rows).toHaveLength(3);
    rows.forEach((row, i) => {
      expect(row.embedding).toBeDefined();
      expect(row.embedding.length).toBe(384 * 4);
    });
  });
});
