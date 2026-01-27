import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createLogger, logger } from '../lib/logger.js';

// Helper to capture console output
class ConsoleCapture {
  constructor() {
    this.logs = [];
    this.errors = [];
    this.originalLog = console.log;
    this.originalError = console.error;
  }

  start() {
    this.logs = [];
    this.errors = [];
    console.log = (...args) => {
      this.logs.push(args.join(' '));
    };
    console.error = (...args) => {
      this.errors.push(args.join(' '));
    };
  }

  stop() {
    console.log = this.originalLog;
    console.error = this.originalError;
  }

  getLogs() {
    return this.logs;
  }

  getErrors() {
    return this.errors;
  }

  hasLog(text) {
    return this.logs.some(log => log.includes(text));
  }

  hasError(text) {
    return this.errors.some(err => err.includes(text));
  }
}

describe('logger', () => {
  let capture;

  beforeEach(() => {
    capture = new ConsoleCapture();
  });

  after(() => {
    if (capture) capture.stop();
  });

  describe('createLogger', () => {
    it('should create a logger instance', () => {
      const log = createLogger();
      assert.ok(log, 'Logger instance should be created');
      assert.strictEqual(typeof log.log, 'function', 'Should have log method');
      assert.strictEqual(typeof log.error, 'function', 'Should have error method');
    });

    it('should create silent logger when silent=true', () => {
      capture.start();
      const log = createLogger(true);
      
      log.log('This should not appear');
      log.warn('This should not appear');
      log.info('This should not appear');
      
      capture.stop();
      assert.strictEqual(capture.getLogs().length, 0, 'Silent logger should not log');
    });

    it('should create non-silent logger when silent=false', () => {
      capture.start();
      const log = createLogger(false);
      
      log.log('This should appear');
      
      capture.stop();
      assert.ok(capture.hasLog('This should appear'), 'Non-silent logger should log');
    });
  });

  describe('log method', () => {
    it('should log plain messages when not silent', () => {
      capture.start();
      const log = createLogger(false);
      
      log.log('Test message');
      
      capture.stop();
      assert.ok(capture.hasLog('Test message'), 'Should log plain message');
    });

    it('should not log when silent', () => {
      capture.start();
      const log = createLogger(true);
      
      log.log('Test message');
      
      capture.stop();
      assert.strictEqual(capture.getLogs().length, 0, 'Should not log in silent mode');
    });
  });

  describe('error method', () => {
    it('should respect silent mode', () => {
      capture.start();
      const log = createLogger(true);
      
      log.error('Critical error');
      
      capture.stop();
      assert.strictEqual(capture.getLogs().length, 0, 'Errors should respect silent mode');
    });

    it('should format errors with ❌ icon when not silent', () => {
      capture.start();
      const log = createLogger(false);
      
      log.error('Something went wrong');
      
      capture.stop();
      assert.ok(capture.hasError('❌ Something went wrong'), 'Should format with ❌ icon');
    });
  });

  describe('warn method', () => {
    it('should log warnings with ⚠️ icon when not silent', () => {
      capture.start();
      const log = createLogger(false);
      
      log.warn('Warning message');
      
      capture.stop();
      assert.ok(capture.hasLog('⚠️'), 'Should include ⚠️ icon');
      assert.ok(capture.hasLog('Warning message'), 'Should include warning text');
    });

    it('should not log warnings when silent', () => {
      capture.start();
      const log = createLogger(true);
      
      log.warn('Warning message');
      
      capture.stop();
      assert.strictEqual(capture.getLogs().length, 0, 'Should not log warnings in silent mode');
    });
  });

  describe('info method', () => {
    it('should log info with ℹ️ icon when not silent', () => {
      capture.start();
      const log = createLogger(false);
      
      log.info('Info message');
      
      capture.stop();
      assert.ok(capture.hasLog('ℹ️'), 'Should include ℹ️ icon');
      assert.ok(capture.hasLog('Info message'), 'Should include info text');
    });

    it('should not log info when silent', () => {
      capture.start();
      const log = createLogger(true);
      
      log.info('Info message');
      
      capture.stop();
      assert.strictEqual(capture.getLogs().length, 0, 'Should not log info in silent mode');
    });
  });

  describe('success method', () => {
    it('should log success with ✅ icon when not silent', () => {
      capture.start();
      const log = createLogger(false);
      
      log.success('Success message');
      
      capture.stop();
      assert.ok(capture.hasLog('✅'), 'Should include ✅ icon');
      assert.ok(capture.hasLog('Success message'), 'Should include success text');
    });

    it('should not log success when silent', () => {
      capture.start();
      const log = createLogger(true);
      
      log.success('Success message');
      
      capture.stop();
      assert.strictEqual(capture.getLogs().length, 0, 'Should not log success in silent mode');
    });
  });

  describe('blank method', () => {
    it('should log blank lines when not silent', () => {
      capture.start();
      const log = createLogger(false);
      
      log.blank();
      
      capture.stop();
      assert.strictEqual(capture.getLogs().length, 1, 'Should log one blank line');
      assert.strictEqual(capture.getLogs()[0], '', 'Blank line should be empty string');
    });

    it('should not log blank lines when silent', () => {
      capture.start();
      const log = createLogger(true);
      
      log.blank();
      
      capture.stop();
      assert.strictEqual(capture.getLogs().length, 0, 'Should not log blank in silent mode');
    });
  });

  describe('header method', () => {
    it('should log header with default 🎯 icon', () => {
      capture.start();
      const log = createLogger(false);
      
      log.header('Test Header');
      
      capture.stop();
      assert.ok(capture.hasLog('🎯 Test Header'), 'Should include default icon and text');
      // Should have 3 lines: blank + header + blank
      assert.ok(capture.getLogs().length >= 3, 'Should log header with surrounding blanks');
    });

    it('should log header with custom icon', () => {
      capture.start();
      const log = createLogger(false);
      
      log.header('Custom Header', '🚀');
      
      capture.stop();
      assert.ok(capture.hasLog('🚀 Custom Header'), 'Should include custom icon');
    });

    it('should not log header when silent', () => {
      capture.start();
      const log = createLogger(true);
      
      log.header('Test Header');
      
      capture.stop();
      assert.strictEqual(capture.getLogs().length, 0, 'Should not log header in silent mode');
    });
  });

  describe('dim method', () => {
    it('should log dimmed text when not silent', () => {
      capture.start();
      const log = createLogger(false);
      
      log.dim('Dimmed text');
      
      capture.stop();
      assert.ok(capture.hasLog('Dimmed text'), 'Should log dimmed text');
    });

    it('should not log dimmed text when silent', () => {
      capture.start();
      const log = createLogger(true);
      
      log.dim('Dimmed text');
      
      capture.stop();
      assert.strictEqual(capture.getLogs().length, 0, 'Should not log dim in silent mode');
    });
  });

  describe('cyan method', () => {
    it('should log cyan text when not silent', () => {
      capture.start();
      const log = createLogger(false);
      
      log.cyan('Cyan text');
      
      capture.stop();
      assert.ok(capture.hasLog('Cyan text'), 'Should log cyan text');
    });

    it('should not log cyan text when silent', () => {
      capture.start();
      const log = createLogger(true);
      
      log.cyan('Cyan text');
      
      capture.stop();
      assert.strictEqual(capture.getLogs().length, 0, 'Should not log cyan in silent mode');
    });
  });

  describe('white method', () => {
    it('should log white text when not silent', () => {
      capture.start();
      const log = createLogger(false);
      
      log.white('White text');
      
      capture.stop();
      assert.ok(capture.hasLog('White text'), 'Should log white text');
    });

    it('should not log white text when silent', () => {
      capture.start();
      const log = createLogger(true);
      
      log.white('White text');
      
      capture.stop();
      assert.strictEqual(capture.getLogs().length, 0, 'Should not log white in silent mode');
    });
  });

  describe('section method', () => {
    it('should log section with default 📋 icon', () => {
      capture.start();
      const log = createLogger(false);
      
      log.section('Test Section');
      
      capture.stop();
      assert.ok(capture.hasLog('📋 Test Section:'), 'Should include default icon and colon');
    });

    it('should log section with custom icon', () => {
      capture.start();
      const log = createLogger(false);
      
      log.section('Custom Section', '📝');
      
      capture.stop();
      assert.ok(capture.hasLog('📝 Custom Section:'), 'Should include custom icon');
    });

    it('should not log section when silent', () => {
      capture.start();
      const log = createLogger(true);
      
      log.section('Test Section');
      
      capture.stop();
      assert.strictEqual(capture.getLogs().length, 0, 'Should not log section in silent mode');
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
      assert.ok(capture.hasLog('Should appear'), 'First message should appear');
      assert.ok(!capture.hasLog('Should not appear'), 'Middle message should not appear');
      assert.ok(capture.hasLog('Should appear again'), 'Last message should appear');
    });
  });

  describe('default logger instance', () => {
    it('should export a default non-silent logger', () => {
      assert.ok(logger, 'Default logger should exist');
      assert.strictEqual(logger.silent, false, 'Default logger should not be silent');
    });
  });
});
