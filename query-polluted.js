import Database from 'better-sqlite3';

const db = new Database('.aiknowsys/knowledge.db', { fileMustExist: true });

const plans = db.prepare(`
    SELECT id, title
    FROM plans 
    WHERE 
        title LIKE '%test%' 
        OR title LIKE '%alpha feature%' 
        OR title LIKE '%beta bugfix%'
        OR id LIKE '%test%'
        OR author = 'dev1'
        OR author = 'dev2'
`).all();

console.log("Polluted plans found:", plans.length);
plans.forEach(p => console.log(`- [${p.id}] ${p.title}`));

const sessions = db.prepare(`
    SELECT id, topic as title
    FROM sessions 
    WHERE 
        topic LIKE '%test%'
        OR id LIKE '%test%'
`).all();

console.log("\nPolluted sessions found:", sessions.length);
sessions.forEach(s => console.log(`- [${s.id}] ${s.title}`));

db.close();
