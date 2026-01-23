#!/bin/bash
# migrate-existing.sh - Full migration workflow for existing projects

set -e

echo "🚀 Knowledge System Migration (Existing Project)"
echo ""
echo "This will:"
echo "  1. Scan your codebase"
echo "  2. Generate draft documentation"
echo "  3. Install custom agents"
echo "  4. Set up skills"
echo "  5. Initialize changelog"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Migration cancelled."
  exit 0
fi

# Check we're in the right location
if [ ! -f "scripts/scan-codebase.sh" ]; then
  echo "❌ Error: scripts/scan-codebase.sh not found"
  echo "   Make sure templates/ and scripts/ are in your project root"
  exit 1
fi

# Step 1: Scan codebase
echo ""
echo "══════════════════════════════════════════"
echo "Step 1/5: Scanning codebase..."
echo "══════════════════════════════════════════"
echo ""

./scripts/scan-codebase.sh

# Step 2: Review draft
echo ""
echo "══════════════════════════════════════════"
echo "Step 2/5: Review generated draft"
echo "══════════════════════════════════════════"
echo ""
echo "📝 CODEBASE_ESSENTIALS.draft.md has been created"
echo ""
echo "IMPORTANT: You must complete the TODO sections before proceeding!"
echo ""
echo "Required sections to fill in:"
echo "  - Core Patterns (how you structure code, handle auth, make API calls)"
echo "  - Critical Invariants (rules that must never be violated)"
echo "  - Common Gotchas (issues new contributors encounter)"
echo "  - Architecture Decisions (why you chose this approach)"
echo ""
echo "Once complete, rename the file:"
echo "  mv CODEBASE_ESSENTIALS.draft.md CODEBASE_ESSENTIALS.md"
echo ""
read -p "Press Enter when you've completed and renamed the file..."

# Verify ESSENTIALS exists
if [ ! -f "CODEBASE_ESSENTIALS.md" ]; then
  echo ""
  echo "⚠️  CODEBASE_ESSENTIALS.md not found!"
  echo ""
  echo "Options:"
  echo "  1) I renamed it, continue anyway"
  echo "  2) Exit and complete the file first"
  read -p "Choice: " choice
  
  if [ "$choice" != "1" ]; then
    echo "Exiting. Complete CODEBASE_ESSENTIALS.md and run this script again."
    exit 0
  fi
fi

# Step 3: Generate AGENTS.md
echo ""
echo "══════════════════════════════════════════"
echo "Step 3/5: Creating AGENTS.md"
echo "══════════════════════════════════════════"
echo ""

if [ -f "templates/AGENTS.template.md" ]; then
  # Try to extract validation commands from ESSENTIALS
  if [ -f "CODEBASE_ESSENTIALS.md" ]; then
    echo "📝 Generating AGENTS.md from template..."
    cp templates/AGENTS.template.md AGENTS.md
    # Note: For now using template as-is. Users can customize validation matrix.
    echo "✅ AGENTS.md created (customize validation matrix as needed)"
  fi
else
  echo "⚠️  AGENTS.template.md not found, skipping..."
fi

# Step 4: Install custom agents
echo ""
echo "══════════════════════════════════════════"
echo "Step 4/5: Installing custom agents..."
echo "══════════════════════════════════════════"
echo ""

if [ -f "templates/agents/setup-agents.sh" ]; then
  bash templates/agents/setup-agents.sh CODEBASE_ESSENTIALS.md
else
  echo "⚠️  Agent setup script not found"
  echo "   Manual installation: copy templates/agents/ to .github/agents/"
fi

# Step 5: Install skills
echo ""
echo "══════════════════════════════════════════"
echo "Step 5/5: Installing universal skills..."
echo "══════════════════════════════════════════"
echo ""

mkdir -p .github/skills

# Copy skill template
if [ -d ".github/skills/_skill-template" ]; then
  echo "✅ Skill template already present"
else
  if [ -d "templates/../.github/skills/_skill-template" ]; then
    cp -r templates/../.github/skills/_skill-template .github/skills/
    echo "✅ Skill template installed"
  fi
fi

# Copy universal skills (check both templates/skills and .github/skills locations)
SKILLS_INSTALLED=0
for skill in dependency-updates documentation-management code-refactoring testing-best-practices skill-creator; do
  if [ -d ".github/skills/$skill" ]; then
    echo "✅ $skill skill already present"
    ((SKILLS_INSTALLED++))
  elif [ -d "templates/skills/$skill" ]; then
    cp -r templates/skills/$skill .github/skills/
    echo "✅ $skill skill installed"
    ((SKILLS_INSTALLED++))
  fi
done

if [ $SKILLS_INSTALLED -eq 0 ]; then
  echo "⚠️  No universal skills found in templates/"
  echo "   You can add skills later to .github/skills/"
fi

# Initialize changelog
echo ""
echo "📝 Initializing CODEBASE_CHANGELOG.md..."

PROJECT_NAME=$(basename "$PWD")
DATE=$(date +"%B %d, %Y")

if [ -f "CODEBASE_CHANGELOG.md" ]; then
  echo "⚠️  CODEBASE_CHANGELOG.md already exists, skipping..."
else
  cat > CODEBASE_CHANGELOG.md << EOF
# Codebase Changelog

**Purpose:** Session-by-session record of changes, validations, and learnings.

---

## Session: Knowledge System Migration ($DATE)

**Goal**: Adopt knowledge system for existing $PROJECT_NAME project

**Changes**:
- Scanned codebase and generated CODEBASE_ESSENTIALS.md
- Installed custom agents (Developer + Architect)
- Added universal skills ($SKILLS_INSTALLED skills)
- Initialized this changelog

**Validation**:
- ✅ All template files created
- ⬜ TODO: Run project tests to verify baseline

**Next Steps**:
- Complete any remaining TODO sections in CODEBASE_ESSENTIALS.md
- Start using @Developer workflow
- Document patterns as discovered
- Add validation results to future sessions

**Key Learning**: Knowledge system provides structure for AI-assisted development while maintaining consistency.

---
EOF
  echo "✅ CODEBASE_CHANGELOG.md created"
fi

# Final summary
echo ""
echo "══════════════════════════════════════════"
echo "🎉 Migration Complete!"
echo "══════════════════════════════════════════"
echo ""
echo "📁 Files created:"
echo "   - CODEBASE_ESSENTIALS.md (review and complete TODOs)"
echo "   - AGENTS.md (AI workflow instructions)"
echo "   - CODEBASE_CHANGELOG.md (session history)"
if [ -d ".github/agents" ]; then
  echo "   - .github/agents/ (Developer + Architect)"
fi
if [ $SKILLS_INSTALLED -gt 0 ]; then
  echo "   - .github/skills/ ($SKILLS_INSTALLED skills installed)"
fi
echo ""
echo "📋 Immediate next steps:"
echo "   1. ✅ Complete any remaining TODO sections in CODEBASE_ESSENTIALS.md"
echo "   2. ⬜ Run your project's tests to establish baseline"
echo "   3. ⬜ Add baseline validation results to CHANGELOG"
echo "   4. ⬜ Review .github/agents/README.md for workflow details"
echo ""
echo "🚀 Start using the system:"
echo "   @Developer <your request>     → Implements and auto-reviews"
echo "   @SeniorArchitect <file>       → Direct review request"
echo ""
echo "📖 Keep improving:"
echo "   - Document patterns in CODEBASE_ESSENTIALS.md as you find them"
echo "   - Update CHANGELOG after each session"
echo "   - Create custom skills for your workflows"
echo ""
echo "💡 Tip: The system works best when ESSENTIALS is kept up-to-date!"
