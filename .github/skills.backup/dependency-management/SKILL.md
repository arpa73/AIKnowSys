---
name: dependency-management
description: Universal dependency management workflow. Use when updating packages, fixing vulnerabilities, or maintaining dependencies. Covers security-first approach, incremental updates, semantic versioning, and rollback procedures. Works with npm, pip, cargo, go mod, or any package manager.
---

# Dependency Management

Safe and systematic approach to updating dependencies while maintaining stability and security.

## When to Use This Skill

Use when:
- User asks to "update dependencies" or "upgrade packages"
- Monthly/quarterly dependency maintenance
- Security vulnerability alerts (CVEs)
- Before major feature releases
- Package manager shows outdated dependencies
- User mentions: "Are our dependencies up to date?"

## Core Principles

1. **Security First**: Update packages with known vulnerabilities immediately
2. **Test-Driven**: Never update without running full test suite
3. **Incremental**: Update one category at a time (prod → dev → tooling)
4. **Semantic Versioning**: Understand patch/minor/major implications
5. **Documented**: Track what changed and why
6. **Reversible**: Always commit before updates for easy rollback

## Pre-Update Checklist

Before starting any dependency updates:

- [ ] Commit all current work: `git status` should be clean
- [ ] All tests currently passing
- [ ] Create update branch: `git checkout -b chore/dependency-updates-YYYY-MM`
- [ ] Review project documentation for current stack
- [ ] Check for breaking changes in major version updates

## Semantic Versioning Strategy

**Understanding version numbers: `MAJOR.MINOR.PATCH`**

| Update Type | Example | Risk | Testing |
|-------------|---------|------|---------|
| Patch | 5.1.0 → 5.1.1 | Low | Run tests |
| Minor | 5.1.0 → 5.2.0 | Medium | Test thoroughly + manual QA |
| Major | 5.0.0 → 6.0.0 | High | Review changelog, expect code changes |

**Update strategy:**
1. **Patch updates**: Generally safe, apply automatically
2. **Minor updates**: Review changelog, test thoroughly
3. **Major updates**: Plan separately, may require code changes

## Universal Workflow

### Step 1: Audit Current Dependencies

**JavaScript/TypeScript (npm):**
```bash
npm audit                    # Security vulnerabilities
npm outdated                 # Outdated packages
```

**Python (pip):**
```bash
pip list --outdated          # Outdated packages
pip-audit                    # Security vulnerabilities (if installed)
# Or: pip install safety && safety check
```

**Rust (cargo):**
```bash
cargo outdated               # Requires: cargo install cargo-outdated
cargo audit                  # Requires: cargo install cargo-audit
```

**Go (go mod):**
```bash
go list -u -m all            # Outdated modules
# Or: go install github.com/psampaz/go-mod-outdated@latest
go list -u -m all | go-mod-outdated -update -direct
```

**Ruby (bundler):**
```bash
bundle outdated              # Outdated gems
bundle audit                 # Security vulnerabilities
```

### Step 2: Update Dependency Manifest

**JavaScript/TypeScript (package.json):**
```bash
# Interactive update
npx npm-check-updates        # Preview
npx npm-check-updates -u     # Update package.json

# Targeted update
npm install package-name@latest
npm install -D dev-package@latest
```

**Python (requirements.txt or pyproject.toml):**
```bash
# Manual edit for pyproject.toml
# Change: package>=1.0.0 to package>=1.1.0

# For requirements.txt
pip install --upgrade package-name
pip freeze > requirements.txt
```

**Rust (Cargo.toml):**
```bash
# Manual edit
# Change: package = "1.0" to package = "1.1"

# Or use cargo-edit
cargo install cargo-edit
cargo upgrade               # Interactive upgrade
```

**Go (go.mod):**
```bash
go get -u package-name      # Update specific package
go get -u ./...             # Update all direct dependencies
go mod tidy                 # Clean up
```

**Ruby (Gemfile):**
```bash
# Update Gemfile manually or:
bundle update package-name  # Specific gem
bundle update               # All gems (careful!)
```

### Step 3: Install/Update Dependencies

**JavaScript/TypeScript:**
```bash
npm install                  # Install updated packages
npm ci                       # Clean install (CI/prod)
```

**Python:**
```bash
pip install -r requirements.txt  # Install from requirements
pip install -e .                 # Install from pyproject.toml
```

**Rust:**
```bash
cargo update                 # Update Cargo.lock
cargo build                  # Verify builds
```

**Go:**
```bash
go mod download              # Download modules
go mod verify                # Verify integrity
```

**Ruby:**
```bash
bundle install               # Install updated gems
```

### Step 4: Run Tests (MANDATORY)

**DO NOT SKIP TESTING**

**JavaScript/TypeScript:**
```bash
npm test                     # All tests
npm test -- --coverage       # With coverage
npm run lint                 # Linting
npm run type-check           # TypeScript
```

**Python:**
```bash
python -m pytest             # All tests
python -m pytest --cov       # With coverage
pylint src/                  # Linting
mypy .                       # Type checking
```

**Rust:**
```bash
cargo test                   # All tests
cargo test --all-features    # With all features
cargo clippy                 # Linting
```

**Go:**
```bash
go test ./...                # All tests
go test -cover ./...         # With coverage
go vet ./...                 # Code analysis
golangci-lint run            # Comprehensive linting
```

**Ruby:**
```bash
bundle exec rspec            # All tests
bundle exec rubocop          # Linting
```

### Step 5: Manual Testing

**Test critical paths:**
- [ ] Application starts without errors
- [ ] Core features work as before
- [ ] No console/log errors
- [ ] Performance unchanged/better
- [ ] Build succeeds (if applicable)

### Step 6: Review Changes

```bash
# Check what actually changed
git diff package.json        # JavaScript
git diff pyproject.toml      # Python
git diff Cargo.toml          # Rust
git diff go.mod              # Go
git diff Gemfile.lock        # Ruby

# Look for:
# - Major version jumps (review breaking changes)
# - New transitive dependencies
# - Removed dependencies
```

### Step 7: Commit Changes

```bash
git add package.json package-lock.json  # JavaScript
git add pyproject.toml requirements.txt # Python
git add Cargo.toml Cargo.lock           # Rust
git add go.mod go.sum                   # Go
git add Gemfile Gemfile.lock            # Ruby

git commit -m "chore(deps): update dependencies

- Updated production dependencies (patch/minor/major)
- Updated dev dependencies
- All tests passing (X passed)
- No breaking changes / Breaking changes: [list]
- Security fixes: [CVEs if applicable]"
```

## Security Updates (High Priority)

When security vulnerabilities are detected:

### 1. Assess Severity

```bash
# JavaScript
npm audit

# Python
safety check
pip-audit

# Rust
cargo audit

# Review:
# - Severity (low/moderate/high/critical)
# - Exploitability (is your code affected?)
# - Patch availability
```

### 2. Update Affected Packages

**Targeted security updates:**

**JavaScript:**
```bash
npm audit fix               # Auto-fix compatible updates
npm audit fix --force       # Force major updates (review changes!)
```

**Python:**
```bash
pip install --upgrade vulnerable-package
```

**Rust:**
```bash
cargo update -p vulnerable-package
```

**Go:**
```bash
go get -u vulnerable-package@latest
go mod tidy
```

### 3. Test Immediately

Security updates should be tested and deployed ASAP:
1. Run full test suite
2. Quick manual smoke test
3. Deploy to staging
4. Monitor for issues
5. Deploy to production

## Rollback Procedure

If updates break something:

### Option 1: Revert Commit

```bash
git revert HEAD              # Creates new commit undoing changes
npm install                  # Reinstall old versions
```

### Option 2: Reset Branch

```bash
git reset --hard origin/main # Nuclear option: lose all changes
npm install                  # Reinstall
```

### Option 3: Selective Rollback

```bash
# JavaScript: Restore old package.json
git checkout HEAD~1 package.json package-lock.json
npm install

# Python: Restore old requirements
git checkout HEAD~1 requirements.txt
pip install -r requirements.txt

# Rust: Restore old Cargo files
git checkout HEAD~1 Cargo.toml Cargo.lock
cargo build

# Go: Restore old go.mod
git checkout HEAD~1 go.mod go.sum
go mod download
```

## Common Scenarios

### Scenario 1: Monthly Maintenance

**Goal**: Keep dependencies reasonably up-to-date

```bash
# 1. Check for updates
npm outdated / pip list --outdated / cargo outdated

# 2. Update patch/minor versions
npx npm-check-updates -u --target minor
npm install && npm test

# 3. Plan major updates separately
# (Review changelogs, schedule dedicated time)
```

### Scenario 2: Security Alert

**Goal**: Fix vulnerability ASAP

```bash
# 1. Identify vulnerable package
npm audit / pip-audit / cargo audit

# 2. Update to patched version
npm install vulnerable-package@patched-version

# 3. Test immediately
npm test

# 4. Deploy ASAP if tests pass
```

### Scenario 3: Pre-Release Prep

**Goal**: Fresh dependencies before release

```bash
# 1. Update all dev dependencies
npm update --dev / pip install -U -r requirements-dev.txt

# 2. Update non-breaking prod dependencies
npm update / pip install -U package

# 3. Test extensively
npm test && npm run e2e

# 4. Document updates in changelog
```

## Best Practices

### Do:
- ✅ Update dependencies regularly (monthly/quarterly)
- ✅ Read changelogs for major updates
- ✅ Run tests after EVERY update
- ✅ Update one category at a time (prod → dev → peer)
- ✅ Commit after each successful category update
- ✅ Document breaking changes in commit message
- ✅ Use lockfiles (package-lock.json, Cargo.lock, go.sum)

### Don't:
- ❌ Update everything at once ("big bang" approach)
- ❌ Skip testing after updates
- ❌ Use exact version pins unless required (npm/pip)
- ❌ Ignore security vulnerabilities
- ❌ Update during feature development
- ❌ Force major updates without reviewing changes

## Lockfile Management

**Purpose of lockfiles:**
- Ensure reproducible builds
- Lock transitive dependency versions
- Enable reliable CI/CD

**When to commit lockfiles:**
- ✅ **Always commit**: package-lock.json (npm), Cargo.lock (Rust), go.sum (Go), Gemfile.lock (Ruby)
- ⚠️ **Libraries only**: Don't commit lockfiles for libraries (let consumers choose versions)
- ✅ **Applications always**: Always commit lockfiles for applications

## Troubleshooting

### Issue: Tests Fail After Update

1. Read test output carefully
2. Check updated package changelogs for breaking changes
3. Search GitHub issues for the package
4. Update code to match new API
5. If unfixable, rollback and plan migration

### Issue: Dependency Conflicts

**JavaScript:**
```bash
npm install --legacy-peer-deps  # Ignore peer dep conflicts (temporary)
npm ls package-name             # See dependency tree
```

**Python:**
```bash
pip install package --no-deps   # Skip dependency check (dangerous!)
pipdeptree                      # Visualize dependency tree
```

**Rust:**
```bash
# Edit Cargo.toml to resolve version conflicts
cargo tree                      # View dependency tree
```

### Issue: Build Breaks After Update

1. Clear caches and rebuild:
   ```bash
   npm ci              # JavaScript (clean install)
   cargo clean         # Rust
   go clean -modcache  # Go
   ```

2. Check for deprecated APIs in changelog
3. Update code to use new APIs
4. Verify toolchain compatibility (Node.js version, Rust version, etc.)

## Related Skills

- [tdd-workflow](../tdd-workflow/SKILL.md) - Test after updates
- [refactoring-workflow](../refactoring-workflow/SKILL.md) - Update code for new APIs
- [validation-troubleshooting](../validation-troubleshooting/SKILL.md) - Fix test failures

---

*This skill is framework-agnostic. Patterns apply to JavaScript, Python, Rust, Go, Ruby, Java, C#, or any language with a package manager.*
