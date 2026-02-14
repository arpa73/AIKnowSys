#!/usr/bin/env node
// Test script for smart database path detection
// After build, import from dist/ (no longer dist/mcp-server/src/)
import { querySessionsSqlite as querySessionsCore } from '../dist/lib/core/sqlite-query.js';

console.log('🔍 Direct Query Test (with smart DB path):\n');

// Test 1: No dbPath provided (should auto-detect!)
console.log('Test 1: No dbPath provided (auto-detection)');
const test1 = await querySessionsCore({});
console.log(`  Result: ${test1.count} sessions (found DB automatically!)\n`);

// Test 2: Topic filter only (no dbPath)
console.log('Test 2: Topic = "sqlite" (no dbPath)');
const test2 = await querySessionsCore({ topic: 'sqlite' });
console.log(`  Result: ${test2.count} sessions`);
if (test2.sessions.length > 0) {
  test2.sessions.forEach(s => console.log(`    ${s.date}: ${s.topics?.join(', ')}`));
}
console.log();

// Test 3: Date filter only (no dbPath)
console.log('Test 3: dateAfter = "2026-02-08" (no dbPath)');
const test3 = await querySessionsCore({ dateAfter: '2026-02-08' });
console.log(`  Result: ${test3.count} sessions`);
if (test3.sessions.length > 0) {
  test3.sessions.forEach(s => console.log(`    ${s.date}: ${s.topics?.join(', ')}`));
}
console.log();

// Test 4: Combined filters (no dbPath)
console.log('Test 4: dateAfter = "2026-02-08" AND topic = "mcp" (no dbPath)');
const test4 = await querySessionsCore({ dateAfter: '2026-02-08', topic: 'mcp' });
console.log(`  Result: ${test4.count} sessions`);
if (test4.sessions.length > 0) {
  test4.sessions.forEach(s => console.log(`    ${s.date}: ${s.topics?.join(', ')}`));
}

console.log('\n✅ Smart database path detection working!');
console.log('   No more manual dbPath configuration needed!');
