# TaskAPI - Codebase Essentials

> **Last Updated:** January 25, 2026  
> **Purpose:** Simple REST API for task management (learning project)

---

## 1. Technology Snapshot

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |
| Language | TypeScript |
| Framework | Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Testing | Vitest |
| Validation | Zod |

---

## 2. Validation Matrix

**Critical Rule:** All commands must pass before committing.

| Command | Purpose | Expected |
|---------|---------|----------|
| `npm test` | Tests | All tests pass |
| `npm run type-check` | Type Check | No TypeScript errors |
| `npm run lint` | Lint | No ESLint errors |

---

## 3. Core Patterns

### API Routes
```typescript
// All routes in src/routes/*.ts
app.get('/api/tasks', async (req, res) => {
  const tasks = await prisma.task.findMany();
  res.json(tasks);
});
```
**Why:** Consistent REST pattern, easy to test

### Request Validation
```typescript
// Using Zod for all request validation
const createTaskSchema = z.object({
  title: z.string().min(1).max(100),
  completed: z.boolean().optional()
});

const body = createTaskSchema.parse(req.body);
```
**Why:** Type-safe validation, clear error messages

### Error Handling
```typescript
// Global error middleware in src/middleware/errors.ts
app.use((err, req, res, next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.errors });
  }
  res.status(500).json({ error: 'Internal server error' });
});
```
**Why:** Consistent error responses, proper status codes

---

## 4. Critical Invariants

**Rules that must NEVER be violated:**

1. **All API endpoints require validation**
   - **What:** Every POST/PUT/PATCH must use Zod schema
   - **Why:** Prevents invalid data from reaching database
   - **Example:** `const data = schema.parse(req.body)`

2. **Tests before commits**
   - **What:** Run `npm test` before every git commit
   - **Why:** Prevents breaking changes from being pushed
   - **Example:** Use git hooks or manual check

3. **Database migrations are versioned**
   - **What:** Never edit existing migration files
   - **Why:** Breaks production databases
   - **Example:** Create new migration with `prisma migrate dev`

---

## 5. Common Gotchas

1. **Prisma Client not updated**
   - **Problem:** Schema changes don't reflect in code
   - **Solution:** Run `npx prisma generate` after changing schema.prisma

2. **Environment variables missing**
   - **Problem:** App crashes on startup
   - **Solution:** Copy `.env.example` to `.env` and fill in DATABASE_URL

3. **Port already in use**
   - **Problem:** "EADDRINUSE: address already in use"
   - **Solution:** Kill process on port 3000: `lsof -ti:3000 | xargs kill`

---

## 6. Development Workflow

### Setup
```bash
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL
npx prisma migrate dev
npm run dev
```

### Running Tests
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

### Development
```bash
npm run dev             # Start with hot reload
npm run build           # TypeScript compile
npm start               # Run production build
```

---

## 7. Project Structure

```
task-api/
├── src/
│   ├── routes/         # API endpoints
│   ├── middleware/     # Express middleware
│   ├── lib/           # Database, utilities
│   └── index.ts       # App entry point
├── prisma/
│   └── schema.prisma  # Database schema
└── test/              # Vitest tests
```

**Key directories:**
- `src/routes/` - One file per resource (tasks.ts, users.ts)
- `src/middleware/` - Reusable middleware (auth, errors, logging)
- `prisma/` - Database schema and migrations

---

## 8. Architecture Decisions

### Why Prisma over raw SQL?
**Decision:** Use Prisma ORM for database access  
**Rationale:** Type safety, migrations, easier testing  
**Trade-offs:**
- ✅ Auto-generated types from schema
- ✅ Query builder prevents SQL injection
- ⚠️ Learning curve for ORM patterns
- ⚠️ Slightly slower than hand-optimized SQL

### Why Zod for validation?
**Decision:** Use Zod for all request validation  
**Rationale:** TypeScript-first, composable schemas  
**Trade-offs:**
- ✅ Infers TypeScript types automatically
- ✅ Great error messages
- ⚠️ Adds bundle size

---

## 9. Change Management

**For new features or breaking changes:**
1. Create feature branch
2. Write tests first (TDD)
3. Implement feature
4. Run full validation suite
5. Create PR, get review
6. Merge and deploy

**Skip formal process for:** Typos, config tweaks, dependency patches

---

## 10. Quick Reference

### Commands
```bash
# Reset database (WARNING: destroys data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Run single test file
npm test -- tasks.test.ts
```

### Important Links
- Prisma Docs: https://www.prisma.io/docs
- Zod Docs: https://zod.dev
- Express Docs: https://expressjs.com

---

*This file is the single source of truth for AI assistants working on this project.*
*Keep it updated and concise.*
