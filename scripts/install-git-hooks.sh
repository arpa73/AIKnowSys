#!/bin/bash
#
# Install Git Hooks
#
# Copies Git hooks from .git-hooks/ to .git/hooks/
# This ensures TDD enforcement and other quality checks are active
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_SOURCE="$PROJECT_ROOT/.git-hooks"
HOOKS_TARGET="$PROJECT_ROOT/.git/hooks"

echo "🔧 Installing Git hooks..."
echo ""

# Check if .git directory exists
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    echo "❌ Error: .git directory not found"
    echo "   This script must be run from a Git repository"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_TARGET"

# Copy each hook
INSTALLED=0
for hook in "$HOOKS_SOURCE"/*; do
    # Skip README.md
    if [[ "$(basename "$hook")" == "README.md" ]]; then
        continue
    fi
    
    hook_name=$(basename "$hook")
    
    # Check if hook already exists
    if [ -f "$HOOKS_TARGET/$hook_name" ]; then
        echo "⚠️  $hook_name already exists"
        read -p "   Overwrite? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "   Skipped $hook_name"
            continue
        fi
    fi
    
    # Copy and make executable
    cp "$hook" "$HOOKS_TARGET/$hook_name"
    chmod +x "$HOOKS_TARGET/$hook_name"
    echo "✅ Installed: $hook_name"
    INSTALLED=$((INSTALLED + 1))
done

echo ""
if [ $INSTALLED -eq 0 ]; then
    echo "ℹ️  No new hooks installed"
else
    echo "✅ Installed $INSTALLED hook(s) successfully!"
    echo ""
    echo "Active hooks:"
    ls -1 "$HOOKS_TARGET" | grep -v ".sample" | sed 's/^/   - /'
fi

echo ""
echo "📚 See .git-hooks/README.md for hook documentation"
echo ""
