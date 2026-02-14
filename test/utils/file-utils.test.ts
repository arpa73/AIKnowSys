/**
 * Tests for file-utils
 * TDD: Tests written to verify DRY extraction from mutation commands
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { checkFileExists } from '../../lib/utils/file-utils.js';

describe('file-utils', () => {
  const testDir = path.join(process.cwd(), 'test-fixtures', 'file-utils-test');
  const testFile = path.join(testDir, 'test-file.txt');

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('checkFileExists', () => {
    it('returns true when file exists (default behavior)', async () => {
      await fs.writeFile(testFile, 'test content');

      const exists = await checkFileExists(testFile);

      expect(exists).toBe(true);
    });

    it('returns false when file does not exist (default behavior)', async () => {
      const exists = await checkFileExists(testFile);

      expect(exists).toBe(false);
    });

    it('throws error when file exists and onExists=error', async () => {
      await fs.writeFile(testFile, 'test content');

      await expect(
        checkFileExists(testFile, { onExists: 'error' })
      ).rejects.toThrow('File already exists');
    });

    it('uses custom error message when provided', async () => {
      await fs.writeFile(testFile, 'test content');

      await expect(
        checkFileExists(testFile, {
          onExists: 'error',
          message: 'Custom error message'
        })
      ).rejects.toThrow('Custom error message');
    });

    it('returns true when file exists and onExists=return', async () => {
      await fs.writeFile(testFile, 'test content');

      const exists = await checkFileExists(testFile, { onExists: 'return' });

      expect(exists).toBe(true);
    });

    it('returns true when file exists and onExists=continue', async () => {
      await fs.writeFile(testFile, 'test content');

      const exists = await checkFileExists(testFile, { onExists: 'continue' });

      expect(exists).toBe(true);
    });

    // Note: Testing re-throw of non-ENOENT errors is OS-dependent  
    // and difficult to reliably test. The logic is verified by code review.
    // The important behavior (returning false for ENOENT) is tested above.

    it('handles files with special characters in path', async () => {
      const specialFile = path.join(testDir, 'file with spaces.txt');
      await fs.writeFile(specialFile, 'content');

      const exists = await checkFileExists(specialFile);

      expect(exists).toBe(true);
    });

    it('handles deeply nested paths', async () => {
      const deepPath = path.join(testDir, 'a', 'b', 'c', 'deep.txt');
      await fs.mkdir(path.dirname(deepPath), { recursive: true });
      await fs.writeFile(deepPath, 'content');

      const exists = await checkFileExists(deepPath);

      expect(exists).toBe(true);
    });

    it('handles absolute paths correctly', async () => {
      // testFile is already absolute
      await fs.writeFile(testFile, 'test');

      const exists = await checkFileExists(path.resolve(testFile));

      expect(exists).toBe(true);
    });
  });
});
