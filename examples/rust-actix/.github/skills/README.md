# Rust/Actix Example Skills

This directory contains Rust + Actix Web specific skills for the knowledge system.

## Skills Included

### 1. endpoint-implementation

**When to use:** Adding new API endpoints

**Key steps:**
1. Define request/response types with Serde
2. Create handler function with extractors
3. Add route to App configuration
4. Implement database query with SQLx
5. Add error handling
6. Write integration tests
7. Run `cargo test` to validate

### 2. database-migrations

**When to use:** Changing database schema

**Key steps:**
1. Create migration with `sqlx migrate add`
2. Write SQL in migrations/ file
3. Test migration with `sqlx migrate run`
4. Update models.rs to match schema
5. Update queries to use new schema
6. Run tests to verify changes
7. Consider rollback (down migration)

### 3. error-handling

**When to use:** Adding custom error types or improving error responses

**Key steps:**
1. Define error variant in error.rs
2. Implement Display trait
3. Implement ResponseError trait
4. Add From<SourceError> conversion
5. Update handlers to use new error
6. Test error responses
7. Ensure no internal details leaked

## How to Use

When the AI agent detects a Rust/Actix task (endpoint work, database changes, error handling), it should:

1. Read the relevant skill from `.github/skills/`
2. Follow the step-by-step workflow
3. Validate with `cargo test && cargo clippy`
4. Update CODEBASE_CHANGELOG.md

## Example Usage

```markdown
User: "Add authentication with JWT tokens"

Agent:
1. Reads @/.github/skills/endpoint-implementation/SKILL.md
2. Creates auth.rs handler with login/register endpoints
3. Adds JWT middleware for protected routes
4. Creates User model and migrations
5. Writes tests (successful login, invalid credentials, token validation)
6. Runs cargo test + clippy to validate
7. Updates changelog
```

---

*These skills are Rust/Actix-specific and build on the universal skills from the template.*
