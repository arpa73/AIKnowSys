# Example Templates

This directory contains **completed examples** of AIKnowSys templates to show you what a well-filled knowledge system looks like.

## 📂 What's Here

### [CODEBASE_ESSENTIALS.example.md](./CODEBASE_ESSENTIALS.example.md)
A fully-filled example for a simple Express + TypeScript + Prisma REST API.

**Use this to:**
- See what "good" documentation looks like
- Understand level of detail expected
- Get inspiration for your own project
- Learn how to write concrete (not generic) examples

**Project:** TaskAPI - Simple todo list REST API  
**Stack:** Node.js, TypeScript, Express, PostgreSQL, Prisma  
**Complexity:** Small/Learning project

---

## 🎯 How to Use These Examples

### 1. **Read First, Then Fill**
Don't start with a blank template. Read the example first to understand:
- What level of detail is expected
- How concrete vs generic to be
- Pattern documentation style
- How to write good invariants

### 2. **Copy Structure, Not Content**
The example shows the **format**, not the content to copy:
- ✅ Copy the section headings
- ✅ Copy the markdown structure
- ✅ Understand the pattern
- ❌ Don't copy the actual code examples (write your own!)

### 3. **Adapt to Your Stack**
The example uses Express/Prisma, but you might use:
- Django + PostgreSQL
- Next.js + MongoDB
- FastAPI + SQLAlchemy
- Rails + ActiveRecord

**That's OK!** The structure works for any stack.

---

## 📝 What Makes a Good Example?

Compare these approaches:

### ❌ Too Generic (Bad)
```markdown
### API Calls
We use axios for API calls.
```

### ✅ Specific & Useful (Good)
```markdown
### API Calls
```typescript
// src/lib/api.ts - All API calls use this instance
import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  timeout: 5000
});

// Usage in components
const tasks = await api.get('/tasks');
```
**Why:** Centralized config, consistent timeout, easy to mock in tests
```

---

## 🔍 Key Differences: Example vs Template

| Aspect | Template (Blank) | Example (Filled) |
|--------|------------------|------------------|
| Placeholders | `{{VARIABLE}}` format | Real project values |
| Code Examples | Generic snippets | Actual project patterns |
| Commands | `TODO: Add command` | `npm test`, `prisma migrate dev` |
| Sections | All sections present | Irrelevant sections removed |
| Purpose | **Start here** for new projects | **Reference** when stuck |

---

## 🚀 Quick Start Workflow

**Step 1:** Read the example (5 minutes)
```bash
cat docs/examples/CODEBASE_ESSENTIALS.example.md
```

**Step 2:** Generate draft for your project
```bash
npx aiknowsys scan --dir .
# Creates DRAFT_CODEBASE_ESSENTIALS.md
```

**Step 3:** Fill in TODOs using example as reference
```bash
# Open both files side-by-side
# - DRAFT_CODEBASE_ESSENTIALS.md (your draft)
# - docs/examples/CODEBASE_ESSENTIALS.example.md (reference)
```

**Step 4:** Remove TODOs and rename
```bash
mv DRAFT_CODEBASE_ESSENTIALS.md CODEBASE_ESSENTIALS.md
```

---

## 💡 Tips from Real Usage

### From the IdeaBox Test Project:

**What Went Smoothly:**
- Having concrete examples reduced anxiety about "doing it wrong"
- Side-by-side comparison (template + example) was helpful
- Pattern documentation style was easy to follow

**What Was Challenging:**
- Knowing which sections to remove vs fill
- Avoiding placeholder-like content (being specific enough)
- Understanding template "weight" (minimal vs comprehensive)

**Lessons Learned:**
1. **Show examples BEFORE filling** - Reduces cognitive load
2. **Be specific, not generic** - Real code > abstract descriptions
3. **Remove irrelevant sections** - Don't force-fit content
4. **Include line numbers** - Makes examples easy to find

---

## 📚 More Examples Coming Soon

We're working on examples for:
- [ ] Full-stack monorepo (Next.js + tRPC)
- [ ] Django REST Framework API
- [ ] Vue SPA with Pinia
- [ ] CLI tool (Node.js)
- [ ] Python package

**Want to contribute an example?** See [CONTRIBUTING.md](../../CONTRIBUTING.md)

---

## 🤔 FAQ

### Q: Should I copy this example exactly?
**A:** No! Use it as a reference for **style and format**, but write content specific to your project.

### Q: My stack isn't represented. Can I still use AIKnowSys?
**A:** Yes! The structure works for any stack. Focus on the **sections and patterns**, not the specific technologies.

### Q: What if my project is simpler/more complex than the example?
**A:** Adjust accordingly:
- **Simpler?** Remove sections, keep it concise
- **More complex?** Add more patterns, split into categories

### Q: How often should I update CODEBASE_ESSENTIALS.md?
**A:** Update when patterns change, not after every commit. Think of it as project-level documentation, not change logs.

---

*These examples are part of AIKnowSys - AI-Powered Development Workflow Template*  
*See [main README](../../README.md) for full documentation*
