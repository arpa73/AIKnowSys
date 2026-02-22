import Database from 'better-sqlite3';
import os from 'os';
import path from 'path';

const userDbPath = path.join(os.homedir(), '.aiknowsys', 'knowledge.db');
const db = new Database(userDbPath);

const data = {
    projects: db.prepare('SELECT * FROM projects').all(),
    invariants: db.prepare('SELECT * FROM invariants').all(),
    plansCount: db.prepare('SELECT count(*) as count FROM plans').get(),
};

console.log(JSON.stringify(data, null, 2));
db.close();
