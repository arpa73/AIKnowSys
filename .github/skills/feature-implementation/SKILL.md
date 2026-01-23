---
name: feature-implementation
description: Step-by-step guide for implementing new features in gnwebsite fullstack Django/Vue project. Use when planning features, adding models/endpoints/APIs, creating UI components, or making changes spanning backend and frontend. Covers API-first development, OpenAPI schema sync, test-driven workflow, and when to create OpenSpec proposals vs direct implementation.
---

# Feature Implementation Guide

Comprehensive workflow for adding new features to gnwebsite fullstack application (Django backend + Vue frontend).

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
- Read [developer-checklist](../developer-checklist/SKILL.md) - Pre-commit checks
- For breaking changes: Read [openspec/AGENTS.md](../../../openspec/AGENTS.md)

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

## Implementation Workflow: Backend → Frontend

### Phase 1: Backend Foundation

#### 1. Create Django Model

**File**: `backend/jewelry_portfolio/models.py`

```python
class MyNewModel(models.Model):
    """Model description"""
    name = models.CharField(max_length=200)
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
```

**Run migrations:**
```bash
docker exec -it gnwebsite-backend-1 python manage.py makemigrations
docker exec -it gnwebsite-backend-1 python manage.py migrate
```

#### 2. Create Serializer

**File**: `backend/jewelry_portfolio/serializers.py`

```python
class MyNewModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = MyNewModel
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
```

**⚠️ CRITICAL - SerializerMethodField Arrays:**

```python
# ✅ CORRECT - Use actual serializer class
@extend_schema_field(RelatedItemSerializer(many=True))
def get_items(self, obj):
    return RelatedItemSerializer(obj.items.all(), many=True).data

# ❌ WRONG - Generic object typing breaks frontend
# @extend_schema_field(field={"type": "array", "items": {"type": "object"}})
```

#### 3. Create ViewSet/View

```python
from rest_framework import viewsets, permissions

class MyNewModelViewSet(viewsets.ModelViewSet):
    """API endpoint for MyNewModel"""
    queryset = MyNewModel.objects.all()
    serializer_class = MyNewModelSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Add filtering
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active == 'true')
        return queryset
```

#### 4. Add URL Pattern

**File**: `backend/jewelry_portfolio/urls.py`

```python
from .views import MyNewModelViewSet

router = DefaultRouter()
router.register(r'my-new-models', MyNewModelViewSet, basename='my-new-model')
```

#### 5. Write Backend Tests

**File**: `backend/jewelry_portfolio/test_my_new_model.py`

```python
from django.test import TestCase
from rest_framework.test import APIClient

class MyNewModelAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.model = MyNewModel.objects.create(name='Test', description='Desc')
    
    def test_list_models(self):
        response = self.client.get('/api/my-new-models/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_filter_by_active(self):
        MyNewModel.objects.create(name='Inactive', is_active=False)
        response = self.client.get('/api/my-new-models/?is_active=true')
        self.assertEqual(len(response.data['results']), 1)
    
    def test_create_model(self):
        data = {'name': 'New', 'description': 'New desc'}
        response = self.client.post('/api/my-new-models/', data)
        self.assertEqual(response.status_code, 201)
```

**Run tests:**
```bash
docker exec gnwebsite-backend-1 pytest backend/jewelry_portfolio/test_my_new_model.py -v
```

#### 6. Generate OpenAPI Schema

```bash
docker exec gnwebsite-backend-1 python manage.py spectacular --file openapi_schema.json --format openapi-json
```

### Phase 2: Frontend Integration

#### 7. Generate TypeScript Client

```bash
cd frontend
npx @openapitools/openapi-generator-cli generate \
  -i ../backend/openapi_schema.json \
  -g typescript-fetch \
  -o src/api/generated
```

**Verify generated:**
- `src/api/generated/models/MyNewModel.ts`
- `src/api/generated/apis/MyNewModelApi.ts`

#### 8. Create Service Wrapper

**File**: `frontend/src/services/myNewModelService.ts`

```typescript
import { myNewModelApi, type MyNewModel, type MyNewModelRequest } from '@/api'

export const myNewModelService = {
  async getAll(filters?: { isActive?: boolean }) {
    return await myNewModelApi.myNewModelList({ isActive: filters?.isActive })
  },
  
  async getById(id: number) {
    return await myNewModelApi.myNewModelRetrieve({ id })
  },
  
  async create(data: MyNewModelRequest) {
    return await myNewModelApi.myNewModelCreate({ myNewModelRequest: data })
  },
  
  async update(id: number, data: MyNewModelRequest) {
    return await myNewModelApi.myNewModelUpdate({ id, myNewModelRequest: data })
  },
  
  async delete(id: number) {
    await myNewModelApi.myNewModelDestroy({ id })
  }
}
```

#### 9. Write Service Tests

**File**: `frontend/src/services/__tests__/myNewModelService.spec.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { myNewModelService } from '../myNewModelService'
import { myNewModelApi } from '@/api'

vi.mock('@/api', () => ({
  myNewModelApi: {
    myNewModelList: vi.fn(),
    myNewModelCreate: vi.fn(),
    // ... other methods
  }
}))

describe('myNewModelService', () => {
  beforeEach(() => vi.clearAllMocks())
  
  it('should fetch all models', async () => {
    const mockData = { results: [{ id: 1, name: 'Test' }] }
    vi.mocked(myNewModelApi.myNewModelList).mockResolvedValue(mockData)
    
    const result = await myNewModelService.getAll()
    
    expect(result).toEqual(mockData)
  })
})
```

#### 10. Create Vue Component

**File**: `frontend/src/views/MyNewModelManagement.vue`

```vue
<template>
  <div class="management-page">
    <h2>My New Models</h2>
    
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">{{ error }}</div>
    
    <div v-else>
      <div v-for="item in items" :key="item.id" class="item-card">
        <h3>{{ item.name }}</h3>
        <p>{{ item.description }}</p>
        <button @click="handleEdit(item.id)">Edit</button>
        <button @click="handleDelete(item.id)">Delete</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { myNewModelService } from '@/services/myNewModelService'
import type { MyNewModel } from '@/api'

const items = ref<MyNewModel[]>([])
const loading = ref(false)
const error = ref('')

const loadItems = async () => {
  loading.value = true
  try {
    const response = await myNewModelService.getAll()
    items.value = response.results || []
  } catch (err) {
    error.value = 'Failed to load items'
  } finally {
    loading.value = false
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('Are you sure?')) return
  await myNewModelService.delete(id)
  await loadItems()
}

onMounted(() => loadItems())
</script>
```

#### 11. Write Component Tests

**File**: `frontend/src/views/__tests__/MyNewModelManagement.spec.ts`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MyNewModelManagement from '../MyNewModelManagement.vue'
import { myNewModelService } from '@/services/myNewModelService'

vi.mock('@/services/myNewModelService')

describe('MyNewModelManagement', () => {
  it('should load and display items', async () => {
    vi.mocked(myNewModelService.getAll).mockResolvedValue({
      results: [{ id: 1, name: 'Test', description: 'Desc' }]
    })
    
    const wrapper = mount(MyNewModelManagement)
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Test')
  })
})
```

#### 12. Add Route (if needed)

**File**: `frontend/src/router/index.ts`

```typescript
{
  path: '/admin/my-new-models',
  name: 'MyNewModelManagement',
  component: () => import('@/views/MyNewModelManagement.vue'),
  meta: { requiresAuth: true, requiresAdmin: true }
}
```

### Phase 3: Testing & Validation

#### 13. Run All Tests

```bash
# Backend
docker exec gnwebsite-backend-1 pytest -v

# Frontend
cd frontend
npm run test:run
npm run type-check
```

#### 14. Manual Testing

- [ ] Create item via UI
- [ ] Edit existing item
- [ ] Delete item with confirmation
- [ ] Filter/search works
- [ ] Error messages display
- [ ] Loading states work
- [ ] No console errors
- [ ] Responsive design works

### Phase 4: Documentation & Commit

#### 15. Update Documentation

If new pattern, update `CODEBASE_ESSENTIALS.md`:
```markdown
## Pattern: My New Feature
- Use MyNewModelService for API calls
- Always validate input before create/update
- Default filter returns all items
```

#### 16. Update Changelog

`CODEBASE_CHANGELOG.md`:
```markdown
### Session: Add My New Model Feature (Jan 13, 2026)

**Goal**: Add MyNewModel management

**Changes**:
- Created backend (model, serializer, viewset, tests)
- Generated TypeScript client
- Built admin UI component
- Added comprehensive tests

**Validation**:
- ✅ Backend: 15 tests passed
- ✅ Frontend: 8 tests passed
- ✅ Type check: passed
```

#### 17. Commit

```bash
git add .
git commit -m "feat: Add MyNewModel management

- Create backend with full CRUD
- Add TypeScript client
- Build admin UI
- Add test coverage

Tests: 23 passed"
```

## Common Patterns & Anti-Patterns

### ✅ Image Handling

```typescript
// CORRECT
import { useImageUrl } from '@/composables/useImageUrl'
const { getImageUrl } = useImageUrl()
const imageUrl = getImageUrl(item.image)

// WRONG - can fail silently
const imageUrl = item.image?.fileUrl
```

### ✅ API Client Usage

```typescript
// CORRECT - use service wrapper
import { myNewModelService } from '@/services/myNewModelService'
const items = await myNewModelService.getAll()

// WRONG - raw fetch breaks auth/types
const response = await fetch('/api/my-new-models/')
```

### ✅ OpenAPI Schema Typing

```python
# CORRECT - proper serializer typing
@extend_schema_field(RelatedItemSerializer(many=True))
def get_items(self, obj):
    return RelatedItemSerializer(obj.items.all(), many=True).data

# WRONG - breaks frontend types
@extend_schema_field(field={"type": "array", "items": {"type": "object"}})
```

### ✅ Error Handling

```typescript
// CORRECT
try {
  await myNewModelService.create(data)
  toast.success('Created')
} catch (err) {
  console.error('Create failed:', err)
  toast.error('Failed to create')
}
```

## Troubleshooting

### Backend Tests Fail
- Check migrations: `python manage.py migrate`
- Verify test data in `setUp()` method
- Check database state between tests

### Frontend Tests Fail
- Verify mock data matches API contract
- Check if component needs auth context
- Ensure dependencies mocked

### Type Check Fails
- Regenerate TypeScript client after backend changes
- Check for `any` types
- Verify imports correct

### Integration Issues
- Check CORS in backend settings
- Verify endpoints match
- Check auth configuration

## Key Workflow Rules

1. **Backend first**: Always implement and test backend before frontend
2. **Schema sync**: Regenerate OpenAPI schema after backend changes
3. **Type safety**: Use generated types, no `any` types
4. **Test coverage**: Write tests for both backend and frontend
5. **Service wrappers**: Always wrap API calls in service layer
6. **Error handling**: Handle errors gracefully with user feedback

## Examples

### Example 1: Adding a Filter

**Backend**:
```python
# 1. Add filter to viewset
def get_queryset(self):
    queryset = super().get_queryset()
    category = self.request.query_params.get('category')
    if category:
        queryset = queryset.filter(category_id=category)
    return queryset

# 2. Write test
def test_filter_by_category(self):
    response = self.client.get('/api/items/?category=1')
    self.assertEqual(len(response.data['results']), 2)
```

**Frontend**:
```typescript
// 1. Regenerate client
// 2. Update service
async getAll(filters?: { category?: number }) {
  return await itemsApi.itemsList({ category: filters?.category })
}

// 3. Use in component
const items = await itemService.getAll({ category: selectedCategory.value })
```

### Example 2: OpenSpec Proposal Flow

```bash
# 1. Create proposal
openspec create add-user-profiles

# 2. Fill out proposal.md and tasks.md
# 3. Validate
openspec validate add-user-profiles --strict

# 4. Get approval
# 5. Implement following this guide
# 6. After deployment
openspec archive add-user-profiles --yes
```

## Related Resources

- [developer-checklist](../developer-checklist/SKILL.md) - Pre-commit validation
- [CODEBASE_ESSENTIALS.md](../../../CODEBASE_ESSENTIALS.md) - Current patterns
- [openspec/AGENTS.md](../../../openspec/AGENTS.md) - OpenSpec workflow
- [Backend tests](../../../backend/jewelry_portfolio/) - Example test patterns
- [Frontend tests](../../../frontend/src/views/__tests__/) - Component tests
