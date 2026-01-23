# Codebase Essentials - Vue 3 + TypeScript SPA

**Created:** January 23, 2026  
**Last Updated:** January 23, 2026  
**Status:** Example Project

---

## Technology Stack

**Frontend:**
- TypeScript 5.3
- Vue 3.4 (Composition API)
- Vite 5.0 (build tool)
- Vue Router 4.2
- Pinia 2.1 (state management)

**Styling:**
- Tailwind CSS 3.4
- PostCSS
- Autoprefixer

**Testing:**
- Vitest 1.2 (unit tests)
- @vue/test-utils 2.4 (component testing)
- Happy DOM (DOM implementation)

**Code Quality:**
- ESLint 8.x
- Prettier 3.x
- TypeScript strict mode

**Key Libraries:**
- Axios (HTTP client)
- Vue I18n (internationalization)
- VueUse (composable utilities)

---

## Validation Matrix

**ALWAYS run these commands before claiming work is complete:**

| Changed | Command | Expected Result |
|---------|---------|-----------------|
| **TypeScript** | `npm run type-check` | No errors |
| **Unit Tests** | `npm run test:run` | All tests pass |
| **Linting** | `npm run lint` | No errors |
| **Build** | `npm run build` | Successful build, no warnings |

**Never use `npm test` alone - it hangs! Always use `npm run test:run` for CI/scripts.**

---

## Core Patterns

### 1. Component Structure (Composition API)

**Pattern: Script Setup + Typed Props + Composables**

```vue
<!-- src/components/ArticleCard.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Article } from '@/types/api'

// Props with TypeScript
interface Props {
  article: Article
  showAuthor?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showAuthor: true
})

// Emits with TypeScript
interface Emits {
  (e: 'edit', id: number): void
  (e: 'delete', id: number): void
}

const emit = defineEmits<Emits>()

// Composables
const router = useRouter()

// Computed properties
const formattedDate = computed(() => {
  return new Date(props.article.created_at).toLocaleDateString()
})

// Methods
const handleEdit = () => {
  emit('edit', props.article.id)
}

const handleView = () => {
  router.push({ name: 'article-detail', params: { id: props.article.id } })
}
</script>

<template>
  <div class="article-card border rounded-lg p-4 hover:shadow-lg transition">
    <h3 class="text-xl font-bold mb-2">{{ article.title }}</h3>
    
    <p class="text-gray-600 mb-4 line-clamp-3">
      {{ article.content }}
    </p>
    
    <div class="flex items-center justify-between">
      <span v-if="showAuthor" class="text-sm text-gray-500">
        By {{ article.author_name }}
      </span>
      
      <div class="flex gap-2">
        <button 
          @click="handleView"
          class="btn-primary"
        >
          View
        </button>
        <button 
          @click="handleEdit"
          class="btn-secondary"
        >
          Edit
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.article-card {
  @apply transition-shadow duration-200;
}

.btn-primary {
  @apply px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700;
}

.btn-secondary {
  @apply px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300;
}
</style>
```

**Why:**
- `<script setup>` reduces boilerplate (no need for `return`)
- TypeScript interfaces for compile-time safety
- Composables for reusable logic
- Scoped styles prevent CSS conflicts
- Tailwind @apply keeps templates clean

### 2. API Integration with Composables

**Pattern: Typed API Client + Composable**

```typescript
// src/api/client.ts
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// src/types/api.ts
export interface Article {
  id: number
  title: string
  content: string
  author: number
  author_name: string
  created_at: string
  updated_at: string
  published: boolean
}

export interface ApiResponse<T> {
  data: T
  count?: number
  next?: string | null
  previous?: string | null
}

// src/composables/useArticles.ts
import { ref, type Ref } from 'vue'
import { apiClient } from '@/api/client'
import type { Article, ApiResponse } from '@/types/api'

export function useArticles() {
  const articles: Ref<Article[]> = ref([])
  const loading = ref(false)
  const error: Ref<string | null> = ref(null)

  const fetchArticles = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await apiClient.get<Article[]>('/articles/')
      articles.value = response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch articles'
      console.error('Error fetching articles:', err)
    } finally {
      loading.value = false
    }
  }

  const createArticle = async (data: Omit<Article, 'id' | 'created_at' | 'updated_at' | 'author' | 'author_name'>) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await apiClient.post<Article>('/articles/', data)
      articles.value.push(response.data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create article'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteArticle = async (id: number) => {
    loading.value = true
    error.value = null
    
    try {
      await apiClient.delete(`/articles/${id}/`)
      articles.value = articles.value.filter(a => a.id !== id)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete article'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    articles,
    loading,
    error,
    fetchArticles,
    createArticle,
    deleteArticle
  }
}
```

**Why:**
- Centralized API client configuration
- Type-safe requests and responses
- Composable pattern for reusability
- Error handling in one place
- Automatic auth token injection

### 3. Pinia Store (State Management)

**Pattern: Composition API Store**

```typescript
// src/stores/auth.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { apiClient } from '@/api/client'

export interface User {
  id: number
  username: string
  email: string
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const username = computed(() => user.value?.username || 'Guest')

  // Actions
  const login = async (username: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login/', { username, password })
      token.value = response.data.token
      user.value = response.data.user
      localStorage.setItem('auth_token', response.data.token)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed')
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
  }

  const fetchUser = async () => {
    if (!token.value) return
    
    try {
      const response = await apiClient.get<User>('/auth/me/')
      user.value = response.data
    } catch (error) {
      // Token invalid, logout
      logout()
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    username,
    login,
    logout,
    fetchUser
  }
})
```

**Why:**
- Composition API syntax (consistent with components)
- TypeScript support built-in
- Computed properties for derived state
- Actions encapsulate business logic
- Persist token to localStorage

### 4. Vue Router Guards

**Pattern: Navigation Guards for Auth**

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/articles',
      name: 'articles',
      component: () => import('@/views/ArticlesView.vue')
    },
    {
      path: '/articles/:id',
      name: 'article-detail',
      component: () => import('@/views/ArticleDetailView.vue'),
      props: true  // Pass route params as props
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { requiresAuth: true }  // Protected route
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true }  // Redirect if logged in
    }
  ]
})

// Global navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.meta.guestOnly && authStore.isAuthenticated) {
    // Redirect to home
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
```

**Why:**
- Lazy-loaded routes (code splitting)
- Route props for better component reusability
- Meta fields for declarative auth requirements
- Global guard centralizes auth logic
- Redirect query parameter for post-login navigation

### 5. Testing Components

**Pattern: Vitest + Testing Library**

```typescript
// src/components/__tests__/ArticleCard.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import ArticleCard from '../ArticleCard.vue'
import type { Article } from '@/types/api'

const mockArticle: Article = {
  id: 1,
  title: 'Test Article',
  content: 'This is test content',
  author: 1,
  author_name: 'John Doe',
  created_at: '2026-01-23T10:00:00Z',
  updated_at: '2026-01-23T10:00:00Z',
  published: true
}

describe('ArticleCard', () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/articles/:id', name: 'article-detail', component: { template: '<div></div>' } }]
  })

  it('renders article data correctly', () => {
    const wrapper = mount(ArticleCard, {
      props: { article: mockArticle },
      global: { plugins: [router] }
    })

    expect(wrapper.text()).toContain('Test Article')
    expect(wrapper.text()).toContain('This is test content')
    expect(wrapper.text()).toContain('John Doe')
  })

  it('hides author when showAuthor is false', () => {
    const wrapper = mount(ArticleCard, {
      props: { article: mockArticle, showAuthor: false },
      global: { plugins: [router] }
    })

    expect(wrapper.text()).not.toContain('John Doe')
  })

  it('emits edit event when edit button clicked', async () => {
    const wrapper = mount(ArticleCard, {
      props: { article: mockArticle },
      global: { plugins: [router] }
    })

    await wrapper.find('button:nth-child(2)').trigger('click')

    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')?.[0]).toEqual([1])
  })

  it('navigates to detail view when view button clicked', async () => {
    const wrapper = mount(ArticleCard, {
      props: { article: mockArticle },
      global: { plugins: [router] }
    })

    const pushSpy = vi.spyOn(router, 'push')

    await wrapper.find('button:nth-child(1)').trigger('click')

    expect(pushSpy).toHaveBeenCalledWith({
      name: 'article-detail',
      params: { id: 1 }
    })
  })
})

// src/composables/__tests__/useArticles.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useArticles } from '../useArticles'
import { apiClient } from '@/api/client'

vi.mock('@/api/client')

describe('useArticles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches articles successfully', async () => {
    const mockArticles = [mockArticle]
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockArticles })

    const { articles, loading, error, fetchArticles } = useArticles()

    expect(loading.value).toBe(false)

    const promise = fetchArticles()
    expect(loading.value).toBe(true)

    await promise

    expect(loading.value).toBe(false)
    expect(articles.value).toEqual(mockArticles)
    expect(error.value).toBeNull()
  })

  it('handles fetch errors', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'))

    const { error, fetchArticles } = useArticles()

    await fetchArticles()

    expect(error.value).toBe('Network error')
  })

  it('creates article and adds to list', async () => {
    const newArticle = { title: 'New', content: 'Content', published: true }
    vi.mocked(apiClient.post).mockResolvedValue({ data: { ...newArticle, id: 2 } })

    const { articles, createArticle } = useArticles()

    await createArticle(newArticle)

    expect(articles.value).toHaveLength(1)
    expect(articles.value[0].title).toBe('New')
  })
})
```

**Why:**
- Component tests verify rendering + interactions
- Composable tests verify business logic
- Mocks isolate unit under test
- Async tests ensure loading states work
- Type-safe test data

---

## Critical Invariants

### NEVER Violate These Rules

1. **Always define types for API responses**
   ```typescript
   // ❌ BAD
   const response = await apiClient.get('/articles/')
   
   // ✅ GOOD
   const response = await apiClient.get<Article[]>('/articles/')
   ```

2. **Never use `any` type (use `unknown` if unavoidable)**
   ```typescript
   // ❌ BAD
   const handleError = (error: any) => { ... }
   
   // ✅ GOOD
   const handleError = (error: unknown) => {
     if (error instanceof Error) { ... }
   }
   ```

3. **Always use `<script setup lang="ts">` for new components**
   - Consistent with Composition API
   - Better TypeScript inference
   - Less boilerplate

4. **Never commit `console.log` in production code**
   - Use proper logging utility
   - ESLint should catch this (`no-console` rule)

5. **Always lazy-load route components**
   ```typescript
   // ❌ BAD
   import HomeView from '@/views/HomeView.vue'
   
   // ✅ GOOD
   component: () => import('@/views/HomeView.vue')
   ```

---

## Common Gotchas

### 1. Reactive Destructuring

**Problem:** Destructuring props/reactive objects loses reactivity.

```typescript
// ❌ BAD - loses reactivity
const { article } = defineProps<{ article: Article }>()

// ✅ GOOD - maintains reactivity
const props = defineProps<{ article: Article }>()
// Use props.article

// OR use toRefs
const { article } = toRefs(props)
```

### 2. Vitest Hanging

**Problem:** `npm test` hangs indefinitely in CI.

**Solution:**
```json
// package.json
{
  "scripts": {
    "test": "vitest",           // For watch mode in dev
    "test:run": "vitest run"    // For CI/one-time runs
  }
}
```

Always use `npm run test:run` in scripts and CI.

### 3. Environment Variables

**Problem:** Environment variables not available at runtime.

**Solution:**
```typescript
// ✅ GOOD - Vite exposes import.meta.env
const apiUrl = import.meta.env.VITE_API_BASE_URL

// .env.local (not committed)
VITE_API_BASE_URL=http://localhost:8000

// .env.production (committed)
VITE_API_BASE_URL=https://api.example.com
```

All env vars must be prefixed with `VITE_` to be exposed.

### 4. Tailwind Purge Not Working

**Problem:** Tailwind classes in dynamic strings get purged.

```vue
<!-- ❌ BAD - will be purged -->
<div :class="`text-${color}-600`">

<!-- ✅ GOOD - safe-list or use full class names -->
<div :class="color === 'blue' ? 'text-blue-600' : 'text-red-600'">
```

---

## Architecture Decisions

### Why Vue 3 Composition API?

**Decision:** Use Composition API over Options API.

**Rationale:**
- Better TypeScript support
- More flexible code organization
- Reusable logic via composables
- Better tree-shaking
- Future direction of Vue

**Alternatives considered:**
- Options API: Less flexible, worse TS support

### Why Pinia over Vuex?

**Decision:** Use Pinia for state management.

**Rationale:**
- Simpler API (no mutations)
- Full TypeScript support
- DevTools integration
- Modular by default
- Official recommendation for Vue 3

**Alternatives considered:**
- Vuex 4: More boilerplate, weaker TS support
- Plain composables: Insufficient for complex state

### Why Vite over Webpack?

**Decision:** Use Vite as build tool.

**Rationale:**
- Instant dev server startup
- Fast HMR (Hot Module Replacement)
- Out-of-the-box TypeScript support
- Optimized production builds
- Official Vue tooling

**Alternatives considered:**
- Webpack: Slower dev experience
- Create Vue App: Uses Vite anyway

---

## File Organization

```
frontend/
├── index.html
├── package.json
├── tsconfig.json              # TypeScript config
├── vite.config.ts             # Vite config
├── vitest.config.ts           # Test config
├── tailwind.config.js         # Tailwind config
├── .env.example               # Environment template
├── src/
│   ├── main.ts                # App entry point
│   ├── App.vue                # Root component
│   ├── router/
│   │   └── index.ts           # Route definitions
│   ├── stores/
│   │   ├── auth.ts            # Auth store
│   │   └── articles.ts        # Articles store
│   ├── views/
│   │   ├── HomeView.vue
│   │   └── ArticlesView.vue
│   ├── components/
│   │   ├── base/              # Base components (Button, Input)
│   │   ├── ArticleCard.vue
│   │   └── __tests__/         # Component tests
│   ├── composables/
│   │   ├── useArticles.ts
│   │   └── __tests__/         # Composable tests
│   ├── api/
│   │   └── client.ts          # Axios instance
│   ├── types/
│   │   └── api.ts             # TypeScript types
│   └── assets/
│       └── styles/
│           └── main.css       # Global styles
└── public/
    └── favicon.ico
```

**Conventions:**
- `views/` for route-level components
- `components/` for reusable components
- `composables/` for reusable logic
- `__tests__/` co-located with source files
- `types/` for shared TypeScript types

---

*This example demonstrates a production-ready Vue 3 SPA with TypeScript, state management, routing, and comprehensive testing.*
