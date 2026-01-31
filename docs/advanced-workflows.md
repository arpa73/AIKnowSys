# Advanced Workflows

Powerful patterns for combining AIKnowSys features to handle complex development scenarios.

---

## OpenSpec + Plan Management Integration

**Combine proposal-driven design with fine-grained task tracking for large features.**

### Overview

AIKnowSys includes two complementary systems that work beautifully together:

| System | Purpose | When to Use |
|--------|---------|-------------|
| **OpenSpec** | Change proposals and team alignment | Breaking changes, API design, architectural decisions |
| **Plan Management** | Multi-step task tracking and progress | Complex features, parallel work streams, long-running initiatives |

### The Problem They Solve Together

**Scenario:** You're building a large feature (e.g., API authentication) that requires:
- Architectural design decisions
- Team/stakeholder approval
- Multiple implementation phases
- Ability to pause and resume work
- Clear audit trail of what was decided and why

**Without this pattern:**
- ❌ Implementation starts before design is approved → wasted work
- ❌ Design decisions scattered across chat history → hard to reference
- ❌ Context lost when switching between features → repeated explanations
- ❌ No clear record of what was approved vs what was built

**With OpenSpec + Plan Management:**
- ✅ Design captured in structured spec document
- ✅ Approval checkpoint before implementation begins
- ✅ Work tracked in resumable plan
- ✅ Clear connection between design and implementation

---

## Pattern: Design → Approve → Implement

### Example Plan Structure

```markdown
# .aiknowsys/PLAN_api_authentication.md

**Status:** 🎯 ACTIVE
**Created:** 2026-01-30
**Owner:** @Developer

## Phase 1: Design & Alignment

**Goal:** Create and approve technical design before implementation.

- [ ] 1.1: Research auth strategies
  - Compare JWT vs session-based
  - Security considerations for gnwebsite
  - Performance implications
  
- [ ] 1.2: Create OpenSpec proposal
  - Command: `openspec create add-api-auth`
  - Document endpoints, types, flow
  - Include security measures
  
- [ ] 1.3: Request architectural review
  - Hand off to @SeniorArchitect
  - Tag: @SeniorArchitect please review OpenSpec for API auth
  
- [ ] 1.4: Address feedback and get approval ✅
  - Resolve review comments
  - Update spec with changes
  - **Checkpoint:** Cannot proceed to Phase 2 without approval

## Phase 2: Backend Implementation (per approved spec)

**Goal:** Implement JWT authentication following approved design.

**Prerequisites:** ✅ Phase 1.4 complete (spec approved)

- [ ] 2.1: Generate JWT tokens
  - Location: `backend/auth/jwt.py`
  - Algorithm: RS256 (from spec)
  - Expiry: 24h access, 7d refresh (from spec)
  
- [ ] 2.2: Create auth middleware
  - Location: `backend/middleware/auth.py`
  - Validates tokens on protected routes
  - Handles token refresh
  
- [ ] 2.3: Protect API endpoints
  - Apply to `/api/v1/*` routes (from spec)
  - Whitelist: `/api/v1/auth/login`, `/api/v1/auth/register`
  
- [ ] 2.4: Write backend tests
  - Token generation/validation
  - Middleware behavior
  - Protected endpoint access

## Phase 3: Frontend Integration (per approved spec)

**Goal:** Connect frontend to auth backend.

**Prerequisites:** ✅ Phase 2.4 complete (backend tested)

- [ ] 3.1: Create login form
  - Component: `frontend/src/components/LoginForm.vue`
  - Matches API contract from spec
  
- [ ] 3.2: Implement token storage
  - Use httpOnly cookies (from spec security requirement)
  - Auto-refresh logic
  
- [ ] 3.3: Add auth headers to API calls
  - Modify axios interceptor
  - Include Bearer token
  
- [ ] 3.4: Write frontend tests
  - Login flow
  - Token refresh
  - Protected route access

## Validation

- [ ] All backend tests pass
- [ ] All frontend tests pass
- [ ] Manual testing: Login → Access protected resource
- [ ] Security audit: No tokens in localStorage
- [ ] Performance: Auth adds <50ms latency
```

### Workflow Execution

**Week 1 - Design Phase:**
```bash
# Developer starts plan
# Status: Phase 1 in progress

$ cd myproject
$ openspec create add-api-auth
# OpenSpec file created: specs/add-api-auth.md

# Fill in spec with endpoints, types, security measures
# Commit spec to repo

# Request review
@SeniorArchitect please review the OpenSpec for API authentication (specs/add-api-auth.md)

# Pause plan while waiting for review
# Update PLAN_api_authentication.md: Phase 1 → waiting for review
# Switch CURRENT_PLAN.md to different work
```

**Week 2 - Review & Approval:**
```markdown
# Architect provides feedback:
# - Use RS256 instead of HS256 (better for distributed systems)
# - Add token refresh endpoint
# - Clarify rate limiting

# Developer addresses feedback
# Update OpenSpec with changes
# Get approval ✅

# Update PLAN_api_authentication.md: Phase 1.4 complete ✅
# Ready to proceed to Phase 2
```

**Week 3-4 - Implementation:**
```bash
# Resume plan by switching CURRENT_PLAN.md back
# Follow approved spec for implementation
# Each task references specific spec sections

# Complete Phase 2 (backend)
# Run validation: pytest backend/tests/test_auth.py
# Mark Phase 2 complete ✅

# Complete Phase 3 (frontend)
# Run validation: npm test -- auth
# Mark Phase 3 complete ✅
```

---

## Benefits of This Pattern

### 1. Clear Approval Checkpoint

**Before implementation begins**, you have:
- ✅ Written design document (OpenSpec)
- ✅ Team/architect approval
- ✅ Security considerations reviewed
- ✅ API contract agreed upon

**Result:** No wasted implementation effort, everyone aligned.

### 2. Resumable Work

Plans can be **paused and resumed**:

```markdown
# CURRENT_PLAN.md

| Plan | Status | Progress |
|------|--------|----------|
| API Auth | 🔄 PAUSED | Waiting for OpenSpec approval |
| Bug Fixes | 🎯 ACTIVE | 80% complete |
```

Work on bug fixes while waiting for auth review, then resume auth when approval comes.

### 3. Audit Trail

**Six months later, someone asks: "Why did we choose JWT over sessions?"**

Answer is in `specs/add-api-auth.md`:
```markdown
## Design Decision: JWT Tokens

**Chosen:** JWT with RS256
**Rejected:** Session-based auth

**Rationale:**
- Enables API access from mobile apps (stateless)
- Easier horizontal scaling (no session storage)
- Supports microservices architecture future

**Trade-offs:**
- Cannot instantly revoke tokens (24h expiry mitigates)
- Larger request size (negligible for our use case)
```

Plus `.aiknowsys/PLAN_api_authentication.md` shows implementation timeline.

### 4. Fine-Grained Progress Tracking

**Developer can see exact status:**
```markdown
Phase 1: ✅ Complete (OpenSpec approved)
Phase 2: 🔄 In Progress (3/4 tasks done)
  ✅ 2.1: JWT generation
  ✅ 2.2: Auth middleware  
  ✅ 2.3: Protect endpoints
  🔄 2.4: Backend tests (70% coverage, need edge cases)
Phase 3: 📋 Not Started
```

### 5. AI Context Continuity

When resuming work after a week:

```markdown
@Developer please continue with the API authentication plan

# AI reads:
# 1. .aiknowsys/CURRENT_PLAN.md → finds API Auth plan
# 2. .aiknowsys/PLAN_api_authentication.md → sees Phase 2.4 in progress
# 3. specs/add-api-auth.md → understands approved design
# 4. Resumes exactly where you left off ✅
```

---

## When to Use This Pattern

### ✅ Good Fit

- **Large features** (>1 week of work)
- **Breaking changes** to APIs or contracts
- **Team alignment needed** before implementation
- **Architectural decisions** with trade-offs
- **Features that span multiple systems** (backend + frontend + mobile)
- **Work that gets interrupted** (context preservation critical)

### ❌ Overkill

- **Simple bug fixes** (just fix it)
- **Internal refactoring** (no external impact)
- **Trivial features** (<1 day)
- **Solo projects** where you're the only approver
- **Exploratory work** (spike first, plan if valuable)

---

## Real-World Example: gnwebsite Newsletter Integration

**Feature:** Add Mailerlite newsletter signup to gnwebsite.

### Phase 1: OpenSpec

Created `specs/add-newsletter-integration.md`:

```markdown
# Newsletter Integration (Mailerlite)

## API Contract

**Backend Endpoint:**
POST /api/v1/newsletter/subscribe
{
  "email": "user@example.com",
  "consent": true
}

**Response:**
200 OK - Successfully subscribed
400 Bad Request - Invalid email or missing consent
429 Too Many Requests - Rate limited

## Implementation Requirements

**Security:**
- Rate limit: 5 requests per IP per minute
- Email validation: RFC 5322 compliant
- GDPR: Require explicit consent checkbox

**Integration:**
- Use Mailerlite API v2
- Environment variables: MAILERLITE_API_KEY, MAILERLITE_GROUP_ID
- Async processing (don't block UI)

**UX:**
- Inline form in footer
- Success: "Thanks! Check your email."
- Error: Show specific message (invalid email vs rate limit)
```

**Architect Review:**
- ✅ Approved with one change: Add double opt-in email confirmation
- ✅ Security reviewed: Rate limiting adequate
- ✅ GDPR compliant

### Phase 2: Implementation Plan

`.aiknowsys/PLAN_newsletter_integration.md`:

```markdown
## Phase 1: OpenSpec ✅ COMPLETE
- Design approved by @SeniorArchitect
- See: specs/add-newsletter-integration.md

## Phase 2: Backend
- [x] Create API endpoint
- [x] Add Mailerlite SDK integration
- [x] Implement rate limiting
- [x] Write backend tests (8 tests, 100% coverage)

## Phase 3: Frontend
- [x] Create NewsletterForm component
- [x] Add validation and error handling
- [x] Integrate with backend API
- [x] Write frontend tests (5 tests)

## Phase 4: Deployment
- [x] Add environment variables to production
- [x] Test in staging
- [x] Deploy to production
- [x] Monitor error rates
```

**Result:**
- ✅ Approved design → no rework
- ✅ All tests written (13 total)
- ✅ Caught 2 edge cases in testing
- ✅ Smooth production deployment

---

## Integration with Other AIKnowSys Features

### Works With Validation Matrix

After implementation, plan includes validation:

```markdown
## Validation (from CODEBASE_ESSENTIALS.md)

Before marking complete:
- [x] pytest backend/tests/ → All 87 tests pass
- [x] npm test → All 134 tests pass  
- [x] Manual: Signup flow works
- [x] Manual: Rate limiting triggers at 5 requests
- [x] Security: No API keys in logs
```

### Works With Skills

Plan can reference specific skills:

```markdown
## Phase 2.4: Write Backend Tests

**See:** .github/skills/testing-best-practices/SKILL.md

Apply patterns:
- Arrange-Act-Assert structure
- One assertion per test
- Test edge cases (invalid email, missing consent, rate limit)
```

### Works With Agent Workflow

Plan enables hand-offs:

```markdown
## Status: Ready for Review

Phase 1-3 complete, all tests passing.

@SeniorArchitect please review:
- specs/add-newsletter-integration.md (OpenSpec)
- backend/api/newsletter.py (implementation)
- frontend/src/components/NewsletterForm.vue

Validation results:
- Backend: 8/8 tests pass
- Frontend: 5/5 tests pass
```

---

## Tips for Success

### 1. Start with OpenSpec for Contracts

If the feature involves:
- API endpoints
- Database schema changes
- External integrations
- Breaking changes

Create OpenSpec FIRST. Get approval BEFORE coding.

### 2. Break Plans into Phases

Each phase should:
- Have clear prerequisites
- Be completable in <1 week
- Have its own validation
- Be resumable

### 3. Link Spec in Plan

Every implementation task should reference the spec:

```markdown
- [ ] 2.1: Create JWT generation
  **Spec:** See "Token Generation" in specs/add-api-auth.md
  **Algorithm:** RS256 (per security requirement)
```

### 4. Update Both Documents

- **OpenSpec:** Design decisions, why we chose this approach
- **Plan:** Implementation progress, what's done/remaining

### 5. Use Plan Status Effectively

```markdown
| Plan | Status | Progress | Blocker |
|------|--------|----------|---------|
| API Auth | 🔄 PAUSED | Phase 1 done | Waiting for OpenSpec approval |
| Bug Fixes | 🎯 ACTIVE | 80% | None |
```

Clear blockers help team understand dependencies.

---

## See Also

- [Plan Management Pattern](../CODEBASE_ESSENTIALS.md#plan-management-pattern) - Pointer system details
- [AGENTS.md](../AGENTS.md#plan-management) - Plan creation and switching workflow
- [OpenSpec Integration](../lib/commands/init/openspec.js) - How OpenSpec is set up during init
- [Feature Implementation Skill](../.github/skills/feature-implementation/SKILL.md) - When to use plans vs OpenSpec

---

**This pattern combines the best of proposal-driven development (OpenSpec) with the best of agile task tracking (Plan Management) to handle complex features with confidence and clarity.** 🎯
