# Python/Django Example Skills

This directory contains Django-specific skills for the knowledge system.

## Skills Included

### 1. feature-implementation

**When to use:** Adding new API endpoints, models, or features

**Key steps:**
1. Design model schema
2. Create serializer
3. Create ViewSet
4. Register routes
5. Write tests with factories
6. Apply migrations
7. Update OpenAPI schema

### 2. database-migrations

**When to use:** Changing models, adding fields, or database schema changes

**Key steps:**
1. Modify models.py
2. Generate migration (`makemigrations`)
3. Review migration file
4. Test migration (`migrate`)
5. Write data migration if needed
6. Test rollback scenario

### 3. api-testing

**When to use:** Testing REST API endpoints

**Key patterns:**
- Use `APIClient` for requests
- Use factories for test data
- Test authentication/permissions
- Verify response status + data
- Check database state changes

## How to Use

When the AI agent detects a Django-related task (model changes, API work, migrations), it should:

1. Read the relevant skill from `.github/skills/`
2. Follow the step-by-step workflow
3. Validate with pytest after each step
4. Update CODEBASE_CHANGELOG.md

## Example Usage

```markdown
User: "Add a Comment model for articles"

Agent:
1. Reads @/.github/skills/feature-implementation/SKILL.md
2. Creates model with ForeignKey to Article
3. Creates serializer with nested representation
4. Creates ViewSet with permission checks
5. Writes tests (create, list, update, delete, permissions)
6. Runs pytest to validate
7. Updates changelog
```

---

*These skills are Django-specific and build on the universal skills from the template.*
