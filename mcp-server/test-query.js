#!/usr/bin/env node
import { parseQueryParams } from './dist/mcp-server/src/utils/query-parser.js';
import { querySessionsSqlite as querySessionsCore } from './dist/lib/core/sqlite-query.js';

const dbPath = '.aiknowsys/knowledge.db';

console.log('🔍 Direct Query Test:\n');

// Test 1: No filters (should return all)
console.log('Test 1: No filters');
const test1 = await querySessionsCore({ dbPath });
console.log(`  Result: ${test1.count} sessions\n`);

// Test 2: Topic filter only
console.log('Test 2: Topic = "sqlite"');
const test2 = await querySessionsCore({ dbPath, topic: 'sqlite' });
console.log(`  Result: ${test2.count} sessions`);
if (test2.sessions.length > 0) {
  test2.sessions.forEach(s => console.log(`    ${s.date}: ${s.topics?.join(', ')}`));
}
console.log();

// Test 3: Date filter only
console.log('Test 3: dateAfter = "2026-02-08"');
const test3 = await querySessionsCore({ dbPath, dateAfter: '2026-02-08' });
console.log(`  Result: ${test3.count} sessions`);
if (test3.sessions.length > 0) {
  test3.sessions.forEach(s => console.log(`    ${s.date}: ${s.topics?.join(', ')}`));
}
console.log();

// Test 4: Combined filters
console.log('Test 4: dateAfter = "2026-02-08" AND topic = "mcp"');
const test4 = await querySessionsCore({ dbPath, dateAfter: '2026-02-08', topic: 'mcp' });
console.log(`  Result: ${test4.count} sessions`);
if (test4.sessions.length > 0) {
  test4.sessions.forEach(s => console.log(`    ${s.date}: ${s.topics?.join(', ')}`));
}
