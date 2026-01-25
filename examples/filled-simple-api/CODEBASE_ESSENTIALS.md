# Task API - Codebase Essentials

> **Last Updated:** January 20, 2026  
> **Purpose:** Simple REST API for task management (learning project)  
> **Maintainer:** Development Team

---

## 1. Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | 20.11.0 |
| Framework | Express | 4.18.2 |
| Database | PostgreSQL | 15.3 |
| ORM | None (raw SQL with pg) | pg@8.11.3 |
| Testing | Jest | 29.7.0 |
| API Testing | Supertest | 6.3.3 |
| Validation | Joi | 17.11.0 |
| Auth | JWT | jsonwebtoken@9.0.2 |
| Linting | ESLint | 8.55.0 |
| Formatting | Prettier | 3.1.1 |

**Environment:**
- Development: Node.js 20.11.0 with nodemon
- Production: Node.js 20.11.0 on Railway
- Database: PostgreSQL 15.3 (local) / Supabase (prod)

---

## 2. Validation Matrix

**⚠️ ALWAYS run these commands before claiming work is complete:**

| Changed | Command | Expected Result |
|---------|---------|-----------------|
| Any JS file | `npm test` | All tests pass (✓ 24 passed) |
| API routes | `npm run test:integration` | Integration tests pass |
| Any code | `npm run lint` | No ESLint errors |
| Database | `npm run db:test` | Test DB migrations work |
| Env vars | `npm run check:env` | All required vars present |

**Quick validation (for small changes):**
```bash
npm run lint && npm test
```

**Full validation (before commits):**
```bash
npm run lint && npm test && npm run test:integration
```

---

## 3. Project Structure

```
task-api/
├── src/
│   ├── routes/          # Express route handlers
│   │   ├── tasks.js     # Task CRUD operations
│   │   ├── auth.js      # Login/register
│   │   └── index.js     # Route aggregator
│   ├── middleware/      # Express middleware
│   │   ├── auth.js      # JWT verification
│   │   ├── validate.js  # Joi validation
│   │   └── errors.js    # Error handler
│   ├── db/              # Database layer
│   │   ├── pool.js      # pg connection pool
│   │   ├── migrations/  # SQL migration files
│   │   └── queries/     # SQL query builders
│   ├── utils/           # Shared utilities
│   │   ├── jwt.js       # Token helpers
│   │   └── hash.js      # Password hashing
│   └── server.js        # Express app setup
├── tests/
│   ├── unit/            # Unit tests (logic)
│   ├── integration/     # API integration tests
│   └── setup.js         # Test database setup
├── .env.example         # Environment template
├── package.json
└── README.md
```

**Key conventions:**
- Routes: `/api/v1/<resource>`
- Test files: `*.test.js` next to source
- DB queries: Separate from route logic
- Middleware: Reusable, single purpose

---

## 4. Core Patterns

### 4.1 Database Queries

**Pattern:** Use parameterized queries, never string concatenation

```javascript
// ✅ GOOD: Parameterized query
async function getTaskById(id) {
  const result = await pool.query(
    'SELECT * FROM tasks WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

// ❌ BAD: SQL injection risk
async function getTaskById(id) {
  const result = await pool.query(
    `SELECT * FROM tasks WHERE id = ${id}`  // NEVER DO THIS
  );
  return result.rows[0];
}
```

### 4.2 Error Handling

**Pattern:** All async route handlers wrapped in try/catch, errors passed to middleware

```javascript
// ✅ GOOD: Centralized error handling
router.post('/tasks', async (req, res, next) => {
  try {
    const task = await createTask(req.body);
    res.status(201).json(task);
  } catch (error) {
    next(error);  // Let middleware handle it
  }
});

// Error middleware (in middleware/errors.js):
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
}
```

### 4.3 Request Validation

**Pattern:** Validate with Joi before processing

```javascript
const taskSchema = Joi.object({
  title: Joi.string().required().min(1).max(200),
  description: Joi.string().max(1000),
  status: Joi.string().valid('pending', 'in_progress', 'completed'),
  due_date: Joi.date().iso()
});

// Middleware usage:
router.post('/tasks', 
  validate(taskSchema),  // Validates req.body
  async (req, res, next) => {
    // req.body is guaranteed valid here
  }
);
```

### 4.4 Authentication

**Pattern:** JWT in Authorization header, middleware verifies

```javascript
// In routes:
router.get('/tasks', 
  requireAuth,  // Middleware checks JWT
  async (req, res) => {
    // req.user is populated by middleware
    const tasks = await getTasksByUser(req.user.id);
    res.json(tasks);
  }
);

// Middleware:
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // Add user to request
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

---

## 5. Critical Invariants

### 5.1 Environment Variables Required

**What:** `JWT_SECRET`, `DATABASE_URL` must be set before startup

**Why:** App won't work without database connection and JWT signing

**Example:**
```javascript
// In server.js startup:
const required = ['JWT_SECRET', 'DATABASE_URL'];
for (const env of required) {
  if (!process.env[env]) {
    throw new Error(`Missing required env var: ${env}`);
  }
}
```

**Enforcement:** Server crashes on startup if missing

### 5.2 All Database Queries Must Use Connection Pool

**What:** Use `pool` from `db/pool.js`, never create new connections

**Why:** Prevents connection leaks, manages connection limits

**Example:**
```javascript
// ✅ GOOD:
import pool from '../db/pool.js';
const result = await pool.query('SELECT ...');

// ❌ BAD:
const client = new pg.Client({ ... });  // NEVER
```

**Enforcement:** Code review, no `new pg.Client()` allowed

### 5.3 Passwords Must Be Hashed Before Storage

**What:** Use `bcrypt` with cost factor 10, never store plain text

**Why:** Security requirement, prevents credential theft

**Example:**
```javascript
import bcrypt from 'bcrypt';

// Hash on registration:
const hashed = await bcrypt.hash(password, 10);

// Verify on login:
const valid = await bcrypt.compare(password, hashed);
```

**Enforcement:** Code review, test suite checks

### 5.4 API Responses Must Be JSON

**What:** All responses must set `Content-Type: application/json`

**Why:** Client expects JSON, simplifies parsing

**Example:**
```javascript
// Express does this automatically with res.json()
res.json({ success: true, data: tasks });
```

**Enforcement:** Integration tests verify Content-Type header

---

## 6. Common Gotchas

### 6.1 PostgreSQL Connection Pool Exhaustion

**Problem:** Tests hang if connection pool runs out

**Cause:** Not releasing clients, too many concurrent connections

**Solution:**
```javascript
// Always use pool.query(), not pool.connect()
// pool.query() auto-releases

// If you must use connect():
const client = await pool.connect();
try {
  await client.query('...');
} finally {
  client.release();  // ALWAYS in finally block
}
```

### 6.2 JWT Token Expiration

**Problem:** Token expires mid-session (set to 1 hour)

**Cause:** Short expiration for security

**Solution:**
- Frontend should refresh tokens before expiry
- Backend returns `401` on expired token
- Don't extend expiration beyond 24 hours

### 6.3 Async/Await Without Try/Catch

**Problem:** Unhandled promise rejections crash server

**Cause:** Forgot try/catch in async route handler

**Solution:**
```javascript
// ❌ BAD: No error handling
router.get('/tasks', async (req, res) => {
  const tasks = await getTasks();  // Might throw
  res.json(tasks);
});

// ✅ GOOD: Catch and forward to middleware
router.get('/tasks', async (req, res, next) => {
  try {
    const tasks = await getTasks();
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});
```

### 6.4 Joi Validation Error Messages

**Problem:** Default Joi errors are cryptic: `"value" must be a string`

**Cause:** Joi uses generic field names

**Solution:**
```javascript
// Customize error messages:
const schema = Joi.object({
  title: Joi.string().required().messages({
    'string.empty': 'Task title cannot be empty',
    'any.required': 'Task title is required'
  })
});
```

### 6.5 Date Handling with PostgreSQL

**Problem:** PostgreSQL returns timestamps in server timezone, not UTC

**Cause:** Default pg driver behavior

**Solution:**
```javascript
// Store as timestamptz (with timezone):
CREATE TABLE tasks (
  created_at TIMESTAMPTZ DEFAULT NOW()
);

// Always parse with timezone awareness:
const createdAt = new Date(task.created_at);  // Parses as UTC
```

---

## 7. Testing Patterns

### 7.1 Test Organization

**Unit tests:** Test individual functions in isolation
```javascript
// tests/unit/utils/jwt.test.js
describe('JWT Utils', () => {
  test('generateToken creates valid JWT', () => {
    const token = generateToken({ id: 1 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe(1);
  });
});
```

**Integration tests:** Test full API endpoints
```javascript
// tests/integration/tasks.test.js
describe('POST /api/v1/tasks', () => {
  test('creates task with valid data', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ title: 'Test task' });
    
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test task');
  });
});
```

### 7.2 Test Database

**Pattern:** Separate test database, reset between tests

```javascript
// tests/setup.js
beforeAll(async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  await pool.query('DELETE FROM tasks');
  await pool.query('DELETE FROM users');
});

afterEach(async () => {
  await pool.query('DELETE FROM tasks');
});

afterAll(async () => {
  await pool.end();
});
```

### 7.3 Test Coverage

**Minimum:** 80% coverage on critical paths
- Routes: 100% (all endpoints tested)
- Middleware: 100% (auth, validation, errors)
- Utils: 90% (edge cases tested)
- DB queries: 80% (happy path + errors)

**Command:**
```bash
npm test -- --coverage
```

---

## 8. Architecture Decisions

### 8.1 No ORM (Raw SQL with pg)

**Decision:** Use `pg` driver directly, write SQL queries manually

**Rationale:**
- Learning project - want to understand SQL
- Simple app - don't need ORM complexity
- Better performance for simple queries
- No abstraction layer to learn

**Trade-offs:**
- ✅ Pros: Full control, better performance, no ORM overhead
- ⚠️ Cons: More boilerplate, manual migrations, no type safety

**Alternatives considered:**
- Prisma: Too heavy for simple API
- Drizzle: Good option, but wanted to learn raw SQL first
- TypeORM: Too complex for this use case

### 8.2 JWT for Authentication

**Decision:** Use stateless JWT tokens, no session storage

**Rationale:**
- Simple to implement
- No session store needed
- Scalable (no shared state)
- Good for learning auth concepts

**Trade-offs:**
- ✅ Pros: Stateless, simple, scalable
- ⚠️ Cons: Can't invalidate tokens, larger payload size

**Alternatives considered:**
- Sessions + cookies: More complex, needs session store
- OAuth: Overkill for learning project

### 8.3 Joi for Validation

**Decision:** Use Joi schema validation for all request bodies

**Rationale:**
- Declarative validation (readable)
- Good error messages (with customization)
- Well-documented, popular library
- Catches errors before DB queries

**Trade-offs:**
- ✅ Pros: Clear schemas, good errors, prevents bad data
- ⚠️ Cons: Extra dependency, slight performance cost

**Alternatives considered:**
- Manual validation: Too much boilerplate
- Class-validator: Requires TypeScript
- Zod: Considered, but Joi more beginner-friendly

---

## 9. Change Management

### 9.1 When to Create OpenSpec Proposal

**Direct implementation (no proposal):**
- Bug fixes
- Documentation updates
- Refactoring without behavior change
- Dependency updates

**Create proposal first:**
- New API endpoints
- Database schema changes
- Authentication/authorization changes
- Breaking changes

**Command:**
```bash
openspec create add-task-priority
```

### 9.2 Branching Strategy

**Branches:**
- `main`: Production-ready code
- `feature/xyz`: New features
- `fix/xyz`: Bug fixes

**Workflow:**
1. Create feature branch from `main`
2. Implement + test
3. Create PR to `main`
4. Merge after review (or self-merge for solo dev)

### 9.3 Deployment

**Environment:**
- Production: Railway
- Database: Supabase PostgreSQL
- CI/CD: GitHub Actions

**Process:**
1. Merge to `main`
2. GitHub Action runs tests
3. Auto-deploy to Railway on success

---

## 10. Development Workflow

### 10.1 Starting Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your values

# 3. Create database
createdb task_api_dev
createdb task_api_test

# 4. Run migrations
npm run db:migrate

# 5. Start dev server
npm run dev  # Runs nodemon
```

### 10.2 Before Every Commit

```bash
# 1. Run linter
npm run lint

# 2. Run tests
npm test

# 3. Check coverage (optional)
npm test -- --coverage

# 4. Manual smoke test
# - Start server: npm run dev
# - Test key endpoints with curl/Postman
```

### 10.3 Adding a New Endpoint

1. **Write integration test first** (TDD):
   ```javascript
   // tests/integration/tasks.test.js
   test('GET /tasks returns user tasks', async () => {
     // Test code here
   });
   ```

2. **Create route handler**:
   ```javascript
   // src/routes/tasks.js
   router.get('/tasks', requireAuth, async (req, res, next) => {
     // Implementation
   });
   ```

3. **Add validation schema** (if POST/PUT):
   ```javascript
   const schema = Joi.object({ ... });
   ```

4. **Run validation matrix**:
   ```bash
   npm run lint && npm test
   ```

5. **Update this document** if new patterns introduced

---

*This document is the single source of truth for AI assistants and developers working on Task API.*
