---
name: documentation-management
description: Maintain AI-optimized documentation and organize codebase history for gnwebsite project. Use when updating docs, organizing changelog, improving readability for AI agents, or when documentation becomes too large. Covers changelog archiving, AI-friendly writing patterns, semantic structure, and knowledge retrieval optimization. Ensures documentation stays readable and discoverable for both humans and AI systems.
---

# Documentation Management

Comprehensive guide for maintaining high-quality, AI-optimized documentation and managing growing codebase history in gnwebsite project.

## When to Use This Skill

- User asks to "update documentation" or "organize the changelog"
- Changelog exceeds 1500 lines or 6 months of sessions
- Documentation becomes hard to navigate or retrieve information from
- After major architectural changes or refactors
- When implementing new patterns that should be documented
- Creating or updating technical documentation for AI consumption
- When you hear: "The changelog is too big" or "Make docs more readable"

## Core Principles

1. **AI-Optimized**: Write for both humans and AI retrieval systems
2. **Self-Contained**: Each section should work independently
3. **Explicit Context**: Never rely on implicit knowledge or visual cues
4. **Hierarchical**: Clear structure with semantic headings
5. **Discoverable**: Use consistent terminology for semantic search
6. **Archived**: Rotate old changelog entries to maintain readability

## Documentation Philosophy (From kapa.ai Best Practices)

### How AI Systems Process Documentation

AI agents use **Retrieval-Augmented Generation (RAG)** which works in three steps:

1. **Chunking**: Documents are divided into smaller, focused sections
2. **Retrieval**: Semantic search finds relevant chunks matching the query
3. **Generation**: LLM uses retrieved chunks to construct answers

**Critical implications:**
- ✅ Sections must be **self-contained** (can't assume linear reading)
- ✅ Context must be **explicit** (AI can't infer unstated information)
- ✅ Related info must be **proximate** (chunking may separate distant content)
- ✅ Terminology must be **consistent** (enables semantic discoverability)

## AI-Friendly Writing Patterns

### 1. Self-Contained Sections

**❌ Context-Dependent (Bad):**
```markdown
## Updating Webhook URLs

Now change the endpoint to your new URL and save the configuration.
```

**✅ Self-Contained (Good):**
```markdown
## Updating Django Webhook URLs in gnwebsite

To update webhook endpoints in gnwebsite backend:

1. Navigate to Admin Panel → Webhooks
2. Select the webhook to modify
3. Change endpoint URL field to new address
4. Click "Save" to apply changes

**Location**: `/panel-0911/webhooks/`
**Model**: `jewelry_portfolio.models.WebhookConfig`
```

**Why**: AI retrieves sections based on relevance, not document order. Include essential context (what system, where to find, complete steps).

### 2. Explicit Terminology

**❌ Vague References (Bad):**
```markdown
## Configure Timeouts

Configure custom timeout settings through the admin panel.
```

**✅ Explicit Product/Feature Names (Good):**
```markdown
## Configure Django API Timeouts in gnwebsite

Configure custom timeout settings for Django REST Framework endpoints:

- **Frontend API calls**: `axios` timeout in `frontend/src/api/index.ts`
- **Backend Gunicorn**: `timeout = 30` in `gunicorn.conf.py`
- **Nginx proxy**: `proxy_read_timeout 30s` in `nginx.conf`
```

**Why**: Product-specific terms improve semantic search. "Django" and "gnwebsite" create clear signals for retrieval.

### 3. Proximate Context

**❌ Scattered Information (Bad):**
```markdown
Authentication tokens expire after 24 hours by default.

The system provides several configuration options for different environments.

When implementing the login flow, ensure you handle this appropriately.
```

**✅ Context Proximity (Good):**
```markdown
Authentication tokens expire after 24 hours by default. When implementing the 
login flow in gnwebsite, handle token expiration by:

1. Refreshing tokens before 24-hour limit (recommended: 23 hours)
2. Implementing error handling for expired token responses (401 errors)
3. Redirecting to login on token expiration

**Configuration**: `SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']` in `settings.py`
```

**Why**: Keeping constraints near implementation guidance ensures they stay together during chunking.

### 4. Text Equivalents for Visuals

**❌ Visual-Dependent (Bad):**
```markdown
See the diagram below for the complete API workflow:

![Complex flowchart](workflow.png)

Follow these steps to implement the integration.
```

**✅ Text-Based Alternative (Good):**
```markdown
## gnwebsite OpenAPI Client Generation Workflow

The backend → frontend API sync follows this workflow:

1. **Update Backend**: Modify Django models/serializers/views
2. **Run Tests**: `docker-compose exec backend pytest jewelry_portfolio/ -x`
3. **Generate Schema**: `python manage.py spectacular --file openapi_schema.json`
4. **Generate Client**: `npx @openapitools/openapi-generator-cli generate ...`
5. **Type Check**: `cd frontend && npm run type-check`
6. **Update Services**: Modify service wrappers to use new types
7. **Test Frontend**: `npm run test:run`
8. **Commit Both**: `git add backend/openapi_schema.json frontend/src/api/generated/`

![API workflow diagram](workflow.png)
_Visual representation of the workflow steps above_
```

**Why**: AI can't parse images. Text-based workflows are fully discoverable.

### 5. Error Messages with Context

**❌ Generic Troubleshooting (Bad):**
```markdown
## Connection Problems

If the connection fails, check your network settings.
```

**✅ Specific Error Context (Good):**
```markdown
## Django Database Connection Errors in gnwebsite

### Error: "django.db.utils.OperationalError: could not connect to server"

**Cause**: PostgreSQL container not running or wrong credentials

**Solution**:
1. Check container status: `docker-compose ps`
2. Restart services: `docker-compose up -d`
3. Verify `DATABASE_URL` in `backend/.env`
4. Check PostgreSQL logs: `docker-compose logs backend`

### Error: "relation does not exist"

**Cause**: Missing migrations

**Solution**:
1. Run migrations: `docker-compose exec backend python manage.py migrate`
2. Verify migration files exist in `backend/jewelry_portfolio/migrations/`
```

**Why**: Users search by copying exact error messages. Including them improves discoverability.

### 6. Hierarchical Structure

**✅ Good Information Architecture:**
```markdown
# Django Authentication (Product Family)
## HttpOnly Cookie JWT Flow (Specific Feature)
### Setup Instructions (Functional Context)
#### Backend Configuration (Component)
#### Frontend Configuration (Component)
### Troubleshooting (Functional Context)
#### Token Expiration Issues (Specific Problem)
#### CORS Configuration (Specific Problem)
```

**Why**: URL paths, document titles, and headings provide contextual metadata for retrieval.

## Changelog Management

### When to Archive

Archive changelog entries when:
- ✅ File exceeds **1500 lines** (currently at 1879 lines!)
- ✅ Sessions older than **6 months**
- ✅ Historical sessions not referenced in recent work
- ✅ Patterns documented in CODEBASE_ESSENTIALS.md

**Current status**: CODEBASE_CHANGELOG.md has 1879 lines → **Archive needed!**

### ESSENTIALS Compression

**When CODEBASE_ESSENTIALS.md exceeds recommended size:**

| Lines | Status | Action |
|-------|--------|--------|
| < 600 | ✅ Optimal | No action needed |
| 600-800 | ✅ Good | Monitor sections |
| 800-1500 | ⚠️ Warning | Run compress-essentials --analyze |
| > 1500 | 🚨 Critical | Compress urgently |

**Compression workflow:**

```bash
# Check ESSENTIALS size
npx aiknowsys check

# Preview compression opportunities
npx aiknowsys compress-essentials --analyze

# Auto-extract verbose sections to docs/
npx aiknowsys compress-essentials --auto

# Or use interactive mode
npx aiknowsys compress-essentials --interactive
```

**What gets extracted:**
- Verbose code examples (>15 lines) → `docs/patterns/`
- Historical context → `.aiknowsys/learned/`
- Stack-specific details → `docs/backend/` or `docs/frontend/`

**What stays in ESSENTIALS:**
- Core patterns (concise summaries)
- Critical invariants
- Validation matrix
- Links to extracted content

**See:** 
- [docs/essentials-compression-guide.md](../../../docs/essentials-compression-guide.md) - Comprehensive guide
- [.aiknowsys/learned/essentials-compression.md](../../../.aiknowsys/learned/essentials-compression.md) - AI agent workflow

### Archive Structure

```
docs/changelog/
├── 2026-Q1.md          # Jan-Mar 2026
├── 2025-Q4.md          # Oct-Dec 2025
├── 2025-Q3.md          # Jul-Sep 2025
└── archive-index.md    # Summary of all archived periods
```

### Archive Procedure

**Step 1: Create Archive File**

```bash
# Create quarterly archive
mkdir -p docs/changelog
touch docs/changelog/2026-Q1.md
```

**Step 2: Move Old Sessions**

Identify sessions older than 3 months:

```bash
# Example: Moving sessions from Oct-Dec 2025 to archive
# Cut from CODEBASE_CHANGELOG.md, paste to docs/changelog/2025-Q4.md
```

**Archive file template**:
```markdown
# GN Website Changelog - 2025 Q4 (Oct-Dec)

Historical session notes from October-December 2025. For current patterns, see `CODEBASE_ESSENTIALS.md`.

**Archive Period**: October 1 - December 31, 2025
**Total Sessions**: 24
**Major Themes**: Authentication refactor, image optimization, tag system

---

## Session: [Title] (Dec 15, 2025)
[Full session content...]

---

## Session: [Title] (Dec 10, 2025)
[Full session content...]
```

**Step 3: Update Main Changelog Header**

```markdown
# GN Website Changelog

Historical session notes and detailed changes. For current patterns and invariants, see `CODEBASE_ESSENTIALS.md`.

**Recent Sessions**: Last 3 months (current file)
**Older Sessions**: See [docs/changelog/](docs/changelog/) for quarterly archives

---

[Keep only recent sessions here]
```

**Step 4: Create Archive Index**

```markdown
# Changelog Archive Index

Historical changelog organized by quarter. For current sessions, see main `CODEBASE_CHANGELOG.md`.

## 2026

### [Q1 (Jan-Mar)](2026-Q1.md)
- Dependency updates skill creation
- WYSIWYG image tracking
- Tag masonry performance optimization
- **Sessions**: 12

## 2025

### [Q4 (Oct-Dec)](2025-Q4.md)
- Privacy policy feature
- Pagination UI implementation
- Authentication refactor
- **Sessions**: 24

### [Q3 (Jul-Sep)](2025-Q3.md)
- Initial project setup
- Django + Vue architecture
- **Sessions**: 18
```

### Archiving Best Practices

**What to Archive:**
- ✅ Sessions older than 3-6 months
- ✅ Completed features fully documented elsewhere
- ✅ Historical debugging sessions
- ✅ Temporary workarounds that were replaced

**What NOT to Archive:**
- ❌ Sessions documenting current patterns
- ❌ Recent architectural decisions
- ❌ Frequently referenced sessions
- ❌ Last 3 months of work

**Archive Naming:**
- `YYYY-QN.md` for quarterly archives (e.g., `2026-Q1.md`)
- `YYYY-MM.md` for monthly archives if needed (high activity periods)
- `archive-index.md` for searchable summary

## Documentation Update Workflow

### After Implementing Features

1. **Update CODEBASE_ESSENTIALS.md** if patterns changed:
   ```markdown
   ## Critical Patterns & Invariants
   - **New Pattern**: Description with examples
   - Link to reference implementation
   ```

2. **Add Changelog Entry** (MANDATORY for significant changes):
   ```markdown
   ## Session: [Brief Title] (MMM D, YYYY)
   
   **Goal**: One sentence description
   
   **Changes**:
   - [file/path.ts](file/path.ts#L123): What changed and why
   
   **Validation**:
   - ✅ Backend tests: X passed
   - ✅ Frontend tests: X passed
   
   **Key Learning**: Pattern or gotcha for future reference
   ```

3. **Create Detailed Docs** for complex features:
   ```bash
   docs/
   ├── components/COMPONENT_NAME.md
   ├── patterns/PATTERN_NAME.md
   ├── guides/GUIDE_NAME.md
   └── incidents/INCIDENT_NAME.md
   ```

### Documentation File Structure

```
docs/
├── README.md                    # Documentation index
├── architecture/                # System design docs
│   ├── OVERVIEW.md
│   └── DATA_FLOW.md
├── components/                  # Component-specific docs
│   ├── TURBULENT_DISSOLVE_IMAGE.md
│   └── PAGINATION_CONTROLS.md
├── deployment/                  # Deployment guides
│   ├── RAILWAY.md
│   └── PRODUCTION.md
├── guides/                      # How-to guides
│   ├── DEVELOPER_CHECKLIST.md
│   ├── TESTING_STRATEGY.md
│   └── AI_AGENT_PERCEPTION.md
├── incidents/                   # Problem + solution docs
│   └── RAILWAY_DYNAMIC_IMPORT_FAILURE.md
├── patterns/                    # Reusable patterns
│   ├── TWO_STAGE_UPLOAD_TESTING.md
│   └── UNIFIED_IMAGE_ARRAY_REFACTOR.md
├── planning/                    # Planning documents
│   └── FEATURE_ROADMAP.md
├── privacy/                     # Legal/compliance docs
│   └── privacy_and_cookie_policy.md
├── reference/                   # API references
│   └── MAILERLITE_INTEGRATION.md
├── reviews/                     # Code review guidelines
│   └── PULL_REQUEST_TEMPLATE.md
└── changelog/                   # Archived changelogs
    ├── archive-index.md
    ├── 2026-Q1.md
    └── 2025-Q4.md
```

## Documentation Quality Checklist

Before finalizing any documentation:

### Structure
- [ ] Uses semantic headings (H1 → H2 → H3, no skips)
- [ ] Each section is self-contained
- [ ] Related information is proximate (same section/paragraph)
- [ ] Hierarchical structure reflects logical relationships

### Content
- [ ] Includes explicit product/feature names (gnwebsite, Django, Vue)
- [ ] No reliance on visual layout or positioning
- [ ] Error messages quoted exactly with solutions
- [ ] Prerequisites stated explicitly (no assumptions)
- [ ] Text alternatives for any diagrams/images

### Discoverability
- [ ] Consistent terminology throughout
- [ ] Keywords appear in headings and first paragraph
- [ ] Cross-links to related documentation
- [ ] Examples include actual code/commands

### AI Optimization
- [ ] Sections work when read in isolation
- [ ] No references like "as mentioned above" without repeating context
- [ ] Code examples include language identifiers (```python, ```typescript)
- [ ] File paths use absolute paths from project root

## Common Documentation Anti-Patterns

### ❌ Contextual Dependencies

**Bad**: "Now update the configuration we set up earlier."

**Good**: "Update the Django settings in `backend/gnwebsite_config/settings.py`..."

### ❌ Implicit Knowledge

**Bad**: "Run the standard Django commands."

**Good**: 
```bash
# Apply database migrations
docker-compose exec backend python manage.py migrate

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput
```

### ❌ Visual-Only Information

**Bad**: Tables with merged cells and complex layouts

**Good**: Structured lists with repeated context:
```markdown
### Django Environment Variables

**DATABASE_URL**
- Purpose: PostgreSQL connection string
- Format: `postgresql://user:pass@host:5432/dbname`
- Required: ✅ Production, ❌ Development (uses SQLite)

**SECRET_KEY**
- Purpose: Django cryptographic signing
- Format: 50+ character random string
- Required: ✅ Always
```

### ❌ Scattered Prerequisites

**Bad**: Prerequisites in introduction, setup in middle, troubleshooting at end

**Good**: Self-contained sections with inline prerequisites:
```markdown
## Setting Up Django Webhooks in gnwebsite

**Prerequisites** (check before proceeding):
- ✅ Django admin access (`/panel-0911/`)
- ✅ Valid HTTPS endpoint with SSL certificate
- ✅ gnwebsite API credentials

**Steps**:
1. Navigate to Admin Panel → Settings → Webhooks
2. ...
```

## Template: Changelog Session Entry

```markdown
## Session: [Brief Descriptive Title] (MMM D, YYYY)

**Goal**: One-sentence description of what this session accomplished

**Problem** (if fixing a bug/issue):
Brief description of the problem that required fixing

**Changes**:

- [backend/path/to/file.py](backend/path/to/file.py#L123-L145): **CREATED/UPDATED/FIXED**
  - What changed at this location
  - Why it was necessary
  - Key implementation details

- [frontend/src/path/to/component.vue](frontend/src/path/to/component.vue):
  - What changed
  - Pattern used (link to CODEBASE_ESSENTIALS.md if relevant)

**Validation**:
- ✅ Backend tests: X passed, Y skipped
- ✅ Frontend tests: X passed
- ✅ TypeScript: No errors
- ✅ Manual testing: Description of what was tested

**Key Learning**: 
Pattern, gotcha, or insight that should be remembered for future work. This often becomes a candidate for CODEBASE_ESSENTIALS.md.

**References** (optional):
- Link to related OpenSpec proposals
- Link to detailed documentation in docs/
- Link to related incidents or patterns
```

## Template: Feature Documentation

```markdown
# [Feature Name]

Brief overview of what this feature does and why it exists.

## Overview

- **Purpose**: What problem does this solve?
- **Users**: Who uses this feature?
- **Location**: Where in the app is this feature?

## Architecture

### Backend (Django)

**Models**: `jewelry_portfolio.models.FeatureName`
- Fields and relationships
- Key methods and their purpose

**API Endpoints**: `/api/feature/`
- GET: Retrieve feature data
- POST: Create new feature
- PUT/PATCH: Update feature
- DELETE: Remove feature

**Permissions**: `IsAdminOrReadOnly`

### Frontend (Vue 3)

**Views**:
- `FeatureView.vue` - Public view at `/feature`
- `FeatureForm.vue` - Admin editor at `/panel-0911/feature`

**Services**: `featureService.ts`
- API wrapper methods
- Type definitions

**Components**:
- `FeatureCard.vue` - Display component
- `FeatureEditor.vue` - Editing component

## Usage Examples

### Retrieving Feature Data

```typescript
import { featureService } from '@/services/featureService'

const data = await featureService.get()
console.log(data.value)
```

### Admin Updates

```typescript
const updated = await featureService.update({
  field: 'new value',
  anotherField: 123
})
```

## Testing

### Backend Tests

Location: `backend/jewelry_portfolio/test_feature.py`

```bash
# Run feature tests
docker-compose exec backend pytest jewelry_portfolio/test_feature.py -v
```

Coverage:
- Model CRUD operations
- API permissions (public/admin)
- Serialization/validation
- Edge cases

### Frontend Tests

Location: `frontend/tests/feature.test.ts`

```bash
# Run feature tests
cd frontend && npm run test:run tests/feature.test.ts
```

Coverage:
- Component rendering
- API integration
- Error handling
- User interactions

## Common Patterns

### Pattern 1: [Name]

**When to use**: Description

**Example**:
```python
# Backend example
```

```typescript
// Frontend example
```

## Troubleshooting

### Error: "[Exact Error Message]"

**Cause**: What causes this error

**Solution**:
1. Step-by-step fix
2. With commands
3. And verification

## Related Documentation

- [CODEBASE_ESSENTIALS.md](../../CODEBASE_ESSENTIALS.md#relevant-section)
- [docs/patterns/RELATED_PATTERN.md](../patterns/RELATED_PATTERN.md)
- [OpenSpec: Feature Proposal](../../openspec/changes/feature-name/)
```

## Changelog Archiving Checklist

When archiving old changelog entries:

- [ ] Identify sessions older than 3-6 months
- [ ] Create quarterly archive file: `docs/changelog/YYYY-QN.md`
- [ ] Copy archive header template with period, session count, themes
- [ ] Move old sessions from CODEBASE_CHANGELOG.md to archive
- [ ] Update main changelog header with archive reference
- [ ] Create/update `docs/changelog/archive-index.md` with summary
- [ ] Verify links to archived sessions still work
- [ ] Test that recent sessions remain easily accessible
- [ ] Commit with message: `docs: archive changelog Q[N] YYYY (X sessions)`

## Integration with Other Skills

- **After features**: Use [feature-implementation](../feature-implementation/SKILL.md) → then update docs
- **Before archiving**: Check [developer-checklist](../developer-checklist/SKILL.md) for recent patterns
- **Creating skills**: Use [skill-creator](../skill-creator/SKILL.md) to convert docs into skills

## Related Files

- [CODEBASE_ESSENTIALS.md](../../../CODEBASE_ESSENTIALS.md) - Current patterns and invariants
- [CODEBASE_CHANGELOG.md](../../../CODEBASE_CHANGELOG.md) - Recent session history
- [docs/README.md](../../../docs/README.md) - Documentation index
- [AGENTS.md](../../../AGENTS.md) - AI agent workflow instructions

## Quick Reference

### Archive Changelog (When > 1500 lines)

```bash
# 1. Create archive directory
mkdir -p docs/changelog

# 2. Create quarterly archive
cat > docs/changelog/2026-Q1.md << 'EOF'
# GN Website Changelog - 2026 Q1 (Jan-Mar)

**Archive Period**: January 1 - March 31, 2026
**Total Sessions**: 12
**Major Themes**: Dependency management, image tracking, performance

---

[Move old sessions here]
EOF

# 3. Update main changelog header
# Remove old sessions (keep last 3 months)

# 4. Create/update index
cat > docs/changelog/archive-index.md << 'EOF'
# Changelog Archive Index

## 2026
### [Q1 (Jan-Mar)](2026-Q1.md) - 12 sessions
EOF

# 5. Commit
git add docs/changelog/ CODEBASE_CHANGELOG.md
git commit -m "docs: archive changelog Q1 2026 (12 sessions)"
```

### Create Feature Documentation

```bash
# Create component doc
cat > docs/components/COMPONENT_NAME.md << 'EOF'
# Component Name

Brief overview...

## Architecture
...
EOF

# Create pattern doc
cat > docs/patterns/PATTERN_NAME.md << 'EOF'
# Pattern Name

When to use this pattern...
EOF
```

### Update CODEBASE_ESSENTIALS.md

```markdown
## Critical Patterns & Invariants
- **New Pattern Name**: Description
  - ✅ **DO:** Good practice
  - ❌ **DON'T:** Anti-pattern
  - **Reference**: [ComponentName.vue](path/to/file.vue)
```
