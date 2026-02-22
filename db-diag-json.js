import Database from 'better-sqlite3';
const db = new Database('.aiknowsys/knowledge.db');

const data = {
    projects: db.prepare('SELECT * FROM projects').all(),
    invariants: db.prepare('SELECT * FROM invariants').all(),
    plansCount: db.prepare('SELECT count(*) as count FROM plans').get(),
    sessionsCount: db.prepare('SELECT count(*) as count FROM sessions').get()
};

console.log(JSON.stringify(data, null, 2));
db.close();
