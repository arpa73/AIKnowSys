/**
 * Tests for error-helpers.ts
 * Validates structured error handling with helpful suggestions
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AIKnowSysError, ErrorTemplates } from '../lib/error-helpers.js';

interface LogEntry {
  type: string;
  msg?: string;
}

interface MockLogger {
  error: (msg: string) => void;
  info: (msg: string) => void;
  white: (msg: string) => void;
  cyan: (msg: string) => void;
  blank: () => void;
}

describe('AIKnowSysError', () => {
  it('should create error with message, suggestion, and learn more link', () => {
    const error = new AIKnowSysError(
      'Test error',
      'Fix it this way',
      'https://example.com/docs'
    );
    
    assert.strictEqual(error.message, 'Test error');
    assert.strictEqual(error.suggestion, 'Fix it this way');
    assert.strictEqual(error.learnMore, 'https://example.com/docs');
    assert.strictEqual(error.name, 'AIKnowSysError');
  });
  
  it('should work without learn more link', () => {
    const error = new AIKnowSysError(
      'Test error',
      'Fix it this way'
    );
    
    assert.strictEqual(error.message, 'Test error');
    assert.strictEqual(error.suggestion, 'Fix it this way');
    assert.strictEqual(error.learnMore, null);
  });
  
  it('should be instanceof Error', () => {
    const error = new AIKnowSysError('Test', 'Fix');
    assert.ok(error instanceof Error);
    assert.ok(error instanceof AIKnowSysError);
  });
  
  it('should format error with logger', () => {
    const logs: LogEntry[] = [];
    const mockLog: MockLogger = {
      error: (msg: string) => logs.push({ type: 'error', msg }),
      info: (msg: string) => logs.push({ type: 'info', msg }),
      white: (msg: string) => logs.push({ type: 'white', msg }),
      cyan: (msg: string) => logs.push({ type: 'cyan', msg }),
      blank: () => logs.push({ type: 'blank' })
    };
    
    const error = new AIKnowSysError(
      'File not found',
      'Run: aiknowsys init',
      'https://docs.example.com'
    );
    
    error.format(mockLog);
    
    // Should have error, suggestion, and learn more
    assert.ok(logs.some(l => l.type === 'error' && l.msg === 'File not found'));
    assert.ok(logs.some(l => l.type === 'info' && l.msg === '💡 How to fix:'));
    assert.ok(logs.some(l => l.type === 'white' && l.msg?.includes('aiknowsys init')));
    assert.ok(logs.some(l => l.type === 'cyan' && l.msg?.includes('https://docs.example.com')));
  });
  
  it('should convert to plain text', () => {
    const error = new AIKnowSysError(
      'Test error',
      'Fix suggestion',
      'https://example.com'
    );
    
    const text = error.toPlainText();
    
    assert.ok(text.includes('✗ Test error'));
    assert.ok(text.includes('💡 How to fix:'));
    assert.ok(text.includes('Fix suggestion'));
    assert.ok(text.includes('📚 Learn more:'));
    assert.ok(text.includes('https://example.com'));
  });
  
  it('should handle multi-line suggestions', () => {
    const logs: LogEntry[] = [];
    const mockLog: MockLogger = {
      error: (msg: string) => logs.push({ type: 'error', msg }),
      info: (msg: string) => logs.push({ type: 'info', msg }),
      white: (msg: string) => logs.push({ type: 'white', msg }),
      cyan: (msg: string) => logs.push({ type: 'cyan', msg }),
      blank: () => logs.push({ type: 'blank' })
    };
    
    const error = new AIKnowSysError(
      'Multiple issues',
      'Line 1\nLine 2\nLine 3'
    );
    
    error.format(mockLog);
    
    const whiteLines = logs.filter(l => l.type === 'white');
    assert.strictEqual(whiteLines.length, 3);
    assert.ok(whiteLines[0].msg?.includes('Line 1'));
    assert.ok(whiteLines[1].msg?.includes('Line 2'));
    assert.ok(whiteLines[2].msg?.includes('Line 3'));
  });
});

describe('ErrorTemplates', () => {
  describe('fileNotFound', () => {
    it('should create file not found error with default suggestions', () => {
      const error = ErrorTemplates.fileNotFound('CODEBASE_ESSENTIALS.md');
      
      assert.ok(error instanceof AIKnowSysError);
      assert.ok(error.message.includes('CODEBASE_ESSENTIALS.md not found'));
      assert.ok(error.suggestion.includes('aiknowsys scan'));
      assert.ok(error.suggestion.includes('aiknowsys init'));
      assert.ok(error.learnMore && error.learnMore.includes('github.com'));
    });
    
    it('should accept custom suggestions', () => {
      const error = ErrorTemplates.fileNotFound(
        'custom.md',
        ['custom command 1', 'custom command 2']
      );
      
      assert.ok(error.suggestion.includes('custom command 1'));
      assert.ok(error.suggestion.includes('custom command 2'));
      assert.ok(!error.suggestion.includes('aiknowsys scan'));
    });
  });
  
  describe('emptyFile', () => {
    it('should create empty file error', () => {
      const error = ErrorTemplates.emptyFile('AGENTS.md');
      
      assert.ok(error.message.includes('AGENTS.md'));
      assert.ok(error.message.includes('empty'));
      assert.ok(error.suggestion.includes('aiknowsys scan'));
      assert.ok(error.learnMore);
    });
  });
  
  describe('fileTooLarge', () => {
    it('should create file too large error with size', () => {
      const error = ErrorTemplates.fileTooLarge('HUGE.md', 75.5);
      
      assert.ok(error.message.includes('HUGE.md'));
      assert.ok(error.message.includes('75.5MB'));
      assert.ok(error.suggestion.includes('Split content'));
      assert.ok(error.learnMore);
    });
  });
  
  describe('missingSection', () => {
    it('should create missing section error', () => {
      const error = ErrorTemplates.missingSection(
        'Validation Matrix',
        'CODEBASE_ESSENTIALS.md'
      );
      
      assert.ok(error.message.includes('Validation Matrix'));
      assert.ok(error.message.includes('CODEBASE_ESSENTIALS.md'));
      assert.ok(error.suggestion.includes('aiknowsys update'));
      assert.ok(error.learnMore);
    });
  });
  
  describe('validationFailed', () => {
    it('should create validation failed error with count', () => {
      const error = ErrorTemplates.validationFailed(3);
      
      assert.ok(error.message.includes('3 check(s) failed'));
      assert.ok(error.suggestion.includes('aiknowsys check'));
      assert.ok(error.learnMore);
    });
    
    it('should include failure list when provided', () => {
      const error = ErrorTemplates.validationFailed(2, [
        'Missing AGENTS.md',
        'Empty CHANGELOG.md'
      ]);
      
      assert.ok(error.suggestion.includes('Missing AGENTS.md'));
      assert.ok(error.suggestion.includes('Empty CHANGELOG.md'));
    });
  });
  
  describe('noKnowledgeSystem', () => {
    it('should create no knowledge system error', () => {
      const error = ErrorTemplates.noKnowledgeSystem();
      
      assert.ok(error.message.includes('No knowledge system found'));
      assert.ok(error.suggestion.includes('aiknowsys init'));
      assert.ok(error.suggestion.includes('aiknowsys migrate'));
      assert.ok(error.learnMore);
    });
  });
});
