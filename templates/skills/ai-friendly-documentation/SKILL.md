---
name: ai-friendly-documentation
description: Write AI-optimized documentation for RAG systems. Use when creating docs, organizing changelogs, or improving AI discoverability. Covers self-contained sections, explicit terminology, changelog archiving, and semantic structure. Framework-agnostic - works for web apps, CLI tools, libraries, or any project type.
---

# AI-Friendly Documentation

Write documentation that works effectively with AI retrieval systems while remaining useful for humans.

## When to Use This Skill

Use when:
- User asks to "update documentation" or "organize the changelog"
- Changelog exceeds 1500 lines or 6 months of sessions
- Documentation becomes hard to navigate or retrieve information from
- After major architectural changes or refactors
- Creating technical documentation for AI consumption
- User mentions: "Make docs more readable", "improve AI discoverability"

## Core Principles

1. **AI-Optimized**: Write for both humans and AI retrieval systems
2. **Self-Contained**: Each section should work independently
3. **Explicit Context**: Never rely on implicit knowledge or visual cues
4. **Hierarchical**: Clear structure with semantic headings
5. **Discoverable**: Use consistent terminology for semantic search
6. **Archived**: Rotate old changelog entries to maintain readability

## How AI Systems Process Documentation

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
## Updating Configuration

Now change the endpoint to your new URL and save the configuration.
```

**✅ Self-Contained (Good):**
```markdown
## Updating API Endpoint Configuration

To update API endpoints in the project:

1. Open configuration file: `config/api.json`
2. Locate the `endpoints` section
3. Update the `baseUrl` field to your new URL
4. Save the file
5. Restart the application: `npm start` or `python main.py`

**Example:**
\`\`\`json
{
  "endpoints": {
    "baseUrl": "https://api.example.com/v2"
  }
}
\`\`\`
```

**Why**: AI retrieves sections based on relevance, not document order. Include essential context (what file, where to find, complete steps).

### 2. Explicit Terminology

**❌ Vague References (Bad):**
```markdown
## Configure Timeouts

Configure custom timeout settings through the admin panel.
```

**✅ Explicit Product/Feature Names (Good):**
```markdown
## Configure HTTP Timeout Settings

Configure custom timeout settings for HTTP requests:

**JavaScript/TypeScript (axios):**
- Location: `src/config/http.ts`
- Setting: `timeout` property in milliseconds
- Example: `{ timeout: 5000 }` (5 seconds)

**Python (requests):**
- Location: `config.py`
- Setting: `REQUEST_TIMEOUT` constant
- Example: `REQUEST_TIMEOUT = 5` (5 seconds)

**Rust (reqwest):**
- Location: `src/config.rs`
- Setting: `Duration::from_secs()`
- Example: `.timeout(Duration::from_secs(5))`
```

**Why**: Product-specific terms and language names improve semantic search.

### 3. Proximate Context

**❌ Scattered Information (Bad):**
```markdown
Authentication tokens expire after 24 hours by default.

The system provides several configuration options for different environments.

When implementing the login flow, ensure you handle this appropriately.
```

**✅ Context Proximity (Good):**
```markdown
## Authentication Token Expiration

Authentication tokens expire after 24 hours by default. When implementing 
the login flow, handle token expiration by:

1. Refreshing tokens before 24-hour limit (recommended: 23 hours)
2. Implementing error handling for expired token responses (401 errors)
3. Redirecting to login on token expiration

**Configuration:**
- JavaScript: `TOKEN_LIFETIME` in `config.js`
- Python: `TOKEN_EXPIRY` in `settings.py`
- Rust: `TOKEN_DURATION` in `config.rs`
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
## API Integration Workflow

The client-server integration follows this workflow:

1. **Initialize Client**: Configure API credentials and base URL
2. **Authenticate**: Exchange credentials for access token
3. **Make Request**: Send HTTP request with token in header
4. **Handle Response**: Parse JSON response and extract data
5. **Error Handling**: Catch network errors and retry if needed
6. **Token Refresh**: Renew token when approaching expiration

![API workflow diagram](workflow.png)
_Visual representation of the workflow steps above_

**Implementation Example (Python):**
\`\`\`python
client = APIClient(base_url="https://api.example.com")
client.authenticate(username, password)
data = client.fetch_data(endpoint="/users")
\`\`\`
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
## Database Connection Errors

### Error: "Connection refused" or "ECONNREFUSED"

**Cause**: Database server not running or incorrect host/port

**Solution:**

**PostgreSQL:**
\`\`\`bash
# Check if PostgreSQL is running
sudo systemctl status postgresql
# Start if needed
sudo systemctl start postgresql
# Verify connection settings in .env or config file
\`\`\`

**MongoDB:**
\`\`\`bash
# Check if MongoDB is running
sudo systemctl status mongod
# Start if needed
sudo systemctl start mongod
\`\`\`

**Docker:**
\`\`\`bash
# Check container status
docker ps
# Restart database container
docker-compose up -d database
\`\`\`

### Error: "Authentication failed" or "Access denied"

**Cause**: Wrong credentials in configuration

**Solution:**
1. Verify username/password in `.env` file
2. Check database user exists: `SELECT * FROM pg_user;` (PostgreSQL)
3. Reset password if needed
4. Ensure connection string format is correct
```

**Why**: Users search by copying exact error messages. Including them improves discoverability.

### 6. Hierarchical Structure

**✅ Good Information Architecture:**
```markdown
# Authentication System (Product Family)
## JWT Token Flow (Specific Feature)
### Setup Instructions (Functional Context)
#### Backend Configuration (Component)
#### Frontend Configuration (Component)
### Troubleshooting (Functional Context)
#### Token Expiration Issues (Specific Problem)
#### CORS Configuration (Specific Problem)
```

**Why**: Headings provide contextual metadata for retrieval and create clear navigation.

## Changelog Management

### When to Archive

Archive changelog entries when:
- ✅ File exceeds **1500 lines**
- ✅ Sessions older than **6 months**
- ✅ Historical sessions not referenced in recent work
- ✅ Patterns documented in main documentation

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
mkdir -p docs/changelog
touch docs/changelog/2026-Q1.md
```

**Step 2: Move Old Sessions**

Archive file template:
```markdown
# Project Changelog - 2026 Q1 (Jan-Mar)

Historical session notes from January-March 2026. For current patterns, see main documentation.

**Archive Period**: January 1 - March 31, 2026
**Total Sessions**: 15
**Major Themes**: Authentication refactor, performance optimization, dependency updates

---

## Session: Feature Implementation (Feb 15, 2026)
[Full session content...]

---

## Session: Bug Fix (Feb 10, 2026)
[Full session content...]
```

**Step 3: Update Main Changelog Header**

```markdown
# Project Changelog

Historical session notes and detailed changes. For current patterns, see main documentation.

**Recent Sessions**: Last 3 months (current file)
**Older Sessions**: See [docs/changelog/](docs/changelog/) for quarterly archives

---

[Keep only recent 3 months here]
```

**Step 4: Create Archive Index**

```markdown
# Changelog Archive Index

Historical changelog organized by quarter. For current sessions, see main `CHANGELOG.md`.

## 2026

### [Q1 (Jan-Mar)](2026-Q1.md)
- Feature implementations
- Performance optimizations
- **Sessions**: 15

## 2025

### [Q4 (Oct-Dec)](2025-Q4.md)
- Initial project setup
- Core feature development
- **Sessions**: 22
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

## Documentation Quality Checklist

Before finalizing any documentation:

### Structure
- [ ] Uses semantic headings (H1 → H2 → H3, no skips)
- [ ] Each section is self-contained
- [ ] Related information is proximate (same section/paragraph)
- [ ] Hierarchical structure reflects logical relationships

### Content
- [ ] Includes explicit product/feature names
- [ ] No reliance on visual layout or positioning
- [ ] Error messages quoted exactly with solutions
- [ ] Prerequisites stated explicitly (no assumptions)
- [ ] Text alternatives for any diagrams/images

### Discoverability
- [ ] Consistent terminology throughout
- [ ] Keywords appear in headings and first paragraph
- [ ] Cross-links to related documentation
- [ ] Examples include actual code/commands with language identifiers

### AI Optimization
- [ ] Sections work when read in isolation
- [ ] No references like "as mentioned above" without repeating context
- [ ] Code examples include language identifiers (```python, ```typescript, ```rust)
- [ ] File paths use clear project-relative paths

## Common Documentation Anti-Patterns

### ❌ Contextual Dependencies

**Bad**: "Now update the configuration we set up earlier."

**Good**: "Update the configuration in `config/settings.json`..."

### ❌ Implicit Knowledge

**Bad**: "Run the standard build commands."

**Good**: 
```bash
# JavaScript/TypeScript
npm run build

# Python
python setup.py build

# Rust
cargo build --release

# Go
go build -o myapp ./cmd/myapp
```

### ❌ Visual-Only Information

**Bad**: Tables with merged cells and complex layouts

**Good**: Structured lists with repeated context:
```markdown
### Environment Variables

**DATABASE_URL**
- Purpose: Database connection string
- Format: `protocol://user:pass@host:port/dbname`
- Required: ✅ Always
- Example: `postgresql://admin:secret@localhost:5432/mydb`

**API_KEY**
- Purpose: External API authentication
- Format: Alphanumeric string, 32 characters
- Required: ✅ Production, ❌ Development
- Example: `abc123def456ghi789jkl012mno345pq`
```

### ❌ Scattered Prerequisites

**Bad**: Prerequisites in introduction, setup in middle, troubleshooting at end

**Good**: Self-contained sections with inline prerequisites:
```markdown
## Setting Up Authentication

**Prerequisites** (check before proceeding):
- ✅ Database running and accessible
- ✅ Environment variables configured
- ✅ TLS/SSL certificates installed (production only)

**Steps**:
1. Install authentication library: `npm install jsonwebtoken`
2. Configure secret key in `.env`: `JWT_SECRET=your-secret-key`
3. ...
```

## Template: Changelog Session Entry

```markdown
## Session: [Brief Descriptive Title] (MMM D, YYYY)

**Goal**: One-sentence description of what this session accomplished

**Problem** (if fixing a bug/issue):
Brief description of the problem that required fixing

**Changes**:

- [path/to/file.ext](path/to/file.ext#L123-L145): **CREATED/UPDATED/FIXED**
  - What changed at this location
  - Why it was necessary
  - Key implementation details

- [another/path/file.ext](another/path/file.ext):
  - What changed
  - Pattern used (link to docs if relevant)

**Validation**:
- ✅ Tests: X passed, Y skipped
- ✅ Linting: No errors
- ✅ Manual testing: Description of what was tested

**Key Learning**: 
Pattern, gotcha, or insight that should be remembered for future work.

**References** (optional):
- Link to related documentation
- Link to related issues or patterns
```

## Template: Feature Documentation

```markdown
# [Feature Name]

Brief overview of what this feature does and why it exists.

## Overview

- **Purpose**: What problem does this solve?
- **Users**: Who uses this feature?
- **Location**: Where is this feature in the codebase?

## Architecture

### Core Components

**Main Module**: `src/feature/main.ext`
- Purpose and responsibilities
- Key functions/classes and their purpose

**Configuration**: `config/feature.json`
- Available settings
- Default values
- Environment-specific overrides

## Usage Examples

### Basic Usage

\`\`\`python
# Python example
from feature import FeatureClass

feature = FeatureClass(config)
result = feature.execute()
\`\`\`

\`\`\`javascript
// JavaScript example
import { FeatureClass } from './feature'

const feature = new FeatureClass(config)
const result = await feature.execute()
\`\`\`

\`\`\`rust
// Rust example
use crate::feature::FeatureClass;

let feature = FeatureClass::new(config);
let result = feature.execute()?;
\`\`\`

### Advanced Usage

[More complex examples with explanation]

## Testing

### Running Tests

\`\`\`bash
# JavaScript/TypeScript
npm test feature.test.js

# Python
pytest tests/test_feature.py -v

# Rust
cargo test feature

# Go
go test ./feature/...
\`\`\`

### Test Coverage
- Core functionality
- Edge cases
- Error handling
- Performance scenarios

## Troubleshooting

### Error: "[Exact Error Message]"

**Cause**: What causes this error

**Solution**:
1. Step-by-step fix
2. With commands
3. And verification

## Related Documentation

- [Main Documentation](../README.md)
- [Related Feature](../related-feature/README.md)
```

## Quick Reference: Archive Changelog

```bash
# 1. Create archive directory
mkdir -p docs/changelog

# 2. Create quarterly archive
cat > docs/changelog/2026-Q1.md << 'EOF'
# Project Changelog - 2026 Q1 (Jan-Mar)

**Archive Period**: January 1 - March 31, 2026
**Total Sessions**: 12

---

[Move old sessions here]
EOF

# 3. Update main changelog header
# Remove old sessions (keep last 3 months)

# 4. Create/update archive index
cat > docs/changelog/archive-index.md << 'EOF'
# Changelog Archive Index

## 2026
### [Q1 (Jan-Mar)](2026-Q1.md) - 12 sessions
EOF

# 5. Commit
git add docs/changelog/ CHANGELOG.md
git commit -m "docs: archive changelog Q1 2026 (12 sessions)"
```

## Related Skills

- [feature-implementation](../feature-implementation/SKILL.md) - Document after implementing
- [skill-creator](../skill-creator/SKILL.md) - Convert docs to skills
- [tdd-workflow](../tdd-workflow/SKILL.md) - Test documentation examples

---

*This skill is framework-agnostic. Patterns apply to Python, JavaScript, TypeScript, Rust, Go, Java, or any language/framework. Based on kapa.ai RAG best practices.*
