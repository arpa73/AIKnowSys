#!/usr/bin/env node
import Database from 'better-sqlite3';

const db = new Database('.aiknowsys/knowledge.db', { readonly: true });

console.log('📊 Database Contents:\n');

const sessions = db.prepare('SELECT date, topics FROM sessions ORDER BY date DESC LIMIT 10').all();
console.log(`Sessions (${sessions.length}):`);
sessions.forEach(s => {
  const topics = s.topics ? JSON.parse(s.topics).slice(0, 3).join(', ') : 'no topics';
  console.log(`  ${s.date}: ${topics}`);
});

db.close();
