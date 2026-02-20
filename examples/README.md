# AIKnowSys - Example Projects

> Reference examples showing completed aiknowsys documentation

---

## 📚 Example Types

### 🌟 Filled Examples (Start Here!)

**These show what your completed docs should look like:**

- **[filled-simple-api/](filled-simple-api/)** - Simple Express REST API
  - **Best for:** First-time users, learning what "filled" means
  - **Shows:** Realistic, specific content (not generic templates)
  - **Complexity:** Small learning project (10 core sections)
  - **Stack:** Node.js 20, Express 4, PostgreSQL, Jest

👉 **Start here if you're asking:** "What does a completed template look like?"

---

### 📋 Stack Templates (Reference Structures)

**These show recommended patterns for specific tech stacks:**

- **[typescript-react/](typescript-react/)** - React + TypeScript SPA
- **[typescript-nextjs/](typescript-nextjs/)** - Next.js full-stack
- **[typescript-vue/](typescript-vue/)** - Vue 3 + TypeScript
- **[nodejs-express/](nodejs-express/)** - Node.js + Express API
- **[python-django/](python-django/)** - Django web framework
- **[python-fastapi/](python-fastapi/)** - FastAPI modern Python
- **[rust-actix/](rust-actix/)** - Actix web framework

👉 **Use these for:** Stack-specific patterns and conventions

---

## 🎯 How to Use These Examples

### 1. Read a Filled Example First

```bash
# Look at the filled example
cd examples/filled-simple-api
cat README.md
cat CODEBASE_ESSENTIALS.md
```

**Why?** Reduces anxiety about "how specific should I be?"

### 2. Initialize Your Project

```bash
cd your-project
# Ask your AI assistant to onboard using:
# .github/onboarding-setup.md
```

### 3. Fill Using Example as Reference

Open side-by-side:
- `examples/filled-simple-api/CODEBASE_ESSENTIALS.md` (reference)
- `your-project/CODEBASE_ESSENTIALS.md` (yours to fill)

**Remember:**
- ✅ Copy the **level of specificity**, not the content
- ✅ Use **real code examples** from your project
- ✅ Write **actual commands** that work
- ❌ Don't copy-paste generic content

### 4. Remove Irrelevant Sections

If a section doesn't apply to your project, remove it:
- API project? No "Accessibility Standards"
- Small prototype? No "Performance Guidelines"
- Solo dev? No "Team Workflow"

**The filled example shows this:** Only 10 sections instead of 13.

---

## 💡 What Makes a Good Filled Example?

### ✅ Concrete Commands
```markdown
❌ Generic: "Run tests"
✅ Specific: "npm test -- --coverage"
```

### ✅ Real Code Examples
```markdown
❌ Generic: "Use async/await"
✅ Specific: Shows actual query function with error handling
```

### ✅ Actual Gotchas
```markdown
❌ Generic: "Be careful with dates"
✅ Specific: "PostgreSQL stores timestamps in UTC but returns in server timezone"
```

### ✅ Project-Specific Patterns
```markdown
❌ Generic: "Follow REST conventions"
✅ Specific: "All routes: /api/v1/<resource>, auth via JWT in Authorization header"
```

---

## 🚀 Quick Start

**Never used aiknowsys before?**

1. Read: [`filled-simple-api/README.md`](filled-simple-api/README.md)
2. Look at: [`filled-simple-api/CODEBASE_ESSENTIALS.md`](filled-simple-api/CODEBASE_ESSENTIALS.md)
3. Initialize: conversational onboarding via `.github/onboarding-setup.md`
4. Fill: Use the example as a reference (not a template to copy)

**Already familiar with aiknowsys?**

Browse stack-specific examples for patterns:
- [`typescript-react/`](typescript-react/) - React patterns
- [`python-django/`](python-django/) - Django conventions
- [`rust-actix/`](rust-actix/) - Rust best practices

---

## 📖 What Each Example Contains

### Filled Examples
- ✅ `README.md` - How to use this example
- ✅ `CODEBASE_ESSENTIALS.md` - Fully filled, realistic
- ✅ `AGENTS.md` - Customized workflow
- ✅ `CODEBASE_CHANGELOG.md` - Sample session entries

### Stack Templates
- ✅ `CODEBASE_ESSENTIALS.md` - Stack-specific patterns
- ✅ `.github/agents/` - Custom agent configurations
- ✅ `.github/skills/` - Framework-specific skills

---

## 🎓 Learning Path

**Step 1:** Understand what "filled" means
→ Read [`filled-simple-api/`](filled-simple-api/)

**Step 2:** See stack-specific patterns
→ Browse template for your stack

**Step 3:** Initialize your project
→ Use AI-native onboarding via `.github/onboarding-setup.md`

**Step 4:** Fill with specificity
→ Use examples as reference, write about YOUR code

**Step 5:** Validate it works
→ Run your validation matrix!

---

*Part of [aiknowsys](https://github.com/arpa73/aiknowsys) - AI-Powered Development Workflow Template*
