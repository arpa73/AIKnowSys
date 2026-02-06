import { describe, it, expect } from 'vitest';
import { StorageAdapter } from '../../lib/context/storage-adapter.js';

describe('StorageAdapter (Base Interface)', () => {
  describe('abstract methods', () => {
    it('should throw when init() called directly on base class', async () => {
      const adapter = new StorageAdapter();
      await expect(adapter.init('/tmp')).rejects.toThrow('must be implemented');
    });

    it('should throw when queryPlans() called directly on base class', async () => {
      const adapter = new StorageAdapter();
      await expect(adapter.queryPlans({})).rejects.toThrow('must be implemented');
    });

    it('should throw when querySessions() called directly on base class', async () => {
      const adapter = new StorageAdapter();
      await expect(adapter.querySessions({})).rejects.toThrow('must be implemented');
    });

    it('should throw when search() called directly on base class', async () => {
      const adapter = new StorageAdapter();
      await expect(adapter.search('query', 'all')).rejects.toThrow('must be implemented');
    });

    it('should throw when rebuildIndex() called directly on base class', async () => {
      const adapter = new StorageAdapter();
      await expect(adapter.rebuildIndex()).rejects.toThrow('must be implemented');
    });

    it('should throw when close() called directly on base class', async () => {
      const adapter = new StorageAdapter();
      await expect(adapter.close()).rejects.toThrow('must be implemented');
    });
  });

  describe('interface contract', () => {
    it('should define all required methods', () => {
      const adapter = new StorageAdapter();
      
      expect(typeof adapter.init).toBe('function');
      expect(typeof adapter.queryPlans).toBe('function');
      expect(typeof adapter.querySessions).toBe('function');
      expect(typeof adapter.search).toBe('function');
      expect(typeof adapter.rebuildIndex).toBe('function');
      expect(typeof adapter.close).toBe('function');
    });
  });
});
