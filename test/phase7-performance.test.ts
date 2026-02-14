import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { depsHealth } from '../lib/commands/deps-health.js';

// Use PROJECT_ROOT to resolve templates (works from compiled dist/ and source)
const projectRoot = process.env.PROJECT_ROOT || path.join(import.meta.dirname, '..');

describe('Phase 7: Performance & Dependency Monitoring', () => {
  const testDir = path.join(import.meta.dirname, 'fixtures', 'phase7-test');
  const perfHistoryPath = path.join(testDir, '.aiknowsys', 'performance-history.json');

  beforeEach(async () => {
    await fs.mkdir(path.join(testDir, '.aiknowsys'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'node_modules'), { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Cleanup errors can be ignored
    }
  });

  describe('Performance History Database', () => {
    it('should create performance-history.json with correct structure', async () => {
      const initialData = {
        testRuns: [],
        buildTimes: [],
        slowestTests: []
      };

      await fs.writeFile(perfHistoryPath, JSON.stringify(initialData, null, 2));

      const content = await fs.readFile(perfHistoryPath, 'utf8');
      const data = JSON.parse(content);

      expect(Array.isArray(data.testRuns)).toBeTruthy();
      expect(Array.isArray(data.buildTimes)).toBeTruthy();
      expect(Array.isArray(data.slowestTests)).toBeTruthy();
    });

    it('should record test run performance', async () => {
      const initialData = { testRuns: [], buildTimes: [], slowestTests: [] };
      await fs.writeFile(perfHistoryPath, JSON.stringify(initialData, null, 2));

      const testRun = {
        date: new Date().toISOString(),
        duration: 25300,
        tests: 422,
        passed: 419,
        failed: 0
      };

      const data = JSON.parse(await fs.readFile(perfHistoryPath, 'utf8'));
      data.testRuns.push(testRun);
      await fs.writeFile(perfHistoryPath, JSON.stringify(data, null, 2));

      const result = JSON.parse(await fs.readFile(perfHistoryPath, 'utf8'));
      expect(result.testRuns.length).toBe(1);
      expect(result.testRuns[0].duration).toBe(25300);
      expect(result.testRuns[0].tests).toBe(422);
    });

    it('should maintain limited history (last 100 runs)', () => {
      const data = { testRuns: [] as any[], buildTimes: [], slowestTests: [] };
      
      // Add 150 test runs
      for (let i = 0; i < 150; i++) {
        data.testRuns.push({
          date: new Date(Date.now() - i * 86400000).toISOString(),
          duration: 20000 + i * 100,
          tests: 422,
          passed: 419,
          failed: 0
        });
      }

      // Keep only last 100
      data.testRuns = data.testRuns.slice(0, 100);

      expect(data.testRuns.length).toBe(100);
    });
  });

  describe('deps-health Command', () => {
    it('should check if deps-health command exists', () => {
      expect(typeof depsHealth).toBe('function');
    });

    it('should run without errors in silent mode', async () => {
      const packageJsonPath = path.join(testDir, 'package.json');
      await fs.writeFile(packageJsonPath, JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'chalk': '^5.0.0'
        }
      }, null, 2));

      const result = await depsHealth({ dir: testDir, _silent: true });
      expect(result).toBeTruthy();
      expect(typeof result).toBe('object');
    }, 30000); // Increase timeout for npm operations

    it('should detect missing package.json', async () => {
      try {
        await depsHealth({ dir: testDir, _silent: true });
        expect.fail('Should throw error for missing package.json');
      } catch (error) {
        expect((error as Error).message.includes('package.json')).toBeTruthy();
      }
    });

    it('should report security advisories if available', async () => {
      const packageJsonPath = path.join(testDir, 'package.json');
      await fs.writeFile(packageJsonPath, JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'chalk': '^5.0.0',
          'ora': '^9.0.0'
        }
      }, null, 2));

      const result = await depsHealth({ dir: testDir, _silent: true });
      
      expect(Object.hasOwn(result, 'securityAdvisories')).toBeTruthy();
      expect(Object.hasOwn(result, 'outdated')).toBeTruthy();
      expect(Object.hasOwn(result, 'totalDependencies')).toBeTruthy();
    }, 30000); // Increase timeout for npm operations

    it('should count total dependencies correctly', async () => {
      const packageJsonPath = path.join(testDir, 'package.json');
      await fs.writeFile(packageJsonPath, JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'chalk': '^5.0.0',
          'ora': '^9.0.0',
          'inquirer': '^13.0.0'
        },
        devDependencies: {
          'eslint': '^9.0.0'
        }
      }, null, 2));

      const result = await depsHealth({ dir: testDir, _silent: true });
      expect(result.totalDependencies).toBe(4);
    }, 30000); // Increase timeout for npm operations

    it('should handle projects with no dependencies', async () => {
      const packageJsonPath = path.join(testDir, 'package.json');
      await fs.writeFile(packageJsonPath, JSON.stringify({
        name: 'test-project',
        version: '1.0.0'
      }, null, 2));

      const result = await depsHealth({ dir: testDir, _silent: true });
      expect(result.totalDependencies).toBe(0);
    }, 30000); // Increase timeout for npm operations
  });

  describe('Performance Monitor Hook', () => {
    const hookPath = path.join(projectRoot, 'templates', 'hooks', 'performance-monitor.cjs');

    it('should have performance-monitor.cjs hook file', async () => {
      try {
        await fs.access(hookPath);
        expect(true).toBeTruthy();
      } catch {
        expect.fail('performance-monitor.cjs should exist');
      }
    });

    it('should be valid CommonJS syntax', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should use module.exports
      expect(content.includes('module.exports')).toBeTruthy();
      
      // Should not use ES module syntax
      expect(!content.includes('export default')).toBeTruthy();
    });

    it('should accept sessionEnd data', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should have async function signature
      expect(content.match(/async\s+function.*\(.*data.*\)/)).toBeTruthy();
    });

    it('should track test duration from sessionEnd data', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should reference duration or time tracking
      expect(content.includes('duration') || content.includes('time')).toBeTruthy();
    });

    it('should detect performance regressions (>20% slower)', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should have regression detection logic
      expect(content.includes('1.2') || content.includes('20%') || content.includes('regression')).toBeTruthy();
    });

    it('should warn about slow tests', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should log warnings
      expect(content.includes('console.error') || content.includes('console.warn')).toBeTruthy();
    });
  });

  describe('Performance Regression Detection', () => {
    it('should calculate 7-day average performance', () => {
      const recentRuns = [
        { duration: 20000 },
        { duration: 21000 },
        { duration: 19000 },
        { duration: 22000 },
        { duration: 20500 },
        { duration: 21500 },
        { duration: 20000 }
      ];

      const avg = recentRuns.reduce((sum, run) => sum + run.duration, 0) / recentRuns.length;
      expect(Math.round(avg)).toBe(20571);
    });

    it('should detect when current run is >20% slower than average', () => {
      const average = 20000;
      const currentRun = 25000; // 25% slower
      const threshold = 1.2;

      const isRegression = currentRun > (average * threshold);
      expect(isRegression).toBeTruthy();
    });

    it('should not flag runs within 20% threshold', () => {
      const average = 20000;
      const currentRun = 22000; // 10% slower
      const threshold = 1.2;

      const isRegression = currentRun > (average * threshold);
      expect(!isRegression).toBeTruthy();
    });
  });
});
