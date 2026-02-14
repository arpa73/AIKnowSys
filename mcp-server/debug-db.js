#!/usr/bin/env node
import Database from 'better-sqlite3';

const db = new Database('.aiknowsys/knowledge.db', { readonly: true });

console.log('🔍 SQLite Debug Query:\n');

// Check all sessions
const allSessions = db.prepare('SELECT id, date, project_id, topics FROM sessions ORDER BY date DESC').all();
console.log(`Total sessions: ${allSessions.length}`);
allSessions.forEach(s => {
  console.log(`  ${s.date} [${s.project_id || 'no project'}]: ${s.topics || 'no topics'}`);
});

console.log('\n');

// Check all projects
const projects = db.prepare('SELECT id, name FROM projects').all();
console.log(`Total projects: ${projects.length}`);
projects.forEach(p => {
  console.log(`  ${p.id}: ${p.name}`);
});

db.close();
