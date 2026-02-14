# Sample Project - Codebase Essentials

> **Last Updated:** January 25, 2026  
> **Purpose:** Test fixture for aiknowsys tests

---

## 1. Technology Snapshot

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |
| Language | TypeScript |
| Framework | Express.js 4.x |

---

## 2. Validation Matrix

| Command | Purpose | Expected |
|---------|---------|----------|
| `npm test` | Run unit tests | All tests pass |
| `npm run lint` | ESLint check | No errors |
| `npm run build` | TypeScript compile | Clean build |

---

## 3. Project Structure

```
sample-project/
├── src/
│   ├── controllers/
│   ├── services/
│   └── routes/
├── test/
└── package.json
```

---

## 4. Core Patterns

### API Route Pattern

```typescript
// ✅ GOOD: Separated concerns
router.get('/users', userController.list);
```

---

## 5. Critical Invariants

1. **Always use TypeScript strict mode**
2. **Test before commit**
3. **No `any` types allowed**

---

*This is a valid CODEBASE_ESSENTIALS.md test fixture*
