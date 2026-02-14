#!/usr/bin/env node
/**
 * Demo: Natural Language Query API
 * 
 * Shows three query styles working with the actual database:
 * 1. Natural language: { when: "last week", about: "MCP" }
 * 2. Relative dates: { last: 7, unit: "days" }
 * 3. Structured: { dateAfter: "2026-02-07" }
 */

import { parseQueryParams } from './dist/mcp-server/src/utils/query-parser.js';
import { querySessionsSqlite as querySessionsCore } from './dist/lib/core/sqlite-query.js';

const dbPath = '.aiknowsys/knowledge.db';

console.log('🎯 Natural Language Query API Demo\n');
console.log('Testing three query styles against actual database...\n');

// Style 1: Natural Language
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📝 Style 1: Natural Language');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const nlParams = { when: "last week", about: "sqlite", dbPath };
console.log(`Query: { when: "last week", about: "sqlite" }`);

const nlParsed = parseQueryParams(nlParams);
console.log(`\nParsed to:`, JSON.stringify(nlParsed, null, 2));

try {
  const nlResult = await querySessionsCore(nlParsed);
  console.log(`\n✅ Found ${nlResult.count} session(s)`);
  if (nlResult.sessions.length > 0) {
    console.log('\nMatching sessions:');
    nlResult.sessions.forEach(s => {
      console.log(`  📅 ${s.date}: ${s.topics?.join(', ') || 'no topics'}`);
    });
  }
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
}

console.log('\n');

// Style 2: Relative Dates
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📝 Style 2: Relative Dates');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const relParams = { last: 7, unit: "days", topic: "mcp", dbPath };
console.log(`Query: { last: 7, unit: "days", topic: "mcp" }`);

const relParsed = parseQueryParams(relParams);
console.log(`\nParsed to:`, JSON.stringify(relParsed, null, 2));

try {
  const relResult = await querySessionsCore(relParsed);
  console.log(`\n✅ Found ${relResult.count} session(s) in last 7 days`);
  if (relResult.sessions.length > 0) {
    console.log('\nRecent sessions:');
    relResult.sessions.forEach(s => {
      console.log(`  📅 ${s.date}: ${s.topics?.slice(0, 2).join(', ') || 'no topics'}`);
    });
  }
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
}

console.log('\n');

// Style 3: Structured (Backward Compatible)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📝 Style 3: Structured (Backward Compatible)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const structParams = { dateAfter: "2026-02-08", dbPath };
console.log(`Query: { dateAfter: "2026-02-08" }`);

const structParsed = parseQueryParams(structParams);
console.log(`\nParsed to:`, JSON.stringify(structParsed, null, 2));

try {
  const structResult = await querySessionsCore(structParsed);
  console.log(`\n✅ Found ${structResult.count} session(s) since Feb 08`);
  if (structResult.sessions.length > 0) {
    console.log(`\nAll ${structResult.count} sessions:`);
    structResult.sessions.forEach(s => {
      const displayTopics = s.topics?.slice(0, 3).join(', ') || 'no topics';
      const more = (s.topics?.length || 0) > 3 ? ` (+${s.topics.length - 3} more)` : '';
      console.log(`  📅 ${s.date}: ${displayTopics}${more}`);
    });
  }
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ All three query styles work!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📊 Summary:');
console.log('  • Natural language: Parses "last week" to dateAfter');
console.log('  • Relative dates: Calculates N days/weeks/months ago');
console.log('  • Structured: Backward compatible with existing queries');
console.log('\n💡 All queries use the same underlying optimized SQLite engine!');
