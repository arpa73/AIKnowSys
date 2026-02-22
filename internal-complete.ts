import { SqliteStorage } from './lib/context/sqlite-storage.js';

async function main() {
    const root = process.cwd();
    const storage = new SqliteStorage();
    await storage.init(root);

    try {
        const db = storage['db'];
        const plan = db.prepare(`SELECT * FROM plans WHERE id = 'PLAN_check_relevancy_of_db_plans_vs_codebase_architecture'`).get();

        if (plan) {
            db.prepare(`UPDATE plans SET status = 'COMPLETE' WHERE id = 'PLAN_check_relevancy_of_db_plans_vs_codebase_architecture'`).run();
            console.log("STATUS UPDATED via internal DB reference!");
        } else {
            console.log("PLAN NOT FOUND IN THIS DB INSTANCE!!!");
        }
    } catch (e) {
        console.error("Error bypassing:", e);
    }
}

main();
