# Scripts Directory

## Status: LEGACY / MIGRATION PATH

This directory contains bash scripts that were the original setup method. They are now **superseded by the CLI** but kept for:

1. **Migration path** for users who bookmarked old documentation
2. **Cross-reference** for testing CLI feature parity  
3. **Examples** of bash-based setup patterns

---

## Recommended Approach

✅ **Use the CLI:**
```bash
npx aiknowsys init         # New projects
npx aiknowsys migrate      # Existing projects
npx aiknowsys scan         # Scan codebase
```

❌ **Old bash scripts:**
```bash
./scripts/setup.sh              # → Use: npx aiknowsys init
./scripts/migrate-existing.sh   # → Use: npx aiknowsys migrate
./scripts/scan-codebase.sh      # → Use: npx aiknowsys scan
```

---

## What About install-git-hooks.sh?

✅ **STILL ACTIVE** - This one is different!

- Copied from `templates/scripts/install-git-hooks.sh` during init
- Runs in USER's project (not aiknowsys itself)
- Installs git hooks for TDD enforcement
- Part of the template system, not a setup script

**Usage:**
```bash
# After running: npx aiknowsys init --yes
cd your-project
./scripts/install-git-hooks.sh  # Enable pre-commit TDD checks
```

---

## Should Scripts Be Removed?

**Not yet.** They serve as:
- Documentation of original design
- Bash implementation reference
- Fallback for environments without Node.js (rare)

**Future:** Mark deprecated in v0.8.x, remove in v1.0.0

---

## Script Inventory

| Script | Status | CLI Equivalent |
|--------|--------|----------------|
| setup.sh | ❌ DEPRECATED | `npx aiknowsys init` |
| migrate-existing.sh | ❌ DEPRECATED | `npx aiknowsys migrate` |
| scan-codebase.sh | ❌ DEPRECATED | `npx aiknowsys scan` |
| install-git-hooks.sh | ✅ TEMPLATE | Copied to user projects during init |

---

*For CLI documentation, see [../README.md](../README.md)*
