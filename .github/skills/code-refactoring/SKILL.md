---
name: code-refactoring
description: Safe code refactoring guide for gnwebsite project. Use when refactoring components, removing duplication, improving code structure, or simplifying complex functions. Covers test-driven refactoring, incremental changes, extract function/composable patterns, and rollback procedures. Ensures refactoring preserves behavior while improving code quality.
---

# Code Refactoring Guide

Step-by-step guide for safely refactoring code without breaking functionality in the gnwebsite fullstack project.

## When to Use This Skill

Use when:
- User asks "How do I refactor this code?" or "Can I simplify this?"
- Reducing code duplication (DRY violations)
- Simplifying complex functions (>50 lines)
- Extracting reusable logic to composables
- Improving code structure or naming
- Addressing technical debt
- User mentions: "refactor", "clean up", "simplify", "reduce duplication"

**Do NOT use for:**
- Style preferences without measurable benefit
- Just before deadlines
- Code without existing tests
- Changes that alter behavior (that's feature work, not refactoring)

## Decision Tree: Proposal or Direct Refactoring?

```
Need to refactor?
│
├─ Breaking changes? (API contracts, schemas, core patterns)
│  └─ YES → Create OpenSpec proposal
│
├─ Just reorganizing code? (internal structure, no external impact)
│  └─ YES → Follow safe refactoring steps
│
└─ Unsure?
   └─ Create proposal (better safe than sorry!)
```

## Prerequisites (CRITICAL)

**NEVER refactor without tests!**

```bash
# Check test coverage
cd frontend && npm run test:run -- --coverage
cd backend && docker exec backend pytest --cov

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
# Refactoring: [Component Name]

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
git checkout -b refactor-my-feature
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
- [ ] No console errors
- [ ] Manual testing complete
- [ ] Performance unchanged/better
- [ ] Documentation updated
```

## Phase 2: Refactoring Patterns

### Pattern A: Extract Function (Reduce Complexity)

**When**: Function >50 lines or multiple responsibilities

**Before**:
```typescript
async function processArticle(article: Article) {
  // Validation (10 lines)
  if (!article.title) throw new Error('Title required')
  if (!article.content) throw new Error('Content required')
  
  // Image processing (15 lines)
  const images = []
  for (const img of article.images || []) {
    const url = img.image?.fileUrl || img.image?.file_url
    if (url) images.push({ url, caption: img.caption })
  }
  
  // Save (20 lines)
  const response = await api.create({ title, content, images })
  return response
}
```

**After**:
```typescript
async function processArticle(article: Article) {
  validateArticle(article)
  const images = processImages(article.images)
  return await saveArticle(article, images)
}

function validateArticle(article: Article) {
  if (!article.title) throw new Error('Title required')
  if (!article.content) throw new Error('Content required')
  if (article.title.length > 200) throw new Error('Title too long')
}

function processImages(images?: ArticleImage[]) {
  return (images || [])
    .map(img => ({ url: getImageUrl(img.image), caption: img.caption }))
    .filter(img => img.url && img.url !== '/placeholder-image.png')
}

async function saveArticle(article: Article, images: ProcessedImage[]) {
  return await api.create({ 
    title: article.title, 
    content: article.content, 
    images 
  })
}
```

**Steps**:
1. Extract ONE function at a time
2. Run tests after each extraction
3. Commit each success
4. Add tests for new functions:

```typescript
describe('validateArticle', () => {
  it('should throw on missing title', () => {
    expect(() => validateArticle({ content: 'test' }))
      .toThrow('Title required')
  })
})

describe('processImages', () => {
  it('should extract URLs', () => {
    const imgs = [{ image: { fileUrl: 'test.jpg' }, caption: 'Test' }]
    expect(processImages(imgs)).toEqual([{ url: 'test.jpg', caption: 'Test' }])
  })
  
  it('should filter placeholders', () => {
    expect(processImages([{ image: null }])).toEqual([])
  })
})
```

### Pattern B: Extract Composable (Reuse Logic)

**When**: Same logic duplicated across 3+ components

**Before** (duplicated in BlogView, ArticleView, CategoryView):
```vue
<script setup>
const items = ref([])
const loading = ref(false)
const error = ref('')

const loadItems = async () => {
  loading.value = true
  try {
    const response = await blogService.getAll()
    items.value = response.results
  } catch (err) {
    error.value = 'Failed to load'
  } finally {
    loading.value = false
  }
}

onMounted(loadItems)
</script>
```

**After**:
```typescript
// composables/useDataLoader.ts
export function useDataLoader<T>(
  loadFn: () => Promise<{ results: T[] }>
) {
  const items = ref<T[]>([])
  const loading = ref(false)
  const error = ref('')
  
  const load = async () => {
    loading.value = true
    error.value = ''
    try {
      const response = await loadFn()
      items.value = response.results || []
    } catch (err) {
      error.value = 'Failed to load items'
      console.error(err)
    } finally {
      loading.value = false
    }
  }
  
  onMounted(load)
  return { items, loading, error, reload: load }
}
```

```vue
<!-- All components now -->
<script setup>
import { useDataLoader } from '@/composables/useDataLoader'

const { items, loading, error, reload } = useDataLoader(() => 
  blogService.getAll()
)
</script>
```

**Steps**:
1. Create composable
2. Write composable tests
3. Migrate ONE component
4. Test that component
5. Commit
6. Repeat for remaining components

### Pattern C: Consolidate Styles

**When**: Same CSS in 3+ components

**Before** (duplicated in 6 form components):
```vue
<style scoped>
.form-group { margin-bottom: 1.5rem; }
.form-control { width: 100%; padding: 0.75rem; }
.btn-primary { background: #007bff; color: white; }
</style>
```

**After**:
```css
/* styles/admin-forms.css */
.form-group { margin-bottom: 1.5rem; }
.form-control { width: 100%; padding: 0.75rem; }
.btn-primary { background: #007bff; color: white; }
```

```vue
<!-- Components keep only unique styles -->
<style scoped>
.special-field { /* component-specific */ }
</style>
```

**Steps**:
1. Extract to shared CSS file
2. Import in main.ts/App.vue
3. Remove from ONE component
4. Visual test
5. Commit
6. Repeat for remaining

### Pattern D: Replace with Utility

**When**: Same calculation in 5+ places

**Before** (in 5 files):
```typescript
const imageUrl = img.image?.fileUrl || img.image?.file_url || '/placeholder-image.png'
```

**After**:
```typescript
// utils/imageData.ts
export function extractImageUrl(
  imageData: any, 
  fallback = '/placeholder-image.png'
): string {
  if (!imageData) return fallback
  return imageData.fileUrl || imageData.file_url || fallback
}

// All files:
const imageUrl = extractImageUrl(img.image)
```

**Steps**:
1. Create utility
2. Write comprehensive tests
3. Replace in ONE location
4. Test
5. Commit
6. Repeat for each location

## Phase 3: Incremental Execution

**CRITICAL WORKFLOW**: One change → Test → Commit

```bash
# 1. Create working branch
git checkout -b refactor-my-feature

# 2. Make ONE small change
# ... edit code ...

# 3. Run tests
npm run test:run

# 4. If pass, commit
git add .
git commit -m "refactor: extract validateArticle function

- Moved validation from processArticle
- All tests passing
- No behavior changes"

# 5. Repeat for next change
# ... edit code ...
npm run test:run
git commit -m "refactor: extract processImages"

# Continue until complete
```

### Testing After EVERY Change

```bash
# After each change:

# 1. Unit tests
npm run test:run

# 2. Type check
npm run type-check

# 3. Pattern check
npm run test:patterns

# 4. Manual spot check
npm run dev
# Test the specific feature

# If ANY fail:
git reset --hard HEAD  # Undo
# OR fix before committing
```

## Phase 4: Validation

### Comprehensive Testing Checklist

**Automated:**
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Type check passes
- [ ] Pattern enforcement passes
- [ ] No new linting errors

**Manual:**
- [ ] Feature works exactly as before
- [ ] No console errors
- [ ] No visual regressions
- [ ] Performance unchanged/better
- [ ] Works in all browsers

**Code Quality:**
- [ ] More readable
- [ ] More testable
- [ ] Less duplication
- [ ] Lower complexity
- [ ] Reasonable file sizes

### Performance Verification

```bash
# Before refactor
npm run build
# Note: size, time

# After refactor
npm run build
# Compare: should be similar or better
```

## Phase 5: Documentation

### Update Project Docs

If new patterns introduced:

**CODEBASE_ESSENTIALS.md**:
```markdown
- **Image URL extraction:** Always use `extractImageUrl()` from `@/utils/imageData`. Prevents silent failures.
```

**CODEBASE_CHANGELOG.md**:
```markdown
### Session: Refactor Image URL Handling (Jan 13, 2026)

**Goal**: Eliminate duplicated image URL logic

**Changes**:
- Created `extractImageUrl()` utility
- Replaced 12 instances
- Added tests (8 unit, 6 integration)

**Impact**:
- Reduced duplication by ~80 lines
- Improved testability

**Validation**:
- ✅ All 227 tests pass
- ✅ No behavior changes
- ✅ Build size unchanged

**Commit**: abc123
```

## Anti-Patterns (DON'T DO THIS)

### ❌ Big Bang Refactor

```bash
# WRONG: Change 50 files at once
git commit -m "refactor: everything"

# CORRECT: Incremental commits
git commit -m "refactor: extract validation"
# test
git commit -m "refactor: extract image processing"
# test
```

### ❌ Refactor Without Tests

```typescript
// WRONG: No tests exist
function refactoredFunction() {
  // Hope this works! 🤞
}

// CORRECT: Write tests first
test('refactoredFunction works', () => { ... })
function refactoredFunction() { ... }
```

### ❌ Change Behavior

```typescript
// WRONG: Added new validation during refactor
function validateArticle(article: Article) {
  if (!article.title) throw new Error('Title required')
  if (!article.excerpt) throw new Error('Excerpt required')  // NEW!
}

// CORRECT: Preserve exact behavior
function validateArticle(article: Article) {
  if (!article.title) throw new Error('Title required')
  // Same validation as before, just extracted
}
```

### ❌ Premature Optimization

```typescript
// WRONG: No measured problem, making code complex
// Replacing simple readable code with "faster" code

// CORRECT: Measure first, optimize if needed
// Keep code simple unless profiling shows issue
```

### ❌ Refactor Under Pressure

```
// WRONG: "Production deploy tomorrow, let me refactor today!"
// CORRECT: Refactor when you have time to test properly
```

## Common Scenarios

### Scenario 1: Component Too Large (>300 lines)

**Fix**:
1. Extract child components
2. Extract composables for logic
3. Extract utilities for helpers
4. ONE responsibility per file

### Scenario 2: Duplicated Code (3+ places)

**Fix**:
1. Identify common pattern
2. Extract to utility/composable
3. Write tests
4. Replace one by one
5. Delete duplicates

### Scenario 3: Hard to Test

**Fix**:
1. Identify dependencies
2. Extract to parameters
3. Make functions pure
4. Write tests with mocks

### Scenario 4: Unclear Naming

**Fix**:
1. Rename ONE identifier
2. Use IDE refactor (F2 in VS Code)
3. Run tests
4. Commit
5. Repeat

## Emergency Rollback

If refactoring breaks something:

```bash
# Option 1: Revert last commit
git revert HEAD

# Option 2: Restore from backup
git checkout backup-before-refactor
git checkout -b refactor-my-feature-v2

# Option 3: Stash and investigate
git stash
npm run test:run  # Pass now?
git stash pop     # Re-apply and fix

# Option 4: Nuclear
git reset --hard origin/development
# Start over with smaller changes
```

## Success Metrics

Refactoring succeeds when:

✅ All tests pass (no behavior changes)  
✅ Code more readable (clear improvement)  
✅ Complexity reduced (fewer lines, simpler logic)  
✅ Duplication removed (DRY)  
✅ Test coverage maintained/improved  
✅ Performance unchanged/better  
✅ No regressions (manual testing confirms)  

## Key Commands

```bash
# Before refactoring
npm run test:run -- --coverage        # Check coverage
docker exec backend pytest --cov      # Backend coverage
git checkout -b backup-before-refactor # Safety backup

# During refactoring (after EACH change)
npm run test:run                      # Frontend tests
npm run type-check                    # TypeScript
npm run test:patterns                 # Pattern enforcement
docker exec backend pytest -v         # Backend tests
git commit -m "refactor: [change]"    # Commit success

# After refactoring
npm run build                         # Verify build
npm run dev                          # Manual test
git push origin refactor-my-feature   # Push when complete
```

## Examples

### Example 1: Extract Function

```bash
# 1. Initial state: 80-line function
# 2. Extract validation (commit)
git commit -m "refactor: extract validateArticle"
# 3. Extract image processing (commit)
git commit -m "refactor: extract processImages"
# 4. Simplify main function (commit)
git commit -m "refactor: simplify processArticle"
# Result: 3 small focused functions
```

### Example 2: Extract Composable

```bash
# 1. Create useDataLoader composable
# 2. Write tests for composable
git commit -m "refactor: add useDataLoader composable"
# 3. Migrate BlogView (test, commit)
git commit -m "refactor: BlogView uses useDataLoader"
# 4. Migrate ArticleView (test, commit)
git commit -m "refactor: ArticleView uses useDataLoader"
# 5. Migrate CategoryView (test, commit)
git commit -m "refactor: CategoryView uses useDataLoader"
# Result: Eliminated 60 lines of duplication
```

## When to Stop

Stop refactoring when:
- Tests start failing frequently (too aggressive)
- Code is "good enough" (perfect is enemy of done)
- Deadline approaching (commit what you have)
- No measurable benefit (diminishing returns)
- You're just tweaking style (not improving structure)

## Related Resources

- [developer-checklist](../developer-checklist/SKILL.md) - Pre-commit validation
- [feature-implementation](../feature-implementation/SKILL.md) - Adding features
- [CODEBASE_ESSENTIALS.md](../../../CODEBASE_ESSENTIALS.md) - Current patterns
- [CODEBASE_CHANGELOG.md](../../../CODEBASE_CHANGELOG.md) - Historical changes
- [.archive/guides/DRY_REFACTORING_GUIDE.md](../../../.archive/guides/DRY_REFACTORING_GUIDE.md) - Past refactor example
