# Custom Agents - Developer & Architect Workflow

**Purpose:** Automated quality gate that enforces CODEBASE_ESSENTIALS.md patterns during development.

---

## How It Works

### The Agent Pair

1. **Developer Agent** (`developer.agent.md`)
   - Primary implementer of features
   - Writes code following documented patterns
   - Automatically hands off to Architect for review
   - Refactors based on feedback

2. **Architect Agent** (`architect.agent.md`)
   - Reviews code against CODEBASE_ESSENTIALS.md
   - Enforces KISS, DRY, SOLID, YAGNI principles
   - Approves or requests changes
   - Provides specific, actionable feedback

### Workflow

```
┌─────────────┐
│    User     │
│  "Add X"    │
└──────┬──────┘
       │
       v
┌─────────────────┐
│   @Developer    │ 1. Implements feature
│   Implements    │ 2. Writes tests
└────────┬────────┘ 3. Auto-handoff ──┐
         │                             │
         │                             v
         │                    ┌────────────────────┐
         │                    │  @SeniorArchitect  │
         │                    │  Reads ESSENTIALS  │
         │                    │  Reviews code      │
         │                    └────────┬───────────┘
         │                             │
         │                  ┌──────────┴──────────┐
         │                  │                     │
         v                  v                     v
    ┌────────┐      ┌──────────┐         ┌──────────────┐
    │  User  │◄─────┤ LGTM ✅  │         │ Issues Found │
    └────────┘      └──────────┘         └──────┬───────┘
                                                 │
                                                 v
                                         ┌───────────────┐
                                         │  @Developer   │
                                         │  Refactors    │
                                         └───────┬───────┘
                                                 │
                                                 └──────► (Loop back to Architect)
```

---

## Usage

### In VS Code with GitHub Copilot

**Start with Developer:**
```
@Developer add a new feature to calculate user retention rate
```

**Developer will:**
1. Implement the code
2. Write tests
3. Complete response and show handoff button

**After Developer completes:**
- A "Send to Architect" button appears
- Click it to automatically transition to SeniorArchitect for review
- The handoff is configured with `send: true`, so review starts immediately

### Planning Complex Features

For multi-step features or architectural changes:
```
@Planner create a plan for implementing user authentication with OAuth
```

**After Planner completes:**
- A "Send to Developer" button appears
- Click it to transition to Developer agent with the plan
- The prompt is pre-filled but not auto-sent (`send: false`), allowing you to review/modify

### Direct Review Request

If you've made changes manually and want a review:
```
@SeniorArchitect review the changes I made to src/utils/metrics.ts
```

---

## What Architect Checks

### ✅ KISS (Keep It Simple)
- No overly complex nested logic
- Readable function/variable names
- Clear control flow

### ✅ DRY (Don't Repeat Yourself)
- No duplicated logic
- Proper abstraction into functions/classes
- Reuse existing utilities

### ✅ SOLID Principles
- Single Responsibility (functions do one thing)
- Dependency Inversion (inject dependencies)
- Interface segregation

### ✅ YAGNI (You Ain't Gonna Need It)
- No speculative "future-proofing"
- Features are actually needed now
- No premature optimization

### ✅ CODEBASE_ESSENTIALS.md Compliance
- Follows documented patterns
- Uses approved libraries/tools
- Respects project constraints

---

## Configuration

### Customizing Review Criteria

Edit `.github/agents/architect.agent.md`:

```markdown
### Project-Specific Rules:
- All API calls must use the generated OpenAPI client
- Components must use TypeScript strict mode
- Error handling must use try/catch with logger
- Database queries must use Django ORM (no raw SQL)
```

### Customizing Developer Behavior

Edit `.github/agents/developer.agent.md`:

```markdown
### Your Coding Standards:
- Write tests first (TDD)
- Use async/await (no .then() chains)
- Log errors with structured logging
- Document complex logic with comments
```

---

## Benefits

| Traditional Workflow | With Custom Agents |
|---------------------|-------------------|
| Write code → Submit PR → Wait for human review → Fix issues → Resubmit | Write code → Instant automated review → Fix issues → Auto re-review |
| Inconsistent feedback across reviewers | Consistent enforcement of standards |
| Human reviewers check style + logic + architecture | Agents check style/patterns, humans focus on architecture |
| Feedback loop: hours to days | Feedback loop: seconds |
| Patterns drift over time | Patterns enforced on every change |

---

## Examples

### Example 1: Clean Code Approval

**User:** `@Developer add a function to format currency`

**Developer implements:**
```typescript
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}
```

**Developer handoff:** `@SeniorArchitect please review formatCurrency in utils/format.ts`

**Architect response:** `LGTM - Architect Approved ✅`
- Uses standard library (Intl.NumberFormat)
- Single responsibility
- No duplication

### Example 2: Issues Found

**User:** `@Developer add validation for email addresses`

**Developer implements:**
```typescript
function validateEmail(email: string): boolean {
  // Complex regex copied from Stack Overflow
  return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email);
}
```

**Architect response:**
```
❌ Review Failed - Issues Found:

1. **DRY Violation** in [src/utils/validation.ts](src/utils/validation.ts#L12)
   - Email validation already exists in src/composables/useAuth.ts
   - Refactor: Extract shared validation to src/utils/validators.ts
   - Rationale: Duplicate regex means inconsistent validation rules

2. **Documentation** in [src/utils/validation.ts](src/utils/validation.ts#L11)
   - Complex regex needs explanation
   - Add comment: What email formats are accepted/rejected
   - Rationale: Future maintainers need to understand edge cases

Please address these issues and resubmit.
```

**Developer refactors and re-submits → Architect approves ✅**

---

## Troubleshooting

### Agent doesn't auto-handoff

**Check:** Is `send: true` in the handoff configuration?
```yaml
handoffs:
  - label: "Send to Architect"
    agent: SeniorArchitect
    prompt: "Please review..."
    send: true  # ← Must be true for auto-handoff
```

### Architect can't read CODEBASE_ESSENTIALS.md

**Check:** Does Architect have `search` tool enabled?
```yaml
tools: [search, search/changes]  # ← Required
```

### Review is too strict / too lenient

**Customize:** Edit architect.agent.md review checklist and criteria.

---

## Best Practices

1. **Let the workflow happen** - Don't interrupt the auto-handoff
2. **Read Architect feedback carefully** - It references specific sections of ESSENTIALS
3. **Update ESSENTIALS when patterns change** - Architect enforces what's documented
4. **Use Developer for implementation** - Use direct chat for questions/exploration
5. **Iterate with feedback** - Refactor and resubmit until approved

---

## Integration with Knowledge System

The agents are part of the broader knowledge system:

```
CODEBASE_ESSENTIALS.md  ←─┐
                          │
AGENTS.md (workflow)      │
                          │ Architect reads
Skills (how-to guides)    │ and enforces
                          │
Custom Agents  ───────────┘
```

**Flow:**
1. Patterns documented in ESSENTIALS
2. Workflow enforced by AGENTS.md
3. Detailed steps in Skills
4. **Automated enforcement by Custom Agents**

---

*This creates a self-reinforcing system where good patterns are documented, taught, and automatically enforced.*
