import { describe, it, afterAll, beforeEach, expect } from 'vitest';
import { createLogger, logger } from '../lib/logger.js';

// Helper to capture console output
class ConsoleCapture {
  logs: string[];
  errors: string[];
  originalLog: typeof console.log;
  originalError: typeof console.error;

  constructor() {
    this.logs = [];
    this.errors = [];
    this.originalLog = console.log;
    this.originalError = console.error;
  }

  start(): void {
    this.logs = [];
    this.errors = [];
    console.log = (...args: unknown[]): void => {
      this.logs.push(args.join(' '));
    };
    console.error = (...args: unknown[]): void => {
      this.errors.push(args.join(' '));
    };
  }

  stop(): void {
    console.log = this.originalLog;
    console.error = this.originalError;
  }

  getLogs(): string[] {
    return this.logs;
  }

  getErrors(): string[] {
    return this.errors;
  }

  hasLog(text: string): boolean {
    return this.logs.some(log => log.includes(text));
  }

  hasError(text: string): boolean {
    return this.errors.some(err => err.includes(text));
  }
}

describe('logger', () => {
  let capture: ConsoleCapture;

  beforeEach(() => {
    capture = new ConsoleCapture();
  });

  afterAll(() => {
    if (capture) capture.stop();
  });

  describe('createLogger', () => {
    it('should create a logger instance', () => {
      const log = createLogger();
      expect(log).toBeTruthy();
      expect(typeof log.log).toBe('function');
      expect(typeof log.error).toBe('function');
    });

    it('should create silent logger when silent=true', () => {
      capture.start();
      const log = createLogger(true);
      
      log.log('This should not appear');
      log.warn('This should not appear');
      log.info('This should not appear');
      
      capture.stop();
      expect(capture.getLogs().length).toBe(0);
    });

    it('should create non-silent logger when silent=false', () => {
      capture.start();
      const log = createLogger(false);
      
      log.log('This should appear');
      
      capture.stop();
      expect(capture.hasLog('This should appear')).toBeTruthy();
    });
  });

  describe('log method', () => {
    it('should log plain messages when not silent', () => {
      capture.start();
      const log = createLogger(false);
      
      log.log('Test message');
      
      capture.stop();
      expect(capture.hasLog('Test message')).toBeTruthy();
    });

    it('should not log when silent', () => {
      capture.start();
      const log = createLogger(true);
      
      log.log('Test message');
      
      capture.stop();
      expect(capture.getLogs().length).toBe(0);
    });
  });

  describe('error method', () => {
    it('should respect silent mode', () => {
      capture.start();
      const log = createLogger(true);
      
      log.error('Critical error');
      
      capture.stop();
      expect(capture.getLogs().length).toBe(0);
    });

    it('should format errors with ❌ icon when not silent', () => {
      capture.start();
      const log = createLogger(false);
      
      log.error('Something went wrong');
      
      capture.stop();
      expect(capture.hasError('❌ Something went wrong')).toBeTruthy();
    });
  });

  describe('warn method', () => {
    it('should log warnings with ⚠️ icon when not silent', () => {
      capture.start();
      const log = createLogger(false);
      
      log.warn('Warning message');
      
      capture.stop();
      expect(capture.hasLog('⚠️')).toBeTruthy();
      expect(capture.hasLog('Warning message')).toBeTruthy();
    });

    it('should not log warnings when silent', () => {
      capture.start();
      const log = createLogger(true);
      
      log.warn('Warning message');
      
      capture.stop();
      expect(capture.getLogs().length).toBe(0);
    });
  });

  describe('info method', () => {
    it('should log info with ℹ️ icon when not silent', () => {
      capture.start();
      const log = createLogger(false);
      
      log.info('Info message');
      
      capture.stop();
      expect(capture.hasLog('ℹ️')).toBeTruthy();
      expect(capture.hasLog('Info message')).toBeTruthy();
    });

    it('should not log info when silent', () => {
      capture.start();
      const log = createLogger(true);
      
      log.info('Info message');
      
      capture.stop();
      expect(capture.getLogs().length).toBe(0);
    });
  });

  describe('success method', () => {
    it('should log success with ✅ icon when not silent', () => {
      capture.start();
      const log = createLogger(false);
      
      log.success('Success message');
      
      capture.stop();
      expect(capture.hasLog('✅')).toBeTruthy();
      expect(capture.hasLog('Success message')).toBeTruthy();
    });

    it('should not log success when silent', () => {
      capture.start();
      const log = createLogger(true);
      
      log.success('Success message');
      
      capture.stop();
      expect(capture.getLogs().length).toBe(0);
    });
  });

  describe('blank method', () => {
    it('should log blank lines when not silent', () => {
      capture.start();
      const log = createLogger(false);
      
      log.blank();
      
      capture.stop();
      expect(capture.getLogs().length).toBe(1);
      expect(capture.getLogs()[0]).toBe('');
    });

    it('should not log blank lines when silent', () => {
      capture.start();
      const log = createLogger(true);
      
      log.blank();
      
      capture.stop();
      expect(capture.getLogs().length).toBe(0);
    });
  });

  describe('header method', () => {
    it('should log header with default 🎯 icon', () => {
      capture.start();
      const log = createLogger(false);
      
      log.header('Test Header');
      
      capture.stop();
      expect(capture.hasLog('🎯 Test Header')).toBeTruthy();
      // Should have 3 lines: blank + header + blank
      expect(capture.getLogs().length >= 3).toBeTruthy();
    });

    it('should log header with custom icon', () => {
      capture.start();
      const log = createLogger(false);
      
      log.header('Custom Header', '🚀');
      
      capture.stop();
      expect(capture.hasLog('🚀 Custom Header')).toBeTruthy();
    });

    it('should not log header when silent', () => {
      capture.start();
      const log = createLogger(true);
      
      log.header('Test Header');
      
      capture.stop();
      expect(capture.getLogs().length).toBe(0);
    });
  });

  describe('dim method', () => {
    it('should log dimmed text when not silent', () => {
      capture.start();
      const log = createLogger(false);
      
      log.dim('Dimmed text');
      
      capture.stop();
      expect(capture.hasLog('Dimmed text')).toBeTruthy();
    });

    it('should not log dimmed text when silent', () => {
      capture.start();
      const log = createLogger(true);
      
      log.dim('Dimmed text');
      
      capture.stop();
      expect(capture.getLogs().length).toBe(0);
    });
  });

  describe('cyan method', () => {
    it('should log cyan text when not silent', () => {
      capture.start();
      const log = createLogger(false);
      
      log.cyan('Cyan text');
      
      capture.stop();
      expect(capture.hasLog('Cyan text')).toBeTruthy();
    });

    it('should not log cyan text when silent', () => {
      capture.start();
      const log = createLogger(true);
      
      log.cyan('Cyan text');
      
      capture.stop();
      expect(capture.getLogs().length).toBe(0);
    });
  });

  describe('white method', () => {
    it('should log white text when not silent', () => {
      capture.start();
      const log = createLogger(false);
      
      log.white('White text');
      
      capture.stop();
      expect(capture.hasLog('White text')).toBeTruthy();
    });

    it('should not log white text when silent', () => {
      capture.start();
      const log = createLogger(true);
      
      log.white('White text');
      
      capture.stop();
      expect(capture.getLogs().length).toBe(0);
    });
  });

  describe('section method', () => {
    it('should log section with default 📋 icon', () => {
      capture.start();
      const log = createLogger(false);
      
      log.section('Test Section');
      
      capture.stop();
      expect(capture.hasLog('📋 Test Section:')).toBeTruthy();
    });

    it('should log section with custom icon', () => {
      capture.start();
      const log = createLogger(false);
      
      log.section('Custom Section', '📝');
      
      capture.stop();
      expect(capture.hasLog('📝 Custom Section:')).toBeTruthy();
    });

    it('should not log section when silent', () => {
      capture.start();
      const log = createLogger(true);
      
      log.section('Test Section');
      
      capture.stop();
      expect(capture.getLogs().length).toBe(0);
    });
  });

  describe('setSilent method', () => {
    it('should dynamically change silent mode', () => {
      capture.start();
      const log = createLogger(false);
      
      log.log('Should appear');
      log.setSilent(true);
      log.log('Should not appear');
      log.setSilent(false);
      log.log('Should appear again');
      
      capture.stop();
      expect(capture.hasLog('Should appear')).toBeTruthy();
      expect(!capture.hasLog('Should not appear')).toBeTruthy();
      expect(capture.hasLog('Should appear again')).toBeTruthy();
    });
  });

  describe('default logger instance', () => {
    it('should export a default non-silent logger', () => {
      capture.start();
      
      expect(logger).toBeTruthy();
      logger.log('Test');
      
      capture.stop();
      expect(capture.hasLog('Test')).toBeTruthy();
    });
  });
});
