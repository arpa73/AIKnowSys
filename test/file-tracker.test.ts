import { describe, it, after, beforeEach } from 'node:test';
import * as assert from 'node:assert/strict';
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

  after(async () => {
    // Cleanup test directory
    if (testDir && await fs.access(testDir).then(() => true).catch(() => false)) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should create instance with empty tracking arrays', async () => {
      assert.ok(tracker, 'FileTracker should be instantiated');
      assert.ok(Array.isArray(tracker.createdFiles), 'Should have createdFiles array');
      assert.ok(Array.isArray(tracker.createdDirs), 'Should have createdDirs array');
      assert.strictEqual(tracker.createdFiles.length, 0, 'Should start with no tracked files');
      assert.strictEqual(tracker.createdDirs.length, 0, 'Should start with no tracked dirs');
    });
  });

  describe('trackFile', () => {
    it('should add file path to createdFiles array', async () => {
      const filePath = path.join(testDir, 'test.txt');
      tracker.trackFile(filePath);
      
      assert.strictEqual(tracker.createdFiles.length, 1, 'Should have 1 tracked file');
      assert.strictEqual(tracker.createdFiles[0], filePath, 'Should track correct file path');
    });

    it('should track multiple files in order', async () => {
      const file1 = path.join(testDir, 'file1.txt');
      const file2 = path.join(testDir, 'file2.txt');
      
      tracker.trackFile(file1);
      tracker.trackFile(file2);
      
      assert.strictEqual(tracker.createdFiles.length, 2, 'Should track 2 files');
      assert.strictEqual(tracker.createdFiles[0], file1, 'First file should be file1');
      assert.strictEqual(tracker.createdFiles[1], file2, 'Second file should be file2');
    });
  });

  describe('trackDir', () => {
    it('should add directory path to createdDirs array', async () => {
      const dirPath = path.join(testDir, 'subdir');
      tracker.trackDir(dirPath);
      
      assert.strictEqual(tracker.createdDirs.length, 1, 'Should have 1 tracked directory');
      assert.strictEqual(tracker.createdDirs[0], dirPath, 'Should track correct directory path');
    });

    it('should track multiple directories in order', async () => {
      const dir1 = path.join(testDir, 'dir1');
      const dir2 = path.join(testDir, 'dir2');
      
      tracker.trackDir(dir1);
      tracker.trackDir(dir2);
      
      assert.strictEqual(tracker.createdDirs.length, 2, 'Should track 2 directories');
      assert.strictEqual(tracker.createdDirs[0], dir1, 'First dir should be dir1');
      assert.strictEqual(tracker.createdDirs[1], dir2, 'Second dir should be dir2');
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
      assert.ok(await fs.access(file1).then(() => true).catch(() => false), 'file1 should exist');
      assert.ok(await fs.access(file2).then(() => true).catch(() => false), 'file2 should exist');
      
      // Rollback
      const mockLog = {
        warn: () => {},  // Silent mock logger
        info: () => {}
      };
      await tracker.rollback(mockLog);
      
      // Verify files are deleted
      assert.ok(!await fs.access(file1).then(() => true).catch(() => false), 'file1 should be deleted');
      assert.ok(!await fs.access(file2).then(() => true).catch(() => false), 'file2 should be deleted');
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
      assert.ok(await fs.access(dir1).then(() => true).catch(() => false), 'dir1 should exist');
      assert.ok(await fs.access(dir2).then(() => true).catch(() => false), 'dir2 should exist');
      
      // Rollback
      const mockLog = {
        warn: () => {},
        info: () => {}
      };
      await tracker.rollback(mockLog);
      
      // Verify empty directories are deleted
      assert.ok(!await fs.access(dir1).then(() => true).catch(() => false), 'dir1 should be deleted');
      assert.ok(!await fs.access(dir2).then(() => true).catch(() => false), 'dir2 should be deleted');
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
      assert.ok(await fs.access(dir).then(() => true).catch(() => false), 'dir should still exist');
      assert.ok(await fs.access(file).then(() => true).catch(() => false), 'file should still exist');
      
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
      
      await assert.doesNotReject(
        async () => await tracker.rollback(mockLog),
        'Should handle missing files gracefully'
      );
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
      assert.ok(logs.length > 0, 'Should have logged something');
      assert.ok(
        logs.some(log => log.msg.includes('log-test.txt')),
        'Should log file name being deleted'
      );
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
      assert.ok(!await fs.access(file2).then(() => true).catch(() => false), 'file2 deleted');
      assert.ok(!await fs.access(file1).then(() => true).catch(() => false), 'file1 deleted');
      
      // Then empty directory should be deleted
      assert.ok(!await fs.access(dir).then(() => true).catch(() => false), 'dir deleted');
    });
  });
});
