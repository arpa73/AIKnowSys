# Backward-Compatible Database Migration Pattern

**Category:** Implementation Pattern  
**Discovered:** Phase 2.4 (Feb 16, 2026)  
**Applicability:** SQLite schema evolution, cross-project deployments  
**Related:** [local-embeddings-pattern.md](local-embeddings-pattern.md)

---

## Context

When evolving database schemas in a deployed application, you need migrations that:
- Work on both new installations and existing databases
- Don't require manual user intervention
- Don't break backward compatibility
- Are safe to run multiple times (idempotent)

Traditional migration frameworks (Flyway, Liquibase, Alembic) add complexity:
- External tools/dependencies
- Migration script versioning
- Manual rollback procedures
- State tracking tables

**For additive schema changes** (new optional columns, new tables), there's a simpler approach.

---

## Pattern: Runtime Schema Detection

**Core Idea:** Detect schema state at runtime, apply missing changes automatically.

### Implementation (Phase 2.4 Example)

```typescript
private async initSchema(): Promise<void> {
  // 1. Load base schema (CREATE TABLE IF NOT EXISTS)
  const schema = await fs.readFile('schema.sql', 'utf-8');
  this.db.exec(schema);
  
  // 2. Check if new column exists
  const tableInfo = this.db.pragma('table_info(knowledge_events)') as Array<{
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: any;
    pk: number;
  }>;
  
  const hasEmbeddingColumn = tableInfo.some(col => col.name === 'embedding');
  
  // 3. Add column only if missing
  if (!hasEmbeddingColumn) {
    this.db.exec('ALTER TABLE knowledge_events ADD COLUMN embedding BLOB;');
  }
}
```

**Key Characteristics:**
- ✅ **Idempotent:** Safe to run on every app start
- ✅ **Self-healing:** Auto-updates legacy databases
- ✅ **No state tracking:** PRAGMA query is the source of truth
- ✅ **Fast:** <1ms overhead per check
- ✅ **Backward compatible:** New column is NULLABLE

---

## When to Use This Pattern

### ✅ GOOD FIT

**Additive schema changes:**
- Adding optional columns (NULLABLE)
- Adding new tables
- Adding indexes
- Adding triggers

**Deployment scenarios:**
- Cross-project installations (Phase 1 - global database)
- Per-project databases (mixed versions)
- Development → production (no explicit migration step)

**Requirements:**
- Changes don't break existing code
- No data transformations needed
- Schema evolution is append-only

### ❌ NOT SUITABLE

**Breaking changes:**
- Renaming columns (use deprecation cycle: add new, migrate data, remove old)
- Removing columns (need versioned migrations + rollback)
- Changing column types (may require data conversion)
- Complex data transformations (need imperative scripts)

**When you need:**
- Rollback capability (this pattern is forward-only)
- Audit trail of migrations (no history tracking)
- Team coordination (multiple conflicting migrations)
- Data validation during migration (only structural changes)

---

## Evolution Over Phases

### Phase 2.1: Base Schema
```typescript
// schema.sql
CREATE TABLE IF NOT EXISTS knowledge_events (...);
```
No migration needed - fresh databases get full schema.

### Phase 2.4: Add Embedding Column
```typescript
// Migration in initSchema()
if (!hasEmbeddingColumn) {
  ALTER TABLE knowledge_events ADD COLUMN embedding BLOB;
}
```
Existing databases upgraded automatically.

### Future (Phase 2.6+): Add Vector Index
```typescript
// Migration in initSchema()
if (!hasVectorIndex) {
  // Load sqlite-vss extension
  // CREATE VIRTUAL TABLE events_vss USING vss(...);
}
```
Incremental complexity, backward compatible.

---

## Performance Characteristics

**Overhead per init():**
- PRAGMA table_info query: ~0.5-1ms
- ALTER TABLE (if needed): ~10-50ms (one-time)
- Total per app start: <1ms amortized

**Scalability:**
- Works for databases with millions of rows
- ALTER TABLE ADD COLUMN is instant (metadata-only)
- No downtime required

**Why this is acceptable:**
- Init happens once per process lifetime
- Sub-millisecond overhead negligible
- No external tooling required

---

## Migration Safety Checklist

Before adding a runtime migration, verify:

- [ ] **Column is NULLABLE** (or has DEFAULT value)
- [ ] **Existing code handles NULL** (won't crash on old data)
- [ ] **Check is idempotent** (safe to run multiple times)
- [ ] **Error handling present** (wrap ALTER TABLE in try/catch if needed)
- [ ] **Tests verify both paths** (new install + migration)

**Anti-pattern:** Adding NOT NULL columns without DEFAULT (breaks existing rows)

---

## Trade-offs

| Aspect | Runtime Detection | Traditional Migrations |
|--------|-------------------|------------------------|
| Setup complexity | ✅ None | ❌ Framework + scripts |
| State tracking | ✅ None (self-describing) | ❌ Migration version table |
| Rollback | ❌ Forward-only | ✅ Up/down migrations |
| Deployment | ✅ Zero-step | ⚠️ Run scripts manually |
| Team coordination | ⚠️ Conflicts possible | ✅ Ordered migrations |
| Audit trail | ❌ None | ✅ Version history |
| Breaking changes | ❌ Not supported | ✅ Data transformations |

**Best for:** Single-developer projects, additive changes, rapid iteration  
**Avoid for:** Multi-team projects with complex migration needs

---

## Alternative Approaches

### 1. Traditional Migration Framework
**Example:** Flyway, Knex migrations, Alembic
```sql
-- V2__add_embedding_column.sql
ALTER TABLE knowledge_events ADD COLUMN embedding BLOB;
```
**Pros:** Explicit versioning, rollback support, audit trail  
**Cons:** Extra tooling, manual deployment step, version conflicts

### 2. Schema Versioning Table
```typescript
CREATE TABLE schema_version (version INT);

if (currentVersion < 2) {
  ALTER TABLE knowledge_events ADD COLUMN embedding BLOB;
  UPDATE schema_version SET version = 2;
}
```
**Pros:** Version tracking, audit trail  
**Cons:** More code, version conflicts possible

### 3. Separate Migration Scripts
```bash
# Run manually on deployment
sqlite3 knowledge.db < migrations/002-add-embedding.sql
```
**Pros:** Explicit control, works for complex transformations  
**Cons:** Manual step, user error risk, no automation

---

## Code Quality Benefits

**Follows KISS:**
- No external dependencies
- No migration version tracking
- Self-describing schema state

**Follows YAGNI:**
- Don't add versioning until needed
- Start simple, add complexity later
- Most projects don't need complex migrations

**Privacy-First:**
- No external migration service
- No state uploaded to cloud
- Pure local database operations

---

## Real-World Example: Phase 2.4

**Scenario:** Add embeddings to existing knowledge events

**Requirements:**
- Works on fresh installs (no events yet)
- Works on existing databases (millions of events)
- Doesn't break existing queries
- No manual user action

**Solution:**
```typescript
// schema.sql (base schema for new installs)
CREATE TABLE IF NOT EXISTS knowledge_events (
  event_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  event_type TEXT NOT NULL,
  data TEXT NOT NULL,
  embedding BLOB,  -- ← New column (Phase 2.4)
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

// sqlite-storage.ts (migration for existing databases)
private async initSchema(): Promise<void> {
  // Load base schema
  this.db.exec(schema);
  
  // Migrate existing databases
  const tableInfo = this.db.pragma('table_info(knowledge_events)');
  if (!tableInfo.some(col => col.name === 'embedding')) {
    this.db.exec('ALTER TABLE knowledge_events ADD COLUMN embedding BLOB;');
  }
}
```

**Outcome:**
- ✅ Fresh installs: Full schema from schema.sql
- ✅ Existing databases: Auto-upgraded on first init()
- ✅ Zero user intervention required
- ✅ Backward compatible (embedding is nullable)
- ✅ Tests verify both paths (new + migration)

---

## Testing Strategy

**Test both scenarios:**

```typescript
describe('Schema Migration', () => {
  it('should create embedding column on fresh database', async () => {
    // Fresh init - schema.sql creates full table
    const storage = new SqliteStorage();
    await storage.init(testDir);
    
    const tableInfo = db.pragma('table_info(knowledge_events)');
    const embedding = tableInfo.find(col => col.name === 'embedding');
    expect(embedding).toBeDefined();
    expect(embedding.type).toBe('BLOB');
  });
  
  it('should add embedding column to existing database', async () => {
    // Simulate old database (create table without embedding)
    db.exec(`
      CREATE TABLE knowledge_events (
        event_id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        event_type TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    
    // Init should detect missing column and add it
    const storage = new SqliteStorage();
    await storage.init(testDir);
    
    const tableInfo = db.pragma('table_info(knowledge_events)');
    const embedding = tableInfo.find(col => col.name === 'embedding');
    expect(embedding).toBeDefined(); // ← Migration worked!
  });
});
```

---

## Future Enhancements (When Needed)

**If PRAGMA overhead becomes noticeable (>10ms):**

Add schema version tracking:
```typescript
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

// Only run migration if not in schema_migrations
const hasV2 = db.prepare('SELECT 1 FROM schema_migrations WHERE version = 2').get();
if (!hasV2) {
  db.exec('ALTER TABLE knowledge_events ADD COLUMN embedding BLOB;');
  db.prepare('INSERT INTO schema_migrations VALUES (2, ?)').run(new Date().toISOString());
}
```

**Benefits:**
- Skip PRAGMA checks after migration applied
- Audit trail of when migrations ran
- Version coordination for teams

**Cost:**
- More code to maintain
- Version conflict resolution needed
- Still simpler than full migration framework

---

## Related Patterns

- [local-embeddings-pattern.md](local-embeddings-pattern.md) - Why embeddings stored locally (Phase 2.3)
- [hybrid-storage-pattern.md](hybrid-storage-pattern.md) - Why events + markdown (Phase 2.1)
- [event-sourcing-pattern.md](event-sourcing-pattern.md) - Why events over documents (Phase 2.2)

---

## Key Takeaways

1. **Runtime schema detection = simpler migrations** for additive changes
2. **PRAGMA table_info is your friend** (idempotent, fast, no state)
3. **Make new columns NULLABLE** (backward compatibility)
4. **Test both fresh install and migration** (don't assume one works)
5. **Start simple**, add version tracking only when overhead measured
6. **Not suitable for breaking changes** (use versioned migrations)

**Use this pattern when:**
- Adding optional features (embeddings, tags, metadata)
- Building MVP (defer complexity)
- Single-developer or small team
- Cross-project deployments

**Avoid when:**
- Breaking schema changes needed
- Complex data transformations
- Team has migration framework investment
- Audit trail legally required

---

*Pattern discovered during Phase 2.4 implementation. Refined from Phase 2.1-2.4 experience. Part of AIKnowSys Privacy-First architecture.*
