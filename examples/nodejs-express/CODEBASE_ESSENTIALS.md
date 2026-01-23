# Codebase Essentials - Express + TypeScript API

**Created:** January 23, 2026  
**Last Updated:** January 23, 2026  
**Status:** Example Project

---

## Technology Stack

**Backend:**
- Node.js 20.x LTS
- TypeScript 5.3
- Express 4.18
- Prisma 5.7 (ORM)

**Database:**
- PostgreSQL 15

**Authentication:**
- passport-jwt (JWT strategy)
- bcryptjs (password hashing)

**Validation:**
- Zod 3.22 (schema validation)
- express-validator (middleware)

**Testing:**
- Jest 29.7 (test framework)
- Supertest 6.3 (HTTP testing)
- ts-jest (TypeScript support)

**Infrastructure:**
- Docker & Docker Compose
- tsx (TypeScript execution)
- nginx (reverse proxy)

**Code Quality:**
- ESLint 8.x
- Prettier 3.x
- Husky (Git hooks)

---

## Validation Matrix

**ALWAYS run these commands before claiming work is complete:**

| Changed | Command | Expected Result |
|---------|---------|-----------------|
| **TypeScript** | `npm run type-check` | No type errors |
| **Unit Tests** | `npm run test` | All tests pass |
| **Linting** | `npm run lint` | No linting errors |
| **Format** | `npm run format:check` | No formatting issues |
| **Build** | `npm run build` | Successful compilation |
| **Database** | `npx prisma migrate dev` | No migration errors |

---

## Core Patterns

### 1. API Routes (Express Router + Controllers)

**Pattern: Router + Controller + Service Layer**

```typescript
// src/types/article.types.ts
import { z } from 'zod'

export const articleSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10),
  published: z.boolean().default(false)
})

export const updateArticleSchema = articleSchema.partial()

export type ArticleCreate = z.infer<typeof articleSchema>
export type ArticleUpdate = z.infer<typeof updateArticleSchema>

// src/controllers/article.controller.ts
import { Request, Response, NextFunction } from 'express'
import { articleService } from '../services/article.service'
import { articleSchema, updateArticleSchema } from '../types/article.types'
import { AppError } from '../middleware/errorHandler'

export const articleController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10
      
      const result = await articleService.list({ page, limit })
      res.json(result)
    } catch (error) {
      next(error)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id)
      const article = await articleService.getById(id)
      
      if (!article) {
        throw new AppError('Article not found', 404)
      }
      
      res.json(article)
    } catch (error) {
      next(error)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = articleSchema.parse(req.body)
      const userId = req.user!.id // From auth middleware
      
      const article = await articleService.create(validated, userId)
      res.status(201).json(article)
    } catch (error) {
      next(error)
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id)
      const validated = updateArticleSchema.parse(req.body)
      const userId = req.user!.id
      
      const article = await articleService.update(id, validated, userId)
      res.json(article)
    } catch (error) {
      next(error)
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id)
      const userId = req.user!.id
      
      await articleService.delete(id, userId)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}

// src/routes/article.routes.ts
import { Router } from 'express'
import { articleController } from '../controllers/article.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.get('/', articleController.list)
router.get('/:id', articleController.getById)
router.post('/', authenticate, articleController.create)
router.patch('/:id', authenticate, articleController.update)
router.delete('/:id', authenticate, articleController.delete)

export default router

// src/services/article.service.ts
import { prisma } from '../lib/prisma'
import { ArticleCreate, ArticleUpdate } from '../types/article.types'
import { AppError } from '../middleware/errorHandler'

export const articleService = {
  async list({ page, limit }: { page: number; limit: number }) {
    const skip = (page - 1) * limit
    
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        skip,
        take: limit,
        include: { author: { select: { id: true, username: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.article.count()
    ])
    
    return {
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  },

  async getById(id: number) {
    return prisma.article.findUnique({
      where: { id },
      include: { author: { select: { id: true, username: true } } }
    })
  },

  async create(data: ArticleCreate, authorId: number) {
    return prisma.article.create({
      data: {
        ...data,
        authorId
      },
      include: { author: { select: { id: true, username: true } } }
    })
  },

  async update(id: number, data: ArticleUpdate, userId: number) {
    // Check ownership
    const article = await prisma.article.findUnique({ where: { id } })
    if (!article) {
      throw new AppError('Article not found', 404)
    }
    if (article.authorId !== userId) {
      throw new AppError('Not authorized', 403)
    }
    
    return prisma.article.update({
      where: { id },
      data,
      include: { author: { select: { id: true, username: true } } }
    })
  },

  async delete(id: number, userId: number) {
    // Check ownership
    const article = await prisma.article.findUnique({ where: { id } })
    if (!article) {
      throw new AppError('Article not found', 404)
    }
    if (article.authorId !== userId) {
      throw new AppError('Not authorized', 403)
    }
    
    await prisma.article.delete({ where: { id } })
  }
}
```

**Why:**
- Separation of concerns (routes → controllers → services)
- Zod provides runtime + compile-time validation
- Service layer testable without HTTP
- Type safety end-to-end

**Gotchas:**
- ❌ Don't put business logic in controllers (keep thin)
- ✅ Use services for reusable business logic
- ✅ Always validate input with Zod before processing

---

### 2. Error Handling Middleware

**Pattern: Custom Error Class + Global Handler**

```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    })
  }
  
  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: 'Unique constraint violation',
        field: err.meta?.target
      })
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Record not found' })
    }
  }
  
  // Custom app errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message
    })
  }
  
  // Unknown errors
  console.error('Unhandled error:', err)
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  })
}

// Usage in app.ts
import express from 'express'
import { errorHandler } from './middleware/errorHandler'

const app = express()

// Routes...

// Error handler MUST be last middleware
app.use(errorHandler)
```

**Why:**
- Centralized error handling
- Type-safe custom errors
- Automatic validation error formatting
- Production-safe error messages

**Gotchas:**
- ❌ Don't forget to call `next(error)` in async handlers
- ✅ Error handler must be the last middleware
- ✅ Use `AppError` for expected errors (404, 403, etc.)

---

### 3. Authentication (JWT + Passport)

**Pattern: Passport Strategy + Middleware**

```typescript
// src/lib/jwt.ts
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = '7d'

export interface JwtPayload {
  userId: number
  email: string
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../lib/jwt'
import { prisma } from '../lib/prisma'
import { AppError } from './errorHandler'

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        email: string
        username: string
      }
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401)
    }
    
    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, username: true }
    })
    
    if (!user) {
      throw new AppError('User not found', 401)
    }
    
    req.user = user
    next()
  } catch (error) {
    if (error instanceof AppError) {
      next(error)
    } else {
      next(new AppError('Invalid token', 401))
    }
  }
}

// src/routes/auth.routes.ts
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { signToken } from '../lib/jwt'
import { AppError } from '../middleware/errorHandler'

const router = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)
    
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw new AppError('Invalid credentials', 401)
    }
    
    const validPassword = await bcrypt.compare(password, user.hashedPassword)
    if (!validPassword) {
      throw new AppError('Invalid credentials', 401)
    }
    
    const token = signToken({ userId: user.id, email: user.email })
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router
```

**Why:**
- Stateless JWT authentication
- Type-safe middleware
- Secure password hashing with bcrypt
- Clean separation of concerns

**Gotchas:**
- ❌ Don't store passwords in plain text
- ✅ Use bcrypt with salt rounds >= 10
- ✅ Validate JWT on every protected route

---

### 4. Database (Prisma)

**Pattern: Prisma Client Singleton**

```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             Int      @id @default(autoincrement())
  email          String   @unique
  username       String   @unique
  hashedPassword String   @map("hashed_password")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
  
  articles Article[]
  
  @@map("users")
}

model Article {
  id        Int      @id @default(autoincrement())
  title     String   @db.VarChar(200)
  content   String   @db.Text
  published Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  authorId Int  @map("author_id")
  author   User @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  @@index([authorId])
  @@index([published, createdAt])
  @@map("articles")
}

// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Why:**
- Type-safe database queries
- Auto-generated TypeScript types
- Migration system built-in
- Connection pooling handled automatically

**Gotchas:**
- ❌ Don't create new PrismaClient instances (connection leak)
- ✅ Use singleton pattern (see above)
- ✅ Run `npx prisma generate` after schema changes

---

### 5. Application Setup

**Pattern: Express App with Middleware Chain**

```typescript
// src/app.ts
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import articleRoutes from './routes/article.routes'
import authRoutes from './routes/auth.routes'
import { errorHandler } from './middleware/errorHandler'

const app = express()

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}))

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/articles', articleRoutes)
app.use('/api/auth', authRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler (must be last)
app.use(errorHandler)

export default app

// src/server.ts
import app from './app'
import { prisma } from './lib/prisma'

const PORT = process.env.PORT || 3000

async function start() {
  try {
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connected')
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

start()
```

**Why:**
- Security headers via helmet
- CORS configuration
- Request logging
- Graceful shutdown handling

**Gotchas:**
- ❌ Don't forget to disconnect Prisma on shutdown
- ✅ Use environment variables for configuration
- ✅ Test database connection before starting server

---

## Testing Patterns

### API Testing with Supertest

```typescript
// src/__tests__/article.test.ts
import request from 'supertest'
import app from '../app'
import { prisma } from '../lib/prisma'
import { signToken } from '../lib/jwt'

describe('Article API', () => {
  let authToken: string
  let userId: number

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        hashedPassword: 'hashed' // Use bcrypt in real tests
      }
    })
    userId = user.id
    authToken = signToken({ userId: user.id, email: user.email })
  })

  afterAll(async () => {
    await prisma.article.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  describe('POST /api/articles', () => {
    it('should create article with valid data', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Article',
          content: 'This is test content',
          published: true
        })

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        title: 'Test Article',
        content: 'This is test content',
        published: true
      })
      expect(response.body.id).toBeDefined()
    })

    it('should reject invalid data', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: '' })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
    })

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/articles')
        .send({ title: 'Test', content: 'Content' })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/articles', () => {
    it('should list articles', async () => {
      const response = await request(app).get('/api/articles')

      expect(response.status).toBe(200)
      expect(response.body.articles).toBeInstanceOf(Array)
      expect(response.body.pagination).toBeDefined()
    })
  })
})
```

**Why:**
- Supertest simulates HTTP requests
- Isolated test database
- Authentication testing
- Validation testing

---

## Project Invariants

**These rules MUST be followed:**

1. **TypeScript Strict Mode:** All code must compile with `strict: true`
2. **Input Validation:** All request bodies validated with Zod
3. **Error Handling:** All async route handlers wrapped in try/catch
4. **Authentication:** Protected routes must use `authenticate` middleware
5. **Service Layer:** Business logic in services, not controllers
6. **Prisma Singleton:** Never create multiple PrismaClient instances
7. **Password Security:** Always hash passwords with bcrypt (10+ rounds)

---

## Common Gotchas

### 1. Async Error Handling

**Problem:**
```typescript
// ❌ BAD: Unhandled promise rejection crashes server
app.get('/articles', async (req, res) => {
  const articles = await prisma.article.findMany() // If this fails, app crashes
  res.json(articles)
})
```

**Solution:**
```typescript
// ✅ GOOD: Catch errors and pass to error handler
app.get('/articles', async (req, res, next) => {
  try {
    const articles = await prisma.article.findMany()
    res.json(articles)
  } catch (error) {
    next(error)
  }
})
```

### 2. Integer Parsing

**Problem:**
```typescript
// ❌ BAD: req.params.id is string, not number
const id = req.params.id // Type: string
await prisma.article.findUnique({ where: { id } }) // Type error!
```

**Solution:**
```typescript
// ✅ GOOD: Parse to number
const id = parseInt(req.params.id, 10)
if (isNaN(id)) {
  throw new AppError('Invalid ID', 400)
}
await prisma.article.findUnique({ where: { id } })
```

### 3. Missing Type Declarations

**Problem:**
```typescript
// ❌ BAD: req.user doesn't exist on Request type
app.use(authenticate)
app.get('/profile', (req, res) => {
  console.log(req.user.id) // TypeScript error!
})
```

**Solution:**
```typescript
// ✅ GOOD: Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; email: string; username: string }
    }
  }
}
```

---

## Architecture Decisions

### Why Express?
- Battle-tested (15+ years)
- Huge ecosystem of middleware
- Simple, unopinionated design
- Great TypeScript support

### Why Prisma over TypeORM?
- Better TypeScript inference
- Auto-generated types
- Simpler migration system
- Faster query performance

### Why Zod over class-validator?
- Runtime + compile-time validation
- TypeScript-first design
- Smaller bundle size
- Easier composition

### Why JWT over Sessions?
- Stateless (scales horizontally)
- No server-side storage needed
- Works across services
- Mobile-friendly

---

## File Organization

```
src/
├── server.ts              # Entry point
├── app.ts                 # Express app setup
├── types/                 # Type definitions
│   └── article.types.ts
├── controllers/           # Request handlers
│   └── article.controller.ts
├── services/              # Business logic
│   └── article.service.ts
├── routes/                # Route definitions
│   ├── article.routes.ts
│   └── auth.routes.ts
├── middleware/            # Custom middleware
│   ├── auth.ts
│   └── errorHandler.ts
├── lib/                   # Utilities
│   ├── prisma.ts
│   └── jwt.ts
└── __tests__/             # Tests
    └── article.test.ts

prisma/
├── schema.prisma
└── migrations/
```

---

## Next Steps for New Developers

1. **Understand Express middleware chain** - Order matters!
2. **Master Prisma** - Read Prisma docs thoroughly
3. **Practice error handling** - Always use try/catch in async routes
4. **Write tests first** - TDD prevents bugs
5. **Use TypeScript strictly** - Don't use `any`
6. **Deploy early** - Test in production-like environment

---

**Remember:** Express is minimal by design. Add middleware thoughtfully and keep routes thin.
