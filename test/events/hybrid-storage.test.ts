/**
 * Hybrid Storage Tests - Phase 2.1
 * Tests for storing BOTH events AND markdown for backward compatibility
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { SqliteStorage } from '../../dist/lib/context/sqlite-storage.js';
import { EventType } from '../../dist/lib/events/types.js';
import type { KnowledgeEvent, SessionStartedData, TaskCompletedData, ValidationPassedData } from '../../dist/lib/events/types.js';

describe('Hybrid Storage - Phase 2.1', () => {
  let storage: SqliteStorage;
  let dbPath: string;

  beforeEach(async () => {
    dbPath = path.join(process.cwd(), `test-tmp-hybrid-${Date.now()}`);
    await fs.mkdir(dbPath, { recursive: true });
    
    storage = new SqliteStorage();
    await storage.init(dbPath);

    // Insert test project for foreign key constraints
    await storage.insertProject({
      id: 'test-proj',
      name: 'Test Project',
      path: '/tmp/test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  });

  afterEach(async () => {
    await storage.close();
    await fs.rm(dbPath, { recursive: true, force: true });
  });

  describe('Hybrid Write (Events + Markdown)', () => {
    it('should store events when creating a session', async () => {
      const sessionId = 'sess-hybrid-001';
      const events: KnowledgeEvent[] = [
        {
          eventId: 'evt-001',
          projectId: 'test-proj',
          sessionId,
          timestamp: new Date().toISOString(),
          eventType: EventType.SESSION_STARTED,
          data: { 
            title: 'Test Hybrid Session',
            topics: ['hybrid', 'testing']
          } as SessionStartedData
        }
      ];

      // Create session with events
      await storage.createSessionWithEvents({
        id: sessionId,
        projectId: 'test-proj',
        date: '2026-02-15',
        title: 'Test Hybrid Session',
        topics: ['hybrid', 'testing'],
        events
      });

      // Verify events were stored
      const retrievedEvents = await storage.queryEvents({ sessionId });
      expect(retrievedEvents).toHaveLength(1);
      expect(retrievedEvents[0].eventType).toBe(EventType.SESSION_STARTED);
    });

    it('should generate and store markdown when creating a session', async () => {
      const sessionId = 'sess-hybrid-002';
      const events: KnowledgeEvent[] = [
        {
          eventId: 'evt-002',
          projectId: 'test-proj',
          sessionId,
          timestamp: new Date().toISOString(),
          eventType: EventType.SESSION_STARTED,
          data: { 
            title: 'Test Hybrid Session',
            topics: ['hybrid']
          } as SessionStartedData
        }
      ];

      await storage.createSessionWithEvents({
        id: sessionId,
        projectId: 'test-proj',
        date: '2026-02-15',
        title: 'Test Hybrid Session',
        topics: ['hybrid'],
        events
      });

      // Verify markdown was stored in sessions.content
      const session = await storage.getSessionById(sessionId);
      expect(session).toBeDefined();
      expect(session?.content).toBeDefined();
      expect(session?.content).toContain('Test Hybrid Session');
    });

    it('should generate markdown that matches template format', async () => {
      const sessionId = 'sess-hybrid-003';
      const events: KnowledgeEvent[] = [
        {
          eventId: 'evt-003a',
          projectId: 'test-proj',
          sessionId,
          timestamp: '2026-02-15T14:00:00Z',
          eventType: EventType.SESSION_STARTED,
          data: { 
            title: 'Implement Feature X',
            topics: ['feature']
          } as SessionStartedData
        },
        {
          eventId: 'evt-003b',
          projectId: 'test-proj',
          sessionId,
          timestamp: '2026-02-15T14:30:00Z',
          eventType: EventType.TASK_COMPLETED,
          data: {
            description: 'Write tests',
            outcome: 'success',
            testsPassing: 42,
            testsTotal: 42
          } as TaskCompletedData
        },
        {
          eventId: 'evt-003c',
          projectId: 'test-proj',
          sessionId,
          timestamp: '2026-02-15T15:00:00Z',
          eventType: EventType.VALIDATION_PASSED,
          data: {
            validationType: 'Tests',
            result: '42 passed'
          }
        }
      ];

      await storage.createSessionWithEvents({
        id: sessionId,
        projectId: 'test-proj',
        date: '2026-02-15',
        title: 'Implement Feature X',
        topics: ['feature'],
        events
      });

      const session = await storage.getSessionById(sessionId);
      const markdown = session?.content || '';

      // Verify markdown contains expected sections
      expect(markdown).toContain('## Session:');
      expect(markdown).toContain('**Goal:**');
      expect(markdown).toContain('## Changes');
      expect(markdown).toContain('## Validation');
    });

    it('should include all event data in generated markdown', async () => {
      const sessionId = 'sess-hybrid-004';
      const events: KnowledgeEvent[] = [
        {
          eventId: 'evt-004',
          projectId: 'test-proj',
          sessionId,
          timestamp: new Date().toISOString(),
          eventType: EventType.TASK_COMPLETED,
          data: {
            description: 'Implement authentication',
            outcome: 'success',
            filesChanged: ['lib/auth.ts', 'test/auth.test.ts'],
            testsPassing: 64,
            testsTotal: 64
          } as TaskCompletedData
        }
      ];

      await storage.createSessionWithEvents({
        id: sessionId,
        projectId: 'test-proj',
        date: '2026-02-15',
        title: 'Add Auth',
        topics: ['auth'],
        events
      });

      const session = await storage.getSessionById(sessionId);
      const markdown = session?.content || '';

      // Verify event details appear in markdown
      expect(markdown).toContain('authentication');
      expect(markdown).toContain('lib/auth.ts');
      expect(markdown).toContain('test/auth.test.ts');
      // Note: testsPassing/testsTotal are stored but not rendered in markdown template
    });
  });

  describe('Hybrid Read (Intelligent Fallback)', () => {
    it('should prefer events over markdown for new sessions', async () => {
      const sessionId = 'sess-read-001';
      
      // Create session with both events and markdown
      await storage.createSessionWithEvents({
        id: sessionId,
        projectId: 'test-proj',
        date: '2026-02-15',
        title: 'Test Session',
        topics: ['test'],
        events: [
          {
            eventId: 'evt-read-001',
            projectId: 'test-proj',
            sessionId,
            timestamp: new Date().toISOString(),
            eventType: EventType.SESSION_STARTED,
            data: { title: 'Test Session', topics: ['test'] } as SessionStartedData
          }
        ]
      });

      // Read session - should return events format (as markdown generated from events)
      const result = await storage.getSessionContent(sessionId);
      
      expect(result.format).toBe('events');
      expect(result.data).toContain('Test Session');
      expect(result.data).toContain('##'); // Markdown headers
    });

    it('should fallback to markdown for legacy sessions', async () => {
      const sessionId = 'sess-read-002';
      const legacyMarkdown = '## Session: Legacy Session\n\n**Goal:** Test fallback\n\n## Changes\n- Fixed bug';

      // Manually insert old-style session (markdown only, no events)
      const db = (storage as any).db;
      db.prepare(`
        INSERT INTO sessions (id, project_id, date, topic, status, content, topics, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'complete', ?, '[]', datetime('now'), datetime('now'))
      `).run(sessionId, 'test-proj', '2026-02-15', 'Legacy Session', legacyMarkdown);

      // Read session - should fallback to markdown
      const result = await storage.getSessionContent(sessionId);
      
      expect(result.format).toBe('markdown');
      expect(result.data).toBe(legacyMarkdown);
      expect(result.data).toContain('Legacy Session');
    });

    it('should handle sessions with corrupted events gracefully', async () => {
      const sessionId = 'sess-read-003';
      
      // Create session normally
      await storage.createSessionWithEvents({
        id: sessionId,
        projectId: 'test-proj',
        date: '2026-02-15',
        title: 'Test Session',
        topics: ['test'],
        events: [
          {
            eventId: 'evt-corrupt',
            projectId: 'test-proj',
            sessionId,
            timestamp: new Date().toISOString(),
            eventType: EventType.SESSION_STARTED,
            data: { title: 'Test', topics: [] } as SessionStartedData
          }
        ]
      });

      // Corrupt the event data
      const db = (storage as any).db;
      db.prepare('UPDATE knowledge_events SET data = ? WHERE event_id = ?')
        .run('invalid-json{{{', 'evt-corrupt');

      // Read session - should fallback to markdown despite event corruption
      const result = await storage.getSessionContent(sessionId);
      
      expect(result.format).toBe('markdown');
      expect(result.data).toContain('Test Session');
    });
  });

  describe('Session Storage Integration', () => {
    it('should support both old and new storage patterns', async () => {
      const oldSessionId = 'old-sess';
      const newSessionId = 'new-sess';

      // Create old-style session (markdown only)
      const db = (storage as any).db;
      db.prepare(`
        INSERT INTO sessions (id, project_id, date, topic, status, content, topics, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'complete', ?, '[]', datetime('now'), datetime('now'))
      `).run(oldSessionId, 'test-proj', '2026-02-14', 'Old Session', 'Old markdown content');

      // Create new-style session (events + markdown)
      await storage.createSessionWithEvents({
        id: newSessionId,
        projectId: 'test-proj',
        date: '2026-02-15',
        title: 'New Session',
        topics: ['new'],
        events: [
          {
            eventId: 'evt-new',
            projectId: 'test-proj',
            sessionId: newSessionId,
            timestamp: new Date().toISOString(),
            eventType: EventType.SESSION_STARTED,
            data: { title: 'New Session', topics: ['new'] } as SessionStartedData
          }
        ]
      });

      // Should be able to read both
      const oldResult = await storage.getSessionContent(oldSessionId);
      const newResult = await storage.getSessionContent(newSessionId);

      expect(oldResult.format).toBe('markdown');
      expect(newResult.format).toBe('events');
    });
  });
});
