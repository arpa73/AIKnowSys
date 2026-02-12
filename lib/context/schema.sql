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

-- Full-text search indices (SQLite FTS5)
CREATE VIRTUAL TABLE IF NOT EXISTS plans_fts USING fts5(
  plan_id UNINDEXED,
  title,
  content,
  content=plans,
  content_rowid=rowid
);

CREATE VIRTUAL TABLE IF NOT EXISTS sessions_fts USING fts5(
  session_id UNINDEXED,
  topic,
  content,
  content=sessions,
  content_rowid=rowid
);

CREATE VIRTUAL TABLE IF NOT EXISTS patterns_fts USING fts5(
  pattern_id UNINDEXED,
  title,
  content,
  content=patterns,
  content_rowid=rowid
);

-- Triggers to keep FTS indices in sync
CREATE TRIGGER IF NOT EXISTS plans_ai AFTER INSERT ON plans BEGIN
  INSERT INTO plans_fts (rowid, plan_id, title, content)
  VALUES (new.rowid, new.id, new.title, new.content);
END;

CREATE TRIGGER IF NOT EXISTS plans_ad AFTER DELETE ON plans BEGIN
  DELETE FROM plans_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER IF NOT EXISTS plans_au AFTER UPDATE ON plans BEGIN
  DELETE FROM plans_fts WHERE rowid = old.rowid;
  INSERT INTO plans_fts (rowid, plan_id, title, content)
  VALUES (new.rowid, new.id, new.title, new.content);
END;

CREATE TRIGGER IF NOT EXISTS sessions_ai AFTER INSERT ON sessions BEGIN
  INSERT INTO sessions_fts (rowid, session_id, topic, content)
  VALUES (new.rowid, new.id, new.topic, new.content);
END;

CREATE TRIGGER IF NOT EXISTS sessions_ad AFTER DELETE ON sessions BEGIN
  DELETE FROM sessions_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER IF NOT EXISTS sessions_au AFTER UPDATE ON sessions BEGIN
  DELETE FROM sessions_fts WHERE rowid = old.rowid;
  INSERT INTO sessions_fts (rowid, session_id, topic, content)
  VALUES (new.rowid, new.id, new.topic, new.content);
END;

CREATE TRIGGER IF NOT EXISTS patterns_ai AFTER INSERT ON patterns BEGIN
  INSERT INTO patterns_fts (rowid, pattern_id, title, content)
  VALUES (new.rowid, new.id, new.title, new.content);
END;

CREATE TRIGGER IF NOT EXISTS patterns_ad AFTER DELETE ON patterns BEGIN
  DELETE FROM patterns_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER IF NOT EXISTS patterns_au AFTER UPDATE ON patterns BEGIN
  DELETE FROM patterns_fts WHERE rowid = old.rowid;
  INSERT INTO patterns_fts (rowid, pattern_id, title, content)
  VALUES (new.rowid, new.id, new.title, new.content);
END;
