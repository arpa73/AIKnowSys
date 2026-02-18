---
title: "PostgreSQL Migration - Enterprise-Scale Storage Backend"
status: "PLANNED"
priority: "low"
created: "2026-02-15"
author: "Planner"
topics: ["postgres", "pgvector", "enterprise-scale", "multi-tenancy"]
depends_on: ["PLAN_knowledge_bank_evolution"]
phase_of: "PLAN_knowledge_bank_evolution"
---

# PLAN: PostgreSQL Migration (Optional Phase 4)

**Status:** 📋 PLANNED  
**Priority:** 🟢 LOW (Optional enhancement, not urgent)  
**Created:** 2026-02-15  
**Timeline:** 2-3 weeks (when needed)  
**Trigger:** >10 concurrent users OR global team OR >1M events

**Goal:** Provide enterprise-scale PostgreSQL storage backend as drop-in replacement for SQLite when scaling needs arise.

**Context:** User has PostgreSQL on Railway (production) and Docker (local dev), making this migration path viable when company adoption grows.

---

## 🎯 When to Implement This Plan

**DON'T implement if:**
- ✅ Team size <10 developers
- ✅ Single-region team (one office/timezone)
- ✅ <100K events in knowledge base
- ✅ Local-first workflow valued (offline work, privacy)

**DO implement when:**
- 🔴 >10 concurrent users (SQLite write locks bottleneck)
- 🔴 Global team (need low-latency read replicas)
- 🔴 >1M events (SQLite-VSS performance degrades)
- 🔴 Compliance needs (audit logs, encryption at rest, point-in-time recovery)
- 🔴 Cross-department usage (marketing, sales, engineering sharing knowledge)

**Current status:** NOT NEEDED YET  
**Revisit:** After knowledge_bank Phase 2 complete + user growth assessment

---

## 📦 Relationship to Other Plans

### The Full Stack

```
┌─────────────────────────────────────────────────────┐
│           CONVERSATIONAL MEDIATOR (Optional)         │
│  "Show me auth patterns from my FastAPI projects"   │
└─────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│              DYNAMIC TOOLSETS (Phase 0)              │
│  search_tools → describe_tools → execute_tool       │
│  (90% tool definition token reduction)              │
└─────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│          KNOWLEDGE BANK EVOLUTION (Phases 1-3)       │
│  - Phase 1: Cross-repo foundation                   │
│  - Phase 2: Event-sourced storage                   │
│  - Phase 3: Markdown generation                     │
│  (98% query token reduction)                        │
└─────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│       STORAGE BACKEND (This Plan - Phase 4)         │
│                                                      │
│  ┌─────────────┐          ┌─────────────┐          │
│  │   SQLite    │   OR     │ PostgreSQL  │          │
│  │   (Local)   │          │ (Railway)   │          │
│  └─────────────┘          └─────────────┘          │
│                                                      │
│  Same interface (StorageAdapter)                    │
│  Config-based selection                             │
└─────────────────────────────────────────────────────┘
```

**Key insights:**
- **Conversational mediator** works with EITHER SQLite or Postgres (doesn't care)
- **Knowledge bank** defines the data model (events, embeddings)
- **This plan** just swaps the storage backend (no API changes)
- **Dynamic toolsets** sit above all of this (tool registration layer)

---

## 🏗️ Architecture: Drop-In Replacement

### Existing Abstraction (Already Built!)

```typescript
// lib/context/storage-adapter.ts (ALREADY EXISTS)
export abstract class StorageAdapter {
  async init(targetDir: string): Promise<void>;
  async queryPlans(filters?: PlanFilters): Promise<{ count: number; plans: PlanMetadata[] }>;
  async querySessions(filters?: SessionFilters): Promise<{ count: number; sessions: SessionMetadata[] }>;
  async search(query: string, scope: SearchScope): Promise<SearchResult[]>;
  async rebuildIndex(): Promise<{ plansIndexed: number; sessionsIndexed: number }>;
  async close(): Promise<void>;
}

// lib/context/sqlite-storage.ts (ALREADY EXISTS)
export class SqliteStorage extends StorageAdapter {
  // Implementation for local SQLite
}
```

### New Implementation (This Plan)

```typescript
// lib/context/postgres-storage.ts (NEW)
import { Pool, PoolClient } from 'pg';
import { StorageAdapter } from './storage-adapter.js';

export class PostgresStorage extends StorageAdapter {
  private pool: Pool;
  
  async init(connectionString: string): Promise<void> {
    this.pool = new Pool({
      connectionString: connectionString || process.env.POSTGRES_URL,
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false } 
        : false,
      max: 20,  // Connection pool size
      idleTimeoutMillis: 30000
    });
    
    await this.runMigrations();
  }
  
  async queryPlans(filters?: PlanFilters): Promise<{ count: number; plans: PlanMetadata[] }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM plans 
         WHERE ($1::TEXT IS NULL OR project_id = $1)
           AND ($2::TEXT IS NULL OR status = $2)
         ORDER BY updated_at DESC
         LIMIT $3`,
        [filters?.projectId, filters?.status, filters?.limit || 50]
      );
      
      return {
        count: result.rowCount || 0,
        plans: result.rows.map(this.rowToPlanMetadata)
      };
    } finally {
      client.release();
    }
  }
  
  async querySessions(filters?: SessionFilters) {
    // Similar to queryPlans, using client.query with parameterized queries
  }
  
  async search(query: string, scope: SearchScope) {
    const client = await this.pool.connect();
    try {
      // Use PostgreSQL full-text search (to_tsvector, to_tsquery)
      const result = await client.query(
        `SELECT * FROM knowledge_events
         WHERE to_tsvector('english', data::text) @@ plainto_tsquery('english', $1)
         LIMIT 50`,
        [query]
      );
      return { query, count: result.rowCount || 0, results: result.rows };
    } finally {
      client.release();
    }
  }
  
  async close(): Promise<void> {
    await this.pool.end();
  }
}
```

---

## 📋 Implementation Plan

### Phase 4.1: PostgreSQL Schema (Week 1)

**Create schema-postgres.sql:**

```sql
-- lib/context/schema-postgres.sql

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector for embeddings

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  project_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  topics TEXT[],  -- Array type (better than TEXT in SQLite)
  description TEXT,
  priority TEXT,
  type TEXT,
  content TEXT
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  topic TEXT,
  status TEXT,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  duration TEXT,
  content TEXT,
  topics TEXT[],
  phases TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge events (from knowledge_bank Phase 2)
CREATE TABLE IF NOT EXISTS knowledge_events (
  event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  event_type TEXT NOT NULL,
  data JSONB NOT NULL,  -- JSONB is indexed, queryable
  embedding vector(384),  -- pgvector type
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_plans_project ON plans(project_id);
CREATE INDEX idx_plans_status ON plans(status);
CREATE INDEX idx_sessions_project ON sessions(project_id);
CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_events_project ON knowledge_events(project_id);
CREATE INDEX idx_events_type ON knowledge_events(event_type);
CREATE INDEX idx_events_timestamp ON knowledge_events(timestamp);

-- JSONB indexes for fast queries
CREATE INDEX idx_events_data ON knowledge_events USING gin(data);

-- Full-text search indexes
CREATE INDEX idx_plans_content_fts ON plans USING gin(to_tsvector('english', content));
CREATE INDEX idx_sessions_content_fts ON sessions USING gin(to_tsvector('english', content));

-- Vector similarity index (IVFFlat for <1M vectors, HNSW for >1M)
CREATE INDEX idx_events_embedding ON knowledge_events 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);  -- Tune based on dataset size

-- Row-level security for multi-tenancy (optional)
ALTER TABLE knowledge_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY project_isolation ON knowledge_events
  FOR ALL
  USING (project_id::TEXT = current_setting('app.project_id', true));

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Key differences from SQLite schema:**
- UUID instead of TEXT for IDs (native type, indexed)
- TIMESTAMPTZ instead of TEXT dates (timezone-aware, sortable)
- JSONB instead of TEXT (indexed, queryable fields)
- TEXT[] arrays instead of comma-separated strings
- vector(384) type from pgvector extension
- GIN indexes for full-text and JSONB
- IVFFlat index for vector similarity
- Row-level security for multi-tenancy
- Triggers for auto-updated timestamps

### Phase 4.2: PostgresStorage Implementation (Week 1)

**File structure:**
```
lib/context/
  ├── storage-adapter.ts         # Base class (existing)
  ├── sqlite-storage.ts          # SQLite implementation (existing)
  ├── postgres-storage.ts        # PostgreSQL implementation (NEW)
  ├── storage-factory.ts         # Factory pattern (NEW)
  └── schema-postgres.sql        # Postgres schema (NEW)
```

**Storage factory:**
```typescript
// lib/context/storage-factory.ts
import { StorageAdapter } from './storage-adapter.js';
import { SqliteStorage } from './sqlite-storage.js';
import { PostgresStorage } from './postgres-storage.js';

export type StorageType = 'sqlite' | 'postgres';

export function createStorageAdapter(type?: StorageType): StorageAdapter {
  const storageType = type || (process.env.STORAGE_TYPE as StorageType) || 'sqlite';
  
  switch (storageType) {
    case 'postgres':
      return new PostgresStorage();
    case 'sqlite':
    default:
      return new SqliteStorage();
  }
}

// Convenience exports
export { SqliteStorage, PostgresStorage };
```

**Update MCP server to use factory:**
```typescript
// mcp-server/src/server.ts
import { createStorageAdapter } from '../../lib/context/storage-factory.js';

const storage = createStorageAdapter();
await storage.init(
  process.env.POSTGRES_URL || path.join(os.homedir(), '.aiknowsys')
);
```

**Environment configuration:**
```bash
# .env.example
STORAGE_TYPE=postgres  # or sqlite (default)
POSTGRES_URL=postgresql://user:pass@railway.app:5432/aiknowsys

# Railway deployment
POSTGRES_URL=${{ Railway.POSTGRES_URL }}
STORAGE_TYPE=postgres

# Local development (Docker)
POSTGRES_URL=postgresql://aiknowsys:aiknowsys@localhost:5432/aiknowsys
STORAGE_TYPE=postgres

# Local development (SQLite)
# STORAGE_TYPE=sqlite  (default, no URL needed)
```

### Phase 4.3: Migration Tooling (Week 2)

**CLI command:**
```bash
# Export from SQLite
npx aiknowsys export-db --format jsonl --output backup.jsonl

# Import to PostgreSQL
npx aiknowsys import-db \
  --input backup.jsonl \
  --storage postgres \
  --connection $POSTGRES_URL
```

**Migration script:**
```typescript
// lib/migration/sqlite-to-postgres.ts
import { SqliteStorage } from '../context/sqlite-storage.js';
import { PostgresStorage } from '../context/postgres-storage.js';

export async function migrateToPostgres(
  sqliteDbPath: string,
  postgresUrl: string,
  options: { batchSize?: number; regenerateEmbeddings?: boolean } = {}
) {
  const { batchSize = 1000, regenerateEmbeddings = false } = options;
  
  console.log('🔄 Starting SQLite → PostgreSQL migration...');
  
  // Initialize both storages
  const sqlite = new SqliteStorage();
  await sqlite.init(sqliteDbPath);
  
  const postgres = new PostgresStorage();
  await postgres.init(postgresUrl);
  
  // 1. Migrate projects
  console.log('📁 Migrating projects...');
  const projects = await sqlite.queryProjects();
  await postgres.insertProjects(projects);
  console.log(`✅ Migrated ${projects.length} projects`);
  
  // 2. Migrate plans
  console.log('📋 Migrating plans...');
  const plans = await sqlite.queryPlans({ limit: 100000 });
  for (const batch of chunk(plans.plans, batchSize)) {
    await postgres.insertPlans(batch);
  }
  console.log(`✅ Migrated ${plans.count} plans`);
  
  // 3. Migrate sessions
  console.log('📝 Migrating sessions...');
  const sessions = await sqlite.querySessions({ limit: 100000 });
  for (const batch of chunk(sessions.sessions, batchSize)) {
    await postgres.insertSessions(batch);
  }
  console.log(`✅ Migrated ${sessions.count} sessions`);
  
  // 4. Migrate events (if Phase 2 complete)
  console.log('⚡ Migrating knowledge events...');
  const events = await sqlite.queryAllEvents();
  for (const batch of chunk(events, batchSize)) {
    await postgres.insertEvents(batch);
  }
  console.log(`✅ Migrated ${events.length} events`);
  
  // 5. Regenerate embeddings (optional, improves quality)
  if (regenerateEmbeddings) {
    console.log('🧠 Regenerating embeddings with parallel workers...');
    await postgres.rebuildEmbeddings({ parallel: 10 });
  }
  
  // 6. Verify counts
  console.log('🔍 Verifying migration...');
  const pgPlans = await postgres.queryPlans({ limit: 1 });
  const pgSessions = await postgres.querySessions({ limit: 1 });
  
  if (pgPlans.count !== plans.count) {
    throw new Error(`Plan count mismatch: SQLite ${plans.count} vs Postgres ${pgPlans.count}`);
  }
  if (pgSessions.count !== sessions.count) {
    throw new Error(`Session count mismatch: SQLite ${sessions.count} vs Postgres ${pgSessions.count}`);
  }
  
  console.log('✅ Migration complete!');
  console.log(`   Projects: ${projects.length}`);
  console.log(`   Plans: ${plans.count}`);
  console.log(`   Sessions: ${sessions.count}`);
  console.log(`   Events: ${events.length}`);
  
  await sqlite.close();
  await postgres.close();
}

function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
```

### Phase 4.4: Testing & Validation (Week 2-3)

**Test files:**
```typescript
// test/storage/postgres-storage.test.ts
describe('PostgresStorage', () => {
  let storage: PostgresStorage;
  let testDbUrl: string;
  
  beforeEach(async () => {
    // Use test database
    testDbUrl = process.env.TEST_POSTGRES_URL || 'postgresql://localhost/aiknowsys_test';
    storage = new PostgresStorage();
    await storage.init(testDbUrl);
  });
  
  describe('queryPlans', () => {
    it('should query plans by project', async () => {
      const { plans } = await storage.queryPlans({ projectId: 'test-project' });
      expect(plans).toBeInstanceOf(Array);
    });
    
    it('should filter by status', async () => {
      const { plans } = await storage.queryPlans({ status: 'ACTIVE' });
      expect(plans.every(p => p.status === 'ACTIVE')).toBe(true);
    });
  });
  
  describe('vector search', () => {
    it('should find similar events by embedding', async () => {
      const queryEmbedding = new Float32Array(384).fill(0.1);
      const results = await storage.semanticSearch(queryEmbedding, { limit: 5 });
      expect(results.length).toBeLessThanOrEqual(5);
      expect(results[0]).toHaveProperty('similarity');
    });
  });
  
  afterEach(async () => {
    await storage.close();
  });
});

// test/migration/sqlite-to-postgres.test.ts
describe('SQLite to Postgres migration', () => {
  it('should migrate all data correctly', async () => {
    await migrateToPostgres(
      './test-fixtures/knowledge.db',
      'postgresql://localhost/aiknowsys_test'
    );
    
    // Verify counts match
    const sqlite = new SqliteStorage();
    await sqlite.init('./test-fixtures/knowledge.db');
    
    const postgres = new PostgresStorage();
    await postgres.init('postgresql://localhost/aiknowsys_test');
    
    const sqlitePlans = await sqlite.queryPlans({ limit: 100000 });
    const postgresPlans = await postgres.queryPlans({ limit: 100000 });
    
    expect(postgresPlans.count).toBe(sqlitePlans.count);
  });
});
```

**Validation commands:**
```bash
# Phase 4 validation checklist
npm test -- --grep "postgres"
node bin/cli.js query-plans --storage postgres --status ACTIVE
node bin/cli.js semantic-search "authentication" --storage postgres
npx aiknowsys migrate-to-postgres --dry-run  # Simulate migration
```

---

## 🚀 Deployment Strategies

### Strategy A: Railway (User's Current Setup)

**Prerequisites:**
- Railway account
- PostgreSQL database provisioned

**Deployment:**
```bash
# 1. Create Railway app
railway init

# 2. Add PostgreSQL plugin
railway add postgres

# 3. Set environment variables
railway variables set STORAGE_TYPE=postgres
railway variables set POSTGRES_URL=${{POSTGRES_URL}}

# 4. Deploy
railway up
```

**Railway advantages:**
- ✅ Managed PostgreSQL (automatic backups, scaling)
- ✅ Easy environment variable management
- ✅ Free tier available (500MB storage)
- ✅ Simple rollback (`railway rollback`)

### Strategy B: Docker Compose (Local Development)

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: aiknowsys
      POSTGRES_PASSWORD: aiknowsys
      POSTGRES_DB: aiknowsys
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./lib/context/schema-postgres.sql:/docker-entrypoint-initdb.d/schema.sql
  
  aiknowsys:
    build: .
    environment:
      STORAGE_TYPE: postgres
      POSTGRES_URL: postgresql://aiknowsys:aiknowsys@postgres:5432/aiknowsys
    depends_on:
      - postgres
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

**Usage:**
```bash
# Start Postgres + AIKnowSys
docker-compose up -d

# Run migrations
docker-compose exec aiknowsys npx aiknowsys migrate-to-postgres

# Check logs
docker-compose logs -f

# Stop
docker-compose down
```

### Strategy C: Hybrid (Dual-Write Migration)

**Zero-downtime migration:**
```typescript
// lib/context/hybrid-storage.ts
export class HybridStorage extends StorageAdapter {
  constructor(
    private primary: PostgresStorage,
    private backup: SqliteStorage
  ) {}
  
  async queryPlans(filters?: PlanFilters) {
    // Read from primary (Postgres)
    try {
      return await this.primary.queryPlans(filters);
    } catch (error) {
      // Fallback to backup (SQLite)
      console.warn('Postgres read failed, falling back to SQLite:', error);
      return await this.backup.queryPlans(filters);
    }
  }
  
  async insertPlan(plan: PlanMetadata) {
    // Write to BOTH (dual-write period)
    await Promise.all([
      this.primary.insertPlan(plan),
      this.backup.insertPlan(plan)
    ]);
  }
}
```

**Migration timeline:**
- **Week 1:** Deploy hybrid storage (dual-write)
- **Week 2:** Verify data consistency
- **Week 3:** Migrate historical data
- **Week 4:** Switch to Postgres-only, remove SQLite

---

## 🔒 Security Considerations

### Connection String Security

**Don't:**
```typescript
// ❌ Hardcoded credentials
const url = 'postgresql://user:password@host/db';
```

**Do:**
```typescript
// ✅ Environment variables
const url = process.env.POSTGRES_URL;
if (!url) throw new Error('POSTGRES_URL not set');

// ✅ Or Railway service variables
const url = process.env.DATABASE_URL;  // Railway auto-provides this
```

### Row-Level Security (RLS)

```sql
-- Enable RLS for multi-tenancy
ALTER TABLE knowledge_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their project's data
CREATE POLICY project_isolation ON knowledge_events
  FOR ALL
  USING (
    project_id = current_setting('app.project_id', true)::UUID
  );

-- Set project_id at connection time
SET app.project_id = 'proj_abc123';
```

**In application code:**
```typescript
async queryEvents(projectId: string) {
  const client = await this.pool.connect();
  try {
    // Set RLS context
    await client.query(`SET app.project_id = $1`, [projectId]);
    
    // Query (RLS automatically filters)
    const result = await client.query('SELECT * FROM knowledge_events');
    return result.rows;
  } finally {
    client.release();
  }
}
```

### SSL/TLS

```typescript
// Production: Require SSL
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: true }  // Verify certificate
    : false  // Local dev without SSL
});
```

---

## 📊 Performance Benchmarks

**Expected performance (1M events, Railway Postgres):**

| Operation | SQLite | PostgreSQL | Improvement |
|-----------|--------|------------|-------------|
| **Insert event** | 5ms | 2ms | 2.5x faster |
| **Query by project** | 50ms | 10ms | 5x faster |
| **Semantic search** | 200ms | 30ms | 6.7x faster |
| **Full-text search** | 100ms | 15ms | 6.7x faster |
| **Concurrent writes** | Locked | 20/sec | ∞ (no locks) |
| **Cross-project query** | N/A | 50ms | New capability |

**Why Postgres is faster at scale:**
- ✅ IVFFlat index (approximate nearest neighbor) vs flat scan
- ✅ Parallel query execution
- ✅ Better cache management (shared buffers)
- ✅ JSONB indexed queries (GIN index)
- ✅ No file locks (MVCC)

---

## 💰 Cost Analysis

### Railway Pricing

**Starter plan ($5/month):**
- 512 MB RAM
- 1 GB storage
- Suitable for: <10 users, <100K events

**Developer plan ($20/month):**
- 8 GB RAM
- 100 GB storage
- Suitable for: 10-50 users, <1M events

**Team plan ($100/month):**
- 32 GB RAM
- 500 GB storage
- Read replicas
- Suitable for: 50-200 users, <10M events

### Docker Self-Hosted (Free)

**User's current setup:**
- Railway Postgres for production
- Docker Postgres for local dev
- **Cost: $0** (if using Railway's free tier)

### When to Pay

**Start paying when:**
- >500 MB data (exceed free tier)
- Need read replicas (global team)
- Need automated backups >1 day retention
- Need point-in-time recovery

**Typical growth:**
- 100 sessions/day × 365 days = 36,500 sessions/year
- 20 events/session = 730K events/year
- ~500 MB storage/year
- **Stay on free tier for ~1 year of heavy usage**

---

## ✅ Success Criteria

**Phase 4 complete when:**
- [ ] PostgresStorage class implements all StorageAdapter methods
- [ ] Schema-postgres.sql deployed to Railway
- [ ] Migration tool tested (SQLite → Postgres)
- [ ] Vector search working (pgvector)
- [ ] All tests passing (postgres-storage.test.ts)
- [ ] Documentation updated (setup guide, Railway deployment)
- [ ] Docker Compose config for local dev
- [ ] Performance benchmarks meet targets (see table above)
- [ ] Zero data loss in migration (verification queries pass)

---

## 🎯 How This Fits with Other Plans

### The Full Architecture Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                      │
│                                                              │
│  Conversational Mediator (Optional, Future)                 │
│  "Show me authentication patterns from FastAPI projects"    │
│                                                              │
│  ↓ Translates to tool calls                                 │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   TOOL ORCHESTRATION LAYER                   │
│                                                              │
│  Dynamic Toolsets (Phase 0) - INDEPENDENT                   │
│  - search_tools: "What tools exist for querying?"           │
│  - describe_tools: "What params does semantic-search take?" │
│  - execute_tool: "Run semantic-search query"                │
│                                                              │
│  Impact: 90% token reduction (29K → 3K tokens)              │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA MODEL LAYER                        │
│                                                              │
│  Knowledge Bank Evolution (Phases 1-3) - CORE              │
│  - Phase 1: Cross-repo (~/.aiknowsys/knowledge.db)         │
│  - Phase 2: Event-sourced storage (structured events)       │
│  - Phase 3: Markdown generation (git-friendly exports)      │
│                                                              │
│  Impact: 98% token reduction (160K → 2K tokens)             │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    STORAGE BACKEND LAYER                     │
│                                                              │
│  PostgreSQL Migration (Phase 4) - THIS PLAN (Optional)     │
│                                                              │
│  ┌────────────────────┐        ┌────────────────────┐      │
│  │   SQLite (Local)   │   OR   │  Postgres (Railway) │      │
│  │  - Local-first     │        │  - Multi-tenant     │      │
│  │  - Privacy         │        │  - Global scale     │      │
│  │  - <10 users       │        │  - >10 users        │      │
│  │  - <1M events      │        │  - >1M events       │      │
│  └────────────────────┘        └────────────────────┘      │
│                                                              │
│  Same StorageAdapter interface (drop-in replacement)        │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Sequence

```
Timeline    Week 1-2       Week 3-6         Week 7-10          Week 11+ (Optional)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 0     Dynamic Toolsets (READY TO START)
            └─ ToolRegistry, search/describe/execute tools
            
Phases 1-3                  Knowledge Bank Evolution
                            ├─ Phase 1: Cross-repo foundation
                            ├─ Phase 2: Event storage + embeddings
                            └─ Phase 3: Markdown generation
                            
Phase 4                                          Postgres Migration
(Optional)                                        └─ When >10 users OR >1M events
                                                  
AI UX                                  Quick Wins → Smart Tools → Mediator
(Parallel)                             └─ Can start during Knowledge Bank Phase 2
```

### Key Relationships

**1. Dynamic Toolsets ↔ Postgres:**
- ✅ **Independent** - Tool registration doesn't care about storage
- ✅ Postgres migration doesn't change tool interfaces
- ✅ Can implement in any order

**2. Knowledge Bank ↔ Postgres:**
- 🔗 **Complementary** - Knowledge bank defines data model, Postgres is backend
- ✅ Postgres is **optional enhancement** (SQLite works fine)
- ✅ StorageAdapter abstraction already exists (Phase 1)
- ✅ Migration happens AFTER Phase 2 (event storage) complete

**3. Conversational Mediator ↔ Postgres:**
- ✅ **Orthogonal** - Mediator uses tools, doesn't care about storage
- ✅ Works with SQLite OR Postgres (no changes needed)
- ✅ Local LLM vs Cloud LLM is separate decision from SQLite vs Postgres

**4. Railway/Docker ↔ This Plan:**
- ✅ **Enabler** - User already has Postgres infrastructure
- ✅ Makes migration lower-risk (familiar tools)
- ✅ Docker for local dev, Railway for production
- ✅ Can test locally before deploying

### When to Trigger This Plan

**Metrics to watch:**
```typescript
// Check if Postgres migration needed
const metrics = await getSystemMetrics();

if (
  metrics.concurrentUsers > 10 ||
  metrics.totalEvents > 1_000_000 ||
  metrics.globalTeam ||
  metrics.writeLocksPerHour > 100
) {
  console.log('🚨 Time to migrate to PostgreSQL');
  console.log('See: PLAN_postgres_migration.md');
}
```

**Decision tree:**
```
User growth assessment
├─ <10 users, single region
│  └─ Stick with SQLite ✅
│
├─ 10-50 users, single region
│  └─ Consider Postgres (if write-heavy)
│
└─ >50 users OR global team OR >1M events
   └─ Migrate to Postgres now 🚨
```

---

## 📝 Dependencies

**This plan depends on:**
- ✅ **PLAN_knowledge_bank_evolution Phase 1** - StorageAdapter interface exists
- ✅ **PLAN_knowledge_bank_evolution Phase 2** - Event storage schema defined
- ⏳ **User infrastructure** - Railway Postgres + Docker already available

**This plan enables:**
- 🎯 100+ concurrent users
- 🎯 10M+ events with <50ms queries
- 🎯 Global team with read replicas
- 🎯 Enterprise compliance (audit logs, PITR)

**This plan is optional for:**
- ❌ Small teams (<10 users)
- ❌ Local-first workflows
- ❌ Privacy-critical deployments (no cloud DB)

---

## 🎓 Lessons from User's Context

**User mentioned:**
> "I have postgres running on my railway environment (different project) already and use it at work, running it in a docker is easy"

**This tells us:**
1. ✅ Infrastructure already exists (Railway Postgres)
2. ✅ User familiar with Postgres (used at work)
3. ✅ Docker expertise (local dev workflow solved)
4. ✅ Lower migration risk (known tools)

**Plan adjustments based on this:**
- Skip "Introduction to Postgres" sections (user knows it)
- Focus on AIKnowSys-specific patterns (event storage, embeddings)
- Leverage Railway (user's existing setup)
- Use Docker Compose for local dev (user's preference)
- Make migration Optional Phase 4 (not urgent, but ready when needed)

---

*Part of AIKnowSys strategic evolution. Optional enterprise-scale storage backend when SQLite reaches limits. Designed for Railway deployment with Docker local development.*
