import Database from 'better-sqlite3';
const db = new Database('.aiknowsys/knowledge.db');

console.log('--- PROJECTS ---');
const projects = db.prepare('SELECT * FROM projects').all();
console.table(projects);

console.log('--- INVARIANTS ---');
const invariants = db.prepare('SELECT * FROM invariants').all();
console.table(invariants);

console.log('--- PLANS (Count) ---');
const plansCount = db.prepare('SELECT count(*) as count FROM plans').get();
console.log('Total Plans:', plansCount.count);

console.log('--- SESSIONS (Count) ---');
const sessionsCount = db.prepare('SELECT count(*) as count FROM sessions').get();
console.log('Total Sessions:', sessionsCount.count);

console.log('--- REVIEWS ---');
const reviewsCount = db.prepare('SELECT count(*) as count FROM reviews').get();
console.log('Total Reviews:', reviewsCount.count);

db.close();
