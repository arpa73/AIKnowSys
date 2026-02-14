---
name: refactoring-workflow
description: Universal code refactoring workflow. Use when improving code structure, reducing duplication, or simplifying complex functions. Covers test-driven refactoring, incremental changes, extract function patterns, and rollback procedures. Framework-agnostic - works for Python, JavaScript, TypeScript, Rust, Go, or any language.
---

# Refactoring Workflow

Step-by-step guide for safely refactoring code without breaking functionality in any codebase.

## When to Use This Skill

Use when:
- User asks "How do I refactor this code?" or "Can I simplify this?"
- Reducing code duplication (DRY violations)
- Simplifying complex functions (>50 lines or cyclomatic complexity >10)
- Extracting reusable logic
- Improving code structure or naming
- Addressing technical debt
- User mentions: "refactor", "clean up", "simplify", "reduce duplication"

**Do NOT use for:**
- Style preferences without measurable benefit
- Just before deadlines
- Code without existing tests
- Changes that alter behavior (that's feature work, not refactoring)

## Core Principles

1. **Test-Driven**: Tests must exist BEFORE refactoring
2. **Incremental**: One change at a time, test after each
3. **Behavioral Preservation**: Same inputs → same outputs
4. **Reversible**: Each step committed separately for rollback
5. **Measurable**: Complexity reduced, duplication eliminated

## Prerequisites (CRITICAL)

**NEVER refactor without tests!**

```bash
# Check test coverage (examples for different languages)
npm test -- --coverage           # JavaScript/TypeScript (Jest/Vitest)
python -m pytest --cov           # Python (pytest)
cargo test                       # Rust
go test -cover ./...             # Go
dotnet test /p:CollectCoverage=true  # C#

# If coverage < 80% for code being refactored:
# 1. STOP
# 2. Write tests FIRST
# 3. THEN refactor
```

**Minimum requirements:**
- [ ] Unit tests exist for all functions being changed
- [ ] Integration tests exist for workflows being changed
- [ ] All tests currently passing ✅

## Phase 1: Preparation

### Step 1: Document Current Behavior

Create temporary documentation:
```markdown
# Refactoring: [Module/Function Name]

## Current Behavior
- Input: X
- Output: Y
- Side effects: Z
- Edge cases: A, B, C

## Existing Tests
- test_case_1: normal flow
- test_case_2: error handling
- test_case_3: edge case

## Success Criteria
After refactor: all tests pass, same behavior
```

### Step 2: Create Safety Backup

```bash
# Create backup branch
git checkout -b backup-before-refactor
git checkout -b refactor/improve-module-x
```

### Step 3: Create Refactoring Checklist

```markdown
## Refactoring Checklist

### Before
- [ ] All existing tests pass
- [ ] Coverage documented
- [ ] Behavior documented
- [ ] Backup branch created

### During
- [ ] ONE change at a time
- [ ] Run tests after EACH change
- [ ] Commit after EACH success

### After
- [ ] All tests still pass
- [ ] No errors in test output
- [ ] Manual testing complete
- [ ] Performance unchanged/better
- [ ] Documentation updated
```

## Phase 2: Refactoring Patterns

### Pattern A: Extract Function (Reduce Complexity)

**When**: Function >50 lines or cyclomatic complexity >10

**Before (TypeScript example)**:
```typescript
async function processOrder(order: Order) {
  // Validation (10 lines)
  if (!order.customerId) throw new Error('Customer required')
  if (!order.items || order.items.length === 0) throw new Error('Items required')
  if (order.total < 0) throw new Error('Invalid total')
  
  // Calculate tax (15 lines)
  let tax = 0
  for (const item of order.items) {
    const rate = item.taxable ? 0.08 : 0
    tax += item.price * item.quantity * rate
  }
  
  // Save (10 lines)
  const finalOrder = { ...order, tax, grandTotal: order.total + tax }
  return await database.orders.create(finalOrder)
}
```

**After**:
```typescript
async function processOrder(order: Order) {
  validateOrder(order)
  const tax = calculateTax(order.items)
  return await saveOrder(order, tax)
}

function validateOrder(order: Order) {
  if (!order.customerId) throw new Error('Customer required')
  if (!order.items || order.items.length === 0) throw new Error('Items required')
  if (order.total < 0) throw new Error('Invalid total')
}

function calculateTax(items: OrderItem[]): number {
  return items.reduce((sum, item) => {
    const rate = item.taxable ? 0.08 : 0
    return sum + (item.price * item.quantity * rate)
  }, 0)
}

async function saveOrder(order: Order, tax: number) {
  const grandTotal = order.total + tax
  return await database.orders.create({ ...order, tax, grandTotal })
}
```

**Python equivalent**:
```python
# Before
def process_order(order):
    # Validation
    if not order.customer_id:
        raise ValueError('Customer required')
    # Tax calculation
    tax = sum(item.price * item.quantity * 0.08 
              for item in order.items if item.taxable)
    # Save
    return db.orders.create({**order, 'tax': tax})

# After
def process_order(order):
    validate_order(order)
    tax = calculate_tax(order.items)
    return save_order(order, tax)

def validate_order(order):
    if not order.customer_id:
        raise ValueError('Customer required')
    if not order.items:
        raise ValueError('Items required')

def calculate_tax(items):
    return sum(item.price * item.quantity * 0.08 
               for item in items if item.taxable)

def save_order(order, tax):
    return db.orders.create({**order, 'tax': tax})
```

**Steps**:
1. Extract ONE function at a time
2. Run tests after each extraction
3. Commit each success
4. Add tests for new functions

### Pattern B: Extract Utility (Eliminate Duplication)

**When**: Same logic duplicated across 3+ locations

**Before (JavaScript example - 5 files with this code)**:
```javascript
const imageUrl = data?.image?.url || data?.image?.file_url || '/placeholder.png'
```

**After**:
```javascript
// utils/image.js
export function getImageUrl(imageData, fallback = '/placeholder.png') {
  if (!imageData) return fallback
  return imageData.url || imageData.file_url || fallback
}

// All 5 files now:
const imageUrl = getImageUrl(data?.image)
```

**Rust equivalent**:
```rust
// Before (duplicated in multiple modules)
let image_url = image_data
    .and_then(|img| img.url.or(img.file_url))
    .unwrap_or_else(|| "/placeholder.png".to_string());

// After
// utils/image.rs
pub fn get_image_url(image_data: Option<&ImageData>) -> String {
    image_data
        .and_then(|img| img.url.as_ref().or(img.file_url.as_ref()))
        .cloned()
        .unwrap_or_else(|| "/placeholder.png".to_string())
}

// All modules now:
let image_url = get_image_url(image_data.as_ref());
```

**Steps**:
1. Create utility function
2. Write comprehensive tests for utility
3. Replace in ONE location
4. Test
5. Commit
6. Repeat for each remaining location

### Pattern C: Replace Magic Numbers/Strings with Constants

**When**: Same literal value appears 5+ times

**Before (Python example)**:
```python
if user.status == "active":
    process_user(user)
    
if account.status == "active":  # Typo risk: "activ", "Active", etc.
    charge(account)
```

**After**:
```python
# constants.py
USER_STATUS_ACTIVE = "active"
USER_STATUS_INACTIVE = "inactive"

# usage
if user.status == USER_STATUS_ACTIVE:
    process_user(user)
    
if account.status == USER_STATUS_ACTIVE:
    charge(account)
```

**Go equivalent**:
```go
// Before
if user.Status == "active" {
    processUser(user)
}

// After
// constants/user.go
const (
    StatusActive   = "active"
    StatusInactive = "inactive"
)

// usage
if user.Status == constants.StatusActive {
    processUser(user)
}
```

### Pattern D: Simplify Complex Conditionals

**When**: Nested conditions >3 levels deep

**Before**:
```typescript
if (user) {
  if (user.isActive) {
    if (user.subscription) {
      if (user.subscription.plan === 'premium') {
        return true
      }
    }
  }
}
return false
```

**After**:
```typescript
function hasPremiumSubscription(user: User | null): boolean {
  if (!user) return false
  if (!user.isActive) return false
  if (!user.subscription) return false
  return user.subscription.plan === 'premium'
}

// Or with early returns:
function hasPremiumSubscription(user: User | null): boolean {
  if (!user || !user.isActive || !user.subscription) {
    return false
  }
  return user.subscription.plan === 'premium'
}
```

## Phase 3: Incremental Execution

**CRITICAL WORKFLOW**: One change → Test → Commit

```bash
# 1. Create working branch
git checkout -b refactor/improve-module-x

# 2. Make ONE small change
# ... edit code ...

# 3. Run tests
npm test                    # JavaScript/TypeScript
python -m pytest           # Python
cargo test                 # Rust
go test ./...              # Go

# 4. If pass, commit
git add .
git commit -m "refactor: extract validate_order function

- Moved validation logic from process_order
- All tests passing
- No behavior changes"

# 5. Repeat for next change
# ... edit code ...
npm test
git commit -m "refactor: extract calculate_tax"

# Continue until complete
```

### Testing After EVERY Change

```bash
# After each change:

# 1. Run tests
npm test                   # JavaScript
pytest                     # Python
cargo test                 # Rust
go test ./...              # Go
dotnet test                # C#

# 2. Type check (if applicable)
npm run type-check         # TypeScript
mypy .                     # Python
cargo check                # Rust

# 3. Linting
npm run lint               # JavaScript/TypeScript
pylint src/                # Python
cargo clippy               # Rust
golangci-lint run          # Go

# If ANY fail:
git reset --hard HEAD      # Undo
# OR fix before committing
```

## Phase 4: Validation

### Comprehensive Testing Checklist

**Automated:**
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Type check passes (if applicable)
- [ ] Linting passes
- [ ] No new warnings

**Manual:**
- [ ] Feature works exactly as before
- [ ] No errors in logs
- [ ] Performance unchanged/better
- [ ] Edge cases still handled correctly

**Code Quality:**
- [ ] More readable
- [ ] More testable
- [ ] Less duplication
- [ ] Lower complexity
- [ ] Reasonable function/file sizes

### Performance Verification

```bash
# Before refactor - run benchmarks
npm run bench              # JavaScript
python -m pytest --benchmark-only  # Python (pytest-benchmark)
cargo bench                # Rust
go test -bench=.           # Go

# After refactor - compare results
# Should be similar or better
```

## Phase 5: Documentation

### Update Project Docs

If new patterns introduced, update your project's documentation:

```markdown
## Code Conventions

### Image URL Handling
Always use `getImageUrl()` from `utils/image`. Prevents silent failures from null/undefined.

**Example:**
\`\`\`javascript
const url = getImageUrl(data?.image)  // ✅ Safe
const url = data?.image?.url          // ❌ Doesn't handle fallback
\`\`\`
```

### Update Changelog

```markdown
### Session: Refactor Order Processing (Feb 3, 2026)

**Goal**: Eliminate complex nested logic in processOrder

**Changes**:
- Extracted `validateOrder()` function
- Extracted `calculateTax()` function
- Extracted `saveOrder()` function
- Reduced cyclomatic complexity from 12 to 3

**Impact**:
- Improved testability (each function tested separately)
- Reduced duplication by ~40 lines
- Easier to modify validation logic

**Validation**:
- ✅ All 164 tests pass
- ✅ No behavior changes
- ✅ Performance unchanged (benchmarked)

**Commits**: abc123, def456, ghi789
```

## Anti-Patterns (DON'T DO THIS)

### ❌ Big Bang Refactor

```bash
# WRONG: Change 50 files at once
git commit -m "refactor: everything"

# CORRECT: Incremental commits
git commit -m "refactor: extract validation"
git commit -m "refactor: extract calculation"
git commit -m "refactor: simplify main function"
```

### ❌ Refactor Without Tests

```python
# WRONG: No tests exist
def refactored_function():
    # Hope this works! 🤞
    pass

# CORRECT: Write tests first
def test_refactored_function():
    assert refactored_function(input) == expected

def refactored_function():
    # Implementation with confidence
    pass
```

### ❌ Change Behavior

```typescript
// WRONG: Added new validation during refactor
function validateOrder(order: Order) {
  if (!order.customerId) throw new Error('Customer required')
  if (!order.email) throw new Error('Email required')  // NEW! Breaks existing code
}

// CORRECT: Preserve exact behavior
function validateOrder(order: Order) {
  if (!order.customerId) throw new Error('Customer required')
  // Same validation as before, just extracted
}
```

### ❌ Premature Optimization

```rust
// WRONG: No measured problem, making code complex
// Replacing simple readable code with "faster" but unreadable code

// CORRECT: Measure first (cargo bench), optimize if needed
// Keep code simple unless profiling shows issue
```

### ❌ Refactor Under Pressure

```
// WRONG: "Production deploy tomorrow, let me refactor today!"
// CORRECT: Refactor when you have time to test properly
```

## Common Scenarios

### Scenario 1: Function Too Large (>50 lines)

**Fix**:
1. Extract helper functions (one responsibility each)
2. Extract utilities for reusable logic
3. Use descriptive names
4. Test each extracted function

### Scenario 2: Duplicated Code (3+ places)

**Fix**:
1. Identify common pattern
2. Extract to utility function/module
3. Write comprehensive tests
4. Replace one by one
5. Commit after each replacement

### Scenario 3: Hard to Test

**Fix**:
1. Identify external dependencies (DB, API, filesystem)
2. Extract dependencies to parameters
3. Make functions pure (same input → same output)
4. Write tests with mocks/stubs

### Scenario 4: Unclear Naming

**Fix**:
1. Rename ONE identifier at a time
2. Use IDE refactor (F2 in VS Code, Rename in IntelliJ)
3. Run tests
4. Commit
5. Repeat for next name

## Emergency Rollback

If refactoring breaks something:

```bash
# Option 1: Revert last commit
git revert HEAD

# Option 2: Restore from backup
git checkout backup-before-refactor
git checkout -b refactor/v2

# Option 3: Stash and investigate
git stash
npm test         # Pass now?
git stash pop    # Re-apply and fix

# Option 4: Nuclear reset
git reset --hard origin/main
# Start over with smaller changes
```

## Success Metrics

Refactoring succeeds when:

✅ All tests pass (no behavior changes)  
✅ Code more readable (clear improvement)  
✅ Complexity reduced (fewer lines, simpler logic, lower cyclomatic complexity)  
✅ Duplication removed (DRY)  
✅ Test coverage maintained/improved  
✅ Performance unchanged/better  
✅ No regressions (manual testing confirms)  

## Language-Specific Testing Commands

```bash
# JavaScript/TypeScript
npm test
npm test -- --coverage
npm run type-check
npm run lint

# Python
python -m pytest
python -m pytest --cov
mypy .
pylint src/

# Rust
cargo test
cargo test --all-features
cargo check
cargo clippy

# Go
go test ./...
go test -cover ./...
go vet ./...
golangci-lint run

# C#
dotnet test
dotnet test /p:CollectCoverage=true
dotnet build

# Ruby
bundle exec rspec
bundle exec rubocop

# Java
mvn test
./gradlew test
```

## When to Stop

Stop refactoring when:
- Tests start failing frequently (too aggressive)
- Code is "good enough" (perfect is enemy of done)
- Deadline approaching (commit what you have)
- No measurable benefit (diminishing returns)
- You're just tweaking style (not improving structure)

## Related Skills

- [tdd-workflow](../tdd-workflow/SKILL.md) - Write tests before refactoring
- [feature-implementation](../feature-implementation/SKILL.md) - Adding features
- [validation-troubleshooting](../validation-troubleshooting/SKILL.md) - When tests fail

---

*This skill is framework-agnostic. Patterns apply to JavaScript, TypeScript, Python, Rust, Go, Java, C#, Ruby, or any language.*
