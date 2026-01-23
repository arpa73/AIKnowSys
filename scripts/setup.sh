#!/bin/bash
# setup.sh - Initialize knowledge system for a project

set -e

echo "🎯 Knowledge System Setup"
echo ""
echo "This script will set up the knowledge system for your project."
echo ""

# Check if project has existing code
if [ -d "src" ] || [ -d "backend" ] || [ -f "package.json" ] || [ -f "pyproject.toml" ]; then
  echo "🔍 Existing project detected!"
  echo ""
  echo "Choose setup mode:"
  echo "  1) Scan existing codebase (recommended for existing projects)"
  echo "  2) Manual setup (blank templates)"
  read -p "Choice: " mode
  
  if [ "$mode" = "1" ]; then
    if [ -f "./scripts/migrate-existing.sh" ]; then
      exec ./scripts/migrate-existing.sh
    else
      echo "❌ Error: migrate-existing.sh not found"
      exit 1
    fi
  fi
fi

echo "📝 Starting fresh project setup..."
echo ""

# Step 1: Detect or ask about tech stack
echo "=== Step 1: Technology Stack ==="
echo ""
echo "What's your primary language?"
echo "1) TypeScript/JavaScript"
echo "2) Python"
echo "3) Rust"
echo "4) Go"
echo "5) Other"
read -p "Choice: " lang_choice

case $lang_choice in
  1)
    LANGUAGE="TypeScript"
    PACKAGE_MANAGER="npm"
    ;;
  2)
    LANGUAGE="Python"
    PACKAGE_MANAGER="pip"
    ;;
  3)
    LANGUAGE="Rust"
    PACKAGE_MANAGER="cargo"
    ;;
  4)
    LANGUAGE="Go"
    PACKAGE_MANAGER="go mod"
    ;;
  5)
    read -p "Enter language name: " LANGUAGE
    read -p "Enter package manager: " PACKAGE_MANAGER
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

# Step 2: Framework detection
echo ""
echo "=== Step 2: Framework ==="
echo ""

if [ "$lang_choice" = "1" ]; then
  echo "Frontend framework?"
  echo "1) Vue"
  echo "2) React"
  echo "3) Svelte"
  echo "4) Angular"
  echo "5) Vanilla/Other"
  read -p "Choice: " framework_choice
  
  case $framework_choice in
    1) FRAMEWORK="Vue 3" ;;
    2) FRAMEWORK="React" ;;
    3) FRAMEWORK="Svelte" ;;
    4) FRAMEWORK="Angular" ;;
    5) read -p "Enter framework: " FRAMEWORK ;;
  esac
elif [ "$lang_choice" = "2" ]; then
  echo "Backend framework?"
  echo "1) Django"
  echo "2) FastAPI"
  echo "3) Flask"
  echo "4) Other"
  read -p "Choice: " framework_choice
  
  case $framework_choice in
    1) FRAMEWORK="Django" ;;
    2) FRAMEWORK="FastAPI" ;;
    3) FRAMEWORK="Flask" ;;
    4) read -p "Enter framework: " FRAMEWORK ;;
  esac
else
  read -p "Enter framework (or press Enter to skip): " FRAMEWORK
fi

# Step 3: Testing tools
echo ""
echo "=== Step 3: Testing ==="
echo ""
echo "Test framework?"
echo "1) Vitest"
echo "2) Jest"
echo "3) pytest"
echo "4) cargo test"
echo "5) go test"
echo "6) Other"
read -p "Choice: " test_choice

case $test_choice in
  1) 
    TEST_FRAMEWORK="Vitest"
    TEST_COMMAND="npm run test:run"
    TYPE_CHECK_CMD="npm run type-check"
    ;;
  2) 
    TEST_FRAMEWORK="Jest"
    TEST_COMMAND="npm test"
    TYPE_CHECK_CMD="npm run type-check"
    ;;
  3) 
    TEST_FRAMEWORK="pytest"
    TEST_COMMAND="pytest"
    TYPE_CHECK_CMD="mypy ."
    ;;
  4)
    TEST_FRAMEWORK="cargo test"
    TEST_COMMAND="cargo test"
    TYPE_CHECK_CMD="cargo check"
    ;;
  5)
    TEST_FRAMEWORK="go test"
    TEST_COMMAND="go test ./..."
    TYPE_CHECK_CMD="go vet ./..."
    ;;
  6)
    read -p "Enter test framework: " TEST_FRAMEWORK
    read -p "Enter test command: " TEST_COMMAND
    read -p "Enter type check command: " TYPE_CHECK_CMD
    ;;
esac

# Get project name
PROJECT_NAME=$(basename "$PWD")
DATE=$(date +"%B %d, %Y")

# Step 4: Generate CODEBASE_ESSENTIALS.md
echo ""
echo "=== Step 4: Generating Files ==="
echo ""
echo "📝 Creating CODEBASE_ESSENTIALS.md..."

if [ ! -f "templates/CODEBASE_ESSENTIALS.template.md" ]; then
  echo "❌ Error: templates/CODEBASE_ESSENTIALS.template.md not found"
  echo "   Make sure you're running this from the aiknowsys directory"
  exit 1
fi

# Replace placeholders in CODEBASE_ESSENTIALS
sed -e "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" \
    -e "s/{{DATE}}/$DATE/g" \
    -e "s/{{LANGUAGE}}/$LANGUAGE/g" \
    -e "s/{{FRAMEWORK}}/$FRAMEWORK/g" \
    -e "s/{{PACKAGE_MANAGER}}/$PACKAGE_MANAGER/g" \
    -e "s/{{TEST_FRAMEWORK}}/$TEST_FRAMEWORK/g" \
    -e "s|{{BACKEND_TEST_CMD}}|$TEST_COMMAND|g" \
    -e "s|{{FRONTEND_TEST_CMD}}|$TEST_COMMAND|g" \
    -e "s|{{TYPE_CHECK_CMD}}|$TYPE_CHECK_CMD|g" \
    templates/CODEBASE_ESSENTIALS.template.md > CODEBASE_ESSENTIALS.md

echo "✅ CODEBASE_ESSENTIALS.md created"

# Step 5: Generate AGENTS.md
echo "📝 Creating AGENTS.md..."

# Create validation matrix with proper newlines
VALIDATION_MATRIX="| Tests | \`$TEST_COMMAND\` | ✅ MANDATORY |"
if [ -n "$TYPE_CHECK_CMD" ]; then
  VALIDATION_MATRIX="$VALIDATION_MATRIX"$'\n'"| Type check | \`$TYPE_CHECK_CMD\` | ✅ MANDATORY |"
fi

# Replace placeholder (use a temporary approach since multi-line sed is tricky)
cp templates/AGENTS.template.md AGENTS.md
# For now, just copy template - users can customize validation matrix manually

echo "✅ AGENTS.md created (customize validation matrix as needed)"

# Step 6: Generate CODEBASE_CHANGELOG.md
echo "📝 Creating CODEBASE_CHANGELOG.md..."

sed -e "s/{{DATE}}/$DATE/g" \
    -e "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" \
    templates/CODEBASE_CHANGELOG.template.md > CODEBASE_CHANGELOG.md

echo "✅ CODEBASE_CHANGELOG.md created"

# Step 7: Copy LICENSE
echo "📝 Creating LICENSE..."
cp LICENSE.template LICENSE
echo "✅ LICENSE created"

# Step 8: Install custom agents
echo ""
echo "=== Step 5: Installing Custom Agents ==="
echo ""

if [ -f "templates/agents/setup-agents.sh" ]; then
  bash templates/agents/setup-agents.sh CODEBASE_ESSENTIALS.md
else
  echo "⚠️  Custom agents setup script not found, skipping..."
  echo "   You can install agents later with: templates/agents/setup-agents.sh"
fi

# Step 9: Copy universal skills
echo ""
echo "=== Step 6: Installing Skills ==="
echo ""

mkdir -p .github/skills

# Copy skill template
if [ -d ".github/skills/_skill-template" ]; then
  echo "✅ Skill template already present"
else
  cp -r templates/../.github/skills/_skill-template .github/skills/ 2>/dev/null || echo "⚠️  Skill template not found"
fi

# Copy universal skills if they exist
for skill in dependency-updates documentation-management code-refactoring testing-best-practices skill-creator; do
  if [ -d "templates/skills/$skill" ] || [ -d ".github/skills/$skill" ]; then
    cp -r templates/skills/$skill .github/skills/ 2>/dev/null || cp -r .github/skills/$skill .github/skills/ 2>/dev/null || true
    echo "✅ $skill skill installed"
  fi
done

# Step 10: Summary
echo ""
echo "🎉 Knowledge System Installation Complete!"
echo ""
echo "📁 Files created:"
echo "   - CODEBASE_ESSENTIALS.md (customize TODO sections)"
echo "   - AGENTS.md (AI workflow instructions)"
echo "   - CODEBASE_CHANGELOG.md (session history)"
echo "   - LICENSE (MIT)"
echo "   - .github/agents/ (Developer + Architect)"
echo "   - .github/skills/ (Universal skills)"
echo ""
echo "📋 Next steps:"
echo "   1. Review CODEBASE_ESSENTIALS.md"
echo "   2. Fill in TODO sections (patterns, invariants, gotchas)"
echo "   3. Customize validation commands if needed"
echo "   4. Remove placeholder sections you don't need"
echo "   5. Start using: @Developer <your request>"
echo ""
echo "📖 Documentation:"
echo "   - How agents work: .github/agents/README.md"
echo "   - How to create skills: .github/skills/_skill-template/README.md"
echo "   - Main README: README.md"
echo ""
echo "💡 Tip: Keep CODEBASE_ESSENTIALS.md updated as patterns evolve!"
