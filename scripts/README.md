# Scripts Directory

## Status: DEPRECATED SCRIPTS REMOVED

The bash scripts (`setup.sh`, `migrate-existing.sh`, `scan-codebase.sh`) have been removed as of v0.9.0. They were fully replaced by CLI commands.

---

## ✅ Use the CLI Instead

```bash
npx aiknowsys init         # New projects (was: setup.sh)
npx aiknowsys migrate      # Existing projects (was: migrate-existing.sh)
npx aiknowsys scan         # Scan codebase (was: scan-codebase.sh)
```

---

## What About install-git-hooks Scripts?  

✅ **STILL ACTIVE** - These are templates, not setup scripts!

- **Node.js version (recommended):** `templates/scripts/install-git-hooks.cjs` - Cross-platform
- **Bash version (legacy):** `templates/scripts/install-git-hooks.sh` - Unix-like systems
- Copied to user projects during `npx aiknowsys init --tdd-enforcement`
- Installs git hooks for TDD enforcement
- Run in YOUR project (not aiknowsys itself)

**Usage in your project:**
```bash
# After running: npx aiknowsys init --tdd-enforcement
cd your-project

# Cross-platform (recommended)
node scripts/install-git-hooks.cjs
# Or: npm run install-hooks

# Legacy bash version (Unix-like systems only)
./scripts/install-git-hooks.sh  
```

---

## History

Bash scripts were the original setup method (v0.1.0 - v0.2.0). CLI replaced them in v0.2.0+. Scripts were kept for migration path but removed in v0.9.0 after sufficient adoption time.

For CLI documentation, see [../README.md](../README.md).
