# Documentation

This folder contains all project documentation organized by category.

**🎯 For AI Agents:** Start with [CODEBASE_ESSENTIALS.md](../CODEBASE_ESSENTIALS.md) and [AGENTS.md](../AGENTS.md) at every session. Use [Agent Skills](../.github/skills/) for step-by-step workflows.

---

## 📚 Core Documentation

### 🆚 [AIKnowSys vs GitHub Copilot Memory](copilot-memory-comparison.md)
**Why AIKnowSys?** Understand the advantages of explicit, permanent, platform-agnostic knowledge management

- 🔒 **100% Local** - Privacy-first, never leaves your machine
- ♾️ **Permanent** - Knowledge lasts forever (not 28-day expiration)
- 🌍 **Any AI Tool** - Works with Claude, ChatGPT, Cursor, etc.
- 📖 **Human-Readable** - Markdown files you control
- 🤝 **Team Shareable** - Commit to git, everyone benefits

**[Read full comparison →](copilot-memory-comparison.md)**

---

## 📚 Directory Structure

### ⚡ [Agent Skills](../.github/skills/) - Step-by-Step Workflows
**Preferred for AI consumption** - Self-contained, auto-loaded workflows following VS Code standard

- **[feature-implementation](../.github/skills/feature-implementation/SKILL.md)** - Backend → frontend → OpenAPI workflow
- **[code-refactoring](../.github/skills/code-refactoring/SKILL.md)** - Safe refactoring with tests
- **[developer-checklist](../.github/skills/developer-checklist/SKILL.md)** - Pre-commit validation
- **[dependency-updates](../.github/skills/dependency-updates/SKILL.md)** - Safe dependency updates
- **[documentation-management](../.github/skills/documentation-management/SKILL.md)** - AI-optimized docs, changelog archiving
- **[skill-creator](../.github/skills/skill-creator/SKILL.md)** - Create new skills from guides

### 🚀 [Advanced Workflows](advanced-workflows.md)
**Powerful patterns for complex scenarios**

- **[OpenSpec + Plan Management Integration](advanced-workflows.md#openspec--plan-management-integration)** - Combine proposal-driven design with fine-grained task tracking for large features

### 🎓 [guides/](guides/) - How-To Guides & References
Human-readable guides and detailed documentation

- **[TESTING_STRATEGY.md](guides/TESTING_STRATEGY.md)** - Comprehensive testing philosophy and practices
- **[ADMIN_USER_GUIDE.md](guides/ADMIN_USER_GUIDE.md)** - Admin interface and content management guide
- **[DEVELOPER_GUIDE_FILE_UPLOADS.md](guides/DEVELOPER_GUIDE_FILE_UPLOADS.md)** - Two-stage file upload pattern
- **[API_TYPE_SAFETY.md](guides/API_TYPE_SAFETY.md)** - OpenAPI type safety best practices
- **[API_INTEGRATION_TEST_PLAN.md](guides/API_INTEGRATION_TEST_PLAN.md)** - Comprehensive testing guide
- **[UNIFIED_IMAGE_ARRAY_REFACTOR.md](guides/UNIFIED_IMAGE_ARRAY_REFACTOR.md)** - Image array pattern
- **[TWO_STAGE_UPLOAD_TESTING.md](guides/TWO_STAGE_UPLOAD_TESTING.md)** - Upload testing guide
- **[MAILERLITE_INTEGRATION.md](guides/MAILERLITE_INTEGRATION.md)** - Mailerlite API integration
- **[COOKIECONSENT_PREFERENCES.md](guides/COOKIECONSENT_PREFERENCES.md)** - Cookie consent implementation

### 🏗️ [architecture/](architecture/) - System Design
High-level architecture and API design
- **[OPENAPI_INTEGRATION.md](architecture/OPENAPI_INTEGRATION.md)** - OpenAPI client generation and usage
- **[API_TESTING.md](architecture/API_TESTING.md)** - API testing strategies
- **[IMPROVEMENT_ROADMAP.md](architecture/IMPROVEMENT_ROADMAP.md)** - Future improvements and technical debt

### 🚀 [deployment/](deployment/) - Operations & Deployment
Production deployment and infrastructure
- **[DEPLOYMENT.md](deployment/DEPLOYMENT.md)** - Complete deployment guide (Railway/production)
- **[RAILWAY_START_HERE.md](deployment/RAILWAY_START_HERE.md)** - Railway platform quick start
- **[MONITORING.md](deployment/MONITORING.md)** - Monitoring and logging setup
- **[HEALTH_CHECKS.md](deployment/HEALTH_CHECKS.md)** - Health endpoints and test scripts

### 🔐 [security/](security/) - Security & Authentication
Security hardening, audits, and authentication
- **[SECURITY.md](security/SECURITY.md)** - Security best practices and pre-deployment checklist
- **[TWO_FACTOR_AUTH.md](security/TWO_FACTOR_AUTH.md)** - 2FA implementation and setup guide
- **[SECURITY_HARDENING_2026-01-04.md](security/SECURITY_HARDENING_2026-01-04.md)** - Latest security hardening (encrypted fields, pinned images)
- **[SECURITY_AUDIT_2025-12-26.md](security/SECURITY_AUDIT_2025-12-26.md)** - Comprehensive security audit
- **[CONFIGURATION.md](security/CONFIGURATION.md)** - Security configuration guide
- **[VALIDATION_REPORT.md](security/VALIDATION_REPORT.md)** - Security testing validation
- **[CSP_HARDENING.md](security/CSP_HARDENING.md)** - Content Security Policy roadmap

### 📖 [reference/](reference/) - Reference Documentation
Current system configuration and integration details
- **[MAILERLITE_INTEGRATION.md](reference/MAILERLITE_INTEGRATION.md)** - Mailerlite API integration and webhook handling
- **[EMAIL_CONFIGURATION_PRODUCTION.md](reference/EMAIL_CONFIGURATION_PRODUCTION.md)** - Production email setup (Resend)
- **[SESSION_CONFIGURATION.md](reference/SESSION_CONFIGURATION.md)** - Session and cookie configuration
- **[API_RATE_LIMITS.md](reference/API_RATE_LIMITS.md)** - API endpoint rate limiting rules
- **[TESTING_AND_REFACTORING.md](reference/TESTING_AND_REFACTORING.md)** - Testing and refactoring strategies

### 🎨 [patterns/](patterns/) - Reusable Patterns
Design patterns and frontend conventions
- **[SEO_ACCESSIBILITY_PATTERN.md](patterns/SEO_ACCESSIBILITY_PATTERN.md)** - Hidden text for SEO and screen readers
- **[HOVER_ANIMATION_PATTERN.md](patterns/HOVER_ANIMATION_PATTERN.md)** - Ken Burns and shimmer effects

### 🧩 [components/](components/) - Component Documentation
Reusable component usage guides
- **[FORM_FIELD_HINT.md](components/FORM_FIELD_HINT.md)** - Form hints component (inline, help, warning, success)

### 🚨 [incidents/](incidents/) - Post-Mortems
Incident reports and lessons learned
- **[2025_12_23_category_filters.md](incidents/2025_12_23_category_filters.md)** - Category filter testing incident

### 📝 [reviews/](reviews/) - Code Reviews & Audits
Comprehensive codebase reviews and improvement plans
- **[codebase_review_2026-01-02.md](reviews/codebase_review_2026-01-02.md)** - Comprehensive review and prioritized roadmap

### 📦 [.archive/](.archive/) - Historical Documentation
Completed work, old changelogs, obsolete documentation, and guides superseded by Agent Skills

- **changelogs/** - Old changelog files (now superseded by [CODEBASE_CHANGELOG.md](../CODEBASE_CHANGELOG.md))
- **implementations/** - Completed feature implementation summaries
- **fixes/** - Completed bug fix documentation
- **enhancements/** - Completed enhancement summaries
- **obsolete/** - Outdated documentation superseded by current system
- **guides-superseded-by-skills/** - Verbose guides now covered by Agent Skills (see [README](.archive/guides-superseded-by-skills/README.md) for skills mapping)

### 📑 [changelog/](changelog/) - Session Archives
Historical session logs from [CODEBASE_CHANGELOG.md](../CODEBASE_CHANGELOG.md) (archived when main file exceeds 1500 lines)

- **[2024-Q4.md](changelog/2024-Q4.md)** - Dec 2024 sessions
- **[archive-index.md](changelog/archive-index.md)** - Complete index of all archived sessions

---

## 🚀 Quick Start

### For AI Agents?
**Start every session with:**
1. **[CODEBASE_ESSENTIALS.md](../CODEBASE_ESSENTIALS.md)** - Architecture, patterns, critical invariants
2. **[AGENTS.md](../AGENTS.md)** - Workflow, validation, documentation rules
3. **[Agent Skills](../.github/skills/)** - Auto-loaded step-by-step workflows

**Read the relevant skill BEFORE coding:**
- Implementing features → [feature-implementation](../.github/skills/feature-implementation/SKILL.md)
- Refactoring code → [code-refactoring](../.github/skills/code-refactoring/SKILL.md)
- Pre-commit checks → [developer-checklist](../.github/skills/developer-checklist/SKILL.md)
- Updating deps → [dependency-updates](../.github/skills/dependency-updates/SKILL.md)
- Managing docs → [documentation-management](../.github/skills/documentation-management/SKILL.md)

### New Admin User?
Start here:
1. **[ADMIN_USER_GUIDE.md](guides/ADMIN_USER_GUIDE.md)** - Complete admin interface guide
2. Learn how to manage jewelry articles, blog posts, and site configuration

### New Developer?
Start here:
1. **[CODEBASE_ESSENTIALS.md](../CODEBASE_ESSENTIALS.md)** - Core patterns and architecture
2. **[developer-checklist skill](../.github/skills/developer-checklist/SKILL.md)** - Pre-commit validation
3. **[TESTING_STRATEGY.md](guides/TESTING_STRATEGY.md)** - How we test

### Implementing a Feature?
1. **[feature-implementation skill](../.github/skills/feature-implementation/SKILL.md)** - Step-by-step backend → frontend → OpenAPI workflow
2. **[CODEBASE_ESSENTIALS.md](../CODEBASE_ESSENTIALS.md)** - Check patterns and invariants
3. **[API_TYPE_SAFETY.md](guides/API_TYPE_SAFETY.md)** - Using OpenAPI generated types

### Refactoring Code?
1. **[code-refactoring skill](../.github/skills/code-refactoring/SKILL.md)** - Safe refactoring with test-driven workflow
2. **[TESTING_STRATEGY.md](guides/TESTING_STRATEGY.md)** - Ensure tests exist before refactoring
3. **[developer-checklist skill](../.github/skills/developer-checklist/SKILL.md)** - Validate after refactoring

### Updating Dependencies?
1. **[dependency-updates skill](../.github/skills/dependency-updates/SKILL.md)** - Safe update workflow for backend Python + frontend npm packages

### Deploying to Production?
1. **[DEPLOYMENT.md](deployment/DEPLOYMENT.md)** - Complete deployment guide
2. **[SECURITY.md](security/SECURITY.md)** - Pre-deployment security checklist
3. **[RAILWAY_START_HERE.md](deployment/RAILWAY_START_HERE.md)** - Railway platform guide

### Something Broke?
1. Check **[incidents/](incidents/)** - Learn from past issues
2. Follow **[TESTING_STRATEGY.md](guides/TESTING_STRATEGY.md)** - Prevent regressions

---

## 📋 Key Principles

### 1. Read CODEBASE_ESSENTIALS.md at Session Start
Single-source reference for architecture, patterns, and critical invariants.  
See: [CODEBASE_ESSENTIALS.md](../CODEBASE_ESSENTIALS.md)

### 2. Use Agent Skills for Step-by-Step Workflows
Prefer skills over verbose guides - better for AI consumption.  
See: [.github/skills/](../.github/skills/)

### 3. Write API Tests BEFORE Frontend Uses the API
Prevents frontend breaking due to untested backend changes.  
See: [TESTING_STRATEGY.md](guides/TESTING_STRATEGY.md)

### 4. Always Use OpenAPI Generated Types
Never create custom types for API responses.  
See: [API_TYPE_SAFETY.md](guides/API_TYPE_SAFETY.md)

### 5. Test in Docker to Match Production
Local tests must run in Docker containers with PostgreSQL.  
See: [TESTING_STRATEGY.md](guides/TESTING_STRATEGY.md)

---

## 🗃️ Archive Policy

Completed work is moved to [.archive/](.archive/) to keep the main docs/ folder focused on **current, actionable documentation**.

**What goes in the archive:**
- ✅ Completed changelogs → [docs/changelog/](changelog/) (quarterly archives when main file exceeds 1500 lines)
- ✅ Verbose guides superseded by Agent Skills → [.archive/guides-superseded-by-skills/](.archive/guides-superseded-by-skills/)
- ✅ Completed implementation summaries → [.archive/implementations/](.archive/implementations/)
- ✅ Bug fix documentation (once fixed) → [.archive/fixes/](.archive/fixes/)
- ✅ Obsolete documentation (superseded by newer approaches) → [.archive/obsolete/](.archive/obsolete/)

**What stays active:**
- ❌ Current guides and workflows
- ❌ Active reference documentation (integrations, configurations)
- ❌ Security and deployment docs (always relevant)
- ❌ Incident post-mortems (for learning from past issues)
- ❌ Agent Skills (optimized for AI consumption)

**When to archive:**
- Changelog exceeds ~1500 lines → archive oldest sessions to [docs/changelog/YYYY-QN.md](changelog/)
- Guide superseded by Agent Skill → archive to [.archive/guides-superseded-by-skills/](.archive/guides-superseded-by-skills/)
- Feature fully implemented and documented → archive implementation summary
- Documentation superseded by newer approach → archive to [.archive/obsolete/](.archive/obsolete/)

See: [documentation-management skill](../.github/skills/documentation-management/SKILL.md) for archiving workflows

---

## 💡 Contributing Documentation

When adding new documentation:

1. **Agent Skills** (step-by-step workflows for AI) → `../.github/skills/` (preferred for repeatable tasks)
2. **Guides** (how-to, best practices for humans) → `guides/`
3. **Incidents** (postmortems, lessons learned) → `incidents/`
4. **Deployment** (production, infrastructure) → `deployment/`
5. **Architecture** (design, structure) → `architecture/`
6. **Security** (hardening, audits, auth) → `security/`
7. **Reference** (integrations, configurations) → `reference/`

**When to create a skill vs guide:**
- **Skill** → Repeatable multi-step workflows, AI agent tasks, progressive disclosure
- **Guide** → Human-readable explanations, context-heavy documentation, conceptual learning

**Update these files when adding docs:**
- This README ([docs/README.md](README.md))
- Agent trigger mappings ([AGENTS.md](../AGENTS.md)) if creating a skill
- Skills index ([.github/skills/README.md](../.github/skills/README.md)) if creating a skill

See: [skill-creator](../.github/skills/skill-creator/SKILL.md) for creating new skills

---

## 🔗 Navigation

- [← Back to Root](../) 
- [Main README](../README.md)
