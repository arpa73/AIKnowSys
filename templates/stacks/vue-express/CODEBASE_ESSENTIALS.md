# {{PROJECT_NAME}} - Codebase Essentials

> **Last Updated:** {{DATE}}  
> **Purpose:** Full-Stack Web Application  
> **Stack:** Vue 3 + Express.js + PostgreSQL

---

## Knowledge System: Document Roles

### The Three Knowledge Files

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
| **Frontend** |
| Framework | Vue 3 (Composition API) | 3.x |
| Build Tool | Vite | 5.x |
| Language | TypeScript | 5.x |
| State Management | Pinia | 2.x |
| Router | Vue Router | 4.x |
| UI Framework | Tailwind CSS | 4.x |
| Testing | Vitest + Vue Test Utils | Latest |
| **Backend** |
| Framework | Express.js | 4.x |
| Runtime | Node.js | 20+ |
| Language | TypeScript | 5.x |
| Database | PostgreSQL | 16+ |
| ORM | Prisma | 5.x |
| Testing | Vitest + Supertest | Latest |
| **Shared** |
| Package Manager | npm (workspaces) | 10+ |
| Linter | ESLint | 9.x |
| Formatter | Prettier | 3.x |

---

## 2. Validation Matrix

| Command | Purpose | Required |
|---------|---------|----------|
| `npm run dev` | Start all services | ✅ Must work |
| `npm run build` | Build frontend + backend | ✅ Before push |
| `npm run type-check` | TypeScript validation | ✅ Before commit |
| `npm run lint` | ESLint all packages | ✅ Before commit |
| `npm test` | Run all tests | ✅ Before commit |
| `npm run test:e2e` | E2E tests (if exists) | ⚠️ Before push |

---

## 3. Project Structure

```
{{PROJECT_NAME}}/
├── packages/
│   ├── frontend/              # Vue 3 application
│   │   ├── src/
│   │   │   ├── components/    # Vue components
│   │   │   ├── views/         # Page components
│   │   │   ├── stores/        # Pinia stores
│   │   │   ├── router/        # Vue Router
│   │   │   ├── api/           # API client
│   │   │   └── types/         # Frontend types
│   │   ├── tests/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── backend/               # Express API server
│   │   ├── src/
│   │   │   ├── routes/        # Express routes
│   │   │   ├── controllers/   # Route handlers
│   │   │   ├── services/      # Business logic
│   │   │   ├── middleware/    # Express middleware
│   │   │   └── types/         # Backend types
│   │   ├── tests/
│   │   ├── prisma/            # Database schema
│   │   │   └── schema.prisma
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── shared/                # Shared TypeScript types
│       ├── src/
│       │   └── types.ts       # API contracts, DTOs
│       ├── tsconfig.json
│       └── package.json
│
├── package.json               # Root workspace config
└── .env.example              # Environment template
```

---

## 4. Core Patterns

### Monorepo Organization

**Rule: Shared types in `packages/shared`, referenced by both frontend and backend**

```typescript
// packages/shared/src/types.ts
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface CreateUserDTO {
  email: string;
  name: string;
  password: string;
}

// packages/backend/src/controllers/users.ts
import { CreateUserDTO, User } from '@{{PROJECT_NAME}}/shared';

// packages/frontend/src/api/users.ts
import { CreateUserDTO, User } from '@{{PROJECT_NAME}}/shared';
```

### Frontend: Composition API Pattern

**Rule: Use `<script setup>` with TypeScript**

```vue
<!-- ✅ GOOD: script setup with TypeScript -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import type { User } from '@{{PROJECT_NAME}}/shared';

const props = defineProps<{
  user: User;
}>();

const count = ref(0);
const doubled = computed(() => count.value * 2);

function increment() {
  count.value++;
}
</script>

<!-- ❌ BAD: Options API (avoid in new code) -->
<script lang="ts">
export default {
  data() {
    return { count: 0 };
  }
};
</script>
```

### Backend: Layered Architecture

**Rule: Routes → Controllers → Services → Database**

```typescript
// ✅ GOOD: Layered architecture
// routes/users.ts
import { Router } from 'express';
import { createUser, getUsers } from '../controllers/users';

const router = Router();
router.post('/users', createUser);
router.get('/users', getUsers);

// controllers/users.ts
import { Request, Response } from 'express';
import * as userService from '../services/users';

export async function createUser(req: Request, res: Response) {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
}

// services/users.ts
import { db } from '../lib/db';
import type { CreateUserDTO } from '@{{PROJECT_NAME}}/shared';

export async function createUser(data: CreateUserDTO) {
  return db.user.create({ data });
}

// ❌ BAD: Business logic in routes
router.post('/users', async (req, res) => {
  const user = await db.user.create({ data: req.body }); // ← Logic in route!
  res.json(user);
});
```

### API Client Pattern

**Rule: Centralized API client with type safety**

```typescript
// packages/frontend/src/api/client.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// packages/frontend/src/api/users.ts
import { api } from './client';
import type { User, CreateUserDTO } from '@{{PROJECT_NAME}}/shared';

export const usersApi = {
  async getAll(): Promise<User[]> {
    const { data } = await api.get<User[]>('/users');
    return data;
  },
  
  async create(userData: CreateUserDTO): Promise<User> {
    const { data } = await api.post<User>('/users', userData);
    return data;
  },
};
```

### Pinia Store Pattern

**Rule: Composition API stores with TypeScript**

```typescript
// packages/frontend/src/stores/users.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { usersApi } from '../api/users';
import type { User } from '@{{PROJECT_NAME}}/shared';

export const useUsersStore = defineStore('users', () => {
  // State
  const users = ref<User[]>([]);
  const loading = ref(false);
  
  // Getters
  const userCount = computed(() => users.value.length);
  
  // Actions
  async function fetchUsers() {
    loading.value = true;
    try {
      users.value = await usersApi.getAll();
    } finally {
      loading.value = false;
    }
  }
  
  return { users, loading, userCount, fetchUsers };
});
```

---

## 5. Common Patterns

### Vue Composables: Reusable Logic

**Pattern: Custom Composable for API Calls**

```typescript
// packages/frontend/src/composables/useApi.ts
import { ref } from 'vue';
import type { Ref } from 'vue';

export function useApi<T>(apiFn: () => Promise<T>) {
  const data = ref<T | null>(null) as Ref<T | null>;
  const loading = ref(false);
  const error = ref<Error | null>(null);
  
  async function execute() {
    loading.value = true;
    error.value = null;
    try {
      data.value = await apiFn();
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  }
  
  return { data, loading, error, execute };
}

// Usage in component
<script setup lang="ts">
import { onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { usersApi } from '@/api/users';

const { data: users, loading, error, execute } = useApi(usersApi.getAll);

onMounted(() => execute());
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">Error: { { error.message } }</div>
  <div v-else>
    <UserCard v-for="user in users" :key="user.id" :user="user" />
  </div>
</template>
```

**Pattern: Form Validation Composable**

```typescript
// packages/frontend/src/composables/useForm.ts
import { ref, computed } from 'vue';

export function useForm<T>(initialValues: T) {
  const values = ref<T>(initialValues);
  const errors = ref<Partial<Record<keyof T, string>>>({});
  const touched = ref<Partial<Record<keyof T, boolean>>>({});
  
  function setFieldValue<K extends keyof T>(field: K, value: T[K]) {
    values.value[field] = value;
    touched.value[field] = true;
  }
  
  function setFieldError<K extends keyof T>(field: K, error: string) {
    errors.value[field] = error;
  }
  
  const isValid = computed(() => Object.keys(errors.value).length === 0);
  
  return { values, errors, touched, setFieldValue, setFieldError, isValid };
}

// Usage
const { values, errors, setFieldValue, isValid } = useForm({
  email: '',
  password: ''
});

function validateEmail() {
  if (!values.value.email.includes('@')) {
    setFieldError('email', 'Invalid email');
  }
}
</script>
```

### Vue Router: Navigation Patterns

**Pattern: Route Guards with Authentication**

```typescript
// packages/frontend/src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/Home.vue')
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/Dashboard.vue'),
      meta: { requiresAuth: true }
    }
  ]
});

// Global navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
  } else {
    next();
  }
});

export default router;
```

**Pattern: Programmatic Navigation with Type Safety**

```typescript
// Define route names as const
export const ROUTES = {
  HOME: 'Home',
  DASHBOARD: 'Dashboard',
  USER_PROFILE: 'UserProfile',
} as const;

// Type-safe navigation
import { useRouter } from 'vue-router';

const router = useRouter();

// ✅ Type-safe with autocomplete
router.push({ name: ROUTES.DASHBOARD });

// ✅ With params
router.push({ 
  name: ROUTES.USER_PROFILE, 
  params: { id: userId } 
});
```

### Pinia: Advanced State Management

**Pattern: Store Composition**

```typescript
// packages/frontend/src/stores/cart.ts
import { defineStore } from 'pinia';
import { useAuthStore } from './auth';
import { computed, ref } from 'vue';

export const useCartStore = defineStore('cart', () => {
  // Compose with other stores
  const authStore = useAuthStore();
  
  const items = ref<CartItem[]>([]);
  
  const total = computed(() => 
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
  
  async function checkout() {
    if (!authStore.isAuthenticated) {
      throw new Error('Must be logged in to checkout');
    }
    // Checkout logic...
  }
  
  return { items, total, checkout };
});
```

**Pattern: Persisted State**

```typescript
// packages/frontend/src/stores/preferences.ts
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const usePreferencesStore = defineStore('preferences', () => {
  // Load from localStorage
  const theme = ref<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  );
  
  // Persist to localStorage on changes
  watch(theme, (newTheme) => {
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }, { immediate: true });
  
  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  }
  
  return { theme, toggleTheme };
});
```

### Express Middleware Patterns

**Pattern: Error Handling Middleware**

```typescript
// packages/backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
  
  // Unexpected errors
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal server error' });
}

// Usage in routes
import { AppError } from '../middleware/errorHandler';

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.getById(req.params.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    res.json(user);
  } catch (error) {
    next(error); // Pass to error handler
  }
}
```

**Pattern: Authentication Middleware**

```typescript
// packages/backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Usage
router.get('/profile', requireAuth, getProfile);
```

**Pattern: Request Validation Middleware**

```typescript
// packages/backend/src/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
}

// Usage
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8)
});

router.post('/users', validate(createUserSchema), createUser);
```

### Prisma Advanced Patterns

**Pattern: Soft Deletes**

```prisma
// packages/backend/prisma/schema.prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String
  deletedAt DateTime?
  
  @@index([deletedAt])
}
```

```typescript
// packages/backend/src/services/users.ts
// Middleware to exclude soft-deleted records
export const prisma = new PrismaClient().$extends({
  query: {
    user: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findUnique({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      }
    }
  }
});

// Soft delete function
export async function softDeleteUser(id: string) {
  return prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() }
  });
}
```

**Pattern: Optimistic Concurrency Control**

```prisma
model Post {
  id      String @id @default(cuid())
  title   String
  version Int    @default(0)
}
```

```typescript
// packages/backend/src/services/posts.ts
export async function updatePost(id: string, version: number, data: UpdateData) {
  const post = await prisma.post.update({
    where: { 
      id,
      version // Ensures version matches
    },
    data: {
      ...data,
      version: { increment: 1 }
    }
  });
  
  if (!post) {
    throw new AppError('Post was modified by another user', 409);
  }
  
  return post;
}
```

### WebSocket Integration Pattern

**Pattern: Real-time Updates with Socket.io**

```typescript
// packages/backend/src/socket.ts
import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

export function setupSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true
    }
  });
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
  
  return io;
}

// Emit events from services
import { io } from '../socket';

export async function createPost(data: CreatePostDTO) {
  const post = await prisma.post.create({ data });
  
  // Notify connected clients
  io.to('posts-room').emit('post-created', post);
  
  return post;
}
```

```typescript
// packages/frontend/src/composables/useSocket.ts
import { onMounted, onUnmounted } from 'vue';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket(url: string = import.meta.env.VITE_API_URL) {
  if (!socket) {
    socket = io(url);
  }
  
  onUnmounted(() => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  });
  
  return socket;
}

// Usage in component
const socket = useSocket();

onMounted(() => {
  socket.on('post-created', (post) => {
    // Update UI with new post
    postsStore.addPost(post);
  });
});
```

---

## 6. Critical Invariants

### Type Safety Across Stack

1. **Shared types package** - All API contracts in `packages/shared`
2. **No `any` types** - Use proper types or `unknown`
3. **Strict TypeScript** - `strict: true` in all `tsconfig.json` files

### Monorepo Rules

1. **Workspace dependencies** - Use `workspace:*` protocol in `package.json`
2. **Build order** - Shared must build before frontend/backend
3. **Single lockfile** - One `package-lock.json` at root

### Database Access

1. **Prisma only in backend** - Never import Prisma in frontend
2. **Single Prisma instance** - Use singleton pattern (`lib/db.ts`)
3. **Migrations in version control** - Never delete migration files

---

## 7. Common Gotchas

### 1. CORS Configuration

```typescript
// ❌ PROBLEM: CORS errors in development
// Backend doesn't allow frontend origin

// ✅ SOLUTION: Configure CORS properly
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
```

### 2. Environment Variables

```typescript
// ❌ PROBLEM: Exposing backend secrets to frontend
// .env in root with DB_URL

// ✅ SOLUTION: Separate .env files
// packages/backend/.env (server secrets)
DATABASE_URL=postgresql://...
JWT_SECRET=secret123

// packages/frontend/.env (client vars, prefixed with VITE_)
VITE_API_URL=http://localhost:3000/api
```

### 3. Type Import Conflicts

```typescript
// ❌ PROBLEM: Importing implementation from shared
import { userService } from '@{{PROJECT_NAME}}/shared';

// ✅ SOLUTION: Only import types from shared
import type { User } from '@{{PROJECT_NAME}}/shared';
```

---

## 8. Testing Patterns

### Frontend Component Tests

```typescript
// packages/frontend/tests/components/UserCard.spec.ts
import { mount } from '@vue/test-utils';
import UserCard from '@/components/UserCard.vue';

describe('UserCard', () => {
  it('displays user name', () => {
    const wrapper = mount(UserCard, {
      props: {
        user: { id: '1', name: 'John', email: 'john@example.com' }
      }
    });
    expect(wrapper.text()).toContain('John');
  });
});
```

### Backend API Tests

```typescript
// packages/backend/tests/routes/users.test.ts
import request from 'supertest';
import { app } from '../src/app';

describe('POST /api/users', () => {
  it('creates a new user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'John', email: 'john@example.com', password: 'secret' });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

---

## 9. Architecture Decisions

### Why Monorepo?

- **Type sharing** - Single source of truth for API contracts
- **Code reuse** - Shared utilities, types, constants
- **Coordinated changes** - Update API contract + implementation together

### Why Pinia over Vuex?

- **TypeScript support** - Native TypeScript, no magic strings
- **Simpler API** - Less boilerplate than Vuex
- **Composition API** - Consistent with Vue 3 patterns

### Why Prisma?

- **Type-safe queries** - Auto-generated TypeScript types
- **Schema migrations** - Versioned database changes
- **Multi-database support** - Easy to switch databases

---

## 10. Development Workflow

### First-Time Setup

```bash
# Install dependencies
npm install

# Set up environment
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env

# Edit packages/backend/.env with DATABASE_URL

# Run migrations
npm run db:migrate

# Start development (frontend + backend)
npm run dev
```

### Before Committing

```bash
# Type check all packages
npm run type-check

# Lint all packages
npm run lint

# Run all tests
npm test

# Build check
npm run build
```

---

*This file is the single source of truth for AI assistants working on this full-stack project.*
