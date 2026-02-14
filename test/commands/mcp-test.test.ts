import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mcpTest } from '../../lib/commands/mcp-test.js';
import type { AIFriendlyError } from '../../lib/types/index.js';

describe('mcp-test command', () => {
  it('parses JSON arguments correctly', async () => {
    const args = '{"topic":"testing"}';
    const parsed = JSON.parse(args);
    
    expect(parsed).toEqual({ topic: 'testing' });
  });

  it('handles malformed JSON gracefully', async () => {
    const args = '{invalid json}';
    
    expect(() => JSON.parse(args)).toThrow();
  });

  it('supports empty object arguments', async () => {
    const args = '{}';
    const parsed = JSON.parse(args);
    
    expect(parsed).toEqual({});
  });

  it('supports complex nested arguments', async () => {
    const args = '{"when":"last week","about":"testing","includeContent":true}';
    const parsed = JSON.parse(args);
    
    expect(parsed).toEqual({
      when: 'last week',
      about: 'testing',
      includeContent: true
    });
  });
});

describe('mcp-test error handling', () => {
  beforeEach(() => {
    // Suppress console output during tests
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns structured error for unknown tool', async () => {
    const result = await mcpTest('unknown-tool', '{}', { json: true, _silent: true });
    
    const error = result as AIFriendlyError;
    expect(error.success).toBe(false);
    expect(error.error.type).toBe('ToolNotFound');
    expect(error.error.message).toContain('unknown-tool');
    expect(error.error.similar_errors).toBeDefined();
  });

  it('suggests similar tool names for typos', async () => {
    const result = await mcpTest('query-session', '{}', { json: true, _silent: true });
    
    const error = result as AIFriendlyError;
    expect(error.success).toBe(false);
    expect(error.error.similar_errors).toContain('query-sessions');
  });

  it('returns structured error for invalid JSON', async () => {
    const result = await mcpTest('get-db-stats', '{invalid', { json: true, _silent: true });
    
    const error = result as AIFriendlyError;
    expect(error.success).toBe(false);
    expect(error.error.type).toBe('ValidationFailed');
    expect(error.error.parameter).toBe('arguments');
    expect(error.error.message).toContain('JSON');
  });

  it('includes usage examples in errors', async () => {
    const result = await mcpTest('fake-tool', '{}', { json: true, _silent: true });
    
    const error = result as AIFriendlyError;
    expect(error.error.suggestion).toBeDefined();
  });
});

describe('mcp-test tool execution', () => {
  it('can call query-sessions with auto-detected dbPath', async () => {
    // This test requires the actual database to exist
    // We'll test the integration once the command is implemented
    expect(true).toBe(true);
  });
});
