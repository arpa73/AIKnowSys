import { describe, it, afterAll, beforeEach, expect } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

// Import FileTracker from utils.js
let FileTracker: any;

describe('FileTracker', () => {
  let testDir: string;
  let tracker: any;

  beforeEach(async () => {
    // Create temporary test directory for each test
    testDir = path.join(os.tmpdir(), `filetracker-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    
    // Import FileTracker and create instance
    const utils = await import('../lib/utils.js');
    FileTracker = utils.FileTracker;
    tracker = new FileTracker();
  });

  afterAll(async () => {
    // Cleanup test directory
    if (testDir && await fs.access(testDir).then(() => true).catch(() => false)) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should create instance with empty tracking arrays', async () => {
      expect(tracker).toBeTruthy();
      expect(Array.isArray(tracker.createdFiles)).toBeTruthy();
      expect(Array.isArray(tracker.createdDirs)).toBeTruthy();
      expect(tracker.createdFiles.length).toBe(0);
      expect(tracker.createdDirs.length).toBe(0);
    });
  });

  describe('trackFile', () => {
    it('should add file path to createdFiles array', async () => {
      const filePath = path.join(testDir, 'test.txt');
      tracker.trackFile(filePath);
      
      expect(tracker.createdFiles.length).toBe(1);
      expect(tracker.createdFiles[0]).toBe(filePath);
    });

    it('should track multiple files in order', async () => {
      const file1 = path.join(testDir, 'file1.txt');
      const file2 = path.join(testDir, 'file2.txt');
      
      tracker.trackFile(file1);
      tracker.trackFile(file2);
      
      expect(tracker.createdFiles.length).toBe(2);
      expect(tracker.createdFiles[0]).toBe(file1);
      expect(tracker.createdFiles[1]).toBe(file2);
    });
  });

  describe('trackDir', () => {
    it('should add directory path to createdDirs array', async () => {
      const dirPath = path.join(testDir, 'subdir');
      tracker.trackDir(dirPath);
      
      expect(tracker.createdDirs.length).toBe(1);
      expect(tracker.createdDirs[0]).toBe(dirPath);
    });

    it('should track multiple directories in order', async () => {
      const dir1 = path.join(testDir, 'dir1');
      const dir2 = path.join(testDir, 'dir2');
      
      tracker.trackDir(dir1);
      tracker.trackDir(dir2);
      
      expect(tracker.createdDirs.length).toBe(2);
      expect(tracker.createdDirs[0]).toBe(dir1);
      expect(tracker.createdDirs[1]).toBe(dir2);
    });
  });

  describe('rollback', () => {
    it('should delete tracked files in reverse order', async () => {
      const file1 = path.join(testDir, 'file1.txt');
      const file2 = path.join(testDir, 'file2.txt');
      
      // Create actual files
      await fs.writeFile(file1, 'content1');
      await fs.writeFile(file2, 'content2');
      
      // Track them
      tracker.trackFile(file1);
      tracker.trackFile(file2);
      
      // Verify files exist
      expect(await fs.access(file1).then(() => true).catch(() => false)).toBeTruthy();
      expect(await fs.access(file2).then(() => true).catch(() => false)).toBeTruthy();
      
      // Rollback
      const mockLog = {
        warn: () => {},  // Silent mock logger
        info: () => {}
      };
      await tracker.rollback(mockLog);
      
      // Verify files are deleted
      expect(!await fs.access(file1).then(() => true).catch(() => false)).toBeTruthy();
      expect(!await fs.access(file2).then(() => true).catch(() => false)).toBeTruthy();
    });

    it('should delete tracked directories in reverse order if empty', async () => {
      const dir1 = path.join(testDir, 'dir1');
      const dir2 = path.join(testDir, 'dir2');
      
      // Create directories
      await fs.mkdir(dir1);
      await fs.mkdir(dir2);
      
      // Track them
      tracker.trackDir(dir1);
      tracker.trackDir(dir2);
      
      // Verify directories exist
      expect(await fs.access(dir1).then(() => true).catch(() => false)).toBeTruthy();
      expect(await fs.access(dir2).then(() => true).catch(() => false)).toBeTruthy();
      
      // Rollback
      const mockLog = {
        warn: () => {},
        info: () => {}
      };
      await tracker.rollback(mockLog);
      
      // Verify empty directories are deleted
      expect(!await fs.access(dir1).then(() => true).catch(() => false)).toBeTruthy();
      expect(!await fs.access(dir2).then(() => true).catch(() => false)).toBeTruthy();
    });

    it('should NOT delete directories that still contain files', async () => {
      const dir = path.join(testDir, 'dir-with-file');
      const file = path.join(dir, 'file.txt');
      
      // Create directory and file
      await fs.mkdir(dir);
      await fs.writeFile(file, 'content');
      
      // Track only directory (not the file inside)
      tracker.trackDir(dir);
      
      // Rollback
      const mockLog = {
        warn: () => {},
        info: () => {}
      };
      await tracker.rollback(mockLog);
      
      // Directory should still exist because it has a file
      expect(await fs.access(dir).then(() => true).catch(() => false)).toBeTruthy();
      expect(await fs.access(file).then(() => true).catch(() => false)).toBeTruthy();
      
      // Cleanup
      await fs.rm(dir, { recursive: true, force: true });
    });

    it('should handle non-existent files gracefully', async () => {
      const nonExistentFile = path.join(testDir, 'does-not-exist.txt');
      
      // Track file that was never created
      tracker.trackFile(nonExistentFile);
      
      // Rollback should not throw
      const mockLog = {
        warn: () => {},
        info: () => {}
      };
      
      await expect(tracker.rollback(mockLog)).resolves.not.toThrow();
    });

    it('should log each deletion', async () => {
      const file = path.join(testDir, 'log-test.txt');
      await fs.writeFile(file, 'content');
      tracker.trackFile(file);
      
      const logs: Array<{ level: string; msg: string }> = [];
      const mockLog = {
        warn: (msg: string) => logs.push({ level: 'warn', msg }),
        info: (msg: string) => logs.push({ level: 'info', msg })
      };
      
      await tracker.rollback(mockLog);
      
      // Should have logged the deletion
      expect(logs.length > 0).toBeTruthy();
      expect(logs.some(log => log.msg.includes('log-test.txt'))).toBeTruthy();
    });

    it('should delete files and directories together in correct order', async () => {
      const dir = path.join(testDir, 'combined-test');
      const file1 = path.join(dir, 'file1.txt');
      const file2 = path.join(dir, 'file2.txt');
      
      // Create directory and files
      await fs.mkdir(dir);
      await fs.writeFile(file1, 'content1');
      await fs.writeFile(file2, 'content2');
      
      // Track in order: dir, file1, file2
      tracker.trackDir(dir);
      tracker.trackFile(file1);
      tracker.trackFile(file2);
      
      // Rollback
      const mockLog = {
        warn: () => {},
        info: () => {}
      };
      await tracker.rollback(mockLog);
      
      // Files should be deleted first (reverse order)
      expect(!await fs.access(file2).then(() => true).catch(() => false)).toBeTruthy();
      expect(!await fs.access(file1).then(() => true).catch(() => false)).toBeTruthy();
      
      // Then empty directory should be deleted
      expect(!await fs.access(dir).then(() => true).catch(() => false)).toBeTruthy();
    });
  });
});
