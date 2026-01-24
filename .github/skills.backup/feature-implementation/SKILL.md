---
name: feature-implementation
description: Step-by-step guide for implementing new features in any project. Use when planning features, adding models/endpoints/APIs, creating UI components, or making changes spanning backend and frontend. Covers when to create OpenSpec proposals vs direct implementation, and provides framework-agnostic implementation patterns.
---

# Feature Implementation Guide

Comprehensive workflow for adding new features to your project.

## When to Use This Skill

Use when:
- Adding new models, endpoints, or APIs
- Creating UI for backend functionality
- Building features requiring both backend and frontend changes
- Work will take more than 1-2 hours
- User asks: "How do I add a new feature?" or "What's the workflow for implementing X?"

## Prerequisites

Before starting:
- Read [CODEBASE_ESSENTIALS.md](../../../CODEBASE_ESSENTIALS.md) - Current patterns
- Check for relevant skills in `.github/skills/`
- For breaking changes: Read `openspec/AGENTS.md` (if OpenSpec is installed)

## Decision Tree: Proposal or Direct Implementation?

### ✅ Create OpenSpec Proposal When:

- **New capabilities**: New models, API resources, system features
- **Breaking changes**: API contract changes, database schema changes
- **Architecture changes**: New patterns, core system refactoring
- **Performance optimizations**: Changes that alter behavior
- **Security changes**: Authentication, authorization, data protection

### ✅ Direct Implementation When:

- **Bug fixes**: Restoring intended behavior
- **Small enhancements**: Improvements to existing features
- **UI improvements**: No API changes required
- **Non-breaking additions**: Adding optional fields to existing models
- **Configuration changes**: Settings, environment variables

**Rule of thumb**: If unsure, create a proposal! Easier to skip approval than refactor later.

## Path A: With OpenSpec Proposal (Breaking/Major Changes)

### Step 1: Create Proposal

```bash
openspec list --specs           # Review existing specs
openspec list                   # Review pending changes
openspec create add-feature-name
```

This creates:
- `openspec/changes/add-feature-name/proposal.md`
- `openspec/changes/add-feature-name/tasks.md`
- `openspec/changes/add-feature-name/design.md` (optional)
- `openspec/changes/add-feature-name/specs/*.delta.md`

### Step 2: Fill Out Proposal

**proposal.md template:**
```markdown
# Add Feature Name

## Problem
What user/business problem does this solve?

## Solution
High-level technical approach

## Scope
- Backend: New model X, endpoint Y
- Frontend: UI component Z
- Tests: Unit + integration coverage

## Impact
- Breaking changes: Yes/No
- Migration required: Yes/No
- Performance impact: [estimate]
```

### Step 3: Create Tasks Checklist

**tasks.md template:**
```markdown
## Backend
- [ ] Create model
- [ ] Write model tests
- [ ] Create serializer
- [ ] Create viewset/view
- [ ] Add URL pattern
- [ ] Write API tests
- [ ] Update OpenAPI schema
- [ ] Run: python manage.py test ✅

## Frontend
- [ ] Generate TypeScript client
- [ ] Create service wrapper
- [ ] Write service tests
- [ ] Create Vue component
- [ ] Write component tests
- [ ] Add route (if needed)
- [ ] Run: npm run test:run ✅
- [ ] Run: npm run type-check ✅

## Documentation
- [ ] Update CODEBASE_ESSENTIALS.md (if new pattern)
- [ ] Add to CODEBASE_CHANGELOG.md
```

### Step 4: Validate & Get Approval

```bash
openspec validate add-feature-name --strict
# Share proposal, wait for approval
```

### Step 5: Implement (See Implementation Steps)

### Step 6: Archive After Deployment

```bash
openspec archive add-feature-name --yes
openspec validate --strict
```

## Path B: Direct Implementation

Skip proposal, go directly to implementation steps below.

## Implementation Workflow

### Phase 1: Plan & Design

#### 1. Understand the Requirement
- What problem does this solve?
- Who are the users?
- What are the acceptance criteria?

#### 2. Check Existing Patterns
```bash
# Read project patterns
cat CODEBASE_ESSENTIALS.md

# Search for similar implementations
grep -r "similar_feature" src/
```

#### 3. Break Down the Work
Create a task list in your notes:
- [ ] Backend/API changes needed
- [ ] Frontend/UI changes needed
- [ ] Database/schema changes
- [ ] Tests to write
- [ ] Documentation updates

### Phase 2: Implement Backend First

**Follow your project's backend patterns from CODEBASE_ESSENTIALS.md**

#### General Backend Checklist:
1. **Create/modify data models**
2. **Add API endpoints**
3. **Write unit tests**
4. **Run backend tests**

Example test command (varies by project):
```bash
# Python/Django
pytest backend/ -v

# Node.js
npm test

# Go
go test ./...
```

### Phase 3: Implement Frontend

**Follow your project's frontend patterns from CODEBASE_ESSENTIALS.md**

#### General Frontend Checklist:
1. **Create/modify components**
2. **Connect to API endpoints**
3. **Handle loading/error states**
4. **Write component tests**
5. **Run frontend tests**

Example test commands (varies by project):
```bash
# React/Vue with Vitest
npm run test:run

# Type checking
npm run type-check
```

### Phase 4: Testing & Validation

#### Run Full Test Suite
```bash
# Follow your project's validation matrix
# See CODEBASE_ESSENTIALS.md for exact commands
```

#### Manual Testing Checklist
- [ ] Happy path works
- [ ] Error handling works  
- [ ] Loading states display correctly
- [ ] No console errors
- [ ] Responsive design works (if applicable)

### Phase 5: Documentation & Commit

#### Update Documentation
If you created a new pattern, add it to `CODEBASE_ESSENTIALS.md`:
```markdown
### Pattern: Feature Name
- How to use it
- Why this approach
- Example code
```

#### Update Changelog
Add entry to `CODEBASE_CHANGELOG.md`:
```markdown
## Session: Add Feature Name (Date)

**Goal**: Brief description

**Changes**:
- [file](file#L123): What changed
- [another/file](another/file): What changed

**Validation**:
- ✅ Backend tests: X passed
- ✅ Frontend tests: X passed
```

#### Commit with Good Message
```bash
git add .
git commit -m "feat: Add feature description

- Backend: What was added
- Frontend: What was added
- Tests: Coverage added

Tests: X passed"
```

## Common Patterns

### ✅ API Error Handling

```typescript
// CORRECT - graceful error handling
try {
  const data = await api.create(payload)
  showSuccess('Created successfully')
} catch (error) {
  console.error('Create failed:', error)
  showError('Failed to create. Please try again.')
}

// WRONG - no error handling
const data = await api.create(payload) // Will crash on error!
```

### ✅ Loading States

```typescript
// CORRECT - show loading feedback
const loading = ref(false)

async function loadData() {
  loading.value = true
  try {
    data.value = await api.getAll()
  } finally {
    loading.value = false
  }
}

// Template
<div v-if="loading">Loading...</div>
<div v-else>{{ data }}</div>
```

### ✅ Test Coverage

```typescript
// Cover these cases:
describe('Feature', () => {
  it('handles success case', async () => { ... })
  it('handles error case', async () => { ... })
  it('handles empty data', async () => { ... })
  it('handles loading state', async () => { ... })
})
```

## Troubleshooting

### Tests Fail
- Check if test data matches expected format
- Verify mocks are set up correctly
- Run tests in isolation to find conflicts

### Type Errors
- Regenerate types if API changed
- Check import paths are correct
- Verify nullable fields are handled

### Integration Issues
- Check API endpoint URLs match
- Verify authentication is configured
- Check CORS settings if applicable

## Key Workflow Rules

1. **Plan before coding**: Understand requirements fully
2. **Backend first**: API before UI
3. **Test as you go**: Don't leave tests for the end
4. **Document patterns**: Help future developers
5. **Small commits**: Easier to review and revert

## Examples

### Example 1: Adding a Filter Feature

**Backend (generic)**:
```python
# Add query parameter handling
def get_list(request):
    items = Item.objects.all()
    if 'status' in request.query_params:
        items = items.filter(status=request.query_params['status'])
    return items
```

**Frontend (generic)**:
```typescript
// Add filter state and API call
const filter = ref('')
const items = ref([])

async function loadItems() {
  items.value = await api.getItems({ status: filter.value })
}

watch(filter, loadItems)
```

### Example 2: OpenSpec Proposal Flow

```bash
# 1. Create proposal
openspec create add-user-profiles

# 2. Fill out proposal.md and tasks.md
# 3. Validate
openspec validate add-user-profiles --strict

# 4. Get approval before implementing
# 5. Implement following the workflow above
# 6. After deployment
openspec archive add-user-profiles --yes
```

## Related Resources

- [CODEBASE_ESSENTIALS.md](../../../CODEBASE_ESSENTIALS.md) - Project patterns
- [code-refactoring](../code-refactoring/SKILL.md) - Test-driven refactoring
- `openspec/AGENTS.md` - OpenSpec workflow (if installed)
