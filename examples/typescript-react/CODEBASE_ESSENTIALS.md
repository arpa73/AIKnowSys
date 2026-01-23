# Codebase Essentials - React + TypeScript SPA

**Created:** January 23, 2026  
**Last Updated:** January 23, 2026  
**Status:** Example Project

---

## Technology Stack

**Frontend:**
- TypeScript 5.3
- React 18.2 (Functional Components + Hooks)
- Vite 5.0 (build tool)
- React Router 6.20

**State Management:**
- Zustand 4.4 (lightweight state)
- TanStack Query 5.0 (server state)

**Styling:**
- Tailwind CSS 3.4
- PostCSS
- clsx (conditional classes)

**Testing:**
- Vitest 1.2 (unit tests)
- @testing-library/react 14.1 (component testing)
- @testing-library/user-event 14.5 (interaction testing)
- Happy DOM (DOM implementation)

**Code Quality:**
- ESLint 8.x
- Prettier 3.x
- TypeScript strict mode

**Key Libraries:**
- Axios (HTTP client)
- React Hook Form 7.48 (form management)
- Zod 3.22 (schema validation)
- date-fns (date utilities)

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

### 1. Component Structure (Functional Components + TypeScript)

**Pattern: FC with Typed Props + Hooks + Custom Hooks**

```tsx
// src/components/ArticleCard.tsx
import { FC, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Article } from '@/types/api'

interface ArticleCardProps {
  article: Article
  showAuthor?: boolean
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
}

export const ArticleCard: FC<ArticleCardProps> = ({
  article,
  showAuthor = true,
  onEdit,
  onDelete
}) => {
  const navigate = useNavigate()

  const handleView = useCallback(() => {
    navigate(`/articles/${article.id}`)
  }, [article.id, navigate])

  const handleEdit = useCallback(() => {
    onEdit?.(article.id)
  }, [article.id, onEdit])

  const formattedDate = new Date(article.created_at).toLocaleDateString()

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-bold mb-2">{article.title}</h3>
      
      {showAuthor && (
        <p className="text-sm text-gray-600 mb-2">
          By {article.author_name}
        </p>
      )}
      
      <p className="text-gray-700 mb-4">{article.excerpt}</p>
      
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{formattedDate}</span>
        
        <div className="space-x-2">
          <button
            onClick={handleView}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Read More
          </button>
          
          {onEdit && (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Why:**
- `FC<Props>` provides type safety for component
- `useCallback` prevents unnecessary re-renders
- Optional chaining (`onEdit?.()`) handles optional callbacks
- Destructured props with defaults for clarity
- Tailwind classes for styling consistency

**Gotchas:**
- ❌ Don't use `React.FC` - deprecated, use `FC` from React
- ❌ Don't forget `useCallback` for event handlers passed to children
- ✅ Always define interface for props (even if empty)
- ✅ Use `?.` for optional callbacks to prevent errors

---

### 2. Custom Hooks

**Pattern: Extract Logic to Reusable Hooks**

```tsx
// src/hooks/useArticles.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Article, ArticleCreate } from '@/types/api'

export const useArticles = () => {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['articles'],
    queryFn: () => api.get<Article[]>('/articles').then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (article: ArticleCreate) => 
      api.post<Article>('/articles', article).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Article> }) =>
      api.patch<Article>(`/articles/${id}`, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/articles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })

  return {
    articles: data ?? [],
    isLoading,
    error,
    createArticle: createMutation.mutate,
    updateArticle: updateMutation.mutate,
    deleteArticle: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
```

**Why:**
- Separates data fetching from UI logic
- TanStack Query handles caching, loading, error states
- Automatic cache invalidation on mutations
- Reusable across multiple components

**Usage:**
```tsx
// src/pages/ArticlesPage.tsx
import { useArticles } from '@/hooks/useArticles'
import { ArticleCard } from '@/components/ArticleCard'

export const ArticlesPage = () => {
  const { articles, isLoading, deleteArticle } = useArticles()

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map(article => (
        <ArticleCard
          key={article.id}
          article={article}
          onDelete={deleteArticle}
        />
      ))}
    </div>
  )
}
```

**Gotchas:**
- ❌ Don't call hooks conditionally or in loops
- ❌ Don't forget to invalidate queries after mutations
- ✅ Always provide `queryKey` for proper caching
- ✅ Use `??` fallback for data to handle undefined

---

### 3. Form Handling

**Pattern: React Hook Form + Zod Validation**

```tsx
// src/components/ArticleForm.tsx
import { FC } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const articleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  published: z.boolean(),
  tags: z.array(z.string()).optional(),
})

type ArticleFormData = z.infer<typeof articleSchema>

interface ArticleFormProps {
  initialData?: Partial<ArticleFormData>
  onSubmit: (data: ArticleFormData) => void
  isSubmitting?: boolean
}

export const ArticleForm: FC<ArticleFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: initialData
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Title
        </label>
        <input
          {...register('title')}
          id="title"
          type="text"
          className="w-full px-3 py-2 border rounded-md"
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-1">
          Content
        </label>
        <textarea
          {...register('content')}
          id="content"
          rows={8}
          className="w-full px-3 py-2 border rounded-md"
        />
        {errors.content && (
          <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
        )}
      </div>

      <div className="flex items-center">
        <input
          {...register('published')}
          id="published"
          type="checkbox"
          className="mr-2"
        />
        <label htmlFor="published" className="text-sm">
          Publish immediately
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !isDirty}
        className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Save Article'}
      </button>
    </form>
  )
}
```

**Why:**
- React Hook Form minimizes re-renders (uncontrolled inputs)
- Zod provides TypeScript-first schema validation
- `zodResolver` integrates validation with form state
- Type inference (`z.infer`) ensures type safety

**Gotchas:**
- ❌ Don't use controlled inputs unless necessary (performance)
- ❌ Don't validate manually - let Zod handle it
- ✅ Always use `{...register('fieldName')}` for inputs
- ✅ Use `isDirty` to prevent unchanged form submissions

---

### 4. State Management (Zustand)

**Pattern: Create Type-Safe Stores**

```typescript
// src/stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  username: string
  email: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  
  // Actions
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => set({
        user,
        token,
        isAuthenticated: true
      }),

      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false
      }),

      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      }))
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
```

**Usage:**
```tsx
// src/components/Header.tsx
import { useAuthStore } from '@/stores/authStore'

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuthStore()

  return (
    <header>
      {isAuthenticated ? (
        <>
          <span>Welcome, {user?.username}</span>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <a href="/login">Login</a>
      )}
    </header>
  )
}
```

**Why:**
- Minimal boilerplate compared to Redux/Context
- Built-in persistence middleware
- TypeScript support out of the box
- Selective subscriptions (only re-render what changed)

**Gotchas:**
- ❌ Don't put server state in Zustand (use TanStack Query)
- ❌ Don't mutate state directly - use `set()`
- ✅ Use `persist` for localStorage sync
- ✅ Partition stores by domain (auth, UI, settings)

---

### 5. Routing

**Pattern: Type-Safe Routes with React Router**

```tsx
// src/router/index.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { HomePage } from '@/pages/HomePage'
import { ArticlesPage } from '@/pages/ArticlesPage'
import { ArticleDetailPage } from '@/pages/ArticleDetailPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: 'articles',
        element: <ArticlesPage />
      },
      {
        path: 'articles/:id',
        element: <ArticleDetailPage />
      }
    ]
  }
])

export const Router = () => <RouterProvider router={router} />
```

**Route Parameters:**
```tsx
// src/pages/ArticleDetailPage.tsx
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'

export const ArticleDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  
  const { data: article, isLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: () => api.get(`/articles/${id}`).then(res => res.data),
    enabled: !!id
  })

  if (isLoading) return <div>Loading...</div>
  if (!article) return <div>Article not found</div>

  return (
    <article>
      <h1>{article.title}</h1>
      <p>{article.content}</p>
    </article>
  )
}
```

**Gotchas:**
- ❌ Don't use `useParams()` without type argument
- ❌ Don't forget `enabled: !!id` for conditional queries
- ✅ Use `errorElement` for error boundaries
- ✅ Use nested routes for layouts

---

## Testing Patterns

### Component Testing

**Pattern: Testing Library + User Event**

```tsx
// src/components/__tests__/ArticleCard.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ArticleCard } from '../ArticleCard'

describe('ArticleCard', () => {
  const mockArticle = {
    id: 1,
    title: 'Test Article',
    excerpt: 'Test excerpt',
    author_name: 'John Doe',
    created_at: '2026-01-01T00:00:00Z'
  }

  it('renders article information', () => {
    render(<ArticleCard article={mockArticle} />)
    
    expect(screen.getByText('Test Article')).toBeInTheDocument()
    expect(screen.getByText('Test excerpt')).toBeInTheDocument()
    expect(screen.getByText(/By John Doe/)).toBeInTheDocument()
  })

  it('calls onEdit when edit button clicked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    
    render(<ArticleCard article={mockArticle} onEdit={onEdit} />)
    
    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)
    
    expect(onEdit).toHaveBeenCalledWith(1)
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('hides author when showAuthor is false', () => {
    render(<ArticleCard article={mockArticle} showAuthor={false} />)
    
    expect(screen.queryByText(/By John Doe/)).not.toBeInTheDocument()
  })
})
```

### Hook Testing

**Pattern: Test Custom Hooks**

```tsx
// src/hooks/__tests__/useArticles.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useArticles } from '../useArticles'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useArticles', () => {
  it('fetches articles on mount', async () => {
    const { result } = renderHook(() => useArticles(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.articles).toBeDefined()
  })
})
```

---

## Project Invariants

**These rules MUST be followed:**

1. **TypeScript Strict Mode:** All files must pass `tsc --noEmit`
2. **Component Props:** Always define interface for props (no implicit `any`)
3. **Hooks Rules:** Never call hooks conditionally or in loops
4. **State Management:**
   - Server state → TanStack Query
   - Client state → Zustand or local `useState`
5. **Error Boundaries:** All routes must have `errorElement`
6. **Accessibility:** All interactive elements must have proper ARIA labels
7. **Testing:** Every component must have at least one test

---

## Common Gotchas

### 1. Infinite Re-Render Loops

**Problem:**
```tsx
// ❌ BAD: Creates new function on every render
<ArticleCard onEdit={(id) => handleEdit(id)} />
```

**Solution:**
```tsx
// ✅ GOOD: useCallback prevents re-creation
const handleEdit = useCallback((id: number) => {
  console.log('Edit', id)
}, [])

<ArticleCard onEdit={handleEdit} />
```

### 2. Missing Dependencies in useEffect

**Problem:**
```tsx
// ❌ BAD: ESLint warning, stale closure
useEffect(() => {
  fetchData(userId)
}, [])
```

**Solution:**
```tsx
// ✅ GOOD: Include all dependencies
useEffect(() => {
  fetchData(userId)
}, [userId])
```

### 3. TanStack Query Key Mistakes

**Problem:**
```tsx
// ❌ BAD: Same key for different data
useQuery({ queryKey: ['articles'], queryFn: () => fetchArticle(id) })
```

**Solution:**
```tsx
// ✅ GOOD: Include dynamic values in key
useQuery({ queryKey: ['article', id], queryFn: () => fetchArticle(id) })
```

### 4. Form Validation Errors

**Problem:**
```tsx
// ❌ BAD: Manual validation is error-prone
const [errors, setErrors] = useState({})
const validate = () => { /* complex logic */ }
```

**Solution:**
```tsx
// ✅ GOOD: Use Zod + React Hook Form
const schema = z.object({ title: z.string().min(1) })
const { register } = useForm({ resolver: zodResolver(schema) })
```

### 5. TypeScript `any` Escape Hatch

**Problem:**
```tsx
// ❌ BAD: Loses type safety
const data: any = await fetchData()
```

**Solution:**
```tsx
// ✅ GOOD: Define proper types
interface Article { id: number; title: string }
const data: Article = await fetchData()
```

---

## Architecture Decisions

### Why React + Vite?
- **React:** Industry standard, huge ecosystem, battle-tested
- **Vite:** Fast HMR, native ESM, better DX than CRA
- **TypeScript:** Catches bugs at compile-time, self-documenting code

### Why Zustand over Redux?
- 10x less boilerplate
- No providers needed
- Better TypeScript inference
- Middleware ecosystem (persist, devtools)

### Why TanStack Query?
- Eliminates 90% of async state management
- Automatic caching, refetching, pagination
- Built-in loading/error states
- Optimistic updates

### Why React Hook Form + Zod?
- Minimal re-renders (uncontrolled inputs)
- Type-safe validation
- Great DX with TypeScript inference
- Tiny bundle size (~9KB)

---

## File Organization Best Practices

**Component files:**
```
src/components/
├── ArticleCard/
│   ├── ArticleCard.tsx
│   ├── ArticleCard.test.tsx
│   └── index.ts           # Re-export
```

**Feature-based structure (for large apps):**
```
src/features/
├── articles/
│   ├── components/
│   ├── hooks/
│   ├── api/
│   └── types/
```

---

## Next Steps for New Developers

1. **Read this document** - Understand patterns before coding
2. **Run tests** - `npm run test:run` to verify setup
3. **Build sample component** - Follow ArticleCard pattern
4. **Create custom hook** - Practice TanStack Query
5. **Write tests** - Aim for >80% coverage
6. **Review PRs** - Learn from team patterns

---

**Remember:** This is a living document. Update patterns as the codebase evolves.
