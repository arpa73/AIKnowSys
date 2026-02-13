/**
 * Performance benchmark for migrate-to-sqlite command
 * Tests migration speed with larger datasets
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { migrateToSqlite } from '../../lib/commands/migrate-to-sqlite.js';
import type { MigrateToSqliteOptions } from '../../lib/types/index.js';

describe('migrate-to-sqlite performance benchmarks', () => {
  let benchmarkDir: string;
  let dbPath: string;

  beforeAll(() => {
    // Create benchmark directory with larger dataset
    benchmarkDir = join(tmpdir(), `benchmark-${Date.now()}`);
    mkdirSync(benchmarkDir, { recursive: true });
    dbPath = join(benchmarkDir, 'benchmark.db');

    const aiknowsysDir = join(benchmarkDir, '.aiknowsys');
    mkdirSync(aiknowsysDir, { recursive: true });
    mkdirSync(join(aiknowsysDir, 'sessions'), { recursive: true });
    mkdirSync(join(aiknowsysDir, 'learned'), { recursive: true });

    // Generate test data
    console.log('\nGenerating benchmark dataset...');
    
    // Create 100 session files
    for (let i = 0; i < 100; i++) {
      const date = new Date(2026, 0, i + 1).toISOString().split('T')[0];
      const sessionContent = `---
date: ${date}
topics: ["benchmark", "performance", "test-${i}"]
status: complete
duration: 2h
---

# Benchmark Session ${i}

## Goal
Performance testing session ${i}

## Changes
${'- Item ' + (i + 1) + '\n'.repeat(10)}

## Key Learning
This is benchmark session ${i} for performance testing.
`;
      writeFileSync(
        join(aiknowsysDir, 'sessions', `${date}-session.md`),
        sessionContent
      );
    }

    // Create 20 plan files
    for (let i = 0; i < 20; i++) {
      const planContent = `---
title: Benchmark Plan ${i}
author: benchmark-user
status: ${i % 2 === 0 ? 'ACTIVE' : 'COMPLETE'}
topics: ["benchmark", "plan-${i}"]
priority: ${i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low'}
type: feature
created: 2026-01-${(i + 1).toString().padStart(2, '0')}T10:00:00Z
updated: 2026-01-${(i + 1).toString().padStart(2, '0')}T15:00:00Z
---

# Benchmark Plan ${i}

## Objective
Performance testing plan ${i}

## Steps
${Array.from({ length: 10 }, (_, j) => `${j + 1}. Step ${j + 1} for plan ${i}`).join('\n')}

## Success Criteria
- All steps complete
- Performance validated
`;
      writeFileSync(
        join(aiknowsysDir, `PLAN_benchmark_${i}.md`),
        planContent
      );
    }

    // Create 30 learned patterns
    for (let i = 0; i < 30; i++) {
      const patternContent = `---
category: benchmark-${i % 5}
keywords: ["pattern-${i}", "benchmark", "test"]
author: benchmark-user
created: 2026-01-${(i + 1).toString().padStart(2, '0')}T12:00:00Z
---

# Benchmark Pattern ${i}

## Problem
Performance testing pattern ${i}

## Solution
${'Implementation detail ' + (i + 1) + '\n'.repeat(5)}

## Benefits
${'- Benefit ' + (i + 1) + '\n'.repeat(3)}
`;
      writeFileSync(
        join(aiknowsysDir, 'learned', `pattern-${i}.md`),
        patternContent
      );
    }

    console.log('✅ Generated 100 sessions, 20 plans, 30 learned patterns');
  });

  afterAll(() => {
    // Clean up benchmark directory
    if (existsSync(benchmarkDir)) {
      rmSync(benchmarkDir, { recursive: true, force: true });
    }
  });

  it('should migrate 150 files within reasonable time', async () => {
    // GIVEN: Large dataset (100 sessions + 20 plans + 30 learned)
    const options: MigrateToSqliteOptions = {
      dir: benchmarkDir,
      dbPath,
      dryRun: false,
      verbose: false,
    };

    // WHEN: Running migration
    console.log('\n🚀 Starting migration benchmark...');
    const startTime = Date.now();
    const result = await migrateToSqlite(options);
    const duration = Date.now() - startTime;

    // THEN: All files migrated successfully
    expect(result.sessions.migrated).toBe(100);
    expect(result.plans.migrated).toBe(20);
    expect(result.learned.migrated).toBe(30);
    expect(result.sessions.errors).toBe(0);
    expect(result.plans.errors).toBe(0);
    expect(result.learned.errors).toBe(0);

    // AND: Migration completes in reasonable time
    const MAX_MIGRATION_TIME_MS = 10000; // 10 seconds for 150 files
    expect(duration).toBeLessThan(MAX_MIGRATION_TIME_MS);

    // Report performance
    const filesPerSecond = (150 / (duration / 1000)).toFixed(1);
    console.log('\n✅ Performance Report:');
    console.log('   Total files: 150');
    console.log(`   Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    console.log(`   Throughput: ${filesPerSecond} files/second`);
    console.log(`   Sessions: ${result.sessions.migrated}/100`);
    console.log(`   Plans: ${result.plans.migrated}/20`);
    console.log(`   Learned: ${result.learned.migrated}/30`);
  });

  it('should handle dry-run mode efficiently with large dataset', async () => {
    // GIVEN: Large dataset and dry-run mode
    const options: MigrateToSqliteOptions = {
      dir: benchmarkDir,
      dbPath,
      dryRun: true,
      verbose: false,
    };

    // WHEN: Running dry-run migration
    const startTime = Date.now();
    const result = await migrateToSqlite(options);
    const duration = Date.now() - startTime;

    // THEN: Scan completes quickly (< 5 seconds)
    const MAX_SCAN_TIME_MS = 5000;
    expect(duration).toBeLessThan(MAX_SCAN_TIME_MS);

    // AND: All files discovered
    expect(result.sessions.found).toBe(100);
    expect(result.plans.found).toBe(20);
    expect(result.learned.found).toBe(30);

    console.log(`\n✅ Dry-run Performance: ${duration}ms for 150 files`);
  });
});
