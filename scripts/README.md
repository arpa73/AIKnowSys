# Scripts Directory

## Status: DEPRECATED SCRIPTS REMOVED

The bash scripts (`setup.sh`, `migrate-existing.sh`, `scan-codebase.sh`) have been removed as of v0.9.0. They were fully replaced by CLI commands.

---

## ✅ Use the CLI Instead

```bash
# AI-native onboarding is conversational via .github/onboarding-setup.md
npx aiknowsys check        # Validate setup and configuration
npx aiknowsys update       # Update existing workflow files
npx aiknowsys query-plans --status ACTIVE
```

---

## Codex Role Wrappers (Local Convenience)

Use these local wrappers for faster role-based starts:

```bash
scripts/codex-developer [task...]
scripts/codex-architect [task...]
scripts/codex-planner [task...]
```

Each wrapper sets the matching Codex profile and injects the matching role skill prompt.

---

## What About install-git-hooks Scripts?  

✅ **STILL ACTIVE** - These are templates, not setup scripts!

- **Node.js version (recommended):** `templates/scripts/install-git-hooks.cjs` - Cross-platform
- **Bash version (legacy):** `templates/scripts/install-git-hooks.sh` - Unix-like systems
- Copied to user projects during onboarding/feature enablement
- Installs git hooks for TDD enforcement
- Run in YOUR project (not aiknowsys itself)

**Usage in your project:**
```bash
# After enabling hooks in your project workflow
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
