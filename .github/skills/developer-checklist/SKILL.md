---
name: developer-checklist
description: Pre-commit and pre-push validation checklist for gnwebsite fullstack project. Use when implementing features, writing tests, before committing code, or creating pull requests. Ensures backend Django tests pass, frontend Vitest tests pass, TypeScript validates, and code follows project patterns. Includes filter implementation, API contract alignment, and test troubleshooting.
---

# Developer Checklist

Comprehensive validation checklist for backend and frontend development in gnwebsite project.

## When to Use This Skill

- Before committing any code changes
- When implementing new backend models, endpoints, or filters
- When integrating frontend components with APIs
- Before creating pull requests
- When troubleshooting test failures
- When you hear: "What should I check before committing?"

## Test Execution - CRITICAL

### Frontend Tests

**ALWAYS use `npm run test:run` (NOT `npm test`):**

```bash
# ✅ CORRECT - Tests run once and exit
npm run test:run

# ❌ WRONG - Tests hang in watch mode
npm test
npm run test
```

### Backend Tests

```bash
# Run all tests
cd backend && python manage.py test

# Run specific test class
cd backend && python manage.py test jewelry_portfolio.api_test.JewelryAPIIntegrationTest
```

## Backend Feature Implementation Checklist

### New Model/Field
- [ ] Write tests for all query methods
- [ ] Test CRUD operations
- [ ] Test field validation and constraints
- [ ] Run: `python manage.py test` ✅

### New Endpoint
- [ ] Write tests for GET, POST, PUT, DELETE as applicable
- [ ] Test authentication/permissions
- [ ] Test error responses (400, 401, 403, 404, 500)
- [ ] Verify API contract with OpenAPI schema
- [ ] Run: `python manage.py test` ✅

### New Filter
- [ ] Test single value: `?filter=value`
- [ ] Test multiple values: `?filter1=value1&filter2=value2`
- [ ] Test edge cases: empty, invalid, null values
- [ ] Test case sensitivity if applicable
- [ ] **Use correct filter type**: `BooleanFilter` for booleans (NOT `CharFilter`)
- [ ] Run: `python manage.py test` ✅

### Model Changes
- [ ] Update related serializers
- [ ] Update related tests
- [ ] Check for migration conflicts
- [ ] Regenerate OpenAPI schema: `python manage.py spectacular --file openapi_schema.json`

## Frontend Feature Implementation Checklist

### API Integration
- [ ] Check if API tests exist for the endpoint
- [ ] If tests missing: Request backend tests FIRST
- [ ] Update service to match tested API contract exactly
- [ ] Use typed mock data from API tests

### Component Updates
- [ ] Add tests for components using API data
- [ ] Verify TypeScript types match API contract
- [ ] Test error handling and loading states
- [ ] Test user interactions
- [ ] Run: `npm run test:run` ✅
- [ ] Run: `npm run type-check` ✅

### After Backend API Changes
- [ ] Regenerate TypeScript client: `npx @openapitools/openapi-generator-cli generate`
- [ ] Update service layer types
- [ ] Update component types
- [ ] Update test mocks

## Pre-Commit Checklist

**Run BEFORE every commit:**

- [ ] Backend tests pass: `cd backend && python manage.py test`
- [ ] Frontend tests pass: `cd frontend && npm run test:run`
- [ ] TypeScript types valid: `cd frontend && npm run type-check`
- [ ] No console errors in browser dev tools
- [ ] Code follows project style (check existing code)

## Pre-Pull Request Checklist

**Before creating ANY pull request:**

- [ ] All tests pass locally (backend + frontend)
- [ ] Tested manually in browser
- [ ] Related documentation updated (CODEBASE_CHANGELOG.md)
- [ ] No console warnings/errors
- [ ] Changes don't break other features
- [ ] Commit messages are descriptive

## Test Failure Troubleshooting

### Backend Tests Failed

1. **Read the error message carefully**
2. Check if the test expectation is correct
3. Fix the implementation to match test expectations
4. **NEVER delete tests to make them pass**

Common backend issues:
- Wrong filter type (CharFilter vs BooleanFilter)
- Missing API test coverage
- Serializer/model mismatch
- Migration conflicts

### Frontend Tests Failed

1. **Check if mock data matches actual API contract**
2. Verify component logic is correct
3. Update test expectations if implementation is correct
4. **NEVER delete tests to make them pass**

Common frontend issues:
- Outdated OpenAPI schema
- Mock data doesn't match API response structure
- Missing pagination handling
- Type mismatches (snake_case vs camelCase)

## Common Mistakes to Avoid

### ❌ DON'T

```bash
# Commit without tests
git commit "Add category filter to frontend"
# Result: API breaks, frontend breaks
```

```python
# Use wrong filter type
class MyFilterSet(FilterSet):
    is_published = CharFilter()  # ❌ WRONG for boolean
```

```typescript
// Skip type checking
const data = response as any  // ❌ Type assertion workaround
```

### ✅ DO

```bash
# Proper workflow
git commit "Add category filter tests"
git commit "Add category filter implementation"
git commit "Update frontend to use category filter"
```

```python
# Use correct filter type
class MyFilterSet(FilterSet):
    is_published = BooleanFilter()  # ✅ CORRECT
```

```typescript
// Fix at source
// Regenerate OpenAPI schema and TypeScript client
// Then types work correctly
```

## Recommended Commit Workflow

**Correct sequence:**

1. Write backend tests → `git commit "Add tests for X"`
2. Implement backend → `git commit "Implement X"`
3. Regenerate OpenAPI schema → `git commit "Update OpenAPI schema"`
4. Update frontend types → `git commit "Update frontend types for X"`
5. Implement frontend → `git commit "Add frontend UI for X"`

## Questions to Ask Before Implementing

- "Are there API tests for this endpoint?"
- "Do the tests cover all filter combinations?"
- "Does the mock data match the actual API response?"
- "Will this change break any existing tests?"
- "Is the OpenAPI schema up to date?"
- "Have I regenerated the TypeScript client?"

## Helpful Commands Reference

### Backend
```bash
# All tests
cd backend && python manage.py test

# Specific test class
cd backend && python manage.py test jewelry_portfolio.api_test.JewelryAPIIntegrationTest

# Regenerate OpenAPI schema
cd backend && python manage.py spectacular --file openapi_schema.json
```

### Frontend
```bash
# All tests (exits after run)
cd frontend && npm run test:run

# Tests with coverage
cd frontend && npm run test:run -- --coverage

# Type check
cd frontend && npm run type-check

# Regenerate TypeScript client
cd frontend && npx @openapitools/openapi-generator-cli generate
```

### Full Validation
```bash
# Quick validation script
cd backend && python manage.py test && \
cd ../frontend && npm run type-check && npm run test:run
```

## Key Project Patterns

### OpenAPI Schema Sync
When backend changes pagination/endpoints:
1. Regenerate schema: `python manage.py spectacular --file openapi_schema.json`
2. Regenerate TS client: `npx @openapitools/openapi-generator-cli generate`
3. Update service layer to use new types
4. Update test mocks

### Filter Implementation
- Use `BooleanFilter` for boolean fields
- Use `NumberFilter` for numeric fields
- Test all combinations: single, multiple, edge cases
- Always write tests before implementing

### Type Safety
- OpenAPI generator converts snake_case → camelCase
- Use camelCase in TypeScript (e.g., `isPublished` not `is_published`)
- No type assertions - regenerate schema instead
- Keep service layer interfaces in sync with API

## Related Files

- [Testing Strategy](../../../docs/guides/TESTING_STRATEGY.md) - Detailed test patterns
- [Incident Report](../../../docs/incidents/2025_12_23_category_filters.md) - Filter mistakes
- [Backend Tests](../../../backend/jewelry_portfolio/api_test.py) - Example patterns
- [Frontend Tests](../../../frontend/src/views/__tests__/) - Component test examples
- [CODEBASE_ESSENTIALS.md](../../../CODEBASE_ESSENTIALS.md) - Core patterns

## Examples

### Example 1: Before Committing New Filter

**User**: "I added a category filter, can I commit?"

**Checklist**:
1. ✅ Backend tests for filter combinations?
2. ✅ Used `NumberFilter` (not CharFilter)?
3. ✅ Tested edge cases?
4. ✅ `python manage.py test` passes?
5. ✅ Regenerated OpenAPI schema?
6. ✅ Frontend tests updated?
7. ✅ `npm run test:run` passes?

### Example 2: Troubleshooting Test Failures

**User**: "Frontend tests are failing after backend changes"

**Steps**:
1. Check if OpenAPI schema regenerated
2. Check if TypeScript client regenerated
3. Check if mock data matches new response structure
4. Update service layer types
5. Update test mocks to match new response

### Example 3: Implementing New Endpoint

**User**: "I need to add a new blog endpoint"

**Workflow**:
1. Write backend tests (GET, POST, PUT, DELETE)
2. Implement endpoint
3. Run `python manage.py test` ✅
4. Regenerate OpenAPI schema
5. Regenerate TS client
6. Update frontend service
7. Write frontend tests
8. Run `npm run test:run` ✅
9. Commit each step

## Anti-Patterns

### ❌ Implementation Before Tests
```bash
# Wrong order
git commit "Implement feature"
git commit "Add tests"
```

### ❌ Type Assertions as Workarounds
```typescript
// Wrong - hiding type issues
const data = response as unknown as MyType
```

### ❌ Deleting Failing Tests
```typescript
// Wrong - tests exist for a reason
// test('should validate input', ...) // Commented out
```

### ✅ Correct Patterns
```bash
# Right order
git commit "Add tests"
git commit "Implement feature"
```

```typescript
// Right - fix at source
// Regenerate OpenAPI schema and client
```

```typescript
// Right - fix implementation
test('should validate input', () => {
  // Update implementation to pass test
})
```
