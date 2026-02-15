import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { exportSession } from '../../dist/lib/commands/export-session.js';
import { SqliteStorage } from '../../dist/lib/context/sqlite-storage.js';
import type { ExportSessionOptions } from '../../dist/lib/types/index.js';

describe('export-session command', () => {
  let tempDir: string;
  let dbPath: string;
  let storage: SqliteStorage;

  beforeEach(async () => {
    // Create temp directory
    tempDir = path.join(
      process.cwd(),
      `test-tmp-export-session-${Date.now()}`
    );
    fs.mkdirSync(tempDir, { recursive: true });

    dbPath = path.join(tempDir, 'knowledge.db');
    storage = new SqliteStorage();
    await storage.init(dbPath);

    // Insert test project for foreign key constraints
    await storage.insertProject({
      id: 'test-project',
      name: 'Test Project',
      path: tempDir,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  });

  afterEach(async () => {
    if (storage) {
      await storage.close();
    }

    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('export by session ID', () => {
    it('should export session events as markdown to stdout', async () => {
      // Insert a session with events
      const sessionId = 'sess-2026-02-15-001';
      await storage.insertSession({
        id: sessionId,
        project_id: 'test-project',
        date: '2026-02-15',
        topic: 'Test Session',
        topics: ['testing', 'export'],
        status: 'completed',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        content: ''
      });

      // Insert events
      await storage.insertEvent({
        eventId: 'evt-001',
        projectId: "test-project",
        sessionId: sessionId,
        eventType: 'session_started',
        timestamp: new Date('2026-02-15T10:00:00Z').toISOString(),
        data: { title: 'Test Session', topics: ['testing', 'export'] }
      });

      await storage.insertEvent({
        eventId: 'evt-002',
        projectId: "test-project",
        sessionId: sessionId,
        eventType: 'goal_defined',
        timestamp: new Date('2026-02-15T10:01:00Z').toISOString(),
        data: { goal: 'Export session as markdown' }
      });

      await storage.insertEvent({
        eventId: 'evt-003',
        projectId: "test-project",
        sessionId: sessionId,
        eventType: 'file_changed',
        timestamp: new Date('2026-02-15T10:05:00Z').toISOString(),
        data: { 
          filePath: 'lib/commands/export-session.ts',
          changeType: 'created',
        }
      });

      await storage.insertEvent({
        eventId: 'evt-004',
        projectId: "test-project",
        sessionId: sessionId,
        eventType: 'validation_passed',
        timestamp: new Date('2026-02-15T10:10:00Z').toISOString(),
        data: {
          validationType: 'Tests',
          result: '5/5 tests passing'
        }
      });

      // Export session (default: stdout)
      const options: ExportSessionOptions = {
        sessionId,
        dbPath,
        verbose: false
      };

      const result = await exportSession(options);

      // Verify markdown was generated
      expect(result.success).toBe(true);
      expect(result.markdown).toBeDefined();
      expect(result.markdown).toContain('## Session: Test Session');
      expect(result.markdown).toContain('**Goal:** Export session as markdown');
      expect(result.markdown).toContain('## Changes');
      expect(result.markdown).toContain('lib/commands/export-session.ts');
      expect(result.markdown).toContain('## Validation');
      expect(result.markdown).toContain('Tests');
    });

    it('should export session to file when --output is provided', async () => {
      // Insert a session with events
      const sessionId = 'sess-2026-02-15-002';
      await storage.insertSession({
        id: sessionId,
        project_id: 'test-project',
        date: '2026-02-15',
        topic: 'Export to File Test',
        topics: ['testing'],
        status: 'completed',
        content: '',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      });

      await storage.insertEvent({
        eventId: 'evt-005',
        projectId: "test-project",
        sessionId: sessionId,
        eventType: 'session_started',
        timestamp: new Date('2026-02-15T11:00:00Z').toISOString(),
        data: { title: 'Export to File Test', topics: ['testing'] }
      });

      await storage.insertEvent({
        eventId: 'evt-006',
        projectId: "test-project",
        sessionId: sessionId,
        eventType: 'goal_defined',
        timestamp: new Date('2026-02-15T11:01:00Z').toISOString(),
        data: { goal: 'Write markdown to file' }
      });

      // Export session to file
      const outputPath = path.join(tempDir, 'exported-session.md');
      const options: ExportSessionOptions = {
        sessionId,
        dbPath,
        output: outputPath,
        verbose: false
      };

      const result = await exportSession(options);

      // Verify file was written
      expect(result.success).toBe(true);
      expect(result.outputPath).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);

      const fileContent = fs.readFileSync(outputPath, 'utf-8');
      expect(fileContent).toContain('## Session: Export to File Test');
      expect(fileContent).toContain('**Goal:** Write markdown to file');
    });

    it('should handle session not found error', async () => {
      const options: ExportSessionOptions = {
        sessionId: 'sess-nonexistent',
        dbPath,
        verbose: false
      };

      const result = await exportSession(options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Session sess-nonexistent not found');
    });

    it('should handle session with no events', async () => {
      // Insert session without events
      const sessionId = 'sess-2026-02-15-003';
      await storage.insertSession({
        id: sessionId,
        project_id: 'test-project',
        date: '2026-02-15',
        topic: 'Empty Session',
        topics: ['testing'],
        status: 'in-progress',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      });

      const options: ExportSessionOptions = {
        sessionId,
        dbPath,
        verbose: false
      };

      const result = await exportSession(options);

      // Should still succeed but with minimal markdown
      expect(result.success).toBe(true);
      expect(result.markdown).toBeDefined();
      expect(result.markdown).toContain('## Session: Empty Session');
      expect(result.eventCount).toBe(0);
    });

    it('should show event count in verbose mode', async () => {
      // Insert session with events
      const sessionId = 'sess-2026-02-15-004';
      await storage.insertSession({
        id: sessionId,
        project_id: 'test-project',
        date: '2026-02-15',
        topic: 'Verbose Test',
        topics: ['testing'],
        status: 'completed',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      });

      await storage.insertEvent({
        eventId: 'evt-007',
        projectId: "test-project",
        sessionId: sessionId,
        eventType: 'session_started',
        timestamp: new Date().toISOString(),
        data: { title: 'Verbose Test', topics: ['testing'] }
      });

      await storage.insertEvent({
        eventId: 'evt-008',
        projectId: "test-project",
        sessionId: sessionId,
        eventType: 'goal_defined',
        timestamp: new Date().toISOString(),
        data: { goal: 'Test verbose mode' }
      });

      await storage.insertEvent({
        eventId: 'evt-009',
        projectId: "test-project",
        sessionId: sessionId,
        eventType: 'validation_passed',
        timestamp: new Date().toISOString(),
        data: { validationType: 'Tests', result: 'passing' }
      });

      const options: ExportSessionOptions = {
        sessionId,
        dbPath,
        verbose: true
      };

      const result = await exportSession(options);

      expect(result.success).toBe(true);
      expect(result.eventCount).toBe(3);
      expect(result.verbose).toBe(true);
    });
  });

  describe('export by date', () => {
    it('should export session by date when --date is provided', async () => {
      // Insert session with specific date
      const sessionId = 'sess-2026-02-20-001';
      await storage.insertSession({
        id: sessionId,
        project_id: 'test-project',
        date: '2026-02-20',
        topic: 'Date Search Test',
        topics: ['testing'],
        status: 'completed',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      });

      await storage.insertEvent({
        eventId: 'evt-010',
        projectId: "test-project",
        sessionId: sessionId,
        eventType: 'session_started',
        timestamp: new Date('2026-02-20T10:00:00Z').toISOString(),
        data: { title: 'Date Search Test', topics: ['testing'] }
      });

      const options: ExportSessionOptions = {
        date: '2026-02-20',
        dbPath,
        verbose: false
      };

      const result = await exportSession(options);

      expect(result.success).toBe(true);
      expect(result.markdown).toContain('## Session: Date Search Test');
      expect(result.sessionId).toBe(sessionId);
    });

    it('should handle date with no matching sessions', async () => {
      const options: ExportSessionOptions = {
        date: '2099-12-31',
        dbPath,
        verbose: false
      };

      const result = await exportSession(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No session found for date 2099-12-31');
    });

    it('should handle multiple sessions on same date (return first)', async () => {
      // Insert two sessions on same date
      const sessionId1 = 'sess-2026-03-01-001';
      const sessionId2 = 'sess-2026-03-01-002';

      await storage.insertSession({
        id: sessionId1,
        project_id: 'test-project',
        date: '2026-03-01',
        topic: 'Session 1',
        topics: ['testing'],
        status: 'completed',
        created: new Date('2026-03-01T09:00:00Z').toISOString(),
        updated: new Date().toISOString()
      });

      await storage.insertSession({
        id: sessionId2,
        project_id: 'test-project',
        date: '2026-03-01',
        topic: 'Session 2',
        topics: ['testing'],
        status: 'completed',
        created: new Date('2026-03-01T10:00:00Z').toISOString(),
        updated: new Date().toISOString()
      });

      await storage.insertEvent({
        eventId: 'evt-011',
        projectId: "test-project",
        sessionId: sessionId1,
        eventType: 'session_started',
        timestamp: new Date().toISOString(),
        data: { title: 'Session 1', topics: ['testing'] }
      });

      await storage.insertEvent({
        eventId: 'evt-012',
        projectId: "test-project",
        sessionId: sessionId2,
        eventType: 'session_started',
        timestamp: new Date().toISOString(),
        data: { title: 'Session 2', topics: ['testing'] }
      });

      const options: ExportSessionOptions = {
        date: '2026-03-01',
        dbPath,
        verbose: true
      };

      const result = await exportSession(options);

      expect(result.success).toBe(true);
      // Should export first session (oldest created_at)
      expect(result.sessionId).toBe(sessionId1);
      expect(result.markdown).toContain('Session 1');
      
      // Verbose mode should warn about multiple sessions
      expect(result.warning).toContain('multiple sessions');
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      const options: ExportSessionOptions = {
        sessionId: 'sess-test',
        dbPath: '/nonexistent/path/to/db.db',
        verbose: false
      };

      const result = await exportSession(options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('database');
    });

    it('should handle invalid output path errors', async () => {
      // Insert session
      const sessionId = 'sess-2026-02-15-005';
      await storage.insertSession({
        id: sessionId,
        project_id: 'test-project',
        date: '2026-02-15',
        topic: 'Output Error Test',
        topics: ['testing'],
        status: 'completed',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      });

      await storage.insertEvent({
        eventId: 'evt-013',
        projectId: "test-project",
        sessionId: sessionId,
        eventType: 'session_started',
        timestamp: new Date().toISOString(),
        data: { title: 'Output Error Test', topics: ['testing'] }
      });

      const options: ExportSessionOptions = {
        sessionId,
        dbPath,
        output: '/root/forbidden/path/output.md', // Should fail with permission error
        verbose: false
      };

      const result = await exportSession(options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should require either sessionId or date', async () => {
      const options: ExportSessionOptions = {
        dbPath,
        verbose: false
      };

      const result = await exportSession(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Either sessionId or date must be provided');
    });

    it('should not allow both sessionId and date', async () => {
      const options: ExportSessionOptions = {
        sessionId: 'sess-test',
        date: '2026-02-15',
        dbPath,
        verbose: false
      };

      const result = await exportSession(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot specify both sessionId and date');
    });
  });

  describe('markdown generation quality', () => {
    it('should generate valid markdown with all sections', async () => {
      // Insert session with comprehensive events
      const sessionId = 'sess-2026-02-15-006';
      await storage.insertSession({
        id: sessionId,
        project_id: 'test-project',
        date: '2026-02-15',
        topic: 'Comprehensive Export Test',
        topics: ['feature', 'testing', 'documentation'],
        status: 'completed',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      });

      // All event types
      await storage.insertEvent({
        eventId: 'evt-014',
        projectId: "test-project",
        sessionId: sessionId,
        eventType: 'session_started',
        timestamp: new Date('2026-02-15T10:00:00Z').toISOString(),
        data: { title: 'Comprehensive Export Test', topics: ['feature', 'testing', 'documentation'] }
      });

      await storage.insertEvent({
        eventId: 'evt-015',
        projectId: "test-project",
        sessionId: sessionId,
        eventType: 'goal_defined',
        timestamp: new Date('2026-02-15T10:01:00Z').toISOString(),
        data: { goal: 'Test all event types in export' }
      });

      await storage.insertEvent({
        eventId: 'evt-016',
        projectId: "test-project",
        sessionId: sessionId,
        eventType: 'task_completed',
        timestamp: new Date('2026-02-15T10:05:00Z').toISOString(),
        data: { task: 'Implement export command', status: 'completed' }
      });

      await storage.insertEvent({
        eventId: 'evt-017',
        projectId: "test-project",
        sessionId: sessionId,
        eventType: 'file_changed',
        timestamp: new Date('2026-02-15T10:06:00Z').toISOString(),
        data: {
          filePath: 'lib/commands/export-session.ts',
          changeType: 'created',
        }
      });

      await storage.insertEvent({
        eventId: 'evt-018',
        projectId: "test-project",
        sessionId: sessionId,
        eventType: 'validation_passed',
        timestamp: new Date('2026-02-15T10:10:00Z').toISOString(),
        data: {
          validationType: 'Tests',
          result: '10/10 tests passing'
        }
      });

      await storage.insertEvent({
        eventId: 'evt-019',
        projectId: "test-project",
        sessionId: sessionId,
        eventType: 'learning_captured',
        timestamp: new Date('2026-02-15T10:15:00Z').toISOString(),
        data: {
          learning: 'Event-sourced exports provide complete traceability',
          applicability: 'universal' as const,
          confidence: 'high' as const
        }
      });

      await storage.insertEvent({
        eventId: 'evt-020',
        projectId: "test-project",
        sessionId: sessionId,
        eventType: 'decision_made',
        timestamp: new Date('2026-02-15T10:20:00Z').toISOString(),
        data: {
          decision: 'Use MarkdownGenerator for consistency',
          rationale: 'Already tested and in use for hybrid storage'
        }
      });

      const options: ExportSessionOptions = {
        sessionId,
        dbPath,
        verbose: true
      };

      const result = await exportSession(options);

      expect(result.success).toBe(true);
      expect(result.eventCount).toBe(7);

      // Verify all sections present
      const markdown = result.markdown!;
      expect(markdown).toContain('## Session: Comprehensive Export Test');
      expect(markdown).toContain('**Goal:** Test all event types in export');
      expect(markdown).toContain('## Changes');
      expect(markdown).toContain('lib/commands/export-session.ts');
      expect(markdown).toContain('## Validation');
      expect(markdown).toContain('Tests');
      expect(markdown).toContain('10/10 tests passing');
      expect(markdown).toContain('## Key Learning');
      expect(markdown).toContain('Event-sourced exports provide complete traceability');
      expect(markdown).toContain('## Decisions');
      expect(markdown).toContain('Use MarkdownGenerator for consistency');
    });

    it('should preserve file links in markdown format', async () => {
      const sessionId = 'sess-2026-02-15-007';
      await storage.insertSession({
        id: sessionId,
        project_id: 'test-project',
        date: '2026-02-15',
        topic: 'File Links Test',
        topics: ['testing'],
        status: 'completed',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      });

      await storage.insertEvent({
        eventId: 'evt-021',
        projectId: "test-project",
        sessionId: sessionId,
        eventType: 'session_started',
        timestamp: new Date().toISOString(),
        data: { title: 'File Links Test', topics: ['testing'] }
      });

      await storage.insertEvent({
        eventId: 'evt-022',
        projectId: "test-project",
        sessionId: sessionId,
        eventType: 'file_changed',
        timestamp: new Date().toISOString(),
        data: {
          filePath: 'lib/commands/export-session.ts',
          changeType: 'modified',
        }
      });

      const options: ExportSessionOptions = {
        sessionId,
        dbPath,
        verbose: false
      };

      const result = await exportSession(options);

      expect(result.success).toBe(true);
      // Should create markdown link for file
      expect(result.markdown).toContain('[lib/commands/export-session.ts](lib/commands/export-session.ts)');
      expect(result.markdown).toContain('modified');
    });
  });
});
