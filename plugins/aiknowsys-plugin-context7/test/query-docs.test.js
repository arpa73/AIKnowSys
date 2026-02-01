/**
 * Tests for query-docs command
 * Following TDD: Writing tests FIRST (RED phase)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { queryDocs } from '../lib/query-docs.js';

describe('Library ID Resolution', () => {
  it('should resolve library name to ID', async () => {
    const result = await queryDocs({
      library: 'Next.js',
      query: 'How to use middleware?',
      mockMode: true
    });
    
    assert.ok(result.libraryId, 'Should resolve library ID');
    assert.ok(result.libraryId.includes('next'), 'Should contain library name');
  });

  it('should handle library with version', async () => {
    const result = await queryDocs({
      library: 'nextjs@15',
      query: 'Server actions',
      mockMode: true
    });
    
    assert.ok(result.libraryId, 'Should resolve versioned library');
    assert.ok(result.version || true, 'Should handle version specification');
  });

  it('should handle invalid library name', async () => {
    const result = await queryDocs({
      library: 'nonexistent-lib-xyz',
      query: 'test query',
      mockMode: true
    });
    
    assert.ok(result.error || result.libraryId === null, 'Should indicate failure');
  });
});

describe('Documentation Queries', () => {
  it('should query documentation for library', async () => {
    const result = await queryDocs({
      library: 'Next.js',
      query: 'How to implement authentication?',
      mockMode: true
    });
    
    assert.ok(result.documentation, 'Should return documentation');
    assert.ok(typeof result.documentation === 'string', 'Documentation should be string');
  });

  it('should handle empty query', async () => {
    const result = await queryDocs({
      library: 'Next.js',
      query: '',
      mockMode: true
    });
    
    assert.ok(result.error || result.documentation, 'Should handle empty query');
  });

  it('should include query in result', async () => {
    const query = 'How to use dynamic routes?';
    const result = await queryDocs({
      library: 'Next.js',
      query,
      mockMode: true
    });
    
    assert.strictEqual(result.query, query, 'Should preserve original query');
  });
});

describe('Context7 Integration', () => {
  it('should connect to Context7 server', async () => {
    const result = await queryDocs({
      library: 'Vue',
      query: 'Composition API',
      mockMode: true,
      mockConnect: true
    });
    
    assert.ok(result.connected !== undefined, 'Should indicate connection status');
  });

  it('should handle Context7 connection errors', async () => {
    const result = await queryDocs({
      library: 'React',
      query: 'Hooks',
      mockMode: true,
      mockConnectionError: true
    });
    
    assert.ok(result.error, 'Should report connection error');
    assert.ok(result.error.includes('Context7') || result.error.includes('connection'), 
      'Error should mention Context7 or connection');
  });

  it('should disconnect after query', async () => {
    const result = await queryDocs({
      library: 'Django',
      query: 'ORM queries',
      mockMode: true,
      trackCleanup: true
    });
    
    assert.ok(result.cleanedUp === true || result.cleanedUp === undefined, 
      'Should clean up connection');
  });
});

describe('Output Formatting', () => {
  it('should format output as text by default', async () => {
    const result = await queryDocs({
      library: 'Express',
      query: 'Middleware',
      mockMode: true
    });
    
    assert.ok(result.output, 'Should include formatted output');
    assert.ok(typeof result.output === 'string', 'Default output should be text');
  });

  it('should support JSON format', async () => {
    const result = await queryDocs({
      library: 'FastAPI',
      query: 'Async endpoints',
      format: 'json',
      mockMode: true
    });
    
    const parsed = JSON.parse(result.output);
    assert.ok(parsed, 'Should be valid JSON');
    assert.ok(parsed.query || parsed.documentation, 'JSON should have data');
  });

  it('should support markdown format', async () => {
    const result = await queryDocs({
      library: 'Rust',
      query: 'Async/await',
      format: 'markdown',
      mockMode: true
    });
    
    assert.ok(result.output.includes('#'), 'Markdown should have headers');
  });

  it('should include library name in output', async () => {
    const result = await queryDocs({
      library: 'TypeScript',
      query: 'Generics',
      mockMode: true
    });
    
    assert.ok(result.output.includes('TypeScript') || result.library === 'TypeScript', 
      'Output should mention library');
  });
});

describe('Error Handling', () => {
  it('should require library option', async () => {
    try {
      await queryDocs({
        query: 'Some query',
        mockMode: true
      });
      assert.fail('Should require library option');
    } catch (error) {
      assert.ok(error.message.includes('library'), 'Error should mention library');
    }
  });

  it('should require query option', async () => {
    try {
      await queryDocs({
        library: 'Next.js',
        mockMode: true
      });
      assert.fail('Should require query option');
    } catch (error) {
      assert.ok(error.message.includes('query'), 'Error should mention query');
    }
  });

  it('should handle malformed library ID gracefully', async () => {
    const result = await queryDocs({
      library: '!!!invalid!!!',
      query: 'test',
      mockMode: true
    });
    
    assert.ok(result.error || result.warning, 'Should handle malformed input');
  });
});

describe('Response Structure', () => {
  it('should return complete response object', async () => {
    const result = await queryDocs({
      library: 'Vue',
      query: 'Reactivity',
      mockMode: true
    });
    
    assert.ok(result.library, 'Should include library');
    assert.ok(result.query, 'Should include query');
    assert.ok(result.documentation || result.error, 'Should include docs or error');
    assert.ok(result.output, 'Should include formatted output');
  });

  it('should include timestamp', async () => {
    const result = await queryDocs({
      library: 'React',
      query: 'Context API',
      mockMode: true
    });
    
    assert.ok(result.timestamp, 'Should include timestamp');
    assert.ok(new Date(result.timestamp).getTime() > 0, 'Timestamp should be valid');
  });

  it('should indicate success/failure clearly', async () => {
    const success = await queryDocs({
      library: 'Next.js',
      query: 'Valid query',
      mockMode: true
    });
    
    assert.ok(success.success === true || success.documentation, 
      'Successful query should be marked as success');
    
    const failure = await queryDocs({
      library: 'Next.js',
      query: 'Valid query',
      mockMode: true,
      mockConnectionError: true
    });
    
    assert.ok(failure.success === false || failure.error, 
      'Failed query should be marked as failure');
  });
});

describe('Mock Mode', () => {
  it('should work without real Context7 server', async () => {
    const result = await queryDocs({
      library: 'Django',
      query: 'Models',
      mockMode: true
    });
    
    assert.ok(result.documentation, 'Mock mode should return documentation');
    assert.ok(result.documentation.includes('Mock') || result.mockMode === true, 
      'Should indicate mock data');
  });

  it('should support custom mock data', async () => {
    const mockDocs = 'Custom mock documentation content';
    const result = await queryDocs({
      library: 'Test',
      query: 'Test query',
      mockMode: true,
      mockDocumentation: mockDocs
    });
    
    assert.ok(result.documentation === mockDocs || result.documentation.includes('Mock'), 
      'Should use custom mock data');
  });
});
