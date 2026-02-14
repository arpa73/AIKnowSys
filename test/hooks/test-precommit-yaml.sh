#!/bin/bash
# Tests for pre-commit hook YAML validation
# Phase 5.3: Pre-commit YAML Validation

set -e

HOOK_PATH=".github/hooks/pre-commit"
TEST_DIR="test-tmp-precommit-$$"
PASS=0
FAIL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing pre-commit hook YAML validation"
echo ""

# Setup test directory
mkdir -p "$TEST_DIR/.aiknowsys/sessions"
cd "$TEST_DIR"
git init --quiet
git config user.email "test@example.com"
git config user.name "Test User"

# Copy hook
cp "../$HOOK_PATH" ".git/hooks/pre-commit"
chmod +x ".git/hooks/pre-commit"

# Test 1: Valid YAML frontmatter
echo "Test 1: Valid YAML frontmatter (should pass)"
cat > ".aiknowsys/sessions/2026-02-08-session.md" <<EOF
---
date: 2026-02-08
title: Test Session
topics: ["test"]
status: in-progress
---

# Session content
EOF

git add ".aiknowsys/sessions/2026-02-08-session.md"

# Also stage index to avoid warning
echo '{}' > ".aiknowsys/context-index.json"
git add ".aiknowsys/context-index.json"

if git commit -m "test" --no-verify 2>&1 | grep -q "Valid YAML frontmatter"; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ FAIL${NC}"
    FAIL=$((FAIL + 1))
fi

# Test 2: Missing YAML frontmatter
echo ""
echo "Test 2: Missing YAML frontmatter (should warn)"
cat > ".aiknowsys/sessions/2026-02-09-session.md" <<EOF
# Session without frontmatter

This is bad.
EOF

git add ".aiknowsys/sessions/2026-02-09-session.md"

if git commit -m "test2" --no-verify 2>&1 | grep -q "Missing YAML frontmatter"; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ FAIL${NC}"
    FAIL=$((FAIL + 1))
fi

# Test 3: Missing required fields
echo ""
echo "Test 3: Missing required fields (should warn)"
cat > ".aiknowsys/sessions/2026-02-10-session.md" <<EOF
---
date: 2026-02-10
---

Missing topics field
EOF

git add ".aiknowsys/sessions/2026-02-10-session.md"

if git commit -m "test3" --no-verify 2>&1 | grep -q "Missing 'topics' field"; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ FAIL${NC}"
    FAIL=$((FAIL + 1))
fi

# Test 4: Session changed but index not updated
echo ""
echo "Test 4: Session changed but index not updated (should warn)"
cat > ".aiknowsys/sessions/2026-02-11-session.md" <<EOF
---
date: 2026-02-11
title: Test
topics: ["test"]
---

Content
EOF

# Stage session but NOT index
git add ".aiknowsys/sessions/2026-02-11-session.md"

if git commit -m "test4" --no-verify 2>&1 | grep -q "context-index.json not updated"; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ FAIL${NC}"
    FAIL=$((FAIL + 1))
fi

# Test 5: Non-blocking behavior (should allow commit despite warnings)
echo ""
echo "Test 5: Non-blocking behavior (allows commit with warnings)"
cat > ".aiknowsys/sessions/2026-02-12-session.md" <<EOF
Bad file
EOF

git add ".aiknowsys/sessions/2026-02-12-session.md"

if git commit -m "test5" --no-verify 2>&1 | grep -q "Proceeding anyway"; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ FAIL${NC}"
    FAIL=$((FAIL + 1))
fi

# Cleanup
cd ..
rm -rf "$TEST_DIR"

echo ""
echo "─────────────────────────"
echo -e "Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"

if [ $FAIL -gt 0 ]; then
    exit 1
fi

exit 0
