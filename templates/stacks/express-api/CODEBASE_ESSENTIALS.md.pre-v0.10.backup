# Codebase Essentials - {{PROJECT_NAME}}

**Created:** {{DATE}}  
**Last Updated:** {{DATE}}  
**Status:** {{STATUS}}

---

## Technology Stack

**Runtime:**
- Node.js {{NODE_VERSION}} LTS
- TypeScript 5.x
- Express 4.x

**Database:**
- {{DATABASE}} (e.g., PostgreSQL, MySQL, MongoDB)
- {{ORM}} (e.g., Prisma, TypeORM, Mongoose)

**Authentication:**
- {{AUTH_LIB}} (e.g., Passport.js with JWT, Auth0, Firebase Auth)
- bcryptjs or argon2 (password hashing)

**Validation:**
- Zod or Yup (schema validation)
- express-validator (middleware)

**Testing:**
- {{TEST_FRAMEWORK}} (Jest, Vitest, or Node test runner)
- Supertest (HTTP endpoint testing)
- ts-node or tsx (TypeScript execution)

**Infrastructure:**
- Docker & Docker Compose
- nginx (optional reverse proxy)

**Code Quality:**
- ESLint with TypeScript
- Prettier
- Husky (git hooks)

---

## Validation Matrix

**ALWAYS run these commands before claiming work is complete:**

| Changed | Command | Expected Result |
|---------|---------|-----------------|
| **TypeScript** | `npm run type-check` | No type errors |
| **Tests** | `npm run test` | All tests pass |
| **Linting** | `npm run lint` | No errors |
| **Format** | `npm run format:check` | No formatting issues |
| **Build** | `npm run build` | Clean compilation |
| **Database** | `{{DB_MIGRATE_CMD}}` | No migration errors |

---

## Project Structure

```
{{PROJECT_NAME}}/
├── src/
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── routes/          # Express routers
│   ├── middleware/      # Custom middleware
│   ├── types/           # TypeScript types & schemas
│   ├── lib/             # Third-party configurations
│   ├── utils/           # Helper functions
│   ├── config/          # Environment & app config
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # API endpoint tests
│   └── setup.ts         # Test configuration
├── prisma/              # Database schema & migrations
└── docker-compose.yml   # Local dev environment
```

---

## Core Patterns

### 1. Three-Layer Architecture (Routes → Controllers → Services)

**✅ GOOD: Separated Concerns**

```typescript
// src/types/user.types.ts
import { z } from 'zod'

export const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  password: z.string().min(8)
})

export const updateUserSchema = createUserSchema.partial()

export type CreateUserDto = z.infer<typeof createUserSchema>
export type UpdateUserDto = z.infer<typeof updateUserSchema>

// src/services/user.service.ts
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { AppError } from '@/middleware/errorHandler'
import type { CreateUserDto, UpdateUserDto } from '@/types/user.types'

export class UserService {
  async create(data: CreateUserDto) {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email }
    })
    
    if (existing) {
      throw new AppError('Email already in use', 400)
    }
    
    // Hash password
    const passwordHash = await hash(data.password, 12)
    
    // Create user
    return prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true
      }
    })
  }
  
  async findById(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true
      }
    })
    
    if (!user) {
      throw new AppError('User not found', 404)
    }
    
    return user
  }
}

export const userService = new UserService()

// src/controllers/user.controller.ts
import type { Request, Response, NextFunction } from 'express'
import { userService } from '@/services/user.service'
import { createUserSchema } from '@/types/user.types'

export class UserController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const validated = createUserSchema.parse(req.body)
      
      // Create user via service
      const user = await userService.create(validated)
      
      // Return response
      res.status(201).json(user)
    } catch (error) {
      next(error)
    }
  }
  
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id)
      const user = await userService.findById(id)
      res.json(user)
    } catch (error) {
      next(error)
    }
  }
}

export const userController = new UserController()

// src/routes/user.routes.ts
import { Router } from 'express'
import { userController } from '@/controllers/user.controller'
import { authenticate } from '@/middleware/auth'

const router = Router()

router.post('/', userController.create)
router.get('/:id', authenticate, userController.getById)

export default router

// src/app.ts
import express from 'express'
import userRoutes from '@/routes/user.routes'
import { errorHandler } from '@/middleware/errorHandler'

const app = express()

app.use(express.json())
app.use('/api/users', userRoutes)
app.use(errorHandler)

export { app }
```

**❌ BAD: Everything in one file**

```typescript
// ❌ No separation of concerns
app.post('/users', async (req, res) => {
  const user = await prisma.user.create({ data: req.body }) // No validation!
  res.json(user)
})
```

**Why:** Three-layer architecture separates concerns - routes handle HTTP, controllers validate/orchestrate, services contain business logic. Easier to test, maintain, and reuse.

### 2. Error Handling (Custom Error Class + Middleware)

**✅ GOOD: Centralized Error Handling**

```typescript
// src/middleware/errorHandler.ts
import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational = true
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
      error: 'Validation error',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    })
  }
  
  // Custom application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message
    })
  }
  
  // Unknown errors - don't leak details!
  console.error('Unexpected error:', err)
  
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  })
}
```

**Usage:**

```typescript
// In service layer
if (!article) {
  throw new AppError('Article not found', 404)
}

if (article.authorId !== userId) {
  throw new AppError('Unauthorized', 403)
}
```

**❌ BAD: Manual error responses everywhere**

```typescript
// ❌ Repeated error handling logic
if (!user) {
  return res.status(404).json({ error: 'User not found' })
}

// ❌ Inconsistent error format
if (!article) {
  return res.status(404).send('Not found')
}
```

**Why:** Centralized error handler ensures consistent error format, proper HTTP status codes, and prevents error detail leakage in production.

---

## Common Patterns

### 1. Authentication Middleware (JWT)

**✅ GOOD: JWT Authentication with Passport**

```typescript
// src/lib/passport.ts
import passport from 'passport'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import { prisma } from './prisma'

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET!
}

passport.use(
  new JwtStrategy(options, async (payload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          username: true
        }
      })
      
      if (!user) {
        return done(null, false)
      }
      
      return done(null, user)
    } catch (error) {
      return done(error, false)
    }
  })
)

// src/middleware/auth.ts
import type { Request, Response, NextFunction } from 'express'
import passport from 'passport'

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    req.user = user
    next()
  })(req, res, next)
}

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

// src/services/auth.service.ts
import { compare, hash } from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { AppError } from '@/middleware/errorHandler'

export class AuthService {
  async register(email: string, username: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } })
    
    if (existing) {
      throw new AppError('Email already registered', 400)
    }
    
    const passwordHash = await hash(password, 12)
    
    const user = await prisma.user.create({
      data: { email, username, passwordHash },
      select: { id: true, email: true, username: true }
    })
    
    const token = this.generateToken(user.id)
    
    return { user, token }
  }
  
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    
    if (!user || !(await compare(password, user.passwordHash))) {
      throw new AppError('Invalid credentials', 401)
    }
    
    const token = this.generateToken(user.id)
    
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      },
      token
    }
  }
  
  private generateToken(userId: number): string {
    return jwt.sign(
      { sub: userId },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )
  }
}

export const authService = new AuthService()
```

### 2. Database Access Patterns (Prisma)

**✅ GOOD: Efficient Queries with Proper Selection**

```typescript
// src/services/article.service.ts
import { prisma } from '@/lib/prisma'

export class ArticleService {
  // Pagination with total count
  async list(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit
    
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          excerpt: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              username: true
            }
          }
        },
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
  }
  
  // Transaction for atomic operations
  async publish(articleId: number, userId: number) {
    return prisma.$transaction(async (tx) => {
      // Verify ownership
      const article = await tx.article.findUnique({
        where: { id: articleId }
      })
      
      if (!article || article.authorId !== userId) {
        throw new AppError('Unauthorized', 403)
      }
      
      // Publish article
      const updated = await tx.article.update({
        where: { id: articleId },
        data: { published: true, publishedAt: new Date() }
      })
      
      // Log activity
      await tx.activityLog.create({
        data: {
          userId,
          action: 'PUBLISH_ARTICLE',
          resourceId: articleId
        }
      })
      
      return updated
    })
  }
  
  // Soft delete pattern
  async delete(id: number, userId: number) {
    const article = await prisma.article.findUnique({
      where: { id }
    })
    
    if (!article) {
      throw new AppError('Article not found', 404)
    }
    
    if (article.authorId !== userId) {
      throw new AppError('Unauthorized', 403)
    }
    
    // Soft delete
    return prisma.article.update({
      where: { id },
      data: { deletedAt: new Date() }
    })
  }
}
```

### 3. Request Validation Middleware

**✅ GOOD: Zod Schema Validation Middleware**

```typescript
// src/middleware/validate.ts
import type { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate request body
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      next(error) // Let error handler deal with ZodError
    }
  }
}

// Usage in routes
import { validate } from '@/middleware/validate'
import { createArticleSchema } from '@/types/article.types'

router.post(
  '/',
  authenticate,
  validate(createArticleSchema),
  articleController.create
)
```

### 4. Rate Limiting

**✅ GOOD: Express Rate Limit**

```typescript
// src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import { createClient } from 'redis'

const redisClient = createClient({
  url: process.env.REDIS_URL
})

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:api:'
  })
})

// Strict rate limit for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true
})

// Usage in app
import { apiLimiter, authLimiter } from '@/middleware/rateLimit'

app.use('/api/', apiLimiter)
app.use('/api/auth/login', authLimiter)
```

### 5. CORS Configuration

**✅ GOOD: Secure CORS Setup**

```typescript
// src/middleware/cors.ts
import cors from 'cors'

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5173'
]

export const corsOptions = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})
```

### 6. Environment Configuration

**✅ GOOD: Type-Safe Environment Variables**

```typescript
// src/config/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number).pipe(z.number().positive()),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  REDIS_URL: z.string().url().optional(),
  ALLOWED_ORIGINS: z.string().optional()
})

// Validate environment variables at startup
export const env = envSchema.parse(process.env)

// Usage
import { env } from '@/config/env'

const app = express()
app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`)
})
```

### 7. Testing Patterns

**✅ GOOD: Integration Tests with Supertest**

```typescript
// tests/integration/articles.test.ts
import request from 'supertest'
import { app } from '@/app'
import { prisma } from '@/lib/prisma'

describe('Article API', () => {
  let authToken: string
  let userId: number
  
  beforeAll(async () => {
    // Seed test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashedpassword'
      }
    })
    userId = user.id
    
    // Get auth token
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
    
    authToken = response.body.token
  })
  
  afterAll(async () => {
    await prisma.article.deleteMany({})
    await prisma.user.deleteMany({})
    await prisma.$disconnect()
  })
  
  describe('POST /api/articles', () => {
    it('creates article when authenticated', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Article',
          content: 'This is test content'
        })
      
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body.title).toBe('Test Article')
    })
    
    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/articles')
        .send({
          title: 'Test Article',
          content: 'This is test content'
        })
      
      expect(response.status).toBe(401)
    })
    
    it('returns 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '' // Invalid: too short
        })
      
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('details')
    })
  })
})
```

---

## Critical Invariants

**Rules that MUST NEVER be violated:**

1. **TypeScript Strict Mode:** All code must pass `strict: true` type checking
2. **Never `any` Type:** Use `unknown` with type guards (exceptions: third-party libs)
3. **Async Error Handling:** All async route handlers must use try-catch or error middleware
4. **Input Validation:** All request bodies validated with Zod before processing
5. **No SQL Injection:** Use Prisma parameterized queries, never raw string concatenation
6. **Password Hashing:** Never store plain text passwords - always bcrypt/argon2
7. **Error Messages:** Never leak sensitive info (stack traces, DB errors) in production
8. **Authorization Checks:** Verify user owns resource before mutations
9. **CORS Configuration:** Never use `origin: '*'` in production
10. **Centralized Error Handling:** All errors must go through error handler middleware

---

## Testing Patterns

**Test Organization:**
```
tests/
├── unit/
│   ├── services/
│   └── utils/
├── integration/
│   └── routes/
└── setup.ts
```

**Naming:** `[name].test.ts` for all test files

**Unit Tests (Services):**
- Mock database calls
- Test business logic
- Test error conditions

**Integration Tests (Routes):**
- Use actual database (test DB)
- Test HTTP endpoints
- Test authentication/authorization

**Coverage Target:** 80% for services, 70% for controllers

---

## Performance Patterns

### 1. Database Query Optimization

```typescript
// ✅ GOOD: Use select to fetch only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    username: true,
    email: true
  }
})

// ❌ BAD: Fetching all fields (includes password hash!)
const users = await prisma.user.findMany()
```

### 2. Caching with Redis

```typescript
// src/lib/redis.ts
import { createClient } from 'redis'

export const redis = createClient({
  url: process.env.REDIS_URL
})

redis.on('error', (err) => console.error('Redis error:', err))

// src/middleware/cache.ts
import { redis } from '@/lib/redis'
import type { Request, Response, NextFunction } from 'express'

export const cacheMiddleware = (ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `cache:${req.originalUrl}`
    
    try {
      const cached = await redis.get(key)
      
      if (cached) {
        return res.json(JSON.parse(cached))
      }
      
      // Override res.json to cache response
      const originalJson = res.json.bind(res)
      res.json = (body: any) => {
        redis.setEx(key, ttl, JSON.stringify(body))
        return originalJson(body)
      }
      
      next()
    } catch (error) {
      next() // Fail gracefully
    }
  }
}
```

---

## Common Gotchas

### 1. Async Route Handlers Must Handle Errors

```typescript
// ❌ BAD: Unhandled promise rejection
router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany() // If this throws, app crashes!
  res.json(users)
})

// ✅ GOOD: Use try-catch or express-async-errors
import 'express-async-errors' // Auto-catches async errors

router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany()
  res.json(users)
})
```

### 2. JWT Secret Must Be Secure

```typescript
// ❌ BAD: Weak secret
const JWT_SECRET = 'secret'

// ✅ GOOD: Strong random secret (use env var)
const JWT_SECRET = process.env.JWT_SECRET! // At least 32 characters
```

### 3. Don't Trust Client Input

```typescript
// ❌ BAD: Using unvalidated input directly
const userId = req.body.userId // Could be anything!
await prisma.user.update({ where: { id: userId }, data: { role: 'admin' } })

// ✅ GOOD: Use authenticated user ID
const userId = req.user!.id // From JWT token
```

---

## Dependencies & Versions

**Major Dependencies:**
- `express@^4.18.0`
- `typescript@^5.3.0`
- `prisma@^5.7.0`
- `@prisma/client@^5.7.0`
- `zod@^3.22.0`
- `bcryptjs@^2.4.3`
- `jsonwebtoken@^9.0.0`
- `passport@^0.7.0`
- `passport-jwt@^4.0.0`

**Update Strategy:**
- Security updates immediately
- Minor/patch updates monthly
- Major version updates with testing
- Check `npm audit` regularly

---

## Build & Deployment

**Build Commands:**
```bash
npm run build          # TypeScript compilation
npm run start:prod     # Run compiled JS
npm run migrate:deploy # Run DB migrations in production
```

**Environment Files:**
- `.env` - Local development (gitignored)
- `.env.example` - Template (committed)
- `.env.test` - Test environment
- Production env vars via hosting platform

**Deployment Checklist:**
- [ ] All tests passing
- [ ] TypeScript compiles without errors
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] CORS origins set correctly
- [ ] JWT_SECRET is strong and secret
- [ ] Rate limiting enabled
- [ ] Logging configured (e.g., Winston, Pino)

---

## Key Architectural Decisions

### Why Three-Layer Architecture?
- **Separation of Concerns:** Routes, controllers, services have distinct responsibilities
- **Testability:** Services can be tested without Express
- **Reusability:** Business logic isn't tied to HTTP
- **Maintainability:** Changes isolated to appropriate layer

### Why Prisma?
- **Type Safety:** Generated TypeScript types from schema
- **Migration System:** Database schema versioning
- **Developer Experience:** Intuitive API, great autocomplete
- **Multi-Database:** Supports PostgreSQL, MySQL, MongoDB, etc.

### Why Zod?
- **Runtime Validation:** TypeScript types alone don't validate at runtime
- **Type Inference:** Schemas generate TypeScript types automatically
- **Error Messages:** Detailed validation error reporting
- **Composable:** Easy to build complex validation from simple schemas

---

## Resources

- [Express Docs](https://expressjs.com/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Zod Docs](https://zod.dev/)
- [Passport.js Docs](https://www.passportjs.org/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Last Updated:** {{DATE}}  
**Next Review:** {{NEXT_REVIEW_DATE}}
