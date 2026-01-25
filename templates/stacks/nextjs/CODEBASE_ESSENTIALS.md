# {{PROJECT_NAME}} - Codebase Essentials

> **Last Updated:** {{DATE}}  
> **Purpose:** Next.js Application with TypeScript  
> **Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS

---

## Knowledge System: Document Roles

### The Three Knowledge Files

This project uses three interconnected knowledge files:

```
CODEBASE_ESSENTIALS.md  ←  What the codebase IS (architecture, patterns, rules)
AGENTS.md               ←  How AI should WORK (workflow, validation, skills)
CODEBASE_CHANGELOG.md   ←  What HAPPENED (session history, decisions, learnings)
```

**Golden Rule:**
- **ESSENTIALS** = "What is" (the system)
- **AGENTS** = "How to work" (the process)
- **CHANGELOG** = "What happened" (the history)

---

## 1. Technology Snapshot

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js (App Router) | 15.x |
| Runtime | Node.js | 20+ |
| Language | TypeScript | 5.x |
| UI Library | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| Package Manager | npm | 10+ |
| Database | PostgreSQL | 16+ |
| ORM | Prisma | 5.x |
| Testing | Vitest + Testing Library | Latest |
| Linter | ESLint | 9.x |
| Formatter | Prettier | 3.x |

---

## 2. Validation Matrix

| Command | Purpose | Required |
|---------|---------|----------|
| `npm run dev` | Start dev server | ✅ Must work |
| `npm run build` | Production build | ✅ Before push |
| `npm run type-check` | TypeScript validation | ✅ Before commit |
| `npm run lint` | ESLint check | ✅ Before commit |
| `npm test` | Run all tests | ✅ Before commit |
| `npm run test:e2e` | E2E tests (if exists) | ⚠️ Before push |

---

## 3. Project Structure

```
{{PROJECT_NAME}}/
├── app/                    # Next.js App Router
│   ├── (routes)/          # Route groups
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── features/         # Feature-specific components
├── lib/                   # Utility functions
│   ├── db.ts             # Database client
│   └── utils.ts          # Helper functions
├── prisma/               # Database schema
│   └── schema.prisma     # Prisma schema
├── public/               # Static assets
├── tests/                # Test files
│   ├── unit/            # Unit tests
│   └── e2e/             # E2E tests
├── .env.local            # Environment variables
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies
```

---

## 4. Core Patterns

### Component Organization

**Rule: Organize by feature, not by type**

```typescript
// ✅ GOOD: Feature-based
components/
  auth/
    LoginForm.tsx
    SignupForm.tsx
    AuthButton.tsx
  dashboard/
    DashboardStats.tsx
    DashboardHeader.tsx

// ❌ BAD: Type-based
components/
  forms/
    LoginForm.tsx
    SignupForm.tsx
  buttons/
    AuthButton.tsx
```

### Server vs Client Components

**Rule: Default to Server Components, opt into Client Components**

```typescript
// ✅ GOOD: Server Component (default)
export default async function Page() {
  const data = await fetchData(); // Direct data fetching
  return <Component data={data} />;
}

// ✅ GOOD: Client Component (when needed)
'use client';

export default function InteractiveWidget() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// ❌ BAD: Unnecessary 'use client'
'use client';  // ← Not needed, no interactivity

export default function StaticContent() {
  return <div>Static content</div>;
}
```

### Data Fetching Pattern

**Rule: Fetch data as close to where it's used as possible**

```typescript
// ✅ GOOD: Colocated data fetching
async function UserProfile({ userId }: { userId: string }) {
  const user = await db.user.findUnique({ where: { id: userId } });
  return <div>{user.name}</div>;
}

// ❌ BAD: Prop drilling from root
// Fetching at page level and passing through many components
```

### API Route Pattern

**Rule: Use Route Handlers with proper error handling**

```typescript
// ✅ GOOD: app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const users = await db.user.findMany();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// ❌ BAD: No error handling, no types
export async function GET(request) {
  const users = await db.user.findMany();
  return NextResponse.json(users);
}
```

---

## 5. Critical Invariants

### TypeScript Strictness

1. **Always use strict mode** - `tsconfig.json` must have `"strict": true`
2. **No `any` types** - Use `unknown` or proper types
3. **Server/Client boundary** - Server Components cannot pass non-serializable props

### Next.js App Router Rules

1. **Metadata exports** - Use `generateMetadata` for dynamic SEO
2. **Loading states** - Use `loading.tsx` for Suspense boundaries
3. **Error boundaries** - Use `error.tsx` for error handling
4. **Route handlers** - Always in `route.ts` files, never `page.ts`

### Database Access

1. **Use Prisma Client** - Never raw SQL unless absolutely necessary
2. **Server-only code** - Database calls only in Server Components or API routes
3. **Connection pooling** - Single Prisma Client instance (see `lib/db.ts`)

---

## 6. Common Gotchas

### 1. Client Component Hydration Mismatch

```typescript
// ❌ PROBLEM: Server renders different than client
function Component() {
  return <div>{new Date().toString()}</div>; // Different on server vs client
}

// ✅ SOLUTION: useEffect for client-only rendering
'use client';
function Component() {
  const [time, setTime] = useState<string>('');
  useEffect(() => setTime(new Date().toString()), []);
  return <div>{time}</div>;
}
```

### 2. Environment Variables

```typescript
// ❌ PROBLEM: Exposing server secrets to client
// In client component
const apiKey = process.env.SECRET_API_KEY; // Undefined in client!

// ✅ SOLUTION: Use NEXT_PUBLIC_ prefix for client vars
const publicKey = process.env.NEXT_PUBLIC_API_KEY;

// Server-only vars don't need prefix (API routes, Server Components)
const secretKey = process.env.SECRET_API_KEY; // ✓ Works in server
```

### 3. Dynamic Routes and Type Safety

```typescript
// ❌ PROBLEM: Untyped params
export default function Page({ params }: any) {
  return <div>{params.id}</div>;
}

// ✅ SOLUTION: Typed params
type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <div>{id}</div>;
}
```

---

## 7. Testing Patterns

### Unit Testing (Vitest + Testing Library)

```typescript
// components/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
});
```

### API Route Testing

```typescript
// app/api/users/__tests__/route.test.ts
import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('GET /api/users', () => {
  it('returns users list', async () => {
    const request = new NextRequest('http://localhost:3000/api/users');
    const response = await GET(request);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
```

---

## 8. Architecture Decisions

### Why App Router over Pages Router?

- **Server Components** - Better performance, smaller bundle sizes
- **Nested Layouts** - More flexible UI composition
- **Streaming** - Progressive rendering with Suspense
- **Built-in Loading/Error States** - Less boilerplate

### Why Prisma?

- **Type-safe database access** - Auto-generated TypeScript types
- **Schema-first** - Single source of truth for data model
- **Migrations** - Versioned schema changes

### Why Tailwind CSS?

- **No CSS-in-JS runtime** - Better performance than styled-components
- **Utility-first** - Faster development, consistent design
- **Dark mode support** - Built-in with `class` strategy

---

## 9. Change Management

### Small Changes (no spec needed)

- Bug fixes
- Styling tweaks
- Performance optimizations
- Dependency updates

### Medium Changes (optional spec)

- New UI components
- New API endpoints
- Database schema changes

### Large Changes (spec required)

- New features with multiple pages
- Authentication/authorization changes
- Major refactoring
- Breaking API changes

**Recommendation:** Use OpenSpec for large changes to align team before coding.

---

## 10. Development Workflow

### First-Time Setup

```bash
# Install dependencies
npm install

# Set up database
cp .env.example .env.local
# Edit .env.local with your database URL

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

### Daily Development

```bash
# Pull latest changes
git pull

# Install new dependencies (if package.json changed)
npm install

# Run migrations (if schema changed)
npx prisma migrate dev

# Start development
npm run dev
```

### Before Committing

```bash
# Run all validation
npm run type-check  # TypeScript
npm run lint        # ESLint
npm test            # Unit tests
npm run build       # Production build test
```

### Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

*This file is the single source of truth for AI assistants working on this Next.js project.*
