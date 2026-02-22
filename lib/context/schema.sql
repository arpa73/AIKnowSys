-- AIKnowSys SQLite Schema
-- Cross-repository knowledge management database
-- Location: ~/.aiknowsys/knowledge.db (user-level) or per-project

-- Projects (repositories using AIKnowSys)
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,           -- Unique repo ID (from git remote or .aiknowsys.config)
  name TEXT NOT NULL,            -- Human-readable project name
  path TEXT,                     -- Absolute path to repository
  tech_stack JSON,               -- Technology snapshot { runtime, language, frameworks }
  created_at TEXT NOT NULL,      -- ISO 8601 timestamp
  updated_at TEXT NOT NULL       -- ISO 8601 timestamp
);

-- Project Invariants (Critical rules for AI agents)
CREATE TABLE IF NOT EXISTS invariants (
  id TEXT PRIMARY KEY,
  number INTEGER NOT NULL,
  name TEXT NOT NULL,
  rule TEXT NOT NULL,
  details TEXT NOT NULL, -- JSON string array
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Plans (implementation plans, can span multiple projects)
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,           -- Plan identifier (e.g., PLAN_auth_jwt)
  project_id TEXT,               -- Project this plan belongs to (nullable for cross-project)
  title TEXT NOT NULL,           -- Plan title
  status TEXT NOT NULL,          -- ACTIVE, PAUSED, PLANNED, COMPLETE, CANCELLED
  author TEXT NOT NULL,          -- Plan owner/author
  priority TEXT,                 -- high, medium, low
  type TEXT,                     -- feature, refactor, bugfix, research
  description TEXT,              -- Optional description/summary
  content TEXT,                  -- Full plan markdown content
  topics JSON,                   -- Tags/topics for categorization
  created_at TEXT NOT NULL,      -- ISO 8601 timestamp
  updated_at TEXT NOT NULL,      -- ISO 8601 timestamp
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_plans_project ON plans(project_id);
CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status);
CREATE INDEX IF NOT EXISTS idx_plans_author ON plans(author);

-- Sessions (work sessions, project-specific)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,           -- Session identifier (date-based)
  project_id TEXT NOT NULL,      -- Project this session belongs to
  date TEXT NOT NULL,            -- Session date (YYYY-MM-DD)
  topic TEXT NOT NULL,           -- Session topic/title
  status TEXT,                   -- active, paused, complete
  plan_id TEXT,                  -- Related plan (if any)
  duration TEXT,                 -- Session duration (if recorded)
  content TEXT,                  -- Full session markdown content
  topics JSON,                   -- Tags/topics for categorization
  phases JSON,                   -- Phase/milestone markers
  created_at TEXT NOT NULL,      -- ISO 8601 timestamp
  updated_at TEXT NOT NULL,      -- ISO 8601 timestamp
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_plan ON sessions(plan_id);

-- Patterns (learned patterns, reusable across projects)
CREATE TABLE IF NOT EXISTS patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,        -- error_resolution, workarounds, debugging_techniques, etc.
  title TEXT NOT NULL,           -- Pattern title
  content TEXT NOT NULL,         -- Pattern content (markdown)
  tags JSON,                     -- Tags for searching
  source_project_id TEXT,        -- Project where pattern was discovered
  applied_count INTEGER DEFAULT 0, -- How many times applied
  created_at TEXT NOT NULL,      -- ISO 8601 timestamp
  FOREIGN KEY (source_project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_patterns_category ON patterns(category);

-- Knowledge Events (Phase 2: Event-Sourced Storage)
-- Structured events replace markdown blobs for AI-optimized queries
CREATE TABLE IF NOT EXISTS knowledge_events (
  event_id TEXT PRIMARY KEY,           -- Unique event identifier
  project_id TEXT NOT NULL,            -- Project this event belongs to
  session_id TEXT,                     -- Session this event was captured in
  plan_id TEXT,                        -- Plan this event relates to
  timestamp TEXT NOT NULL,             -- ISO 8601 timestamp
  event_type TEXT NOT NULL,            -- Event type discriminator (task_completed, decision_made, etc.)
  data TEXT NOT NULL,                  -- JSON event payload (structured by type)
  embedding BLOB,                      -- 384-dimensional vector (Float32Array) for semantic search
  created_at TEXT NOT NULL,            -- Event creation timestamp
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_project ON knowledge_events(project_id);
CREATE INDEX IF NOT EXISTS idx_events_session ON knowledge_events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_plan ON knowledge_events(plan_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON knowledge_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON knowledge_events(timestamp);

-- Full-text search for event data
CREATE VIRTUAL TABLE IF NOT EXISTS events_fts USING fts5(
  event_id UNINDEXED,
  event_type,
  data,
  content=knowledge_events,
  content_rowid=rowid
);

-- Triggers to keep FTS index synchronized
CREATE TRIGGER IF NOT EXISTS events_ai AFTER INSERT ON knowledge_events BEGIN
  INSERT INTO events_fts(rowid, event_id, event_type, data)
  VALUES (new.rowid, new.event_id, new.event_type, new.data);
END;

CREATE TRIGGER IF NOT EXISTS events_ad AFTER DELETE ON knowledge_events BEGIN
  INSERT INTO events_fts(events_fts, rowid, event_id, event_type, data)
  VALUES ('delete', old.rowid, old.event_id, old.event_type, old.data);
END;

CREATE TRIGGER IF NOT EXISTS events_au AFTER UPDATE ON knowledge_events BEGIN
  INSERT INTO events_fts(events_fts, rowid, event_id, event_type, data)
  VALUES ('delete', old.rowid, old.event_id, old.event_type, old.data);
  INSERT INTO events_fts(rowid, event_id, event_type, data)
  VALUES (new.rowid, new.event_id, new.event_type, new.data);
END;

-- Full-text search indices (SQLite FTS5)
-- Self-managed FTS tables (not external content) to avoid SQLITE_CORRUPT_VTAB errors
-- Column name: id (maps to id in source tables)
CREATE VIRTUAL TABLE IF NOT EXISTS plans_fts USING fts5(
  id UNINDEXED,
  title,
  content
);

CREATE VIRTUAL TABLE IF NOT EXISTS sessions_fts USING fts5(
  id UNINDEXED,
  topic,
  content
);

CREATE VIRTUAL TABLE IF NOT EXISTS patterns_fts USING fts5(
  id UNINDEXED,
  title,
  content
);

CREATE VIRTUAL TABLE IF NOT EXISTS invariants_fts USING fts5(
  id UNINDEXED,
  name,
  rule
);

-- Triggers to keep FTS indices in sync
-- Note: Uses rowid-based operations for FTS5 compatibility
-- FTS5 UPDATE is problematic, so we use DELETE + INSERT pattern
-- Column name in FTS tables is 'id' (not plan_id/session_id/pattern_id)
CREATE TRIGGER IF NOT EXISTS plans_ai AFTER INSERT ON plans BEGIN
  INSERT INTO plans_fts (rowid, id, title, content)
  VALUES (new.rowid, new.id, new.title, new.content);
END;

CREATE TRIGGER IF NOT EXISTS plans_ad AFTER DELETE ON plans BEGIN
  DELETE FROM plans_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER IF NOT EXISTS plans_au AFTER UPDATE ON plans BEGIN
  DELETE FROM plans_fts WHERE rowid = old.rowid;
  INSERT INTO plans_fts (rowid, id, title, content)
  VALUES (new.rowid, new.id, new.title, new.content);
END;

CREATE TRIGGER IF NOT EXISTS sessions_ai AFTER INSERT ON sessions BEGIN
  INSERT INTO sessions_fts (rowid, id, topic, content)
  VALUES (new.rowid, new.id, new.topic, new.content);
END;

CREATE TRIGGER IF NOT EXISTS sessions_ad AFTER DELETE ON sessions BEGIN
  DELETE FROM sessions_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER IF NOT EXISTS sessions_au AFTER UPDATE ON sessions BEGIN
  DELETE FROM sessions_fts WHERE rowid = old.rowid;
  INSERT INTO sessions_fts (rowid, id, topic, content)
  VALUES (new.rowid, new.id, new.topic, new.content);
END;

CREATE TRIGGER IF NOT EXISTS patterns_ai AFTER INSERT ON patterns BEGIN
  INSERT INTO patterns_fts (rowid, id, title, content)
  VALUES (new.rowid, new.id, new.title, new.content);
END;

CREATE TRIGGER IF NOT EXISTS patterns_ad AFTER DELETE ON patterns BEGIN
  DELETE FROM patterns_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER IF NOT EXISTS patterns_au AFTER UPDATE ON patterns BEGIN
  DELETE FROM patterns_fts WHERE rowid = old.rowid;
  INSERT INTO patterns_fts (rowid, id, title, content)
  VALUES (new.rowid, new.id, new.title, new.content);
END;

CREATE TRIGGER IF NOT EXISTS invariants_ai AFTER INSERT ON invariants BEGIN
  INSERT INTO invariants_fts (rowid, id, name, rule)
  VALUES (new.rowid, new.id, new.name, new.rule);
END;

CREATE TRIGGER IF NOT EXISTS invariants_ad AFTER DELETE ON invariants BEGIN
  DELETE FROM invariants_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER IF NOT EXISTS invariants_au AFTER UPDATE ON invariants BEGIN
  DELETE FROM invariants_fts WHERE rowid = old.rowid;
  INSERT INTO invariants_fts (rowid, id, name, rule)
  VALUES (new.rowid, new.id, new.name, new.rule);
END;

CREATE TRIGGER IF NOT EXISTS invariants_au AFTER UPDATE ON invariants BEGIN
  UPDATE invariants_fts SET name = new.name, rule = new.rule WHERE id = old.id;
END;

-- Reviews (Code/Plan reviews)
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  target_id TEXT NOT NULL,       -- plan_id or session_id
  author TEXT NOT NULL,
  status TEXT NOT NULL,          -- PENDING, ACTIVE, ADDRESSED
  content TEXT NOT NULL,         -- Review comments/markdown
  created_at TEXT NOT NULL,      -- ISO 8601 timestamp
  updated_at TEXT NOT NULL,      -- ISO 8601 timestamp
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews(target_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_project ON reviews(project_id);

-- Links (Relationships between entities)
CREATE TABLE IF NOT EXISTS links (
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  type TEXT NOT NULL,            -- depends_on, relates_to, blocks, etc.
  metadata JSON,                 -- Optional metadata
  created_at TEXT NOT NULL,      -- ISO 8601 timestamp
  PRIMARY KEY (source_id, target_id, type)
);

CREATE INDEX IF NOT EXISTS idx_links_source ON links(source_id);
CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_id);

-- User State (Context constraints & focus)
CREATE TABLE IF NOT EXISTS user_state (
  user_id TEXT PRIMARY KEY,      -- Unique user identifier (e.g., git config user.email)
  project_id TEXT,               -- Current active project
  active_plan_id TEXT,           -- Current active plan
  last_session_id TEXT,          -- Last active session
  focus_context JSON,            -- Current focus structure { files: [], topic: "" }
  updated_at TEXT NOT NULL,      -- Last update timestamp
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (active_plan_id) REFERENCES plans(id) ON DELETE SET NULL,
  FOREIGN KEY (last_session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_state_project ON user_state(project_id);

