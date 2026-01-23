# Codebase Essentials - Rust + Actix Web API

**Created:** January 23, 2026  
**Last Updated:** January 23, 2026  
**Status:** Example Project

---

## Technology Stack

**Backend:**
- Rust 1.75 (stable)
- Actix Web 4.4 (web framework)
- Actix RT (async runtime)
- SQLx 0.7 (database library)
- PostgreSQL 15

**Serialization:**
- Serde 1.0 (serialization framework)
- Serde JSON (JSON support)

**Testing:**
- Built-in Rust test framework
- Actix Web test utilities
- SQLx test macros

**Code Quality:**
- Clippy (linter)
- Rustfmt (formatter)
- Cargo audit (security)

**Key Dependencies:**
- tokio (async runtime)
- env_logger (logging)
- dotenv (environment variables)
- bcrypt (password hashing)
- jsonwebtoken (JWT authentication)

---

## Validation Matrix

**ALWAYS run these commands before claiming work is complete:**

| Changed | Command | Expected Result |
|---------|---------|-----------------|
| **Rust Code** | `cargo test` | All tests pass |
| **Specific Tests** | `cargo test test_name` | Named tests pass |
| **Type Checking** | `cargo check` | No errors |
| **Linting** | `cargo clippy -- -D warnings` | No warnings or errors |
| **Formatting** | `cargo fmt -- --check` | Code is formatted |
| **Build** | `cargo build --release` | Successful build |
| **Security Audit** | `cargo audit` | No vulnerabilities |

---

## Core Patterns

### 1. API Endpoints (Actix Web Handlers)

**Pattern: Handler + Extractor + Responder**

```rust
// src/models.rs
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Article {
    pub id: i32,
    pub title: String,
    pub content: String,
    pub author_id: i32,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
    pub published: bool,
}

#[derive(Debug, Deserialize)]
pub struct CreateArticle {
    pub title: String,
    pub content: String,
    pub published: bool,
}

// src/handlers/articles.rs
use actix_web::{web, HttpResponse, Result};
use sqlx::PgPool;
use crate::models::{Article, CreateArticle};

pub async fn list_articles(pool: web::Data<PgPool>) -> Result<HttpResponse> {
    let articles = sqlx::query_as::<_, Article>(
        "SELECT * FROM articles ORDER BY created_at DESC"
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(articles))
}

pub async fn get_article(
    pool: web::Data<PgPool>,
    article_id: web::Path<i32>,
) -> Result<HttpResponse> {
    let article = sqlx::query_as::<_, Article>(
        "SELECT * FROM articles WHERE id = $1"
    )
    .bind(article_id.into_inner())
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    match article {
        Some(article) => Ok(HttpResponse::Ok().json(article)),
        None => Ok(HttpResponse::NotFound().json("Article not found")),
    }
}

pub async fn create_article(
    pool: web::Data<PgPool>,
    payload: web::Json<CreateArticle>,
    // In real app, extract user_id from JWT
) -> Result<HttpResponse> {
    let author_id = 1; // Placeholder
    
    let article = sqlx::query_as::<_, Article>(
        "INSERT INTO articles (title, content, author_id, published) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *"
    )
    .bind(&payload.title)
    .bind(&payload.content)
    .bind(author_id)
    .bind(payload.published)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Created().json(article))
}

pub async fn delete_article(
    pool: web::Data<PgPool>,
    article_id: web::Path<i32>,
) -> Result<HttpResponse> {
    let result = sqlx::query("DELETE FROM articles WHERE id = $1")
        .bind(article_id.into_inner())
        .execute(pool.get_ref())
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    if result.rows_affected() == 0 {
        Ok(HttpResponse::NotFound().json("Article not found"))
    } else {
        Ok(HttpResponse::NoContent().finish())
    }
}

// src/main.rs
use actix_web::{web, App, HttpServer};
use sqlx::postgres::PgPoolOptions;

mod handlers;
mod models;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();
    dotenv::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to create pool");

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .route("/articles", web::get().to(handlers::articles::list_articles))
            .route("/articles", web::post().to(handlers::articles::create_article))
            .route("/articles/{id}", web::get().to(handlers::articles::get_article))
            .route("/articles/{id}", web::delete().to(handlers::articles::delete_article))
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
```

**Why:**
- Extractors (`web::Data`, `web::Json`, `web::Path`) for type-safe request parsing
- `Result<HttpResponse>` for error handling
- SQLx compile-time query verification
- Database pool for connection management
- Serde for automatic serialization/deserialization

### 2. Error Handling

**Pattern: Custom Error Type + From Implementations**

```rust
// src/error.rs
use actix_web::{error::ResponseError, http::StatusCode, HttpResponse};
use std::fmt;

#[derive(Debug)]
pub enum ApiError {
    DatabaseError(sqlx::Error),
    NotFound(String),
    ValidationError(String),
    Unauthorized,
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            ApiError::DatabaseError(e) => write!(f, "Database error: {}", e),
            ApiError::NotFound(msg) => write!(f, "Not found: {}", msg),
            ApiError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
            ApiError::Unauthorized => write!(f, "Unauthorized"),
        }
    }
}

impl ResponseError for ApiError {
    fn error_response(&self) -> HttpResponse {
        match self {
            ApiError::DatabaseError(_) => {
                HttpResponse::InternalServerError().json("Internal server error")
            }
            ApiError::NotFound(msg) => {
                HttpResponse::NotFound().json(msg)
            }
            ApiError::ValidationError(msg) => {
                HttpResponse::BadRequest().json(msg)
            }
            ApiError::Unauthorized => {
                HttpResponse::Unauthorized().json("Unauthorized")
            }
        }
    }

    fn status_code(&self) -> StatusCode {
        match self {
            ApiError::DatabaseError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            ApiError::NotFound(_) => StatusCode::NOT_FOUND,
            ApiError::ValidationError(_) => StatusCode::BAD_REQUEST,
            ApiError::Unauthorized => StatusCode::UNAUTHORIZED,
        }
    }
}

impl From<sqlx::Error> for ApiError {
    fn from(err: sqlx::Error) -> Self {
        ApiError::DatabaseError(err)
    }
}

// Usage in handlers
pub async fn get_article(
    pool: web::Data<PgPool>,
    article_id: web::Path<i32>,
) -> Result<HttpResponse, ApiError> {
    let article = sqlx::query_as::<_, Article>(
        "SELECT * FROM articles WHERE id = $1"
    )
    .bind(article_id.into_inner())
    .fetch_optional(pool.get_ref())
    .await?; // Automatic conversion from sqlx::Error

    match article {
        Some(article) => Ok(HttpResponse::Ok().json(article)),
        None => Err(ApiError::NotFound("Article not found".to_string())),
    }
}
```

**Why:**
- Type-safe error handling with `Result`
- Automatic HTTP response generation
- `From` trait for error conversion
- Centralized error logic
- Prevents information leakage (hides internal errors)

### 3. Database Migrations with SQLx

**Pattern: SQL Migrations in migrations/ Directory**

```bash
# Install sqlx-cli
cargo install sqlx-cli --no-default-features --features postgres

# Create migration
sqlx migrate add create_articles_table

# migrations/20260123_create_articles_table.sql
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    published BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_created ON articles(created_at DESC);

# Run migrations
sqlx migrate run
```

**Why:**
- Version-controlled schema changes
- Rollback support (down migrations)
- Compile-time query verification
- Automatic index creation
- Timestamps with defaults

### 4. Testing (Unit + Integration)

**Pattern: Test Modules + Test Database**

```rust
// src/handlers/articles.rs
#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::{test, web, App};
    use sqlx::postgres::PgPoolOptions;

    async fn setup_test_db() -> PgPool {
        let database_url = std::env::var("TEST_DATABASE_URL")
            .unwrap_or_else(|_| "postgresql://localhost/test_db".to_string());

        let pool = PgPoolOptions::new()
            .max_connections(1)
            .connect(&database_url)
            .await
            .expect("Failed to create test pool");

        // Run migrations
        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .expect("Failed to run migrations");

        pool
    }

    #[actix_web::test]
    async fn test_list_articles_empty() {
        let pool = setup_test_db().await;

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(pool.clone()))
                .route("/articles", web::get().to(list_articles))
        )
        .await;

        let req = test::TestRequest::get().uri("/articles").to_request();
        let resp = test::call_service(&app, req).await;

        assert!(resp.status().is_success());
        
        let body: Vec<Article> = test::read_body_json(resp).await;
        assert_eq!(body.len(), 0);
    }

    #[actix_web::test]
    async fn test_create_and_get_article() {
        let pool = setup_test_db().await;

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(pool.clone()))
                .route("/articles", web::post().to(create_article))
                .route("/articles/{id}", web::get().to(get_article))
        )
        .await;

        // Create article
        let payload = CreateArticle {
            title: "Test Article".to_string(),
            content: "Test content".to_string(),
            published: true,
        };

        let req = test::TestRequest::post()
            .uri("/articles")
            .set_json(&payload)
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), StatusCode::CREATED);

        let created: Article = test::read_body_json(resp).await;
        assert_eq!(created.title, "Test Article");

        // Get article
        let req = test::TestRequest::get()
            .uri(&format!("/articles/{}", created.id))
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());

        let fetched: Article = test::read_body_json(resp).await;
        assert_eq!(fetched.id, created.id);
    }

    #[actix_web::test]
    async fn test_get_nonexistent_article() {
        let pool = setup_test_db().await;

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(pool.clone()))
                .route("/articles/{id}", web::get().to(get_article))
        )
        .await;

        let req = test::TestRequest::get()
            .uri("/articles/99999")
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }
}
```

**Why:**
- Test database isolation
- Integration tests with real database
- Actix test utilities for request/response
- Automatic migration running
- Status code + body assertions

---

## Critical Invariants

### NEVER Violate These Rules

1. **Always handle `Result` types explicitly**
   ```rust
   // ❌ BAD
   let article = query.fetch_one(&pool).await.unwrap();
   
   // ✅ GOOD
   let article = query.fetch_one(&pool).await?;
   // Or
   let article = query.fetch_one(&pool).await
       .map_err(|e| ApiError::DatabaseError(e))?;
   ```

2. **Never expose internal error details in production**
   ```rust
   // ❌ BAD
   HttpResponse::InternalServerError().json(format!("Error: {}", e))
   
   // ✅ GOOD
   HttpResponse::InternalServerError().json("Internal server error")
   // Log the error internally
   log::error!("Database error: {}", e);
   ```

3. **Always use parameterized queries (prevent SQL injection)**
   ```rust
   // ❌ BAD
   let query = format!("SELECT * FROM articles WHERE id = {}", id);
   
   // ✅ GOOD
   sqlx::query("SELECT * FROM articles WHERE id = $1").bind(id)
   ```

4. **Never commit `.env` files**
   - Use `.env.example` for documentation
   - Add `.env` to `.gitignore`

5. **Always run `cargo clippy` before committing**
   - Catches common mistakes
   - Enforces best practices
   - Use `-- -D warnings` to fail on warnings

---

## Common Gotchas

### 1. Async Runtime Conflicts

**Problem:** Mixing Tokio and async-std causes runtime errors.

**Solution:**
```toml
# Cargo.toml - stick to one runtime
[dependencies]
actix-web = "4.4"
actix-rt = "2.9"  # Uses Tokio
tokio = { version = "1", features = ["full"] }
# Don't mix with async-std
```

### 2. SQLx Compile-Time Verification

**Problem:** `cargo build` fails with "database not found" for queries.

**Solution:**
```bash
# Set DATABASE_URL for compile-time verification
export DATABASE_URL="postgresql://localhost/dev_db"

# Or disable compile-time checks (not recommended)
# Cargo.toml
[dependencies]
sqlx = { version = "0.7", features = ["runtime-tokio-native-tls", "postgres"], default-features = false }
```

### 3. Lifetime Errors with Actix Extractors

**Problem:** Lifetime errors when returning data from extractors.

**Solution:**
```rust
// ❌ BAD - lifetime issues
pub async fn handler(data: web::Data<MyData>) -> impl Responder {
    let value = &data.value; // Borrow doesn't live long enough
    HttpResponse::Ok().json(value)
}

// ✅ GOOD - clone or take ownership
pub async fn handler(data: web::Data<MyData>) -> impl Responder {
    let value = data.value.clone();
    HttpResponse::Ok().json(value)
}
```

### 4. Connection Pool Exhaustion

**Problem:** Tests hang due to connection pool exhaustion.

**Solution:**
```rust
// In tests, use small pool
let pool = PgPoolOptions::new()
    .max_connections(1)  // One connection per test
    .connect(&database_url)
    .await?;

// In production, tune based on load
let pool = PgPoolOptions::new()
    .max_connections(20)
    .connect(&database_url)
    .await?;
```

---

## Architecture Decisions

### Why Actix Web?

**Decision:** Use Actix Web as the web framework.

**Rationale:**
- One of the fastest web frameworks (benchmarks)
- Mature ecosystem and documentation
- Built on Tokio (industry standard async runtime)
- Strong type safety with extractors
- Active development and maintenance

**Alternatives considered:**
- Rocket: Requires nightly Rust
- Axum: Newer, less ecosystem maturity
- Warp: Less ergonomic API

### Why SQLx over Diesel?

**Decision:** Use SQLx for database interactions.

**Rationale:**
- Compile-time query verification
- Async/await support (Diesel async is experimental)
- Supports raw SQL (more flexibility)
- Built-in migration support
- Better PostgreSQL-specific features

**Alternatives considered:**
- Diesel: No stable async, more ORM-like
- SeaORM: Newer, less battle-tested

### Why PostgreSQL?

**Decision:** Use PostgreSQL as primary database.

**Rationale:**
- JSON/JSONB support for flexible data
- Full-text search capabilities
- Excellent performance at scale
- Strong data integrity guarantees
- Industry standard for Rust web apps

**Alternatives considered:**
- SQLite: Not suitable for production concurrency
- MySQL: PostgreSQL has better Rust support

---

## File Organization

```
project/
├── Cargo.toml                  # Dependencies
├── .env.example                # Environment template
├── migrations/                 # SQLx migrations
│   ├── 20260123_create_articles.sql
│   └── ...
├── src/
│   ├── main.rs                 # Entry point
│   ├── models.rs               # Data models
│   ├── error.rs                # Error types
│   ├── handlers/
│   │   ├── mod.rs
│   │   ├── articles.rs         # Article endpoints
│   │   └── auth.rs             # Auth endpoints
│   ├── middleware/
│   │   ├── mod.rs
│   │   └── auth.rs             # JWT middleware
│   └── utils/
│       └── database.rs         # DB utilities
└── tests/
    └── integration_test.rs     # Integration tests
```

**Conventions:**
- One handler module per resource (`articles`, `users`, `comments`)
- `models.rs` for shared data structures
- `error.rs` for centralized error handling
- Tests co-located with modules (`#[cfg(test)]`)
- Integration tests in `tests/` directory

---

## Development Workflow

### Starting Development

```bash
# 1. Install SQLx CLI
cargo install sqlx-cli --no-default-features --features postgres

# 2. Set up database
createdb dev_db
export DATABASE_URL="postgresql://localhost/dev_db"

# 3. Run migrations
sqlx migrate run

# 4. Run development server
cargo run

# Or with auto-reload
cargo install cargo-watch
cargo watch -x run
```

### Making Changes

```bash
# 1. Make code changes
# 2. Check compilation
cargo check

# 3. Run tests
cargo test

# 4. Run linter
cargo clippy -- -D warnings

# 5. Format code
cargo fmt

# 6. Commit only after all checks pass
```

### Before Committing

```bash
# Full validation
cargo test && cargo clippy -- -D warnings && cargo fmt -- --check
```

---

## Production Deployment

### Checklist

- [ ] Environment variables set (DATABASE_URL, etc.)
- [ ] Database migrations applied
- [ ] `cargo build --release` succeeds
- [ ] Binary size optimized (strip symbols)
- [ ] Logging configured (env_logger or tracing)
- [ ] Reverse proxy configured (nginx)
- [ ] HTTPS/TLS enabled
- [ ] Connection pool tuned for load
- [ ] Monitoring/metrics enabled
- [ ] Backup strategy implemented

### Build Optimization

```toml
# Cargo.toml
[profile.release]
lto = true              # Link-time optimization
codegen-units = 1       # Better optimization
strip = true            # Remove debug symbols
opt-level = 3           # Maximum optimization
```

### Environment Variables

```bash
# Production .env
DATABASE_URL=postgresql://user:password@db:5432/production_db
RUST_LOG=info
JWT_SECRET=<random-secret>
```

---

*This example demonstrates a production-ready Rust + Actix Web API with type safety, error handling, database migrations, and comprehensive testing.*
