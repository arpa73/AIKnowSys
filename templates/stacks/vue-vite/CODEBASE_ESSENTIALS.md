# Codebase Essentials - {{PROJECT_NAME}}

**Created:** {{DATE}}  
**Last Updated:** {{DATE}}  
**Status:** {{STATUS}}

---

## Technology Stack

**Frontend:**
- TypeScript 5.x
- Vue 3.x (Composition API with `<script setup>`)
- Vite 5.x (build tool and dev server)
- Vue Router 4.x (client-side routing)
- Pinia 2.x (state management)

**Styling:**
- {{CSS_FRAMEWORK}} (e.g., Tailwind CSS, UnoCSS, or plain CSS)
- PostCSS
- Autoprefixer

**Testing:**
- Vitest (unit and integration tests)
- @vue/test-utils (component testing)
- Happy DOM or jsdom

**Code Quality:**
- ESLint with Vue plugin
- Prettier
- TypeScript strict mode
- Husky (git hooks)

**Key Libraries:**
- {{HTTP_CLIENT}} (Axios, Fetch API wrapper, or TanStack Query)
- VueUse (composition utilities)
- {{ADDITIONAL_LIBS}}

---

## Validation Matrix

**ALWAYS run these commands before claiming work is complete:**

| Changed | Command | Expected Result |
|---------|---------|-----------------|
| **TypeScript** | `npm run type-check` | No errors |
| **Tests** | `npm run test:run` | All tests pass |
| **Linting** | `npm run lint` | No errors, or auto-fixed |
| **Build** | `npm run build` | Successful production build |

**Note:** Use `npm run test:run` instead of `npm test` to avoid hanging in CI/scripts.

---

## Project Structure

```
{{PROJECT_NAME}}/
├── src/
│   ├── assets/          # Static assets (images, fonts)
│   ├── components/      # Reusable Vue components
│   │   ├── base/        # Base UI components (Button, Input, etc.)
│   │   └── features/    # Feature-specific components
│   ├── composables/     # Composition API functions
│   ├── router/          # Vue Router configuration
│   ├── stores/          # Pinia stores
│   ├── types/           # TypeScript type definitions
│   ├── views/           # Page-level components
│   ├── utils/           # Helper functions
│   ├── App.vue          # Root component
│   └── main.ts          # Application entry point
├── public/              # Public static files
├── tests/               # Test files
└── vite.config.ts       # Vite configuration
```

---

## Core Patterns

### 1. Component Structure (Composition API)

**✅ GOOD: `<script setup>` with Typed Props**

```vue
<!-- src/components/UserCard.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { User } from '@/types/models'

interface Props {
  user: User
  showEmail?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showEmail: false
})

interface Emits {
  (e: 'edit', userId: number): void
  (e: 'delete', userId: number): void
}

const emit = defineEmits<Emits>()

const initials = computed(() => {
  return props.user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
})

const handleEdit = () => emit('edit', props.user.id)
</script>

<template>
  <div class="user-card">
    <div class="avatar">{ { initials } }</div>
    <div class="details">
      <h3>{ { user.name } }</h3>
      <p v-if="showEmail">{ { user.email } }</p>
    </div>
    <button @click="handleEdit">Edit</button>
  </div>
</template>

<style scoped>
.user-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}
</style>
```

**❌ BAD: Options API without types**

```vue
<script>
export default {
  props: ['user'], // No type safety!
  emits: ['edit'],
  computed: {
    initials() {
      // Runtime errors possible
      return this.user.name.split(' ').map(n => n[0]).join('')
    }
  }
}
</script>
```

**Why:** `<script setup>` reduces boilerplate, typed props catch errors at compile time, and emits are type-safe.

### 2. Vue Router (Type-Safe Navigation)

**✅ GOOD: Typed Routes with Constants**

```typescript
// src/router/routes.ts
import type { RouteRecordRaw } from 'vue-router'

export const ROUTE_NAMES = {
  HOME: 'home',
  USERS: 'users',
  USER_DETAIL: 'user-detail',
  LOGIN: 'login',
} as const

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: ROUTE_NAMES.HOME,
    component: () => import('@/views/HomePage.vue')
  },
  {
    path: '/users',
    name: ROUTE_NAMES.USERS,
    component: () => import('@/views/UsersPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/users/:id',
    name: ROUTE_NAMES.USER_DETAIL,
    component: () => import('@/views/UserDetailPage.vue'),
    props: true // Pass route params as props
  }
]
```

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { useAuthStore } from '@/stores/auth'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guard for auth
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next({ name: ROUTE_NAMES.LOGIN, query: { redirect: to.fullPath } })
  } else {
    next()
  }
})
```

**❌ BAD: Magic string routes**

```typescript
// ❌ Typo-prone, no autocomplete
router.push({ name: 'user-detial' }) // Typo!
router.push('/users/' + id) // Manual string concat
```

**Why:** Route name constants prevent typos, enable autocomplete, and make refactoring safer. Navigation guards centralize auth logic.

### 3. Pinia Stores (Composition API)

**✅ GOOD: Composition API Store with Persistence**

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
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userName = computed(() => user.value?.username || 'Guest')
  
  // Actions
  const login = async (username: string, password: string) => {
    const response = await apiClient.post<{ user: User; token: string }>('/auth/login', {
      username,
      password
    })
    
    user.value = response.data.user
    token.value = response.data.token
    localStorage.setItem('auth_token', response.data.token)
  }
  
  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
  }
  
  const loadUser = async () => {
    if (!token.value) return
    
    try {
      const response = await apiClient.get<User>('/auth/me')
      user.value = response.data
    } catch (error) {
      // Token invalid, clear auth
      logout()
    }
  }
  
  return {
    // State
    user,
    token,
    // Getters
    isAuthenticated,
    userName,
    // Actions
    login,
    logout,
    loadUser
  }
})
```

**❌ BAD: Options API Store with Manual localStorage**

```typescript
// ❌ More verbose, harder to type
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null
  }),
  actions: {
    login(username, password) {
      // No TypeScript help
      localStorage.setItem('token', this.token)
    }
  }
})
```

**Why:** Composition API stores are more concise, easier to type, and match Vue 3's Composition API style. Explicit localStorage sync keeps auth state persistent.

### 4. Composables (Reusable Logic)

**✅ GOOD: useApi Composable**

```typescript
// src/composables/useApi.ts
import { ref, type Ref } from 'vue'

export interface UseApiReturn<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  execute: (...args: any[]) => Promise<void>
  reset: () => void
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>
): UseApiReturn<T> {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const execute = async (...args: any[]) => {
    loading.value = true
    error.value = null
    
    try {
      data.value = await apiFunction(...args)
    } catch (err: any) {
      error.value = err.message || 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const reset = () => {
    data.value = null
    loading.value = false
    error.value = null
  }
  
  return {
    data,
    loading,
    error,
    execute,
    reset
  }
}
```

**Usage:**

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import { getUsers } from '@/api/users'

const { data: users, loading, error, execute: fetchUsers } = useApi(getUsers)

onMounted(() => fetchUsers())
</script>

<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: { { error } }</div>
    <ul v-else-if="users">
      <li v-for="user in users" :key="user.id">{ { user.name } }</li>
    </ul>
  </div>
</template>
```

**❌ BAD: Duplicate logic in every component**

```vue
<script setup>
// ❌ Repeated in every component that fetches data
const users = ref([])
const loading = ref(false)
const error = ref(null)

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/users')
    users.value = await res.json()
  } catch (e) {
    error.value = e
  }
  loading.value = false
}
</script>
```

**Why:** Composables extract common patterns (loading, error, data states) into reusable functions. Reduces duplication and makes testing easier.

---

## Common Patterns

### 1. Form Handling with Validation

**✅ GOOD: Composable Form with Validation**

```typescript
// src/composables/useForm.ts
import { reactive, computed } from 'vue'

export interface ValidationRule<T = any> {
  validate: (value: T) => boolean
  message: string
}

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, ValidationRule[]>> = {}
) {
  const formData = reactive<T>({ ...initialValues })
  const errors = reactive<Partial<Record<keyof T, string>>>({})
  const touched = reactive<Partial<Record<keyof T, boolean>>>({})
  
  const validate = (field?: keyof T): boolean => {
    const fieldsToValidate = field ? [field] : Object.keys(validationRules) as (keyof T)[]
    
    let isValid = true
    
    for (const fieldName of fieldsToValidate) {
      const rules = validationRules[fieldName]
      if (!rules) continue
      
      for (const rule of rules) {
        if (!rule.validate(formData[fieldName])) {
          errors[fieldName] = rule.message
          isValid = false
          break
        } else {
          delete errors[fieldName]
        }
      }
    }
    
    return isValid
  }
  
  const handleBlur = (field: keyof T) => {
    touched[field] = true
    validate(field)
  }
  
  const reset = () => {
    Object.assign(formData, initialValues)
    Object.keys(errors).forEach(key => delete errors[key as keyof T])
    Object.keys(touched).forEach(key => delete touched[key as keyof T])
  }
  
  const isFormValid = computed(() => {
    return Object.keys(validationRules).every(field => !errors[field as keyof T])
  })
  
  return {
    formData,
    errors,
    touched,
    validate,
    handleBlur,
    reset,
    isFormValid
  }
}
```

**Usage:**

```vue
<script setup lang="ts">
import { useForm } from '@/composables/useForm'

const { formData, errors, touched, handleBlur, validate, isFormValid } = useForm(
  { username: '', email: '', password: '' },
  {
    username: [
      { validate: (v) => v.length >= 3, message: 'Username must be at least 3 characters' }
    ],
    email: [
      { validate: (v) => /^\S+@\S+\.\S+$/.test(v), message: 'Invalid email format' }
    ],
    password: [
      { validate: (v) => v.length >= 8, message: 'Password must be at least 8 characters' }
    ]
  }
)

const handleSubmit = async () => {
  if (!validate()) return
  
  // Submit form data
  console.log('Submitting:', formData)
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <input
        v-model="formData.username"
        @blur="handleBlur('username')"
        placeholder="Username"
      />
      <span v-if="touched.username && errors.username" class="error">
        { { errors.username } }
      </span>
    </div>
    
    <button type="submit" :disabled="!isFormValid">Submit</button>
  </form>
</template>
```

### 2. Async Component Loading with Suspense

**✅ GOOD: Suspense with Error Boundary**

```vue
<!-- src/views/UserDashboard.vue -->
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'

const UserStats = defineAsyncComponent(() => import('@/components/UserStats.vue'))
const ActivityFeed = defineAsyncComponent(() => import('@/components/ActivityFeed.vue'))
</script>

<template>
  <div class="dashboard">
    <ErrorBoundary>
      <Suspense>
        <template #default>
          <UserStats />
        </template>
        <template #fallback>
          <div class="skeleton">Loading stats...</div>
        </template>
      </Suspense>
    </ErrorBoundary>
    
    <ErrorBoundary>
      <Suspense>
        <template #default>
          <ActivityFeed />
        </template>
        <template #fallback>
          <div class="skeleton">Loading activity...</div>
        </template>
      </Suspense>
    </ErrorBoundary>
  </div>
</template>
```

```vue
<!-- src/components/ErrorBoundary.vue -->
<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const error = ref<Error | null>(null)

onErrorCaptured((err) => {
  error.value = err
  return false // Prevent error from propagating
})
</script>

<template>
  <div v-if="error" class="error-boundary">
    <h3>Something went wrong</h3>
    <p>{ { error.message } }</p>
  </div>
  <slot v-else />
</template>
```

### 3. Global State Composition (Multiple Stores)

**✅ GOOD: Composing Multiple Stores**

```typescript
// src/composables/useCurrentUser.ts
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePreferencesStore } from '@/stores/preferences'

export function useCurrentUser() {
  const authStore = useAuthStore()
  const prefsStore = usePreferencesStore()
  
  const userWithPreferences = computed(() => {
    if (!authStore.user) return null
    
    return {
      ...authStore.user,
      theme: prefsStore.theme,
      language: prefsStore.language,
      notifications: prefsStore.notifications
    }
  })
  
  const updateTheme = async (theme: 'light' | 'dark') => {
    await prefsStore.updateTheme(theme)
  }
  
  return {
    user: userWithPreferences,
    isAuthenticated: authStore.isAuthenticated,
    updateTheme,
    logout: authStore.logout
  }
}
```

### 4. API Client Configuration

**✅ GOOD: Centralized Axios Instance**

```typescript
// src/api/client.ts
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { router } from '@/router'
import { ROUTE_NAMES } from '@/router/routes'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor: Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: Handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      router.push({ name: ROUTE_NAMES.LOGIN })
    }
    return Promise.reject(error)
  }
)
```

### 5. Environment Variables (Type-Safe)

**✅ GOOD: Typed Environment Variables**

```typescript
// src/types/env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_TITLE: string
  readonly VITE_ENABLE_ANALYTICS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

```typescript
// src/config/env.ts
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  appTitle: import.meta.env.VITE_APP_TITLE || 'My App',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
} as const
```

```.env
VITE_API_BASE_URL=https://api.example.com
VITE_APP_TITLE=My Amazing App
VITE_ENABLE_ANALYTICS=true
```

**Why:** Type definitions provide autocomplete and catch missing env vars at compile time. Centralized config object prevents scattered `import.meta.env` calls.

### 6. Testing Patterns

**✅ GOOD: Component Testing with Vue Test Utils**

```typescript
// tests/components/UserCard.test.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import UserCard from '@/components/UserCard.vue'
import type { User } from '@/types/models'

describe('UserCard', () => {
  const mockUser: User = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com'
  }
  
  it('renders user name', () => {
    const wrapper = mount(UserCard, {
      props: { user: mockUser }
    })
    
    expect(wrapper.text()).toContain('John Doe')
  })
  
  it('emits edit event when button clicked', async () => {
    const wrapper = mount(UserCard, {
      props: { user: mockUser }
    })
    
    await wrapper.find('button').trigger('click')
    
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')?.[0]).toEqual([1])
  })
  
  it('shows email when showEmail is true', () => {
    const wrapper = mount(UserCard, {
      props: {
        user: mockUser,
        showEmail: true
      }
    })
    
    expect(wrapper.text()).toContain('john@example.com')
  })
})
```

**Composable Testing:**

```typescript
// tests/composables/useApi.test.ts
import { describe, it, expect, vi } from 'vitest'
import { useApi } from '@/composables/useApi'

describe('useApi', () => {
  it('handles successful API call', async () => {
    const mockFn = vi.fn().mockResolvedValue({ id: 1, name: 'Test' })
    const { data, loading, error, execute } = useApi(mockFn)
    
    expect(loading.value).toBe(false)
    
    await execute()
    
    expect(loading.value).toBe(false)
    expect(data.value).toEqual({ id: 1, name: 'Test' })
    expect(error.value).toBeNull()
  })
  
  it('handles API error', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('API Error'))
    const { data, error, execute } = useApi(mockFn)
    
    await expect(execute()).rejects.toThrow('API Error')
    
    expect(data.value).toBeNull()
    expect(error.value).toBe('API Error')
  })
})
```

---

## Critical Invariants

**Rules that MUST NEVER be violated:**

1. **TypeScript Strict Mode:** All code must pass `strict: true` type checking
2. **No `any` Types:** Use `unknown` and type guards instead of `any` (exceptions: third-party libs without types)
3. **Composition API Only:** No Options API in new components
4. **`<script setup>` Syntax:** All new components must use `<script setup lang="ts">`
5. **Typed Props and Emits:** All component props and emits must be typed with interfaces
6. **Route Names as Constants:** Use `ROUTE_NAMES` object, never magic strings
7. **Centralized API Client:** All API calls through `apiClient`, never raw `fetch`
8. **No Direct localStorage:** Always use Pinia stores for persistence
9. **Error Boundaries:** Async components must be wrapped in `<Suspense>` and error boundaries
10. **Test Coverage:** New features require tests (components and composables)

---

## Testing Patterns

**Test Organization:**
```
tests/
├── unit/
│   ├── components/
│   ├── composables/
│   └── utils/
├── integration/
│   └── flows/
└── setup.ts
```

**Naming:** `[name].test.ts` for all test files

**Component Tests:**
- Test user interactions (clicks, inputs)
- Test emitted events
- Test conditional rendering
- Mock external dependencies (API calls, router)

**Composable Tests:**
- Test state changes
- Test async behavior
- Test error handling
- No need for DOM mounting

**Coverage Target:** 80% for business logic, 60% overall

---

## Performance Patterns

### 1. Code Splitting

```typescript
// Router-level splitting
const routes = [
  {
    path: '/admin',
    component: () => import('@/views/AdminDashboard.vue') // Lazy-loaded
  }
]
```

### 2. Component-level Optimization

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'

// ✅ GOOD: Computed for derived state
const filteredItems = computed(() => {
  return items.value.filter(item => item.active)
})

// ❌ BAD: Function in template (re-runs every render)
// <div v-for="item in items.filter(i => i.active)">
</script>
```

### 3. Virtual Scrolling for Large Lists

```bash
npm install vue-virtual-scroller
```

```vue
<script setup lang="ts">
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

const items = ref(Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Item ${i}` })))
</script>

<template>
  <RecycleScroller
    :items="items"
    :item-size="50"
    key-field="id"
  >
    <template #default="{ item }">
      <div class="item">{ { item.name } }</div>
    </template>
  </RecycleScroller>
</template>
```

---

## Common Gotchas

### 1. Reactivity Loss with Destructuring

```typescript
// ❌ BAD: Loses reactivity
const { user } = useAuthStore()
console.log(user.value) // Won't update!

// ✅ GOOD: Use storeToRefs
import { storeToRefs } from 'pinia'
const { user } = storeToRefs(useAuthStore())
console.log(user.value) // Reactive!
```

### 2. `v-if` vs `v-show`

```vue
<!-- ✅ Use v-if for infrequent toggles (removes from DOM) -->
<div v-if="isLoggedIn">Welcome!</div>

<!-- ✅ Use v-show for frequent toggles (CSS display toggle) -->
<div v-show="isMenuOpen">Menu</div>
```

### 3. Avoid Mutating Props

```vue
<script setup lang="ts">
// ❌ BAD: Mutating prop directly
const props = defineProps<{ count: number }>()
const increment = () => props.count++ // ERROR!

// ✅ GOOD: Use local state or emit event
const localCount = ref(props.count)
const increment = () => localCount.value++
// OR
const emit = defineEmits<{ (e: 'update:count', value: number): void }>()
const increment = () => emit('update:count', props.count + 1)
</script>
```

---

## Dependencies & Versions

**Major Dependencies:**
- `vue@^3.4.0`
- `vue-router@^4.2.0`
- `pinia@^2.1.0`
- `vite@^5.0.0`
- `typescript@^5.3.0`
- `vitest@^1.2.0`
- `@vue/test-utils@^2.4.0`

**Update Strategy:**
- Check for updates monthly: `npm outdated`
- Test in dev before upgrading: `npm run test && npm run build`
- Update minor/patch versions together
- Major version updates require testing and review

---

## Build & Deployment

**Build Commands:**
```bash
npm run build          # Production build
npm run preview        # Preview production build locally
npm run build:analyze  # Bundle size analysis
```

**Environment Files:**
- `.env` - Default values (committed)
- `.env.local` - Local overrides (gitignored)
- `.env.production` - Production values (gitignored)

**Deployment Checklist:**
- [ ] All tests passing
- [ ] TypeScript errors resolved
- [ ] Environment variables configured
- [ ] Build size within limits (< 500KB initial bundle)
- [ ] Performance budget met (Lighthouse score > 90)

---

## Key Architectural Decisions

### Why Composition API?
- Better TypeScript support
- Easier code reuse (composables)
- Aligns with Vue 3's direction
- More flexible than Options API

### Why Pinia over Vuex?
- Simpler API (no mutations)
- Better TypeScript inference
- Composition API support
- Smaller bundle size

### Why Vite over Webpack?
- Faster dev server (ESM-based)
- Faster builds (esbuild)
- Better DX (instant HMR)
- Modern by default

---

## Resources

- [Vue 3 Docs](https://vuejs.org/)
- [Vue Router Docs](https://router.vuejs.org/)
- [Pinia Docs](https://pinia.vuejs.org/)
- [Vite Docs](https://vitejs.dev/)
- [VueUse](https://vueuse.org/) - Composable utilities
- [Vue Test Utils](https://test-utils.vuejs.org/)

---

**Last Updated:** {{DATE}}  
**Next Review:** {{NEXT_REVIEW_DATE}}
