import Database from 'better-sqlite3';
import os from 'os';
import path from 'path';

const projectDbPath = path.resolve('.aiknowsys/knowledge.db');
const userDbPath = path.join(os.homedir(), '.aiknowsys', 'knowledge.db');

console.log(`Connecting to Project DB: ${projectDbPath}`);
console.log(`Connecting to User DB: ${userDbPath}`);

const projectDb = new Database(projectDbPath);
const userDb = new Database(userDbPath);

// Target Project ID
const TARGET_PROJECT_ID = 'knowledge-system-template';
const REDUNDANT_PROJECT_IDS = ['arpa73-aiknowsys', 'default', 'system'];

try {
    userDb.pragma('foreign_keys = OFF');
    console.log('Foreign keys disabled for consolidation.');

    // 1. Ensure Target Project exists in User DB
    const project = projectDb.prepare('SELECT * FROM projects WHERE id = ?').get(TARGET_PROJECT_ID)
        || projectDb.prepare('SELECT * FROM projects WHERE path LIKE ?').get('%knowledge-system-template')
        || { id: TARGET_PROJECT_ID, name: 'knowledge-system-template', path: path.resolve('.'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };

    userDb.prepare(`
    INSERT OR REPLACE INTO projects (id, name, path, tech_stack, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(TARGET_PROJECT_ID, project.name, project.path, project.tech_stack, project.created_at, project.updated_at);

    // 2. Sync Invariants (Restore core rules)
    console.log('--- Syncing Invariants ---');
    const projectInvariants = projectDb.prepare('SELECT * FROM invariants').all();
    const insertInvariant = userDb.prepare(`
    INSERT OR REPLACE INTO invariants (id, number, name, rule, details, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
    for (const inv of projectInvariants) {
        insertInvariant.run(inv.id, inv.number, inv.name, inv.rule, inv.details, inv.created_at, inv.updated_at);
    }
    console.log(`Synced ${projectInvariants.length} invariants.`);

    // 3. Sync Plans
    console.log('--- Syncing Plans ---');
    const allProjectPlans = projectDb.prepare('SELECT * FROM plans').all();
    const insertPlan = userDb.prepare(`
    INSERT OR REPLACE INTO plans (id, project_id, title, status, author, priority, type, description, content, topics, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
    for (const plan of allProjectPlans) {
        const finalProjectId = (REDUNDANT_PROJECT_IDS.includes(plan.project_id) || !plan.project_id) ? TARGET_PROJECT_ID : plan.project_id;
        insertPlan.run(plan.id, finalProjectId, plan.title, plan.status, plan.author, plan.priority, plan.type, plan.description, plan.content, plan.topics, plan.created_at, plan.updated_at);
    }
    console.log(`Synced ${allProjectPlans.length} plans.`);

    // 4. Sync Sessions
    console.log('--- Syncing Sessions ---');
    const allProjectSessions = projectDb.prepare('SELECT * FROM sessions').all();
    const insertSession = userDb.prepare(`
    INSERT OR REPLACE INTO sessions (id, project_id, date, topic, status, plan_id, duration, content, topics, phases, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
    for (const session of allProjectSessions) {
        const finalProjectId = (REDUNDANT_PROJECT_IDS.includes(session.project_id) || !session.project_id) ? TARGET_PROJECT_ID : session.project_id;
        insertSession.run(session.id, finalProjectId, session.date, session.topic, session.status, session.plan_id, session.duration, session.content, session.topics, session.phases, session.created_at, session.updated_at);
    }
    console.log(`Synced ${allProjectSessions.length} sessions.`);

    // 5. Cleanup redundant projects in User DB
    console.log('--- Cleaning Up ---');
    userDb.prepare('DELETE FROM projects WHERE id IN (?, ?, ?)').run(...REDUNDANT_PROJECT_IDS);
    userDb.prepare('DELETE FROM projects WHERE id LIKE ?').run('test-project-%');

    // Re-enable and check
    userDb.pragma('foreign_keys = ON');
    const fkErrors = userDb.pragma('foreign_key_check');
    if (fkErrors.length > 0) {
        console.error('Foreign key check failed after consolidation:', fkErrors);
    } else {
        console.log('Consolidation complete. Database integrity verified.');
    }

} catch (err) {
    console.error('Consolidation failed:', err);
} finally {
    projectDb.close();
    userDb.close();
}
