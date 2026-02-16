---
category: "project_specific"
pattern_type: "architecture"
confidence: "high"
reusability: "high"
discovered: "2026-02-16"
validated: "2026-02-16"
tests_passing: 18
---

# Hybrid Storage Pattern (Event-Sourced + Markdown)

## Trigger Words
`hybrid storage`, `event sourcing`, `backward compatible storage`, `events and markdown`, `dual write pattern`

## Context
Transitioning from markdown-only storage to event-sourced storage while maintaining backward compatibility with existing sessions/plans that don't have events.

## The Pattern

### Problem
- Need to store structured events for AI optimization (queryable, less tokens)
- Must maintain markdown for human readability
- Cannot break existing sessions that only have markdown
- Want smooth migration path (not big-bang cutover)

### Solution: Hybrid Write, Intelligent Read

**Write Path (Optional Event Storage):**
```typescript
async function createSession(options: {
  title: string;
  topics: string[];
  storage?: SqliteStorage;  // 🔑 Optional parameter
}) {
  if (storage) {
    // NEW: Event-sourced path
    // 1. Create events (atomic facts)
    const events = [
      { eventId: `evt-${randomUUID()}`, eventType: EventType.SESSION_STARTED, ... },
      { eventId: `evt-${randomUUID()}`, eventType: EventType.GOAL_DEFINED, ... }
    ];
    
    // 2. Generate markdown FROM events
    const markdown = markdownGenerator.generateSessionMarkdown(events, title);
    
    // 3. Store session record FIRST (FK constraint)
    await storage.insertSession({ id, content: markdown, ... });
    
    // 4. Store events (FK satisfied)
    await Promise.all(events.map(e => storage.insertEvent(e)));
  } else {
    // LEGACY: Template-based path (backward compatible)
    const markdown = generateSessionTemplate({ title, topics });
    await fs.writeFile(filePath, markdown);
  }
}
```

**Read Path (Intelligent Fallback):**
```typescript
async function readSession(sessionId: string, storage?: SqliteStorage) {
  if (storage) {
    // Try events first
    const events = await storage.queryEvents({ sessionId });
    
    if (events.length > 0) {
      // NEW: Regenerate markdown from events
      return markdownGenerator.generateSessionMarkdown(events);
    }
  }
  
  // FALLBACK: Read markdown file (legacy sessions)
  const markdown = await fs.readFile(sessionFilePath, 'utf-8');
  return markdown;
}
```

### Key Implementation Details

**1. UUID Event IDs (Not Date.now())**
```typescript
// ❌ BAD: Race condition if events created in same millisecond
eventId: `evt-${Date.now()}-1`

// ✅ GOOD: Guaranteed unique IDs
import { randomUUID } from 'crypto';
eventId: `evt-${randomUUID()}`
```

**2. Foreign Key Dependency Chain**
```typescript
// Order matters! FK constraints: events → sessions → projects

// 1. Create project (idempotent - ignore UNIQUE constraint errors)
try {
  await storage.insertProject({ id: projectId, ... });
} catch (error) {
  if (!error.message?.includes('UNIQUE constraint')) throw error;
}

// 2. Create session record (required for event FK constraint)
await storage.insertSession({ id: sessionId, project_id: projectId, ... });

// 3. NOW store events (FK satisfied)
await Promise.all(events.map(e => storage.insertEvent(e)));
```

**3. Parameter Mapping (Internal vs Schema)**
```typescript
// Interface uses internal names:
insertSession({ created: timestamp, updated: timestamp })

// Maps to database columns:
INSERT INTO sessions (..., created_at, updated_at) VALUES (...)
```

**4. AI-Friendly Error Handling**
```typescript
import { AIFriendlyErrorBuilder } from '../utils/error-builder.js';

try {
  await storage.insertProject({ ... });
} catch (error) {
  if (!error.message?.includes('UNIQUE constraint')) {
    throw AIFriendlyErrorBuilder.databaseError(
      `Failed to create project record for '${projectId}': ${error.message}`,
      'Check database permissions and ensure SQLite storage is initialized'
    );
  }
  // Silently ignore duplicate - project already exists
}
```

### Event-Driven Markdown Format

**Important:** Markdown generated from events has DIFFERENT format than static template:

```markdown
# Static Template Format
## Goal
[Goal text here]

## Changes
[Changes here]

# Event-Driven Format
## Session: [Title] ([Date])

**Goal:** [Goal text]

**Changes:**
- [Change 1]
- [Change 2]
```

**Why:** Event format can evolve independently from template structure.

### Migration Strategy

**Phase 1: Dual Write (Current)**
- Write both events and markdown
- Read events if available, fallback to markdown
- Zero disruption to existing workflow

**Phase 2: Events-First (Future)**
- Write only events
- Generate markdown on-demand for human review
- Markdown becomes export/cache, not source of truth

**Phase 3: Event-Only (Vision)**
- Remove markdown storage entirely
- MCP tools query events directly
- Human readable exports via CLI commands

### Test Coverage Strategy

**Integration Tests (test/integration/hybrid-storage.test.ts):**
- ✅ Hybrid write creates both events and markdown
- ✅ Event-to-markdown sync (dynamic generation)
- ✅ Backward compatibility (pure markdown sessions work)
- ✅ Migration tool integration (markdown → events conversion)

**Unit Tests (test/events/hybrid-storage.test.ts):**
- ✅ Event storage in database
- ✅ Markdown generation from events
- ✅ Format matching (events vs template)
- ✅ Data preservation (all event data in markdown)
- ✅ Intelligent fallback (events > markdown > error)
- ✅ Corrupted event handling (graceful degradation)

### Benefits

**For AI Agents:**
- ✅ Queryable structured events (filter by type, date, project)
- ✅ Token efficient (fetch only relevant events)
- ✅ Backward compatible (works with old sessions)
- ✅ Smooth transition (no big-bang migration)

**For Humans:**
- ✅ Still get readable markdown
- ✅ No workflow changes
- ✅ Can review event-driven vs template format
- ✅ Migration path is opt-in

### Gotchas

1. **FK Constraint Order:** Project → Session → Events (must create in order)
2. **Parameter Names:** `created/updated` (interface) vs `created_at/updated_at` (schema)
3. **UUID Imports:** Must use `crypto` not `uuid` package (Node built-in)
4. **Format Divergence:** Event markdown ≠ template markdown (by design)
5. **Idempotency:** Project creation must handle UNIQUE constraint gracefully

### When to Use

**Use hybrid storage when:**
- ✅ Transitioning from file-based to database storage
- ✅ Need backward compatibility with existing data
- ✅ Want gradual migration (not all-at-once)
- ✅ AI optimization important but human readability required

**Don't use hybrid storage if:**
- ❌ Already have pure event-sourced system
- ❌ No legacy data to support
- ❌ Can do clean cutover (no migration needed)
- ❌ Storage overhead not acceptable

### Related Patterns

- **Event Sourcing** - Events as source of truth
- **CQRS** - Command/Query Responsibility Segregation (events = command, markdown = query)
- **Strangler Fig** - Gradually replace old system with new
- **Graceful Degradation** - Fallback to markdown when events unavailable

### Files Implementing This Pattern

- [lib/core/create-session.ts](lib/core/create-session.ts#L110-L172) - Hybrid write implementation
- [lib/events/markdown-generator.ts](lib/events/markdown-generator.ts) - Events → markdown conversion
- [lib/migration/event-migrator.ts](lib/migration/event-migrator.ts) - Markdown → events migration
- [lib/context/sqlite-storage.ts](lib/context/sqlite-storage.ts) - Event storage adapter

### Future Enhancements

**Planned:**
- [ ] Event embeddings for semantic search
- [ ] Event-based diff/changelog generation
- [ ] Cross-project event queries
- [ ] Event replay/time-travel debugging

**Under Consideration:**
- [ ] Markdown caching (regenerate only when events change)
- [ ] Partial markdown updates (append-only optimization)
- [ ] Event compression (store deltas, not full snapshots)
