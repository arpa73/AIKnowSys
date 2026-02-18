# Type Safety Refactoring Patterns

**Trigger Words:** any-to-unknown, type-refactoring, lint-debt, type-safety, strict-ts, awaited-return-type, validation-before-casting

## Pattern 1: Test Result Type Inference with Awaited ReturnType

**Problem:**
Test files used `const result: any = await command(...)`, which bypassed type checking and hid unsafe property access.

**Solution:**
Use a type alias derived directly from the command return type:

```typescript
type CommandResult = Awaited<ReturnType<typeof commandFn>>;
const result: CommandResult = await commandFn(args);
```

**Benefits:**
- Catches unsafe property access at compile time.
- Self-documenting test intent.
- Refactor-safe when command return type evolves.

**Applied in:**
- [test/quality-check.test.ts](test/quality-check.test.ts)
- [test/context-learning.test.ts](test/context-learning.test.ts)
- [test/plugins.test.ts](test/plugins.test.ts)
- [test/list-patterns.test.ts](test/list-patterns.test.ts)

## Pattern 2: Runtime Validation Before Type Casting (External Boundaries)

**Problem:**
Data loaded from SQLite/JSON is untrusted at compile time. Direct casts (`as SomeType`) can hide invalid runtime values.

**Solution:**
Validate runtime shape and enum membership first, then cast:

```typescript
if (!Object.values(MyEnum).includes(rawValue as MyEnum)) {
  throw new Error(`Invalid value '${rawValue}'`);
}

if (typeof parsed !== 'object' || parsed === null) {
  throw new Error('Invalid object payload');
}

const typedValue = rawValue as MyEnum;
const typedPayload = parsed as MyPayload;
```

**When to use:**
- SQLite row mapping
- JSON parse results
- API payload mapping
- User-input normalization

**Applied in:**
- [lib/context/sqlite-storage.ts](lib/context/sqlite-storage.ts)
  - Event type enum validation before `EventType` cast
  - Parsed data object validation before `EventData` cast

## Pattern 3: Strong SQL Parameter Boundaries

**Problem:**
Using `unknown[]` for SQL params is safer than `any[]`, but still too loose for database call sites.

**Solution:**
Define a DB-value union and standardize param arrays:

```typescript
type SqliteValue = string | number | null | Buffer | bigint;
const params: SqliteValue[] = [];
```

**Benefits:**
- Explicit DB input contract.
- Better compile-time checks for query builder paths.
- Easier reuse across query methods.

**Applied in:**
- [lib/context/sqlite-storage.ts](lib/context/sqlite-storage.ts)

## Pattern 4: Optional Property Assertions in Tests

**Problem:**
After removing `any`, strict TypeScript surfaced optional fields (`fix`, `details`, `violations`, nested `checks`) that tests assumed always existed.

**Solution:**
Assert presence or provide a safe fallback before deep access:

```typescript
expect(result.fix).toBeDefined();
expect(result.fix?.includes('compress-essentials')).toBeTruthy();

const violations = result.violations ?? [];
expect(violations.length).toBe(2);
expect(violations[0]?.line).toBe(1);
```

**Benefits:**
- Preserves strict mode safety.
- Prevents runtime crashes in tests.
- Makes optionality explicit in assertions.

## Usage Guidance

- Prefer inferred return aliases for command-test integration.
- At any external data boundary, validate before casting.
- Use precise unions at DB parameter boundaries.
- In tests, never assume optional fields exist without a guard/assertion.

## Validation Checklist for This Pattern Family

```bash
npm run build
npx vitest run <changed-test-file>
node bin/cli.js validate-deliverables
npm test
```
