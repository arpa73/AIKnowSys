/**
 * Tests for error-helpers.ts
 * Validates structured error handling with helpful suggestions
 */

import { describe, it, expect } from 'vitest';
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
    
    expect(error.message).toBe('Test error');
    expect(error.suggestion).toBe('Fix it this way');
    expect(error.learnMore).toBe('https://example.com/docs');
    expect(error.name).toBe('AIKnowSysError');
  });
  
  it('should work without learn more link', () => {
    const error = new AIKnowSysError(
      'Test error',
      'Fix it this way'
    );
    
    expect(error.message).toBe('Test error');
    expect(error.suggestion).toBe('Fix it this way');
    expect(error.learnMore).toBe(null);
  });
  
  it('should be instanceof Error', () => {
    const error = new AIKnowSysError('Test', 'Fix');
    expect(error instanceof Error).toBeTruthy();
    expect(error instanceof AIKnowSysError).toBeTruthy();
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
    expect(logs.some(l => l.type === 'error' && l.msg === 'File not found')).toBeTruthy();
    expect(logs.some(l => l.type === 'info' && l.msg === '💡 How to fix:')).toBeTruthy();
    expect(logs.some(l => l.type === 'white' && l.msg?.includes('aiknowsys init'))).toBeTruthy();
    expect(logs.some(l => l.type === 'cyan' && l.msg?.includes('https://docs.example.com'))).toBeTruthy();
  });
  
  it('should convert to plain text', () => {
    const error = new AIKnowSysError(
      'Test error',
      'Fix suggestion',
      'https://example.com'
    );
    
    const text = error.toPlainText();
    
    expect(text.includes('✗ Test error')).toBeTruthy();
    expect(text.includes('💡 How to fix:')).toBeTruthy();
    expect(text.includes('Fix suggestion')).toBeTruthy();
    expect(text.includes('📚 Learn more:')).toBeTruthy();
    expect(text.includes('https://example.com')).toBeTruthy();
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
    expect(whiteLines.length).toBe(3);
    expect(whiteLines[0].msg?.includes('Line 1')).toBeTruthy();
    expect(whiteLines[1].msg?.includes('Line 2')).toBeTruthy();
    expect(whiteLines[2].msg?.includes('Line 3')).toBeTruthy();
  });
});

describe('ErrorTemplates', () => {
  describe('fileNotFound', () => {
    it('should create file not found error with default suggestions', () => {
      const error = ErrorTemplates.fileNotFound('CODEBASE_ESSENTIALS.md');
      
      expect(error instanceof AIKnowSysError).toBeTruthy();
      expect(error.message.includes('CODEBASE_ESSENTIALS.md not found')).toBeTruthy();
      expect(error.suggestion.includes('aiknowsys scan')).toBeTruthy();
      expect(error.suggestion.includes('aiknowsys init')).toBeTruthy();
      expect(error.learnMore && error.learnMore.includes('github.com')).toBeTruthy();
    });
    
    it('should accept custom suggestions', () => {
      const error = ErrorTemplates.fileNotFound(
        'custom.md',
        ['custom command 1', 'custom command 2']
      );
      
      expect(error.suggestion.includes('custom command 1')).toBeTruthy();
      expect(error.suggestion.includes('custom command 2')).toBeTruthy();
      expect(!error.suggestion.includes('aiknowsys scan')).toBeTruthy();
    });
  });
  
  describe('emptyFile', () => {
    it('should create empty file error', () => {
      const error = ErrorTemplates.emptyFile('AGENTS.md');
      
      expect(error.message.includes('AGENTS.md')).toBeTruthy();
      expect(error.message.includes('empty')).toBeTruthy();
      expect(error.suggestion.includes('aiknowsys scan')).toBeTruthy();
      expect(error.learnMore).toBeTruthy();
    });
  });
  
  describe('fileTooLarge', () => {
    it('should create file too large error with size', () => {
      const error = ErrorTemplates.fileTooLarge('HUGE.md', 75.5);
      
      expect(error.message.includes('HUGE.md')).toBeTruthy();
      expect(error.message.includes('75.5MB')).toBeTruthy();
      expect(error.suggestion.includes('Split content')).toBeTruthy();
      expect(error.learnMore).toBeTruthy();
    });
  });
  
  describe('missingSection', () => {
    it('should create missing section error', () => {
      const error = ErrorTemplates.missingSection(
        'Validation Matrix',
        'CODEBASE_ESSENTIALS.md'
      );
      
      expect(error.message.includes('Validation Matrix')).toBeTruthy();
      expect(error.message.includes('CODEBASE_ESSENTIALS.md')).toBeTruthy();
      expect(error.suggestion.includes('aiknowsys update')).toBeTruthy();
      expect(error.learnMore).toBeTruthy();
    });
  });
  
  describe('validationFailed', () => {
    it('should create validation failed error with count', () => {
      const error = ErrorTemplates.validationFailed(3);
      
      expect(error.message.includes('3 check(s) failed')).toBeTruthy();
      expect(error.suggestion.includes('aiknowsys check')).toBeTruthy();
      expect(error.learnMore).toBeTruthy();
    });
    
    it('should include failure list when provided', () => {
      const error = ErrorTemplates.validationFailed(2, [
        'Missing AGENTS.md',
        'Empty CHANGELOG.md'
      ]);
      
      expect(error.suggestion.includes('Missing AGENTS.md')).toBeTruthy();
      expect(error.suggestion.includes('Empty CHANGELOG.md')).toBeTruthy();
    });
  });
  
  describe('noKnowledgeSystem', () => {
    it('should create no knowledge system error', () => {
      const error = ErrorTemplates.noKnowledgeSystem();
      
      expect(error.message.includes('No knowledge system found')).toBeTruthy();
      expect(error.suggestion.includes('aiknowsys init')).toBeTruthy();
      expect(error.suggestion.includes('aiknowsys migrate')).toBeTruthy();
      expect(error.learnMore).toBeTruthy();
    });
  });
});
