# Pre-built Stack Templates

Pre-configured templates for popular technology stacks. These templates have most placeholders already filled with stack-specific best practices.

## Available Stacks

### Frontend

- **`nextjs`** - Next.js with TypeScript, React, and Tailwind CSS
- **`vue-vite`** - Vue 3 with TypeScript, Vite, and Pinia

### Backend

- **`express-api`** - Express.js REST API with TypeScript and PostgreSQL
- **`fastapi`** - FastAPI with Python, PostgreSQL, and SQLAlchemy

### Full Stack

- **`vue-express`** - Vue 3 + Express.js monorepo with shared TypeScript types
- **`nextjs-api`** - Next.js with App Router and API routes

## Usage

```bash
# Use a pre-built stack
npx aiknowsys init --stack nextjs

# List available stacks
npx aiknowsys init --list-stacks
```

## Template Structure

Each stack template includes:

- **CODEBASE_ESSENTIALS.md** - Pre-filled with stack-specific patterns
- **validation.json** - Validation commands for the stack
- **patterns.json** - Common patterns and anti-patterns
- **README.md** - Stack-specific notes

## Creating New Stack Templates

1. Create directory: `templates/stacks/stack-name/`
2. Add `CODEBASE_ESSENTIALS.md` with filled sections
3. Add `validation.json` with test/lint/build commands
4. Add to `lib/commands/init.js` AVAILABLE_STACKS array
5. Test with: `npx aiknowsys init --stack stack-name`
