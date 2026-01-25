# Task API - Development Changelog

> Session-by-session development history for AI context preservation.

---

## Session: Add Task Filtering (Jan 23, 2026)

**Goal:** Allow users to filter tasks by status and due date

**Changes:**

- [src/routes/tasks.js](src/routes/tasks.js#L45-L67): Added GET /tasks endpoint with query params
  - Accepts `?status=pending&due_before=2026-01-31`
  - Validates query params with Joi schema
  - Returns filtered tasks from database

- [src/db/queries/tasks.js](src/db/queries/tasks.js#L23-L48): New `getTasksFiltered` function
  - Builds dynamic SQL query with WHERE clauses
  - Uses parameterized queries (SQL injection safe)
  - Handles optional filters gracefully

- [tests/integration/tasks.test.js](tests/integration/tasks.test.js#L89-L134): Added 4 integration tests
  - Filter by status only
  - Filter by due_before only
  - Combined filters
  - No filters (returns all)

**Validation:**
- ✅ Tests: 24 passed (added 4 new tests)
- ✅ Lint: No errors
- ✅ Integration: All 4 filtering scenarios work
- ✅ Manual: Tested with curl, Postman

**Key Learning:** Dynamic SQL building requires careful handling of optional parameters. Use array filtering to build WHERE clauses conditionally:

```javascript
const conditions = [];
const values = [];

if (status) {
  conditions.push(`status = $${values.length + 1}`);
  values.push(status);
}

if (dueBefore) {
  conditions.push(`due_date < $${values.length + 1}`);
  values.push(dueBefore);
}

const whereClause = conditions.length > 0 
  ? `WHERE ${conditions.join(' AND ')}` 
  : '';
```

---

## Session: Fix JWT Token Expiration (Jan 21, 2026)

**Goal:** Users complained tokens expire too quickly (was 15 minutes)

**Changes:**

- [src/utils/jwt.js](src/utils/jwt.js#L12): Changed token expiration from 15m to 1h
  - `expiresIn: '1h'` (was `'15m'`)
  - Balances security vs UX
  - Still short enough to be secure

- [CODEBASE_ESSENTIALS.md](CODEBASE_ESSENTIALS.md#L145-L152): Updated "JWT Token Expiration" gotcha
  - Documented new 1-hour expiration
  - Added recommendation: don't exceed 24 hours
  - Frontend should refresh before expiry

**Validation:**
- ✅ Tests: 24 passed (no test changes needed)
- ✅ Manual: Verified token valid for 1 hour, then expires

**Key Learning:** Token expiration is a trade-off between security and UX. 1 hour is reasonable for a learning project. Production apps should implement refresh tokens.

---

## Session: Add Task Priority Field (Jan 18, 2026)

**Goal:** Allow users to set task priority (low, medium, high)

**Changes:**

- [src/db/migrations/003_add_priority.sql](src/db/migrations/003_add_priority.sql): New migration
  - Added `priority` column (VARCHAR(10), default 'medium')
  - Values constrained to: low, medium, high
  - Created index on priority for filtering

- [src/routes/tasks.js](src/routes/tasks.js#L23-L28): Updated validation schema
  - Added `priority: Joi.string().valid('low', 'medium', 'high').default('medium')`
  - Applied to POST and PUT routes

- [tests/integration/tasks.test.js](tests/integration/tasks.test.js#L55-L67): Added priority tests
  - Create task with priority
  - Default priority is 'medium'
  - Invalid priority rejected

**Validation:**
- ✅ Tests: 24 passed (added 3 new tests)
- ✅ Lint: No errors
- ✅ Migration: Ran successfully on dev and test DBs

**Key Learning:** When adding enum columns, use CHECK constraints in PostgreSQL:

```sql
ALTER TABLE tasks
ADD COLUMN priority VARCHAR(10) DEFAULT 'medium'
CHECK (priority IN ('low', 'medium', 'high'));
```

This prevents invalid data at the database level, not just application level.

---

## Session: Initial Project Setup (Jan 15, 2026)

**Goal:** Set up basic Express API with PostgreSQL and JWT auth

**Changes:**

- [src/server.js](src/server.js): Express app setup
  - Middleware: helmet, cors, express.json()
  - Routes: /api/v1/tasks, /api/v1/auth
  - Error handler middleware

- [src/routes/tasks.js](src/routes/tasks.js): Basic CRUD operations
  - GET /tasks (list user's tasks)
  - POST /tasks (create task)
  - GET /tasks/:id (get single task)
  - PUT /tasks/:id (update task)
  - DELETE /tasks/:id (delete task)

- [src/routes/auth.js](src/routes/auth.js): Authentication
  - POST /register (create user)
  - POST /login (get JWT token)

- [src/middleware/auth.js](src/middleware/auth.js): JWT verification
  - `requireAuth` middleware
  - Validates Bearer token
  - Adds `req.user` with user data

- [src/db/pool.js](src/db/pool.js): PostgreSQL connection pool
  - Uses `pg` driver
  - Configuration from environment variables

- [tests/integration/](tests/integration/): Integration test setup
  - Test database configuration
  - Supertest for API testing
  - Setup/teardown hooks

- [CODEBASE_ESSENTIALS.md](CODEBASE_ESSENTIALS.md): Initial documentation
  - Technology stack
  - Validation matrix
  - Core patterns
  - Architecture decisions

- [AGENTS.md](AGENTS.md): AI agent workflow
  - Session protocol
  - Validation checklist
  - Project-specific invariants

**Validation:**
- ✅ Tests: 17 passed (initial test suite)
- ✅ Lint: No errors
- ✅ Manual: All endpoints tested with Postman

**Key Learning:** Setting up validation matrix from day 1 prevents technical debt. Writing tests first (TDD) catches bugs early and documents expected behavior.

---

*This changelog captures the development journey of Task API. Each session includes what changed, validation results, and lessons learned.*
