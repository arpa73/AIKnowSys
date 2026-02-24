import { SqliteStorage } from '../../../../lib/context/sqlite-storage.js';
import { findKnowledgeDb } from '../../../../lib/utils/find-knowledge-db.js';

export async function getSkillContentFromSqlite(skillName: string): Promise<string | null> {
  const storage = new SqliteStorage();
  try {
    await storage.init(findKnowledgeDb());
    const skill = await storage.getSkillByName(skillName);
    return skill?.content ?? null;
  } finally {
    await storage.close();
  }
}
