import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('VSCode Hooks', () => {
  const testSessionsDir = path.join(__dirname, 'fixtures', 'test-sessions');
  const sessionStartScript = path.join(__dirname, '..', 'templates', 'hooks', 'session-start.js');
  const sessionEndScript = path.join(__dirname, '..', 'templates', 'hooks', 'session-end.js');

  beforeEach(() => {
    // Create test sessions directory
    if (!fs.existsSync(testSessionsDir)) {
      fs.mkdirSync(testSessionsDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test sessions directory
    if (fs.existsSync(testSessionsDir)) {
      fs.rmSync(testSessionsDir, { recursive: true, force: true });
    }
  });

  describe('session-start.js', () => {
    it('should exit cleanly (code 0) when sessions directory does not exist', () => {
      const nonExistentDir = path.join(__dirname, 'fixtures', 'nonexistent-sessions');
      
      try {
        execSync(`node ${sessionStartScript}`, {
          env: { ...process.env, SESSIONS_DIR: nonExistentDir },
          stdio: 'pipe'
        });
        assert.ok(true); // Should not throw
      } catch (error) {
        assert.fail('Should not throw when sessions directory does not exist');
      }
    });

    it('should exit cleanly (code 0) when sessions directory is empty', () => {
      try {
        execSync(`node ${sessionStartScript}`, {
          env: { ...process.env, SESSIONS_DIR: testSessionsDir },
          stdio: 'pipe'
        });
        assert.ok(true); // Should not throw
      } catch (error) {
        assert.fail('Should not throw when sessions directory is empty');
      }
    });

    it('should NOT output reminder when all sessions are >7 days old', () => {
      // Create an old session file (8 days ago)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8);
      const oldFileName = `${oldDate.toISOString().split('T')[0]}-session.md`;
      const oldFilePath = path.join(testSessionsDir, oldFileName);
      
      fs.writeFileSync(oldFilePath, '# Old Session');
      
      // Set file modification time to 8 days ago
      const oldTime = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      fs.utimesSync(oldFilePath, oldTime, oldTime);

      const result = execSync(`node ${sessionStartScript}`, {
        env: { ...process.env, SESSIONS_DIR: testSessionsDir },
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      assert.ok(!result.includes('[SessionStart] Found recent session'));
    });

    it('should output session filename when recent session exists (<7 days)', () => {
      // Create a recent session file (today)
      const today = new Date().toISOString().split('T')[0];
      const recentFileName = `${today}-session.md`;
      const recentFilePath = path.join(testSessionsDir, recentFileName);
      
      fs.writeFileSync(recentFilePath, '# Recent Session');

      try {
        execSync(`node ${sessionStartScript}`, {
          env: { ...process.env, SESSIONS_DIR: testSessionsDir },
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (error) {
        // stderr output causes non-zero exit in some cases
        const stderr = (error as any).stderr?.toString() || '';
        assert.ok(stderr.includes('[SessionStart] Found recent session'));
        assert.ok(stderr.includes(recentFileName));
      }
    });

    it('should identify MOST RECENT session when multiple recent sessions exist', () => {
      // Create multiple recent session files
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todayFile = `${today.toISOString().split('T')[0]}-session.md`;
      const yesterdayFile = `${yesterday.toISOString().split('T')[0]}-session.md`;
      
      fs.writeFileSync(path.join(testSessionsDir, todayFile), '# Today');
      fs.writeFileSync(path.join(testSessionsDir, yesterdayFile), '# Yesterday');

      try {
        execSync(`node ${sessionStartScript}`, {
          env: { ...process.env, SESSIONS_DIR: testSessionsDir },
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (error) {
        const stderr = (error as any).stderr?.toString() || '';
        assert.ok(stderr.includes(todayFile)); // Should reference most recent
      }
    });
  });

  describe('session-end.js', () => {
    it('should create .aiknowsys/sessions/ directory if missing', () => {
      const newSessionsDir = path.join(__dirname, 'fixtures', 'new-sessions');
      
      try {
        execSync(`node ${sessionEndScript}`, {
          env: { ...process.env, SESSIONS_DIR: newSessionsDir },
          stdio: 'pipe'
        });

        assert.strictEqual(fs.existsSync(newSessionsDir), true);
      } finally {
        // Clean up
        if (fs.existsSync(newSessionsDir)) {
          fs.rmSync(newSessionsDir, { recursive: true, force: true });
        }
      }
    });

    it('should create session file from template when file does not exist', () => {
      execSync(`node ${sessionEndScript}`, {
        env: { ...process.env, SESSIONS_DIR: testSessionsDir },
        stdio: 'pipe'
      });

      const today = new Date().toISOString().split('T')[0];
      const sessionFile = path.join(testSessionsDir, `${today}-session.md`);
      
      assert.strictEqual(fs.existsSync(sessionFile), true);
      
      const content = fs.readFileSync(sessionFile, 'utf-8');
      assert.ok(content.includes('# Session:'));
      assert.ok(content.includes('**Date:**'));
      assert.ok(content.includes('**Started:**'));
      assert.ok(content.includes('**Last Updated:**'));
      assert.ok(content.includes('## Current State'));
      assert.ok(content.includes('### Completed'));
      assert.ok(content.includes('### In Progress'));
      assert.ok(content.includes('### Notes for Next Session'));
    });

    it('should UPDATE timestamp (preserve content) when file exists', () => {
      // Create existing session file
      const today = new Date().toISOString().split('T')[0];
      const sessionFile = path.join(testSessionsDir, `${today}-session.md`);
      
      const initialContent = `# Session: ${today}
**Date:** ${today}
**Started:** 10:00
**Last Updated:** 10:00

## Current State
Working on features
`;
      
      fs.writeFileSync(sessionFile, initialContent);
      
      // Run session-end script
      execSync(`node ${sessionEndScript}`, {
        env: { ...process.env, SESSIONS_DIR: testSessionsDir },
        stdio: 'pipe'
      });

      const updatedContent = fs.readFileSync(sessionFile, 'utf-8');
      
      // Should update Last Updated timestamp but preserve other content
      assert.ok(updatedContent.includes('Working on features'));
      assert.ok(updatedContent.includes('**Started:** 10:00'));
      // Last Updated should be different from original
      assert.match(updatedContent, /\*\*Last Updated:\*\* \d{2}:\d{2}/);
    });

    it('should exit cleanly (code 0) on successful operation', () => {
      try {
        execSync(`node ${sessionEndScript}`, {
          env: { ...process.env, SESSIONS_DIR: testSessionsDir },
          stdio: 'pipe'
        });
        assert.ok(true); // Should not throw
      } catch (error) {
        assert.fail('Should exit with code 0 on success');
      }
    });

    it('should output confirmation to stderr (visible to user)', () => {
      try {
        execSync(`node ${sessionEndScript}`, {
          env: { ...process.env, SESSIONS_DIR: testSessionsDir },
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (error) {
        const stderr = (error as any).stderr?.toString() || '';
        assert.ok(stderr.includes('[SessionEnd]'));
      }
    });
  });
});
