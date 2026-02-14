#!/usr/bin/env node

/**
 * Benchmark: createSession performance (CLI subprocess vs direct lib/core import)
 * 
 * Usage: node scripts/benchmark-create-session.js
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { createSessionCore } from '../dist/lib/core/create-session.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { unlinkSync, existsSync } from 'fs';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

const ITERATIONS = 10;

async function benchmarkCLI() {
  const times = [];
  
  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    
    try {
      await execFileAsync('npx', [
        'aiknowsys',
        'create-session',
        '--title', `Benchmark Test ${Date.now()}`,
        '--topics', 'benchmark'
      ], { cwd: PROJECT_ROOT });
    } catch (error) {
      // Ignore errors (session may already exist)
    }
    
    const end = performance.now();
    times.push(end - start);
    
    // Clean up session file if it was created
    const sessionFile = resolve(PROJECT_ROOT, '.aiknowsys', 'sessions', `${new Date().toISOString().split('T')[0]}-session.md`);
    if (existsSync(sessionFile)) {
      try {
        unlinkSync(sessionFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
  
  return times;
}

async function benchmarkCore() {
  const times = [];
  
  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    
    try {
      await createSessionCore({
        title: `Benchmark Test ${Date.now()}`,
        topics: ['benchmark'],
        plan: null,
        targetDir: PROJECT_ROOT
      });
    } catch (error) {
      // Ignore errors (duplicate sessions handled gracefully)
    }
    
    const end = performance.now();
    times.push(end - start);
    
    // Clean up session file if it was created
    const sessionFile = resolve(PROJECT_ROOT, '.aiknowsys', 'sessions', `${new Date().toISOString().split('T')[0]}-session.md`);
    if (existsSync(sessionFile)) {
      try {
        unlinkSync(sessionFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
  
  return times;
}

function stats(times) {
  const sorted = times.slice().sort((a, b) => a - b);
  const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  
  return { avg, median, min, max };
}

async function main() {
  console.log('🔬 Benchmarking createSession: CLI subprocess vs direct lib/core import\n');
  console.log(`Iterations: ${ITERATIONS} per method\n`);
  
  console.log('⏱️  Running CLI subprocess benchmark...');
  const cliTimes = await benchmarkCLI();
  const cliStats = stats(cliTimes);
  
  console.log('⏱️  Running direct lib/core benchmark...');
  const coreTimes = await benchmarkCore();
  const coreStats = stats(coreTimes);
  
  console.log('\n📊 Results:\n');
  console.log('CLI Subprocess (execFileAsync):');
  console.log(`  Average: ${cliStats.avg.toFixed(2)}ms`);
  console.log(`  Median:  ${cliStats.median.toFixed(2)}ms`);
  console.log(`  Min:     ${cliStats.min.toFixed(2)}ms`);
  console.log(`  Max:     ${cliStats.max.toFixed(2)}ms`);
  
  console.log('\nDirect lib/core Import:');
  console.log(`  Average: ${coreStats.avg.toFixed(2)}ms`);
  console.log(`  Median:  ${coreStats.median.toFixed(2)}ms`);
  console.log(`  Min:     ${coreStats.min.toFixed(2)}ms`);
  console.log(`  Max:     ${coreStats.max.toFixed(2)}ms`);
  
  const improvement = (cliStats.avg / coreStats.avg).toFixed(1);
  const savings = (cliStats.avg - coreStats.avg).toFixed(2);
  
  console.log(`\n🚀 Performance Improvement: ${improvement}x faster`);
  console.log(`⏰ Time Saved: ${savings}ms per call\n`);
  
  if (parseFloat(improvement) >= 10) {
    console.log('✅ Phase 2 POC VALIDATED: 10x+ performance improvement achieved!');
  } else {
    console.log('⚠️  Performance improvement below expected 10x threshold');
  }
}

main().catch(console.error);
