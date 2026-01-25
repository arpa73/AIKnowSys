# {{PROJECT_NAME}} - Codebase Essentials

> **Last Updated:** {{DATE}}  
> **Purpose:** Next.js API Backend with App Router  
> **Stack:** Next.js 15 API Routes, Server Actions, TypeScript, Prisma

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
| Package Manager | npm | 10+ |
| Database | PostgreSQL | 16+ |
| ORM | Prisma | 5.x |
| Validation | Zod | 3.x |
| Authentication | {{AUTH_PROVIDER}} | Latest |
| Testing | Vitest | Latest |
| Linter | ESLint | 9.x |
| Formatter | Prettier | 3.x |

**Additional Libraries:**
- `@prisma/client` - Type-safe database client
- `zod` - Runtime type validation
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT token management
- `rate-limiter-flexible` - Rate limiting
- `cors` - CORS configuration

---

## 2. Validation Matrix

| Command | Purpose | Required |
|---------|---------|----------|
| `npm run dev` | Start dev server | ✅ Must work |
| `npm run build` | Production build | ✅ Before push |
| `npm run type-check` | TypeScript validation | ✅ Before commit |
| `npm run lint` | ESLint check | ✅ Before commit |
| `npm test` | Run all tests | ✅ Before commit |
| `npm run test:api` | API route tests | ✅ Before push |
| `npm run test:integration` | Integration tests | ⚠️ Before push |
| `npx prisma migrate deploy` | Run migrations | ✅ Before deploy |

---

## 3. Project Structure

```
{{PROJECT_NAME}}/
├── app/
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── refresh/route.ts
│   │   ├── users/                # User CRUD
│   │   │   ├── route.ts          # GET, POST /api/users
│   │   │   └── [id]/route.ts     # GET, PUT, DELETE /api/users/:id
│   │   ├── posts/                # Posts resource
│   │   └── health/route.ts       # Health check
│   ├── actions/                  # Server Actions
│   │   ├── auth.ts               # Auth mutations
│   │   ├── posts.ts              # Post mutations
│   │   └── users.ts              # User mutations
│   └── layout.tsx                # Root layout (minimal for API)
├── lib/
│   ├── db.ts                     # Prisma client singleton
│   ├── auth.ts                   # Authentication utilities
│   ├── validation.ts             # Zod schemas
│   ├── errors.ts                 # Custom error classes
│   ├── middleware/               # Middleware utilities
│   │   ├── auth.ts               # Auth middleware
│   │   ├── ratelimit.ts          # Rate limiting
│   │   └── cors.ts               # CORS configuration
│   └── utils.ts                  # Helper functions
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Migration files
│   └── seed.ts                   # Database seeding
├── tests/
│   ├── api/                      # API route tests
│   │   ├── auth.test.ts
│   │   ├── users.test.ts
│   │   └── posts.test.ts
│   ├── integration/              # Integration tests
│   └── utils/                    # Test utilities
│       ├── setup.ts
│       └── helpers.ts
├── middleware.ts                 # Global middleware
├── .env.local                    # Environment variables
├── next.config.js                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

---

## 4. Core Patterns

### API Route Handler Structure

**Rule: Use consistent route handler pattern with error handling**

```typescript
// ✅ GOOD: app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ApiError, handleApiError } from '@/lib/errors';

// Input validation schema
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8)
});

// GET /api/users - List users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      db.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        }
      }),
      db.user.count()
    ]);

    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/users - Create user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validated = createUserSchema.parse(body);
    
    // Check for existing user
    const existing = await db.user.findUnique({
      where: { email: validated.email }
    });
    
    if (existing) {
      throw new ApiError('User already exists', 409);
    }
    
    // Hash password
    const hashedPassword = await hashPassword(validated.password);
    
    // Create user
    const user = await db.user.create({
      data: {
        email: validated.email,
        name: validated.name,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// ❌ BAD: No validation, no error handling, exposes password
export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await db.user.create({ data: body });
  return NextResponse.json(user);
}
```

### Dynamic Route Parameters

**Rule: Use typed params and proper validation**

```typescript
// ✅ GOOD: app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApiError, handleApiError } from '@/lib/errors';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/users/:id
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        posts: {
          select: {
            id: true,
            title: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/users/:id
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    
    const updateSchema = z.object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional()
    });
    
    const validated = updateSchema.parse(body);
    
    const user = await db.user.update({
      where: { id },
      data: validated,
      select: {
        id: true,
        email: true,
        name: true,
        updatedAt: true
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/users/:id
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    
    await db.user.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'User deleted' }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Server Actions for Mutations

**Rule: Use Server Actions for form submissions and mutations**

```typescript
// ✅ GOOD: app/actions/posts.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth';

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  published: z.boolean().default(false)
});

type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

export async function createPost(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    // 1. Authenticate
    const session = await getServerSession();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    // 2. Validate input
    const validated = createPostSchema.parse({
      title: formData.get('title'),
      content: formData.get('content'),
      published: formData.get('published') === 'true'
    });

    // 3. Create post
    const post = await db.post.create({
      data: {
        ...validated,
        authorId: session.user.id
      }
    });

    // 4. Revalidate cache
    revalidatePath('/posts');
    revalidatePath(`/posts/${post.id}`);

    return { success: true, data: { id: post.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to create post' };
  }
}

export async function updatePost(
  id: string,
  formData: FormData
): Promise<ActionResult<void>> {
  try {
    const session = await getServerSession();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check ownership
    const post = await db.post.findUnique({
      where: { id },
      select: { authorId: true }
    });

    if (!post || post.authorId !== session.user.id) {
      return { success: false, error: 'Forbidden' };
    }

    // Update
    const validated = createPostSchema.parse({
      title: formData.get('title'),
      content: formData.get('content'),
      published: formData.get('published') === 'true'
    });

    await db.post.update({
      where: { id },
      data: validated
    });

    revalidatePath(`/posts/${id}`);
    
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: 'Failed to update post' };
  }
}

export async function deletePost(id: string): Promise<ActionResult<void>> {
  try {
    const session = await getServerSession();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check ownership
    const post = await db.post.findUnique({
      where: { id },
      select: { authorId: true }
    });

    if (!post || post.authorId !== session.user.id) {
      return { success: false, error: 'Forbidden' };
    }

    await db.post.delete({
      where: { id }
    });

    revalidatePath('/posts');
    
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: 'Failed to delete post' };
  }
}
```

### Input Validation with Zod

**Rule: Define reusable validation schemas**

```typescript
// ✅ GOOD: lib/validation.ts
import { z } from 'zod';

// Base schemas
export const emailSchema = z.string().email('Invalid email format');
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number');

// User schemas
export const registerSchema = z.object({
  email: emailSchema,
  name: z.string().min(1, 'Name is required').max(100),
  password: passwordSchema
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: emailSchema.optional(),
  bio: z.string().max(500).optional()
});

// Post schemas
export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  published: z.boolean().default(false),
  tags: z.array(z.string()).max(10).optional()
});

export const updatePostSchema = createPostSchema.partial();

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10)
});

export const postFilterSchema = paginationSchema.extend({
  published: z.coerce.boolean().optional(),
  authorId: z.string().uuid().optional(),
  tag: z.string().optional()
});

// Type inference
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type PostFilter = z.infer<typeof postFilterSchema>;

// Usage in API route
import { createPostSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createPostSchema.parse(body);
    // ... rest of handler
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    // ... other error handling
  }
}
```

---

## 5. Critical Invariants

### API Design Principles

1. **RESTful conventions** - Use proper HTTP methods (GET, POST, PUT, DELETE)
2. **Consistent response format** - Always return JSON with consistent structure
3. **Status codes** - Use correct HTTP status codes (200, 201, 400, 401, 404, 500)
4. **Error handling** - Always handle errors gracefully with meaningful messages
5. **Validation** - Validate all inputs using Zod before processing

### Security Requirements

1. **Authentication** - Protect all non-public routes with authentication middleware
2. **Authorization** - Check user permissions before allowing resource access
3. **Password hashing** - Never store plain text passwords (use bcrypt)
4. **Input sanitization** - Validate and sanitize all user inputs
5. **Rate limiting** - Implement rate limiting on all public endpoints
6. **CORS** - Configure CORS properly for allowed origins

### Database Access

1. **Single Prisma instance** - Use singleton pattern for Prisma client
2. **No N+1 queries** - Use `include` or `select` to fetch related data
3. **Transactions** - Use transactions for operations that must be atomic
4. **Soft deletes** - Consider soft deletes for user data (GDPR compliance)

### TypeScript Strictness

1. **Strict mode enabled** - `tsconfig.json` must have `"strict": true`
2. **No `any` types** - Use `unknown` or proper types
3. **Type exports** - Export types for API responses and inputs
4. **Runtime validation** - Use Zod for runtime type checking

---

## 6. Common Patterns

### Pattern 1: Authentication with JWT

```typescript
// lib/auth.ts
import jwt from 'jsonwebtoken';
import { db } from './db';
import { ApiError } from './errors';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '7d';

export type TokenPayload = {
  userId: string;
  email: string;
};

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new ApiError('Invalid or expired token', 401);
  }
}

export async function getAuthUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError('Missing or invalid authorization header', 401);
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  });

  if (!user) {
    throw new ApiError('User not found', 401);
  }

  return user;
}

// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { db } from '@/lib/db';
import { generateToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { handleApiError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // Find user
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true
      }
    });

    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      throw new ApiError('Invalid credentials', 401);
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// app/api/auth/register/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    // Check existing user
    const existing = await db.user.findUnique({
      where: { email: validated.email }
    });

    if (existing) {
      throw new ApiError('Email already registered', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        email: validated.email,
        name: validated.name,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email
    });

    return NextResponse.json({
      token,
      user
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Pattern 2: Protected Routes with Middleware

```typescript
// lib/middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { ApiError } from '@/lib/errors';

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  try {
    const user = await getAuthUser(request);
    return handler(request, user);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

export function requireRole(allowedRoles: string[]) {
  return async (
    request: NextRequest,
    handler: (request: NextRequest, user: any) => Promise<NextResponse>
  ) => {
    return withAuth(request, async (req, user) => {
      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
      return handler(req, user);
    });
  };
}

// Usage in protected route
// app/api/admin/users/route.ts
import { requireRole } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  return requireRole(['admin'])(request, async (req, user) => {
    const users = await db.user.findMany();
    return NextResponse.json(users);
  });
}

// app/api/posts/route.ts - User must be authenticated
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    const body = await req.json();
    const post = await db.post.create({
      data: {
        ...body,
        authorId: user.id
      }
    });
    return NextResponse.json(post, { status: 201 });
  });
}
```

### Pattern 3: Global Middleware Configuration

```typescript
// middleware.ts (at root)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Define public routes that don't require authentication
const publicRoutes = [
  '/api/health',
  '/api/auth/login',
  '/api/auth/register',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check authentication for protected API routes
  if (pathname.startsWith('/api')) {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    try {
      verifyToken(token);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

### Pattern 4: Rate Limiting

```typescript
// lib/middleware/ratelimit.ts
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { NextRequest, NextResponse } from 'next/server';

// Create rate limiter (10 requests per minute per IP)
const rateLimiter = new RateLimiterMemory({
  points: 10, // Number of requests
  duration: 60, // Per 60 seconds
});

export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>
) {
  try {
    const ip = request.ip || 'unknown';
    await rateLimiter.consume(ip);
    return handler();
  } catch (error) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }
}

// Different rate limits for different endpoints
export const strictRateLimit = new RateLimiterMemory({
  points: 5,
  duration: 60,
});

export const authRateLimit = new RateLimiterMemory({
  points: 3, // Only 3 login attempts per minute
  duration: 60,
});

// Usage
// app/api/auth/login/route.ts
import { authRateLimit } from '@/lib/middleware/ratelimit';

export async function POST(request: NextRequest) {
  const ip = request.ip || 'unknown';
  
  try {
    await authRateLimit.consume(ip);
  } catch (error) {
    return NextResponse.json(
      { error: 'Too many login attempts' },
      { status: 429 }
    );
  }

  // ... rest of login logic
}
```

### Pattern 5: CORS Configuration

```typescript
// lib/middleware/cors.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001',
];

export function corsHeaders(origin: string | null) {
  const headers = new Headers();
  
  if (origin && allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');
  
  return headers;
}

export function handleCors(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  // Handle preflight request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers });
  }
  
  return headers;
}

// Usage in route
// app/api/posts/route.ts
export async function GET(request: NextRequest) {
  const headers = handleCors(request);
  
  const posts = await db.post.findMany();
  
  return NextResponse.json(posts, { headers });
}

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}
```

### Pattern 6: Error Handling

```typescript
// lib/errors.ts
export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Zod validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors
      },
      { status: 400 }
    );
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          error: 'Resource already exists',
          code: 'DUPLICATE_ERROR'
        },
        { status: 409 }
      );
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          error: 'Resource not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }
  }

  // Custom API errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code
      },
      { status: error.status }
    );
  }

  // Generic errors
  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    },
    { status: 500 }
  );
}

// Usage
// app/api/posts/[id]/route.ts
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    
    const post = await db.post.findUnique({
      where: { id }
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    return NextResponse.json(post);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Pattern 7: Database Transactions

```typescript
// ✅ GOOD: Use transactions for multi-step operations
// app/api/orders/route.ts
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json();
      const { items, shippingAddress } = createOrderSchema.parse(body);

      // Use transaction to ensure all operations succeed or fail together
      const order = await db.$transaction(async (tx) => {
        // 1. Create order
        const newOrder = await tx.order.create({
          data: {
            userId: user.id,
            shippingAddress,
            status: 'pending'
          }
        });

        // 2. Create order items and update inventory
        for (const item of items) {
          // Check inventory
          const product = await tx.product.findUnique({
            where: { id: item.productId }
          });

          if (!product || product.stock < item.quantity) {
            throw new ApiError('Insufficient stock', 400);
          }

          // Create order item
          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: item.productId,
              quantity: item.quantity,
              price: product.price
            }
          });

          // Update inventory
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity }
            }
          });
        }

        // 3. Calculate total
        const total = await tx.orderItem.aggregate({
          where: { orderId: newOrder.id },
          _sum: {
            price: true
          }
        });

        // 4. Update order with total
        return tx.order.update({
          where: { id: newOrder.id },
          data: { total: total._sum.price || 0 },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        });
      });

      return NextResponse.json(order, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  });
}
```

### Pattern 8: Pagination and Filtering

```typescript
// ✅ GOOD: Implement cursor-based pagination for better performance
// app/api/posts/route.ts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    
    // Parse and validate query parameters
    const params = postFilterSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      published: searchParams.get('published'),
      authorId: searchParams.get('authorId'),
      tag: searchParams.get('tag'),
      cursor: searchParams.get('cursor')
    });

    // Build where clause
    const where: Prisma.PostWhereInput = {};
    
    if (params.published !== undefined) {
      where.published = params.published;
    }
    
    if (params.authorId) {
      where.authorId = params.authorId;
    }
    
    if (params.tag) {
      where.tags = {
        has: params.tag
      };
    }

    // Cursor-based pagination (better for large datasets)
    const posts = await db.post.findMany({
      where,
      take: params.limit + 1, // Fetch one extra to check if there's more
      ...(params.cursor && {
        cursor: { id: params.cursor },
        skip: 1 // Skip the cursor
      }),
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            comments: true,
            likes: true
          }
        }
      }
    });

    // Check if there's a next page
    const hasMore = posts.length > params.limit;
    const items = hasMore ? posts.slice(0, -1) : posts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({
      data: items,
      pagination: {
        nextCursor,
        hasMore
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Alternative: Offset-based pagination (simpler, but slower for large datasets)
export async function GET_offset(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const params = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit')
    });

    const skip = (params.page - 1) * params.limit;

    const [posts, total] = await Promise.all([
      db.post.findMany({
        skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' }
      }),
      db.post.count()
    ]);

    return NextResponse.json({
      data: posts,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit)
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Pattern 9: File Upload Handling

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { withAuth } from '@/lib/middleware/auth';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const formData = await req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        throw new ApiError('No file provided', 400);
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new ApiError('File too large (max 5MB)', 400);
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new ApiError('Invalid file type', 400);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${user.id}-${timestamp}-${file.name}`;
      const filepath = join(process.cwd(), 'public', 'uploads', filename);

      // Save file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      // Save to database
      const upload = await db.upload.create({
        data: {
          filename,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          userId: user.id,
          url: `/uploads/${filename}`
        }
      });

      return NextResponse.json(upload, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  });
}
```

### Pattern 10: Webhook Handling

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { handleApiError } from '@/lib/errors';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      throw new ApiError('Invalid signature', 400);
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(failedPayment);
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return handleApiError(error);
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;
  
  await db.order.update({
    where: { id: orderId },
    data: {
      status: 'paid',
      paymentIntentId: paymentIntent.id
    }
  });
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;
  
  await db.order.update({
    where: { id: orderId },
    data: {
      status: 'payment_failed',
      paymentError: paymentIntent.last_payment_error?.message
    }
  });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  await db.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    }
  });
}
```

---

## 7. Testing Patterns

### API Route Testing

```typescript
// tests/api/auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { POST as registerHandler } from '@/app/api/auth/register/route';
import { db } from '@/lib/db';

describe('Auth API', () => {
  beforeAll(async () => {
    // Clean up test data
    await db.user.deleteMany({
      where: { email: 'test@example.com' }
    });
  });

  afterAll(async () => {
    await db.user.deleteMany({
      where: { email: 'test@example.com' }
    });
  });

  describe('POST /api/auth/register', () => {
    it('creates a new user and returns token', async () => {
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          name: 'Test User',
          password: 'Password123'
        })
      });

      const response = await registerHandler(request as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('token');
      expect(data.user).toMatchObject({
        email: 'test@example.com',
        name: 'Test User'
      });
    });

    it('returns 409 for duplicate email', async () => {
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          name: 'Test User',
          password: 'Password123'
        })
      });

      const response = await registerHandler(request as any);
      expect(response.status).toBe(409);
    });

    it('returns 400 for invalid input', async () => {
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          name: '',
          password: '123' // Too short
        })
      });

      const response = await registerHandler(request as any);
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns token for valid credentials', async () => {
      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123'
        })
      });

      const response = await loginHandler(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('token');
    });

    it('returns 401 for invalid credentials', async () => {
      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'WrongPassword'
        })
      });

      const response = await loginHandler(request as any);
      expect(response.status).toBe(401);
    });
  });
});
```

### Integration Testing

```typescript
// tests/integration/posts.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import { generateToken } from '@/lib/auth';

describe('Posts Integration', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create test user
    const user = await db.user.create({
      data: {
        email: 'integration@test.com',
        name: 'Integration Test',
        password: 'hashed_password'
      }
    });
    userId = user.id;
    authToken = generateToken({ userId: user.id, email: user.email });
  });

  it('creates, retrieves, updates, and deletes a post', async () => {
    // CREATE
    const createResponse = await fetch('http://localhost:3000/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: 'Test Post',
        content: 'Test content',
        published: true
      })
    });
    const created = await createResponse.json();
    expect(createResponse.status).toBe(201);
    expect(created).toHaveProperty('id');

    // READ
    const getResponse = await fetch(`http://localhost:3000/api/posts/${created.id}`);
    const retrieved = await getResponse.json();
    expect(retrieved.title).toBe('Test Post');

    // UPDATE
    const updateResponse = await fetch(`http://localhost:3000/api/posts/${created.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: 'Updated Post'
      })
    });
    const updated = await updateResponse.json();
    expect(updated.title).toBe('Updated Post');

    // DELETE
    const deleteResponse = await fetch(`http://localhost:3000/api/posts/${created.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    expect(deleteResponse.status).toBe(200);
  });
});
```

### Server Action Testing

```typescript
// tests/actions/posts.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createPost } from '@/app/actions/posts';
import * as authModule from '@/lib/auth';

// Mock authentication
vi.mock('@/lib/auth', () => ({
  getServerSession: vi.fn()
}));

describe('createPost server action', () => {
  it('creates post when authenticated', async () => {
    vi.mocked(authModule.getServerSession).mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' }
    });

    const formData = new FormData();
    formData.append('title', 'Test Post');
    formData.append('content', 'Test content');
    formData.append('published', 'true');

    const result = await createPost(formData);

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('id');
  });

  it('returns error when not authenticated', async () => {
    vi.mocked(authModule.getServerSession).mockResolvedValue(null);

    const formData = new FormData();
    formData.append('title', 'Test Post');
    formData.append('content', 'Test content');

    const result = await createPost(formData);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('validates input', async () => {
    vi.mocked(authModule.getServerSession).mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' }
    });

    const formData = new FormData();
    formData.append('title', ''); // Invalid: empty title
    formData.append('content', 'Test content');

    const result = await createPost(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('required');
  });
});
```

---

## 8. Common Gotchas

### 1. Request Body Already Consumed

```typescript
// ❌ PROBLEM: Cannot read request body twice
export async function POST(request: NextRequest) {
  const body1 = await request.json(); // First read
  const body2 = await request.json(); // Error! Already consumed
}

// ✅ SOLUTION: Read once and reuse
export async function POST(request: NextRequest) {
  const body = await request.json();
  // Use body multiple times
}
```

### 2. Params as Promise in Next.js 15

```typescript
// ❌ WRONG: Treating params as synchronous object
export async function GET(request: NextRequest, { params }: RouteContext) {
  const id = params.id; // Error in Next.js 15!
}

// ✅ CORRECT: Await params
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params; // ✓ Correct
}
```

### 3. Environment Variables in Edge Runtime

```typescript
// ❌ PROBLEM: Node.js APIs not available in Edge runtime
import { readFileSync } from 'fs'; // Won't work in Edge!

// ✅ SOLUTION: Specify runtime or use compatible APIs
export const runtime = 'nodejs'; // Or use edge-compatible code
```

### 4. Database Connection in Serverless

```typescript
// ❌ PROBLEM: Creating new Prisma client on every request
export async function GET() {
  const db = new PrismaClient(); // Connection exhaustion!
  const users = await db.user.findMany();
}

// ✅ SOLUTION: Use singleton pattern
// lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

### 5. CORS Headers on Error Responses

```typescript
// ❌ PROBLEM: Forgetting CORS headers on error responses
export async function POST(request: NextRequest) {
  try {
    // ... logic
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
    // Missing CORS headers!
  }
}

// ✅ SOLUTION: Consistent CORS headers
export async function POST(request: NextRequest) {
  const headers = handleCors(request);
  
  try {
    // ... logic
    return NextResponse.json(data, { headers });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500, headers });
  }
}
```

---

## 9. Architecture Decisions

### Why Next.js for API Backend?

- **Unified codebase** - Share types between frontend and backend
- **TypeScript-first** - Excellent type safety out of the box
- **Serverless-ready** - Deploy to Vercel, AWS Lambda, etc.
- **Built-in middleware** - Easy request interception
- **Server Actions** - Type-safe mutations without manual API routes

### Why Prisma?

- **Type-safe queries** - Auto-generated TypeScript types
- **Migration management** - Versioned schema changes
- **Multi-database support** - Easy to switch databases
- **Great DX** - Prisma Studio for database browsing

### Why Zod for Validation?

- **Runtime validation** - Catches invalid data at runtime
- **Type inference** - Generate TypeScript types from schemas
- **Composable** - Easy to build complex schemas
- **Great error messages** - Helpful validation feedback

### API Routes vs Server Actions?

**Use API Routes for:**
- RESTful APIs consumed by external clients
- Webhooks from third-party services
- Public endpoints
- Need for explicit HTTP methods and status codes

**Use Server Actions for:**
- Form submissions from your own frontend
- Type-safe mutations
- Simpler code without manual fetch calls
- Automatic revalidation

---

## 10. Change Management

### Small Changes (no spec needed)

- Bug fixes in existing endpoints
- Adding validation rules
- Performance optimizations
- Dependency updates

### Medium Changes (optional spec)

- New API endpoints
- Database schema changes
- Authentication flow changes
- New middleware

### Large Changes (spec required)

- New authentication system
- Major API redesign
- Breaking changes to API contracts
- Multi-service integration

**Recommendation:** Use OpenSpec for large changes to document API contracts before implementation.

---

## 11. Development Workflow

### First-Time Setup

```bash
# Clone repository
git clone {{REPO_URL}}
cd {{PROJECT_NAME}}

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local:
# DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
# JWT_SECRET="your-secret-key"
# ALLOWED_ORIGINS="http://localhost:3000"

# Set up database
npx prisma generate
npx prisma migrate dev
npx prisma db seed # Optional: seed with test data

# Start development server
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
npx prisma generate

# Start development
npm run dev

# Test API endpoints
curl http://localhost:3000/api/health
```

### Before Committing

```bash
# Run all validation checks
npm run type-check    # TypeScript validation
npm run lint          # ESLint
npm test              # Unit tests
npm run test:api      # API tests
npm run build         # Production build test

# Check database migrations
npx prisma migrate status

# Format code
npm run format
```

### Database Operations

```bash
# Create new migration
npx prisma migrate dev --name add_user_role

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Generate Prisma client (after schema changes)
npx prisma generate
```

### Testing API Endpoints

```bash
# Health check
curl http://localhost:3000/api/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test","password":"Password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'

# Use token for authenticated requests
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Deployment

```bash
# Build for production
npm run build

# Run production build locally
npm start

# Deploy to Vercel
vercel deploy --prod

# Run migrations in production
npx prisma migrate deploy
```

---

## 12. Performance Optimization

### Database Query Optimization

```typescript
// ❌ BAD: N+1 query problem
const users = await db.user.findMany();
for (const user of users) {
  const posts = await db.post.findMany({
    where: { authorId: user.id }
  });
  // This creates N queries!
}

// ✅ GOOD: Single query with include
const users = await db.user.findMany({
  include: {
    posts: true
  }
});

// ✅ EVEN BETTER: Select only needed fields
const users = await db.user.findMany({
  select: {
    id: true,
    name: true,
    posts: {
      select: {
        id: true,
        title: true
      },
      take: 5 // Limit included posts
    }
  }
});
```

### Response Caching

```typescript
// app/api/posts/route.ts
export async function GET(request: NextRequest) {
  const posts = await db.post.findMany({
    where: { published: true },
    select: {
      id: true,
      title: true,
      excerpt: true,
      createdAt: true
    }
  });

  return NextResponse.json(posts, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
    }
  });
}
```

### Streaming Large Responses

```typescript
// app/api/export/route.ts
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const users = await db.user.findMany();
      
      // Send header
      controller.enqueue(encoder.encode('id,name,email\n'));
      
      // Stream each row
      for (const user of users) {
        const row = `${user.id},${user.name},${user.email}\n`;
        controller.enqueue(encoder.encode(row));
      }
      
      controller.close();
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=users.csv'
    }
  });
}
```

---

*This file is the single source of truth for AI assistants working on this Next.js API project.*
