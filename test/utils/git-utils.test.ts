/**
 * Tests for git utilities
 * Phase B Mini - Context Query Completion
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { detectUsername } from '../../lib/utils/git-utils.js';

// Mock child_process
vi.mock('child_process');

describe('git-utils', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore environment variables
    delete process.env.USER;
    delete process.env.USERNAME;
  });

  describe('detectUsername', () => {
    it('returns git username when git config available', () => {
      vi.mocked(execSync).mockReturnValue('John Doe' as any);
      
      const username = detectUsername();
      
      expect(username).toBe('john-doe');
      expect(execSync).toHaveBeenCalledWith('git config user.name', { encoding: 'utf-8' });
    });

    it('converts spaces to hyphens', () => {
      vi.mocked(execSync).mockReturnValue('Arno Paffen' as any);
      
      const username = detectUsername();
      
      expect(username).toBe('arno-paffen');
    });

    it('handles multiple spaces', () => {
      vi.mocked(execSync).mockReturnValue('John  Multiple   Spaces' as any);
      
      const username = detectUsername();
      
      expect(username).toBe('john-multiple-spaces');
    });

    it('falls back to $USER when git not available', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('git not found');
      });
      process.env.USER = 'testuser';
      
      const username = detectUsername();
      
      expect(username).toBe('testuser');
    });

    it('falls back to $USERNAME when $USER not available', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('git not found');
      });
      delete process.env.USER;
      process.env.USERNAME = 'windowsuser';
      
      const username = detectUsername();
      
      expect(username).toBe('windowsuser');
    });

    it('returns "unknown" when no username sources available', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('git not found');
      });
      delete process.env.USER;
      delete process.env.USERNAME;
      
      const username = detectUsername();
      
      expect(username).toBe('unknown');
    });

    it('handles empty git username', () => {
      vi.mocked(execSync).mockReturnValue('   ' as any);
      process.env.USER = 'fallbackuser';
      
      const username = detectUsername();
      
      expect(username).toBe('fallbackuser');
    });
  });
});
