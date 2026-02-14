import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SqliteStorage } from '../../lib/context/sqlite-storage.js';
import { findKnowledgeDb } from '../../lib/utils/find-knowledge-db.js';

describe('Database Error Messages (Phase 3 - Better Error Handling)', () => {
  // Use isolated temp directory outside project to prevent finding parent .aiknowsys/
  const testDir = path.join(os.tmpdir(), 'aiknowsys-test-error-handling-' + process.pid);
  
  beforeEach(async () => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });
  
  afterEach(() => {
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });
  
  describe('findKnowledgeDb error messages', () => {
    it('provides helpful error when database not found', () => {
      expect(() => {
        findKnowledgeDb(testDir);
      }).toThrow(/Database not found/);
      
      expect(() => {
        findKnowledgeDb(testDir);
      }).toThrow(/migrate-to-sqlite/);
      
      expect(() => {
        findKnowledgeDb(testDir);
      }).toThrow(/Troubleshooting/);
    });
    
    it('shows searched path in error message', () => {
      try {
        findKnowledgeDb(testDir);
        expect.fail('Should have thrown');
      } catch (error) {
        const err = error as Error;
        expect(err.message).toContain(testDir);
        expect(err.message).toContain('Searched from:');
      }
    });
    
    it('includes current working directory in error', () => {
      try {
        findKnowledgeDb(testDir);
        expect.fail('Should have thrown');
      } catch (error) {
        const err = error as Error;
        expect(err.message).toContain('Current directory:');
        expect(err.message).toContain(process.cwd());
      }
    });
  });
  
  describe('SqliteStorage error messages', () => {
    it('provides helpful error when database file is corrupted', async () => {
      const dbPath = path.join(testDir, '.aiknowsys', 'knowledge.db');
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      
      // Create a corrupted database file (invalid SQLite format)
      fs.writeFileSync(dbPath, 'This is not a valid SQLite database file');
      
      const storage = new SqliteStorage();
      
      try {
        await storage.init(dbPath);
        expect.fail('Should have thrown');
      } catch (error) {
        const err = error as Error;
        // Should wrap the error with context
        expect(err.message).toContain('database');
      }
    });
    
    it('provides helpful error when database permissions are wrong', async () => {
      // Skip on Windows (permission handling is different)
      if (process.platform === 'win32') {
        return;
      }
      
      const dbPath = path.join(testDir, '.aiknowsys', 'knowledge.db');
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      
      // Create database with valid SQLite format first
      const storage = new SqliteStorage();
      await storage.init(dbPath);
      await storage.close();
      
      // Make it unreadable
      fs.chmodSync(dbPath, 0o000);
      
      const storage2 = new SqliteStorage();
      
      try {
        await storage2.init(dbPath);
        expect.fail('Should have thrown');
      } catch (error) {
        const err = error as Error;
        // Should mention permissions
        expect(err.message.toLowerCase()).toMatch(/permission|access/);
      } finally {
        // Restore permissions for cleanup
        fs.chmodSync(dbPath, 0o644);
      }
    });
  });
  
  describe('Error message quality', () => {
    it('errors include actionable troubleshooting steps', () => {
      try {
        findKnowledgeDb(testDir);
        expect.fail('Should have thrown');
      } catch (error) {
        const err = error as Error;
        
        // Should have numbered steps
        expect(err.message).toMatch(/1\./);
        expect(err.message).toMatch(/2\./);
        
        // Should suggest concrete actions
        expect(err.message).toContain('migrate-to-sqlite');
        expect(err.message).toContain('project-root');
      }
    });
    
    it('errors show expected vs actual context', () => {
      try {
        findKnowledgeDb(testDir);
        expect.fail('Should have thrown');
      } catch (error) {
        const err = error as Error;
        
        // Should show what was searched
        expect(err.message).toContain('Searched from:');
        
        // Should show what was expected
        expect(err.message).toContain('Expected database location:');
      }
    });
  });
});

