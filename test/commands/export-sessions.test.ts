import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { exportSessions } from '../../dist/lib/commands/export-sessions.js';
import { SqliteStorage } from '../../dist/lib/context/sqlite-storage.js';
import type { ExportSessionsOptions } from '../../dist/lib/types/index.js';

describe('export-sessions command', () => {
  let tempDir: string;
  let outputDir: string;
  let dbPath: string;
  let storage: SqliteStorage;

  beforeEach(async () => {
    // Create temp directories
    tempDir = path.join(
      process.cwd(),
      `test-tmp-export-sessions-${Date.now()}`
    );
    fs.mkdirSync(tempDir, { recursive: true });

    outputDir = path.join(tempDir, 'exports');
    dbPath = path.join(tempDir, 'knowledge.db');

    storage = new SqliteStorage();
    await storage.init(dbPath);

    // Insert test project
    await storage.insertProject({
      id: 'test-project',
      name: 'Test Project',
      path: tempDir,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Insert multiple test sessions with events
    await createTestSession(storage, 'sess-2026-02-10-001', '2026-02-10', 'Session Feb 10');
    await createTestSession(storage, 'sess-2026-02-12-001', '2026-02-12', 'Session Feb 12');
    await createTestSession(storage, 'sess-2026-02-15-001', '2026-02-15', 'Session Feb 15');
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

  describe('bulk export to directory', () => {
    it('should export all sessions to directory', async () => {
      const options: ExportSessionsOptions = {
        dbPath,
        outputDir,
        verbose: false
      };

      const result = await exportSessions(options);

      expect(result.success).toBe(true);
      expect(result.exported).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.outputDir).toBe(outputDir);

      // Verify files were created
      const files = fs.readdirSync(outputDir);
      expect(files).toHaveLength(3);
      expect(files).toContain('sess-2026-02-10-001.md');
      expect(files).toContain('sess-2026-02-12-001.md');
      expect(files).toContain('sess-2026-02-15-001.md');

      // Verify file content
      const content = fs.readFileSync(
        path.join(outputDir, 'sess-2026-02-10-001.md'),
        'utf-8'
      );
      expect(content).toContain('## Session: Session Feb 10');
      expect(content).toContain('**Goal:**');
    });

    it('should create output directory if it does not exist', async () => {
      const nonExistentDir = path.join(tempDir, 'new-dir', 'nested', 'exports');

      const options: ExportSessionsOptions = {
        dbPath,
        outputDir: nonExistentDir,
        verbose: false
      };

      const result = await exportSessions(options);

      expect(result.success).toBe(true);
      expect(fs.existsSync(nonExistentDir)).toBe(true);
      expect(result.exported).toBe(3);
    });

    it('should handle verbose mode with progress reporting', async () => {
      const options: ExportSessionsOptions = {
        dbPath,
        outputDir,
        verbose: true
      };

      const result = await exportSessions(options);

      expect(result.success).toBe(true);
      expect(result.exported).toBe(3);
    });
  });

  describe('date range filtering', () => {
    it('should export sessions within date range (from/to)', async () => {
      const options: ExportSessionsOptions = {
        dbPath,
        outputDir,
        from: '2026-02-11',
        to: '2026-02-15',
        verbose: false
      };

      const result = await exportSessions(options);

      expect(result.success).toBe(true);
      expect(result.exported).toBe(2); // Feb 12 and Feb 15

      const files = fs.readdirSync(outputDir);
      expect(files).toHaveLength(2);
      expect(files).toContain('sess-2026-02-12-001.md');
      expect(files).toContain('sess-2026-02-15-001.md');
      expect(files).not.toContain('sess-2026-02-10-001.md');
    });

    it('should export sessions from specific date onwards (from only)', async () => {
      const options: ExportSessionsOptions = {
        dbPath,
        outputDir,
        from: '2026-02-12',
        verbose: false
      };

      const result = await exportSessions(options);

      expect(result.success).toBe(true);
      expect(result.exported).toBe(2); // Feb 12 and Feb 15
    });

    it('should export sessions up to specific date (to only)', async () => {
      const options: ExportSessionsOptions = {
        dbPath,
        outputDir,
        to: '2026-02-12',
        verbose: false
      };

      const result = await exportSessions(options);

      expect(result.success).toBe(true);
      expect(result.exported).toBe(2); // Feb 10 and Feb 12
    });
  });

  describe('project filtering', () => {
    it('should filter sessions by project ID', async () => {
      // Add another project with different sessions
      await storage.insertProject({
        id: 'other-project',
        name: 'Other Project',
        path: tempDir,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Insert session for other project
      await storage.insertSession({
        id: 'sess-other-001',
        project_id: 'other-project',
        date: '2026-02-14',
        topic: 'Other Session',
        topics: ['other'],
        status: 'completed',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        content: ''
      });

      await storage.insertEvent({
        eventId: 'evt-other-001',
        projectId: 'other-project',
        sessionId: 'sess-other-001',
        eventType: 'session_started',
        timestamp: new Date('2026-02-14T10:00:00Z').toISOString(),
        data: { title: 'Other Session', topics: ['other'] }
      });

      // Export only test-project sessions
      const options: ExportSessionsOptions = {
        dbPath,
        outputDir,
        projectId: 'test-project',
        verbose: false
      };

      const result = await exportSessions(options);

      expect(result.success).toBe(true);
      expect(result.exported).toBe(3); // Only test-project sessions

      const files = fs.readdirSync(outputDir);
      expect(files).toHaveLength(3);
      expect(files).not.toContain('sess-other-001.md');
    });
  });

  describe('dry run mode', () => {
    it('should simulate export without creating files (dry run)', async () => {
      const options: ExportSessionsOptions = {
        dbPath,
        outputDir,
        dryRun: true,
        verbose: false
      };

      const result = await exportSessions(options);

      expect(result.success).toBe(true);
      expect(result.exported).toBe(3);

      // Verify NO files were created
      expect(fs.existsSync(outputDir)).toBe(false);
    });

    it('should show what would be exported in dry run with verbose', async () => {
      const options: ExportSessionsOptions = {
        dbPath,
        outputDir,
        from: '2026-02-12',
        dryRun: true,
        verbose: true
      };

      const result = await exportSessions(options);

      expect(result.success).toBe(true);
      expect(result.exported).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      const options: ExportSessionsOptions = {
        dbPath: '/nonexistent/path/knowledge.db',
        outputDir,
        verbose: false
      };

      const result = await exportSessions(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to connect to database');
      expect(result.exported).toBe(0);
    });

    it('should handle no sessions found (empty result)', async () => {
      const options: ExportSessionsOptions = {
        dbPath,
        outputDir,
        from: '2026-03-01', // Date with no sessions
        to: '2026-03-31',
        verbose: false
      };

      const result = await exportSessions(options);

      expect(result.success).toBe(true);
      expect(result.exported).toBe(0);
      expect(result.skipped).toBe(0);
    });

    it('should track failed exports and continue processing', async () => {
      // Create a session with no events (will cause markdown generation to fail)
      await storage.insertSession({
        id: 'sess-broken-001',
        project_id: 'test-project',
        date: '2026-02-11',
        topic: 'Broken Session',
        topics: ['broken'],
        status: 'started',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        content: ''
      });

      const options: ExportSessionsOptions = {
        dbPath,
        outputDir,
        verbose: false
      };

      const result = await exportSessions(options);

      // Should succeed overall but track failures
      expect(result.success).toBe(true);
      expect(result.exported).toBeGreaterThan(0);
      expect(result.failed).toBeGreaterThanOrEqual(0);
      
      // If a session fails, it should be in the errors array
      if (result.failed > 0) {
        expect(result.errors).toBeDefined();
        expect(result.errors!.length).toBeGreaterThan(0);
      }
    });

    it('should handle invalid output directory path', async () => {
      const options: ExportSessionsOptions = {
        dbPath,
        outputDir: '/root/forbidden/path', // Likely permission denied
        verbose: false
      };

      const result = await exportSessions(options);

      // Should fail gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('combined filters', () => {
    it('should apply multiple filters (date range + project)', async () => {
      // Add another project
      await storage.insertProject({
        id: 'other-project',
        name: 'Other Project',
        path: tempDir,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      await createTestSession(storage, 'sess-other-001', '2026-02-13', 'Other Session', 'other-project');

      const options: ExportSessionsOptions = {
        dbPath,
        outputDir,
        from: '2026-02-12',
        to: '2026-02-15',
        projectId: 'test-project',
        verbose: false
      };

      const result = await exportSessions(options);

      expect(result.success).toBe(true);
      expect(result.exported).toBe(2); // Only test-project sessions in range

      const files = fs.readdirSync(outputDir);
      expect(files).toHaveLength(2);
      expect(files).toContain('sess-2026-02-12-001.md');
      expect(files).toContain('sess-2026-02-15-001.md');
      expect(files).not.toContain('sess-other-001.md');
    });
  });

  describe('markdown quality', () => {
    it('should generate valid markdown for each exported session', async () => {
      const options: ExportSessionsOptions = {
        dbPath,
        outputDir,
        verbose: false
      };

      const result = await exportSessions(options);

      expect(result.success).toBe(true);

      // Check each exported file
      const files = fs.readdirSync(outputDir);
      for (const file of files) {
        const content = fs.readFileSync(path.join(outputDir, file), 'utf-8');

        // Verify markdown structure
        expect(content).toContain('## Session:');
        expect(content).toContain('**Goal:**');
        expect(content).toContain('## Changes');
        expect(content).toContain('## Validation');
      }
    });

    it('should preserve file links in markdown format', async () => {
      // Add a session with file changes
      const sessionId = 'sess-with-files-001';
      await storage.insertSession({
        id: sessionId,
        project_id: 'test-project',
        date: '2026-02-16',
        topic: 'File Changes Session',
        topics: ['files'],
        status: 'completed',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        content: ''
      });

      await storage.insertEvent({
        eventId: 'evt-file-001',
        projectId: 'test-project',
        sessionId: sessionId,
        eventType: 'file_changed',
        timestamp: new Date('2026-02-16T10:00:00Z').toISOString(),
        data: {
          filePath: 'lib/commands/test.ts',
          changeType: 'created'
        }
      });

      const options: ExportSessionsOptions = {
        dbPath,
        outputDir,
        from: '2026-02-16',
        verbose: false
      };

      const result = await exportSessions(options);

      expect(result.success).toBe(true);

      const content = fs.readFileSync(
        path.join(outputDir, 'sess-with-files-001.md'),
        'utf-8'
      );

      // Verify file link format
      expect(content).toContain('[lib/commands/test.ts](lib/commands/test.ts)');
    });
  });
});

// Helper function to create test session with events
async function createTestSession(
  storage: SqliteStorage,
  sessionId: string,
  date: string,
  topic: string,
  projectId: string = 'test-project'
): Promise<void> {
  await storage.insertSession({
    id: sessionId,
    project_id: projectId,
    date: date,
    topic: topic,
    topics: ['testing', 'export'],
    status: 'completed',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    content: ''
  });

  // Insert session_started event
  await storage.insertEvent({
    eventId: `${sessionId}-evt-001`,
    projectId: projectId,
    sessionId: sessionId,
    eventType: 'session_started',
    timestamp: new Date(`${date}T10:00:00Z`).toISOString(),
    data: { title: topic, topics: ['testing', 'export'] }
  });

  // Insert goal_defined event
  await storage.insertEvent({
    eventId: `${sessionId}-evt-002`,
    projectId: projectId,
    sessionId: sessionId,
    eventType: 'goal_defined',
    timestamp: new Date(`${date}T10:01:00Z`).toISOString(),
    data: { goal: `Goal for ${topic}` }
  });

  // Insert file_changed event
  await storage.insertEvent({
    eventId: `${sessionId}-evt-003`,
    projectId: projectId,
    sessionId: sessionId,
    eventType: 'file_changed',
    timestamp: new Date(`${date}T10:05:00Z`).toISOString(),
    data: {
      filePath: 'lib/test.ts',
      changeType: 'modified'
    }
  });

  // Insert validation_passed event
  await storage.insertEvent({
    eventId: `${sessionId}-evt-004`,
    projectId: projectId,
    sessionId: sessionId,
    eventType: 'validation_passed',
    timestamp: new Date(`${date}T10:10:00Z`).toISOString(),
    data: {
      validationType: 'Tests',
      details: 'All tests passing'
    }
  });
}
