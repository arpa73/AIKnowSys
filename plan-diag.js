import Database from 'better-sqlite3';
const db = new Database('.aiknowsys/knowledge.db');

const projectCounts = db.prepare('SELECT project_id, count(*) as count FROM plans GROUP BY project_id').all();
console.log('--- PLANS BY PROJECT_ID ---');
console.table(projectCounts);

const projects = db.prepare('SELECT * FROM projects').all();
console.log('--- PROJECTS ---');
console.table(projects);

db.close();
