# Codebase Essentials - Next.js 14 + TypeScript

**Created:** January 23, 2026  
**Last Updated:** January 23, 2026  
**Status:** Example Project

---

## Technology Stack

**Framework:**
- Next.js 14.0 (App Router)
- TypeScript 5.3
- React 18.2

**Styling:**
- Tailwind CSS 3.4
- CSS Modules (when needed)
- clsx (conditional classes)

**Data Fetching:**
- Server Components (default)
- Server Actions (mutations)
- TanStack Query (client-side caching)

**Database & ORM:**
- PostgreSQL 15
- Prisma 5.7 (type-safe ORM)

**Authentication:**
- NextAuth.js 5.0
- JWT sessions
- OAuth providers (Google, GitHub)

**Testing:**
- Vitest 1.2 (unit tests)
- Playwright 1.40 (E2E tests)
- @testing-library/react 14.1

**Code Quality:**
- ESLint 8.x (Next.js config)
- Prettier 3.x
- TypeScript strict mode

**Deployment:**
- Vercel (recommended)
- Docker (self-hosted option)

---

## Validation Matrix

**ALWAYS run these commands before claiming work is complete:**

| Changed | Command | Expected Result |
|---------|---------|-----------------|
| **TypeScript** | `npm run type-check` | No errors |
| **Unit Tests** | `npm run test:run` | All tests pass |
| **E2E Tests** | `npm run test:e2e` | All flows pass |
| **Linting** | `npm run lint` | No errors |
| **Build** | `npm run build` | Successful build |
| **Database** | `npx prisma migrate dev` | No migration errors |

---

## Core Patterns

### 1. Server Components (Default)

**Pattern: Async Server Components with Direct Data Fetching**

```tsx
// app/articles/page.tsx
import { prisma } from '@/lib/prisma'
import { ArticleCard } from '@/components/ArticleCard'

// This is a Server Component by default
export default async function ArticlesPage() {
  // Fetch data directly in component
  const articles = await prisma.article.findMany({
    include: { author: true },
    orderBy: { created_at: 'desc' }
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Articles</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map(article => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  )
}

// Opt into revalidation
export const revalidate = 3600 // Revalidate every hour
```

**Why:**
- Zero JavaScript sent to client for data fetching
- Automatic request deduplication
- Streaming and Suspense support
- SEO-friendly (fully rendered HTML)

**Gotchas:**
- ❌ Cannot use hooks (`useState`, `useEffect`) in Server Components
- ❌ Cannot attach event handlers directly
- ✅ Use `'use client'` directive for interactive components
- ✅ Fetch data as close to where it's needed

---

### 2. Client Components (Interactive)

**Pattern: 'use client' for Interactivity**

```tsx
// components/ArticleCard.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Article } from '@prisma/client'

interface ArticleCardProps {
  article: Article & { author: { name: string } }
}

export function ArticleCard({ article }: ArticleCardProps) {
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(false)

  const handleLike = async () => {
    setIsLiked(!isLiked)
    // Server Action (see below)
    await likeArticle(article.id)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 
        className="text-xl font-bold mb-2 cursor-pointer hover:text-blue-600"
        onClick={() => router.push(`/articles/${article.id}`)}
      >
        {article.title}
      </h3>
      
      <p className="text-gray-600 mb-4">{article.author.name}</p>
      
      <button
        onClick={handleLike}
        className={`px-4 py-2 rounded ${
          isLiked ? 'bg-red-500 text-white' : 'bg-gray-200'
        }`}
      >
        {isLiked ? '❤️ Liked' : '🤍 Like'}
      </button>
    </div>
  )
}
```

**Why:**
- `'use client'` enables React hooks and interactivity
- Next.js automatically code-splits client components
- Server Components can render Client Components as children

**Gotchas:**
- ❌ Don't make everything a Client Component (hurts performance)
- ✅ Keep Client Components small and focused
- ✅ Pass data from Server → Client Components as props

---

### 3. Server Actions (Mutations)

**Pattern: Server-Side Mutations with Type Safety**

```tsx
// app/actions/articles.ts
'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const articleSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10),
  published: z.boolean()
})

export async function createArticle(formData: FormData) {
  // Validate input
  const validatedFields = articleSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
    published: formData.get('published') === 'on'
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed'
    }
  }

  // Create article
  try {
    const article = await prisma.article.create({
      data: {
        ...validatedFields.data,
        authorId: 1 // TODO: Get from auth session
      }
    })

    // Revalidate cached pages
    revalidatePath('/articles')
    
    return { success: true, article }
  } catch (error) {
    return { success: false, message: 'Database error' }
  }
}

export async function updateArticle(id: number, formData: FormData) {
  const validatedFields = articleSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
    published: formData.get('published') === 'on'
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  await prisma.article.update({
    where: { id },
    data: validatedFields.data
  })

  revalidatePath('/articles')
  revalidatePath(`/articles/${id}`)
  
  return { success: true }
}

export async function deleteArticle(id: number) {
  await prisma.article.delete({ where: { id } })
  revalidatePath('/articles')
  return { success: true }
}
```

**Usage in Form:**
```tsx
// app/articles/new/page.tsx
import { createArticle } from '@/app/actions/articles'
import { SubmitButton } from '@/components/SubmitButton'

export default function NewArticlePage() {
  return (
    <form action={createArticle} className="space-y-4">
      <div>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      <div>
        <label htmlFor="content">Content</label>
        <textarea
          id="content"
          name="content"
          rows={8}
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      <div>
        <input id="published" name="published" type="checkbox" />
        <label htmlFor="published">Publish</label>
      </div>

      <SubmitButton />
    </form>
  )
}
```

**Why:**
- Type-safe mutations run on server
- Progressive enhancement (works without JavaScript)
- Automatic revalidation integration
- No API routes needed for simple mutations

**Gotchas:**
- ❌ Must use `'use server'` directive
- ❌ Cannot return non-serializable data (functions, classes)
- ✅ Always validate inputs with Zod
- ✅ Always call `revalidatePath()` after mutations

---

### 4. Database Schema (Prisma)

**Pattern: Type-Safe Schema with Relations**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  name      String?
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  
  articles  Article[]
  
  @@map("users")
}

model Article {
  id        Int      @id @default(autoincrement())
  title     String   @db.VarChar(200)
  content   Text
  published Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  authorId  Int      @map("author_id")
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  tags      Tag[]
  
  @@index([authorId])
  @@index([published, createdAt])
  @@map("articles")
}

model Tag {
  id        Int       @id @default(autoincrement())
  name      String    @unique @db.VarChar(50)
  
  articles  Article[]
  
  @@map("tags")
}
```

**Prisma Client Usage:**
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Why:**
- Auto-generated TypeScript types
- Compile-time type checking for queries
- Migration system built-in
- Connection pooling handled automatically

**Common Queries:**
```typescript
// Find with relations
const article = await prisma.article.findUnique({
  where: { id: 1 },
  include: { author: true, tags: true }
})

// Create with relations
await prisma.article.create({
  data: {
    title: 'New Article',
    content: 'Content here',
    author: { connect: { id: userId } },
    tags: { connect: [{ id: 1 }, { id: 2 }] }
  }
})

// Aggregate
const stats = await prisma.article.aggregate({
  _count: true,
  _avg: { id: true }
})
```

**Gotchas:**
- ❌ Don't create new PrismaClient in every function (connection leak)
- ✅ Use singleton pattern (see above)
- ✅ Always run `npx prisma generate` after schema changes

---

### 5. Authentication (NextAuth.js)

**Pattern: Session-Based Auth with OAuth**

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  }
})

export { handler as GET, handler as POST }
```

**Protect Routes:**
```tsx
// app/admin/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/signin')
  }

  return <div>Admin Panel - Welcome {session.user?.name}</div>
}
```

**Client-Side Session:**
```tsx
// components/UserMenu.tsx
'use client'

import { useSession, signIn, signOut } from 'next-auth/react'

export function UserMenu() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    return <button onClick={() => signIn()}>Sign In</button>
  }

  return (
    <div>
      <p>Welcome, {session.user?.name}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}
```

**Why:**
- Built-in OAuth support (Google, GitHub, etc.)
- Secure session management
- Database session storage via Prisma adapter
- Server + Client auth utilities

**Gotchas:**
- ❌ Don't expose client secrets in client components
- ✅ Use `getServerSession()` in Server Components
- ✅ Use `useSession()` in Client Components

---

### 6. API Routes (When Needed)

**Pattern: Type-Safe API Routes**

```typescript
// app/api/articles/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional()
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const result = querySchema.safeParse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    search: searchParams.get('search')
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten() },
      { status: 400 }
    )
  }

  const { page, limit, search } = result.data
  const skip = (page - 1) * limit

  const articles = await prisma.article.findMany({
    where: search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    } : {},
    skip,
    take: limit,
    include: { author: true }
  })

  const total = await prisma.article.count({
    where: search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    } : {}
  })

  return NextResponse.json({
    articles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  })
}
```

**Why:**
- Full control over request/response
- Useful for webhooks, external integrations
- Type-safe with Zod validation

**When to use:**
- ❌ Don't use for simple CRUD (use Server Actions)
- ✅ Use for webhooks (e.g., Stripe, SendGrid)
- ✅ Use for external API integrations
- ✅ Use for complex query logic

---

## Testing Patterns

### Component Testing

```tsx
// components/__tests__/ArticleCard.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ArticleCard } from '../ArticleCard'

describe('ArticleCard', () => {
  const mockArticle = {
    id: 1,
    title: 'Test Article',
    content: 'Test content',
    published: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: 1,
    author: { id: 1, name: 'John Doe', email: 'john@example.com', createdAt: new Date(), updatedAt: new Date() }
  }

  it('renders article title', () => {
    render(<ArticleCard article={mockArticle} />)
    expect(screen.getByText('Test Article')).toBeInTheDocument()
  })
})
```

### E2E Testing

```typescript
// tests/e2e/articles.spec.ts
import { test, expect } from '@playwright/test'

test('create new article', async ({ page }) => {
  await page.goto('/articles/new')
  
  await page.fill('input[name="title"]', 'E2E Test Article')
  await page.fill('textarea[name="content"]', 'This is test content')
  await page.check('input[name="published"]')
  
  await page.click('button[type="submit"]')
  
  await expect(page).toHaveURL(/\/articles\/\d+/)
  await expect(page.locator('h1')).toContainText('E2E Test Article')
})
```

---

## Project Invariants

**These rules MUST be followed:**

1. **App Router Only:** No Pages Router (use `app/` directory)
2. **Server Components First:** Default to Server Components, opt into Client
3. **TypeScript Strict:** All files must pass type checking
4. **Prisma Singleton:** Always use shared `prisma` instance
5. **Server Actions:** Validate all inputs with Zod
6. **Revalidation:** Call `revalidatePath()` after mutations
7. **Authentication:** Check session before sensitive operations
8. **Database Indexes:** Add indexes for commonly queried fields

---

## Common Gotchas

### 1. Hydration Mismatch

**Problem:**
```tsx
// ❌ BAD: Server renders different HTML than client
export default function Component() {
  return <div>{new Date().toISOString()}</div>
}
```

**Solution:**
```tsx
// ✅ GOOD: Use client component for dynamic values
'use client'
import { useState, useEffect } from 'react'

export default function Component() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => setMounted(true), [])
  
  if (!mounted) return null
  
  return <div>{new Date().toISOString()}</div>
}
```

### 2. Missing 'use client' Directive

**Problem:**
```tsx
// ❌ BAD: Trying to use hooks in Server Component
import { useState } from 'react'

export default function Component() {
  const [count, setCount] = useState(0) // Error!
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

**Solution:**
```tsx
// ✅ GOOD: Add 'use client' at top of file
'use client'

import { useState } from 'react'

export default function Component() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### 3. Forgetting Revalidation

**Problem:**
```tsx
// ❌ BAD: Data not updated after mutation
'use server'

export async function deleteArticle(id: number) {
  await prisma.article.delete({ where: { id } })
  // Missing revalidation!
}
```

**Solution:**
```tsx
// ✅ GOOD: Revalidate affected paths
'use server'
import { revalidatePath } from 'next/cache'

export async function deleteArticle(id: number) {
  await prisma.article.delete({ where: { id } })
  revalidatePath('/articles')
}
```

### 4. Client Component Data Fetching

**Problem:**
```tsx
// ❌ BAD: Fetching in Client Component (unnecessary JS)
'use client'

export default function ArticlesPage() {
  const [articles, setArticles] = useState([])
  
  useEffect(() => {
    fetch('/api/articles').then(res => res.json()).then(setArticles)
  }, [])
  
  return <div>{/* render */}</div>
}
```

**Solution:**
```tsx
// ✅ GOOD: Fetch in Server Component
import { prisma } from '@/lib/prisma'

export default async function ArticlesPage() {
  const articles = await prisma.article.findMany()
  return <div>{/* render */}</div>
}
```

---

## Architecture Decisions

### Why Next.js 14 App Router?
- **Server Components:** Faster page loads, better SEO
- **Server Actions:** Type-safe mutations without API routes
- **Streaming:** Progressive rendering for better UX
- **File-based routing:** Convention over configuration

### Why Prisma?
- Type-safe database access
- Auto-generated types from schema
- Migration system included
- Great DX with TypeScript

### Why NextAuth.js?
- OAuth built-in (Google, GitHub, etc.)
- Secure session management
- Database session storage
- Both server + client utilities

### Why Not tRPC?
- Server Actions provide similar benefits
- Less setup for simple apps
- tRPC better for large teams/complex APIs

---

## File Organization

**Recommended structure:**
```
app/
├── (auth)/              # Route group (doesn't affect URL)
│   ├── login/
│   └── register/
├── (dashboard)/         # Route group
│   ├── articles/
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── page.tsx
│   └── layout.tsx
├── api/
│   └── webhooks/
│       └── stripe/
│           └── route.ts
├── actions/
│   └── articles.ts      # Server Actions
└── layout.tsx

components/
├── ui/                  # Reusable UI components
├── forms/               # Form components
└── layout/              # Layout components

lib/
├── prisma.ts            # Prisma client
├── utils.ts             # Helper functions
└── validations.ts       # Zod schemas

prisma/
├── schema.prisma
└── migrations/
```

---

## Next Steps for New Developers

1. **Read Next.js docs** - https://nextjs.org/docs
2. **Understand Server vs Client** - Critical distinction
3. **Practice Prisma** - Run `npx prisma studio` to explore DB
4. **Test Server Actions** - Create, update, delete operations
5. **Set up auth** - Follow NextAuth.js setup guide
6. **Deploy to Vercel** - See your app in production

---

**Remember:** Server Components are the default, Client Components are opt-in. This mental model will save you from many bugs.
