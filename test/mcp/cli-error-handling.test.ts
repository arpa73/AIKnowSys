import { describe, it, expect } from 'vitest';
import { handleCLIError } from '../../mcp-server/src/tools/utils/error-helpers.js';

describe('CLI Error Handling', () => {
  describe('handleCLIError', () => {
    it('should handle "unknown option" errors', () => {
      const error = new Error('error: unknown option \'--appendSection\'');
      const result = handleCLIError(error, 'appending to session');
      
      expect(result).not.toBeNull();
      expect(result?.isError).toBe(true);
      expect(result?.content[0].text).toContain('InvalidParameter');
      expect(result?.content[0].text).toContain('dash-case');
    });

    it('should handle "required option" errors', () => {
      const error = new Error('error: required option \'--content\' not specified');
      const result = handleCLIError(error, 'updating session');
      
      expect(result).not.toBeNull();
      expect(result?.isError).toBe(true);
      expect(result?.content[0].text).toContain('MissingRequired');
      expect(result?.content[0].text).toContain('content');
    });

    it('should handle "invalid argument" errors', () => {
      const error = new Error('error: invalid argument \'foo\' for option \'--date\'');
      const result = handleCLIError(error, 'creating session');
      
      expect(result).not.toBeNull();
      expect(result?.isError).toBe(true);
      expect(result?.content[0].text).toContain('ValidationFailed');
    });

    it('should handle database not found errors', () => {
      const error = new Error('ENOENT: database file not found at /path/to/db.sqlite');
      const result = handleCLIError(error, 'querying sessions');
      
      expect(result).not.toBeNull();
      expect(result?.isError).toBe(true);
      expect(result?.content[0].text).toContain('DatabaseError');
      expect(result?.content[0].text).toContain('migrate-to-sqlite');
    });

    it('should handle file not found errors', () => {
      const error = new Error('ENOENT: no such file or directory \'/path/to/file.md\'');
      const result = handleCLIError(error, 'reading session');
      
      expect(result).not.toBeNull();
      expect(result?.isError).toBe(true);
      expect(result?.content[0].text).toContain('FileSystemError');
    });

    it('should return null for unrecognized errors', () => {
      const error = new Error('Some random error message');
      const result = handleCLIError(error, 'doing something');
      
      expect(result).toBeNull();
    });

    it('should handle non-Error objects', () => {
      const result = handleCLIError('not an error', 'doing something');
      
      expect(result).toBeNull();
    });
  });
});
