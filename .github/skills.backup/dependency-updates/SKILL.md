---
name: dependency-updates
description: Safe dependency update workflow for gnwebsite fullstack Django/Vue project. Use when updating packages, upgrading dependencies, fixing vulnerabilities, or when user asks to update dependencies. Covers backend Python (pyproject.toml), frontend npm packages, vulnerability audits, testing requirements, and rollback procedures. Ensures updates maintain compatibility and don't break existing functionality.
---

# Dependency Updates

Comprehensive guide for safely updating backend and frontend dependencies in gnwebsite project while maintaining stability and security.

## When to Use This Skill

- User asks to "update dependencies" or "upgrade packages"
- Monthly/quarterly dependency maintenance
- Security vulnerability alerts
- When fixing known CVEs or vulnerabilities
- Before major feature releases
- When you hear: "Are our dependencies up to date?"

## Core Principles

1. **Security First**: Update packages with known vulnerabilities immediately
2. **Test-Driven**: Never update without running full test suite
3. **Incremental**: Update one category at a time (backend → frontend → devDeps)
4. **Documented**: Track what changed and why in CODEBASE_CHANGELOG.md
5. **Reversible**: Always commit before updates for easy rollback

## Pre-Update Checklist

Before starting any dependency updates:

- [ ] Commit all current work: `git status` should be clean
- [ ] All tests currently passing (backend + frontend)
- [ ] Create a new branch: `git checkout -b chore/dependency-updates-YYYY-MM`
- [ ] Read CODEBASE_ESSENTIALS.md for current stack snapshot
- [ ] Check for breaking changes in major version updates

## Backend Dependency Updates (Python)

### Step 1: Audit Current Dependencies

```bash
# Check for vulnerabilities using pip-audit (if available)
docker-compose exec backend pip install pip-audit
docker-compose exec backend pip-audit

# Check for outdated packages
docker-compose exec backend pip list --outdated
```

### Step 2: Update pyproject.toml

**Source of truth**: `backend/pyproject.toml`

```toml
[project]
dependencies = [
    "Django>=5.1.0",           # Production dependencies
    "djangorestframework>=3.15.2",
    # ... more
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",           # Dev dependencies
    # ... more
]
```

**Update strategy**:

1. **Patch updates** (5.1.0 → 5.1.1): Generally safe, update automatically
2. **Minor updates** (5.1.0 → 5.2.0): Review changelog, test thoroughly
3. **Major updates** (5.1.0 → 6.0.0): May require code changes, plan separately

```bash
# Edit pyproject.toml manually
# For patch updates: Change Django>=5.1.0 to Django>=5.1.2
# For minor updates: Change Django>=5.1.0 to Django>=5.2.0
# NEVER use exact pins (==) unless absolutely required
```

### Step 3: Regenerate requirements.txt

```bash
# Use the project's update script (preferred)
cd backend && ./update-requirements.sh

# Or manually:
docker-compose exec backend pip-compile pyproject.toml -o requirements.txt --resolver=backtracking --strip-extras
```

**What this does**:
- Resolves all transitive dependencies
- Locks exact versions for reproducible builds
- Generates requirements.txt from pyproject.toml

### Step 4: Rebuild Backend Container

```bash
# Rebuild with new dependencies
docker-compose build backend

# Start fresh
docker-compose up -d backend
```

### Step 5: Run Backend Tests

**MANDATORY - DO NOT SKIP**

```bash
# Run all backend tests
docker-compose exec backend pytest jewelry_portfolio/ -x

# Expected: "X passed, Y skipped" with no failures
```

**If tests fail:**
1. Read error messages carefully
2. Check changelogs for breaking changes
3. Update code to match new API
4. Re-run tests until all pass
5. If unfixable, rollback: `git checkout backend/pyproject.toml backend/requirements.txt`

### Step 6: Test Django Admin & API Manually

```bash
# Start dev server
docker-compose up backend

# Test in browser:
# - Admin panel: http://localhost:8000/panel-0911/
# - API endpoints: http://localhost:8000/api/
# - OpenAPI docs: http://localhost:8000/api/schema/swagger-ui/
```

### Step 7: Regenerate OpenAPI Schema

**Required if Django/DRF updated:**

```bash
# Regenerate OpenAPI schema
docker-compose exec backend python manage.py spectacular --file openapi_schema.json

# Check for schema changes
git diff backend/openapi_schema.json
```

If schema changed → proceed to frontend TypeScript client regeneration

## Frontend Dependency Updates (npm)

### Step 1: Audit Current Dependencies

```bash
# Check for vulnerabilities
cd frontend && npm audit

# View vulnerability details
npm audit --json > audit-report.json

# Check for outdated packages
npm outdated
```

### Step 2: Update package.json

**Two approaches:**

#### A. Interactive Update (Recommended for major updates)

```bash
# Use npm-check-updates (install if needed)
npm install -g npm-check-updates

# Preview updates
ncu

# Update package.json (does NOT install yet)
ncu -u

# Review changes
git diff package.json
```

#### B. Targeted Update (For specific packages)

```bash
# Update specific package to latest
npm install vue@latest

# Update with version constraint
npm install typescript@~5.9.3

# Update dev dependency
npm install -D vite@latest
```

### Step 3: Install Updated Dependencies

```bash
# Install and update package-lock.json
npm install

# If conflicts, try:
npm install --legacy-peer-deps
```

### Step 4: Run Frontend Tests

**MANDATORY - DO NOT SKIP**

```bash
# Type checking
npm run type-check
# Expected: No output = success

# Unit/integration tests
npm run test:run  # NOT "npm test" - it hangs!
# Expected: "X passed" with acceptable documented failures

# Build check
npm run build
# Expected: Successful build
```

**If tests fail:**
1. Check for TypeScript errors first: `npm run type-check`
2. Read error messages for breaking API changes
3. Update components/composables to match new APIs
4. Check migration guides in package changelogs
5. If unfixable, rollback: `git checkout frontend/package.json frontend/package-lock.json && npm install`

### Step 5: Regenerate TypeScript API Client (If Backend Updated)

**Required if openapi_schema.json changed:**

```bash
cd frontend

# Regenerate TypeScript client from OpenAPI schema
npx @openapitools/openapi-generator-cli generate \
  -i ../backend/openapi_schema.json \
  -g typescript-fetch \
  -o src/api/generated

# Verify TypeScript compiles
npm run type-check
```

### Step 6: Test Frontend Manually

```bash
# Start dev server
npm run dev

# Test in browser:
# - All routes load: http://localhost:3000
# - Forms submit correctly
# - Image uploads work
# - Admin panel accessible
# - No console errors
```

## Vulnerability-Specific Updates

**For critical security updates, use expedited workflow:**

### Backend Vulnerabilities

```bash
# 1. Identify vulnerable package from audit
docker-compose exec backend pip-audit

# 2. Update ONLY the vulnerable package in pyproject.toml
# Example: If Pillow has CVE, update Pillow>=10.4.0 to Pillow>=10.5.0

# 3. Regenerate requirements.txt
cd backend && ./update-requirements.sh

# 4. Rebuild and test
docker-compose build backend
docker-compose exec backend pytest jewelry_portfolio/ -x

# 5. Commit immediately if tests pass
git add backend/pyproject.toml backend/requirements.txt
git commit -m "security: update Pillow to fix CVE-XXXX-YYYY"
```

### Frontend Vulnerabilities

```bash
# 1. Audit and identify vulnerable packages
npm audit

# 2. Try automatic fix first
npm audit fix

# 3. If that doesn't work, update manually
npm install vulnerable-package@latest

# 4. Test immediately
npm run type-check && npm run test:run

# 5. Commit if tests pass
git add package.json package-lock.json
git commit -m "security: update axios to fix CVE-XXXX-YYYY"
```

## Testing Matrix

**After ANY dependency update, run ALL relevant tests:**

| Changed | Commands | Required |
|---------|----------|----------|
| **Backend dependencies** | `docker-compose exec backend pytest jewelry_portfolio/ -x` | ✅ MANDATORY |
| **Django/DRF** | Regenerate OpenAPI schema → TypeScript client | ✅ If major update |
| **Frontend dependencies** | `cd frontend && npm run type-check` | ✅ MANDATORY |
| **Frontend logic packages** | `cd frontend && npm run test:run` | ✅ MANDATORY |
| **Vue/TypeScript** | `cd frontend && npm run build` | ✅ MANDATORY |
| **Any dependency** | Manual smoke testing in browser | ✅ MANDATORY |

## Update Categories & Priority

### High Priority (Update Immediately)

- **Security vulnerabilities**: Any CVE with severity ≥ 7.0
- **Critical bug fixes**: Data loss, auth bypass, XSS, CSRF
- **Zero-day exploits**: Update same day if possible

### Medium Priority (Update Monthly/Quarterly)

- **Minor version updates**: New features, performance improvements
- **Patch updates**: Bug fixes without breaking changes
- **DevDependencies**: Testing tools, build tools

### Low Priority (Update Before Major Releases)

- **Major version updates**: Breaking changes, require code migration
- **Experimental features**: Alpha/beta packages
- **Optional dependencies**: Nice-to-have features

## Common Pitfalls & Solutions

### ❌ Pitfall 1: Updating Everything at Once

**Problem**: Can't identify which update broke tests

**Solution**:
```bash
# ✅ Update in stages
git commit -m "deps: update backend security packages"
git commit -m "deps: update backend dev tools"
git commit -m "deps: update frontend runtime packages"
git commit -m "deps: update frontend dev tools"
```

### ❌ Pitfall 2: Skipping Tests

**Problem**: Broken code reaches production

**Solution**: ALWAYS run full test suite:
```bash
# Backend
docker-compose exec backend pytest jewelry_portfolio/ -x

# Frontend
cd frontend && npm run type-check && npm run test:run && npm run build
```

### ❌ Pitfall 3: Not Reading Changelogs

**Problem**: Breaking changes surprise you in production

**Solution**: For major updates, read migration guides:
```bash
# Example: Vue 3.4 → 3.5
# 1. Read: https://github.com/vuejs/core/blob/main/CHANGELOG.md
# 2. Search for "BREAKING" or "Migration"
# 3. Update code before updating dependency
```

### ❌ Pitfall 4: Forgetting Docker Rebuild

**Problem**: Old packages still in container, tests pass locally but fail in CI

**Solution**:
```bash
# ✅ Always rebuild after backend updates
docker-compose build backend
docker-compose up -d backend
```

### ❌ Pitfall 5: Using Exact Versions

**Problem**: Can't get security patches without manual updates

**Solution**:
```toml
# ❌ DON'T - locks to exact version
Django==5.1.0

# ✅ DO - allows patches
Django>=5.1.0

# ✅ DO - allows minor updates
Django>=5.1.0,<6.0.0
```

## Rollback Procedure

**If updates break critical functionality:**

### Quick Rollback (Last Commit)

```bash
# Rollback all changes
git reset --hard HEAD~1

# Reinstall old dependencies
docker-compose build backend  # Backend
cd frontend && npm install     # Frontend

# Verify rollback worked
docker-compose exec backend pytest jewelry_portfolio/ -x
cd frontend && npm run test:run
```

### Selective Rollback (Specific Files)

```bash
# Rollback only backend
git checkout HEAD~1 -- backend/pyproject.toml backend/requirements.txt
cd backend && ./update-requirements.sh
docker-compose build backend

# Rollback only frontend
git checkout HEAD~1 -- frontend/package.json frontend/package-lock.json
cd frontend && npm install
```

## Post-Update Checklist

After successful updates:

- [ ] All tests passing (backend + frontend)
- [ ] Manual smoke testing completed
- [ ] No console errors in browser
- [ ] No build warnings
- [ ] OpenAPI schema regenerated (if backend updated)
- [ ] TypeScript client regenerated (if schema changed)
- [ ] Update CODEBASE_CHANGELOG.md with session entry
- [ ] Commit changes with descriptive message

## Commit Message Format

```bash
# Security updates
git commit -m "security: update Django to 5.1.4 (CVE-2024-XXXXX)"

# Regular updates
git commit -m "deps: update backend dependencies (Django 5.1.4, DRF 3.15.3)"
git commit -m "deps: update frontend dependencies (Vue 3.5.26, Vite 7.3.0)"

# Breaking changes
git commit -m "deps!: update Vue to 3.5.0 (breaking: new Composition API)"
```

## Documentation Requirements

**Update CODEBASE_CHANGELOG.md after significant updates:**

```markdown
## Session: Dependency Updates - Backend Security (Jan 17, 2026)

**Goal**: Update Django and Pillow to fix security vulnerabilities

**Changes**:
- [backend/pyproject.toml](backend/pyproject.toml): Django 5.1.0 → 5.1.4 (CVE-2024-XXXXX)
- [backend/pyproject.toml](backend/pyproject.toml): Pillow 10.4.0 → 10.5.0 (CVE-2024-YYYYY)
- [backend/requirements.txt](backend/requirements.txt): Regenerated with pip-compile

**Validation**:
- ✅ Backend tests: 156 passed
- ✅ Manual admin panel check: OK
- ✅ API endpoints: OK

**Key Learning**: Django 5.1.4 changes cookie handling - required updating JWT settings
```

## Monthly Maintenance Workflow

**Recommended schedule: First Monday of each month**

```bash
# 1. Create update branch
git checkout -b chore/dependency-updates-$(date +%Y-%m)

# 2. Backend audit & update
docker-compose exec backend pip-audit
# Update pyproject.toml
cd backend && ./update-requirements.sh
docker-compose build backend
docker-compose exec backend pytest jewelry_portfolio/ -x
git commit -m "deps: update backend dependencies"

# 3. Frontend audit & update
cd frontend
npm audit
npm outdated
ncu -u  # Update package.json
npm install
npm run type-check && npm run test:run && npm run build
git commit -m "deps: update frontend dependencies"

# 4. Manual testing
# Test all critical user flows

# 5. Update changelog
# Add session entry to CODEBASE_CHANGELOG.md
git commit -m "docs: update changelog for dependency updates"

# 6. Create PR
git push origin chore/dependency-updates-$(date +%Y-%m)
```

## Integration with Other Skills

- **Before updating**: Read [developer-checklist](../developer-checklist/SKILL.md) for test requirements
- **After breaking changes**: May need [feature-implementation](../feature-implementation/SKILL.md) to update code
- **For refactoring after updates**: Use [code-refactoring](../code-refactoring/SKILL.md)

## Related Files

- [backend/DEPENDENCIES.md](../../../backend/DEPENDENCIES.md) - Backend dependency workflow
- [CODEBASE_ESSENTIALS.md](../../../CODEBASE_ESSENTIALS.md) - Current stack snapshot
- [CODEBASE_CHANGELOG.md](../../../CODEBASE_CHANGELOG.md) - Session history
- [.github/skills/developer-checklist/SKILL.md](../developer-checklist/SKILL.md) - Testing requirements

## Quick Reference Commands

```bash
# Backend
cd backend && ./update-requirements.sh
docker-compose build backend
docker-compose exec backend pytest jewelry_portfolio/ -x

# Frontend
cd frontend
npm audit
npm outdated
ncu -u && npm install
npm run type-check && npm run test:run && npm run build

# OpenAPI sync (if backend updated)
docker-compose exec backend python manage.py spectacular --file openapi_schema.json
cd frontend && npx @openapitools/openapi-generator-cli generate \
  -i ../backend/openapi_schema.json \
  -g typescript-fetch \
  -o src/api/generated
```
