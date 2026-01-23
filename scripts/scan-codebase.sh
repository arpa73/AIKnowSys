#!/bin/bash
# scan-codebase.sh - Analyze existing project and generate draft ESSENTIALS

set -e

echo "🔍 Scanning Codebase..."
echo ""

PROJECT_ROOT="${1:-.}"
cd "$PROJECT_ROOT"

# Detect project name
PROJECT_NAME=$(basename "$PWD")
DATE=$(date +"%B %d, %Y")

echo "📁 Project: $PROJECT_NAME"
echo ""

# Initialize findings
FRONTEND_FRAMEWORK=""
BACKEND_FRAMEWORK=""
LANGUAGE=""
BUILD_TOOL=""
TEST_FRAMEWORK=""
PACKAGE_MANAGER=""
CONTAINER_PLATFORM=""
DATABASE=""
TEST_COMMANDS=()
VALIDATION_ROWS=""

# Detect frontend (JavaScript/TypeScript)
if [ -f "package.json" ]; then
  echo "📦 Found package.json"
  PACKAGE_MANAGER="npm"
  
  # Detect framework
  if grep -q '"vue"' package.json; then
    VERSION=$(grep -o '"vue": "[^"]*"' package.json | cut -d'"' -f4 || echo "")
    FRONTEND_FRAMEWORK="Vue ${VERSION}"
  elif grep -q '"react"' package.json; then
    VERSION=$(grep -o '"react": "[^"]*"' package.json | cut -d'"' -f4 || echo "")
    FRONTEND_FRAMEWORK="React ${VERSION}"
  elif grep -q '"@angular' package.json; then
    FRONTEND_FRAMEWORK="Angular"
  elif grep -q '"svelte"' package.json; then
    FRONTEND_FRAMEWORK="Svelte"
  fi
  
  # Detect build tool
  if grep -q '"vite"' package.json; then
    BUILD_TOOL="Vite"
  elif grep -q '"webpack"' package.json; then
    BUILD_TOOL="Webpack"
  elif grep -q '"next"' package.json; then
    BUILD_TOOL="Next.js"
  fi
  
  # Detect test framework
  if grep -q '"vitest"' package.json; then
    TEST_FRAMEWORK="Vitest"
    if grep -q '"test":' package.json; then
      TEST_COMMANDS+=("npm test")
    elif grep -q '"test:run":' package.json; then
      TEST_COMMANDS+=("npm run test:run")
    fi
  elif grep -q '"jest"' package.json; then
    TEST_FRAMEWORK="Jest"
    TEST_COMMANDS+=("npm test")
  fi
  
  # Check for type checking
  if grep -q '"type-check":' package.json; then
    TEST_COMMANDS+=("npm run type-check")
  fi
fi

# Detect TypeScript
if [ -f "tsconfig.json" ]; then
  echo "📘 Found TypeScript configuration"
  LANGUAGE="TypeScript"
  if [ ${#TEST_COMMANDS[@]} -eq 0 ]; then
    TEST_COMMANDS+=("tsc --noEmit")
  fi
fi

# Detect Python
if [ -f "pyproject.toml" ] || [ -f "requirements.txt" ]; then
  echo "🐍 Found Python project"
  LANGUAGE="Python"
  
  # Detect Python version
  if [ -f "pyproject.toml" ] && grep -q "python" pyproject.toml; then
    PYTHON_VERSION=$(grep -o 'python = "[^"]*"' pyproject.toml | cut -d'"' -f2 || echo "")
  fi
  
  # Detect framework
  if grep -rq "django" requirements.txt pyproject.toml 2>/dev/null; then
    BACKEND_FRAMEWORK="Django"
  elif grep -rq "fastapi" requirements.txt pyproject.toml 2>/dev/null; then
    BACKEND_FRAMEWORK="FastAPI"
  elif grep -rq "flask" requirements.txt pyproject.toml 2>/dev/null; then
    BACKEND_FRAMEWORK="Flask"
  fi
  
  # Detect test framework
  if [ -f "pytest.ini" ] || grep -q "pytest" pyproject.toml 2>/dev/null || grep -q "pytest" requirements.txt 2>/dev/null; then
    TEST_FRAMEWORK="pytest"
    TEST_COMMANDS+=("pytest")
  fi
  
  PACKAGE_MANAGER="pip"
fi

# Detect Rust
if [ -f "Cargo.toml" ]; then
  echo "🦀 Found Rust project"
  LANGUAGE="Rust"
  BACKEND_FRAMEWORK="Rust"
  PACKAGE_MANAGER="cargo"
  TEST_FRAMEWORK="cargo test"
  TEST_COMMANDS+=("cargo test")
  TEST_COMMANDS+=("cargo check")
fi

# Detect Go
if [ -f "go.mod" ]; then
  echo "🐹 Found Go project"
  LANGUAGE="Go"
  PACKAGE_MANAGER="go mod"
  TEST_COMMANDS+=("go test ./...")
  TEST_COMMANDS+=("go vet ./...")
fi

# Detect Docker
if [ -f "docker-compose.yml" ]; then
  echo "🐳 Found Docker Compose setup"
  CONTAINER_PLATFORM="Docker Compose"
fi

# Detect database
if grep -rq "postgresql\|psycopg" . 2>/dev/null; then
  DATABASE="PostgreSQL"
elif grep -rq "mongodb\|pymongo" . 2>/dev/null; then
  DATABASE="MongoDB"
elif grep -rq "mysql" . 2>/dev/null; then
  DATABASE="MySQL"
elif grep -rq "sqlite" . 2>/dev/null; then
  DATABASE="SQLite"
fi

# Build validation rows
for cmd in "${TEST_COMMANDS[@]}"; do
  VALIDATION_ROWS+="| Tests | \`$cmd\` | ✅ MANDATORY |\n"
done

# Generate draft ESSENTIALS
echo ""
echo "📝 Generating draft CODEBASE_ESSENTIALS.md..."

cat > CODEBASE_ESSENTIALS.draft.md << EOF
# Codebase Essentials - $PROJECT_NAME

**Generated:** $DATE  
**Status:** ⚠️  DRAFT - Review and customize before using  
**Source:** Automated scan of existing codebase

---

## 🚨 CRITICAL RULE: Never Rush - Always Follow Process

**"Never rush, just fix it well and ALWAYS follow knowledge system procedures"**

**This applies to ALL changes, including:**
- ✅ "Quick fixes" and "little bugs"
- ✅ Urgent production issues
- ✅ Simple one-line changes
- ✅ Documentation updates
- ✅ Configuration tweaks

**The process (non-negotiable):**
1. Read CODEBASE_ESSENTIALS.md at session start
2. Check for existing patterns before implementing
3. Make changes + write/update tests
4. Run validation (see matrix below)
5. Update documentation if patterns changed
6. Commit with proper message

---

## Technology Stack

EOF

# Add detected stack
if [ -n "$FRONTEND_FRAMEWORK" ]; then
  cat >> CODEBASE_ESSENTIALS.draft.md << EOF
**Frontend:**
- **Framework:** $FRONTEND_FRAMEWORK
- **Language:** ${LANGUAGE:-JavaScript}
- **Build Tool:** ${BUILD_TOOL:-Not detected}
- **Package Manager:** $PACKAGE_MANAGER

EOF
fi

if [ -n "$BACKEND_FRAMEWORK" ]; then
  cat >> CODEBASE_ESSENTIALS.draft.md << EOF
**Backend:**
- **Framework:** $BACKEND_FRAMEWORK
- **Language:** $LANGUAGE
- **Package Manager:** $PACKAGE_MANAGER

EOF
fi

if [ -n "$TEST_FRAMEWORK" ]; then
  cat >> CODEBASE_ESSENTIALS.draft.md << EOF
**Testing:**
- **Framework:** $TEST_FRAMEWORK

EOF
fi

if [ -n "$CONTAINER_PLATFORM" ] || [ -n "$DATABASE" ]; then
  cat >> CODEBASE_ESSENTIALS.draft.md << EOF
**Infrastructure:**
${CONTAINER_PLATFORM:+- **Containerization:** $CONTAINER_PLATFORM}
${DATABASE:+- **Database:** $DATABASE}

EOF
fi

# Add validation matrix
cat >> CODEBASE_ESSENTIALS.draft.md << EOF
---

## Validation Matrix

**Run these commands before claiming work is complete:**

| Changed | Command | Required |
|---------|---------|----------|
EOF

# Add detected test commands
for cmd in "${TEST_COMMANDS[@]}"; do
  echo "| Tests | \`$cmd\` | ✅ MANDATORY |" >> CODEBASE_ESSENTIALS.draft.md
done

cat >> CODEBASE_ESSENTIALS.draft.md << 'EOF'

**🚨 RULE: Never claim work is complete without running validation!**

**Detected validation commands:**

```bash
EOF

for cmd in "${TEST_COMMANDS[@]}"; do
  echo "$cmd" >> CODEBASE_ESSENTIALS.draft.md
done

cat >> CODEBASE_ESSENTIALS.draft.md << 'EOF'
```

---

## 📝 TODO: Complete These Sections

The scanner detected your tech stack, but YOU need to document:

### 1. Core Patterns

**How do you structure components/modules?**
- TODO: Document your project structure
- TODO: Component/module organization patterns
- TODO: Naming conventions

**How is authentication handled?**
- TODO: Auth flow (JWT, sessions, OAuth, etc.)
- TODO: Token storage approach
- TODO: Permission/authorization patterns

**How are API calls made?**
- TODO: HTTP client setup
- TODO: Error handling patterns
- TODO: Request/response interceptors

**What's your state management approach?**
- TODO: State library (if any)
- TODO: Where state lives
- TODO: Update patterns

---

### 2. Critical Invariants

**What rules must NEVER be violated?**

1. **TODO: Add invariant 1**
   - What: [Description]
   - Why: [Rationale]
   - Example: [Code example]

2. **TODO: Add invariant 2**
   - What: [Description]
   - Why: [Rationale]

---

### 3. Common Gotchas

**What issues do new contributors encounter?**

### TODO: Gotcha 1

**Problem:** [What goes wrong]

**Solution:** [How to fix it]

**Example:**
```
// TODO: Add code example
```

---

### 4. Architecture Decisions

**Why did you choose this structure?**

### TODO: Decision 1

**Decision:** [What was decided]

**Rationale:** [Why this approach]

**Trade-offs:**
- ✅ Benefit 1
- ⚠️  Cost/limitation 1

---

## Next Steps

1. ✅ Review this generated file
2. ⬜ Fill in TODO sections above  
3. ⬜ Add project-specific constraints
4. ⬜ Document your coding standards
5. ⬜ Run validation commands to verify correctness
6. ⬜ Rename to CODEBASE_ESSENTIALS.md when ready

---

*Generated by Knowledge System Template scanner*
EOF

echo ""
echo "✅ Draft generated: CODEBASE_ESSENTIALS.draft.md"
echo ""
echo "📊 Detected:"
[ -n "$FRONTEND_FRAMEWORK" ] && echo "   - Frontend: $FRONTEND_FRAMEWORK"
[ -n "$BACKEND_FRAMEWORK" ] && echo "   - Backend: $BACKEND_FRAMEWORK"
[ -n "$LANGUAGE" ] && echo "   - Language: $LANGUAGE"
[ -n "$BUILD_TOOL" ] && echo "   - Build Tool: $BUILD_TOOL"
[ -n "$CONTAINER_PLATFORM" ] && echo "   - Infrastructure: $CONTAINER_PLATFORM"
[ -n "$DATABASE" ] && echo "   - Database: $DATABASE"
echo "   - Test commands: ${#TEST_COMMANDS[@]} found"
echo ""
echo "⚠️  IMPORTANT: This is a STARTING POINT"
echo "   Review and customize before using in production!"
echo ""
echo "📖 Next: Edit CODEBASE_ESSENTIALS.draft.md to add:"
echo "   - Your actual patterns and conventions"
echo "   - Critical invariants"
echo "   - Common gotchas"
echo "   - Architecture decisions"
echo ""
echo "💡 Tip: Rename to CODEBASE_ESSENTIALS.md when complete"
