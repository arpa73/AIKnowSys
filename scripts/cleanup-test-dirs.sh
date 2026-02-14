#!/usr/bin/env bash
# Cleanup temporary test directories created during development
# Usage: bash scripts/cleanup-test-dirs.sh [--dry-run] [--force] [directory]
#   --dry-run: Preview deletions without making changes
#   --force:   Skip confirmation prompt (for CI/automation)
#   directory: Target directory (defaults to project root)

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

DRY_RUN=false
FORCE=false
TARGET_DIR=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    *)
      # Assume it's a directory argument
      if [[ -z "$TARGET_DIR" ]]; then
        TARGET_DIR="$1"
      fi
      shift
      ;;
  esac
done

# Get workspace root (script location is in scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Use provided directory or default to WORKSPACE_ROOT
if [[ -z "$TARGET_DIR" ]]; then
  TARGET_DIR="$WORKSPACE_ROOT"
else
  # Resolve to absolute path
  TARGET_DIR="$(cd "$TARGET_DIR" 2>/dev/null && pwd || echo "$TARGET_DIR")"
fi

if [[ "$DRY_RUN" == "true" ]]; then
  echo -e "${YELLOW}🔍 DRY RUN MODE - No files will be deleted${NC}\n"
fi

echo -e "${GREEN}🧹 Cleaning up test directories...${NC}\n"

# Confirmation prompt for destructive operation (unless --force or --dry-run)
if [[ "$DRY_RUN" == "false" && "$FORCE" == "false" ]]; then
  echo -e "${YELLOW}⚠️  This will permanently delete test directories in:${NC}"
  echo -e "${YELLOW}   $TARGET_DIR${NC}\n"
  read -p "Continue? [y/N] " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✓ Cancelled. Use --dry-run to preview changes.${NC}"
    exit 0
  fi
  echo # Empty line for better formatting
fi

# Patterns for test directories to clean up
PATTERNS=(
  "test-*"           # Test directories with timestamps
  "temp-*"           # Temporary directories
  "tmp-*"            # Alternative temp naming
  "*-test-*"         # Test suffix directories
  "scan-test-*"      # Scan test outputs
)

FOUND_COUNT=0
DELETED_COUNT=0

# Find and process test directories
for pattern in "${PATTERNS[@]}"; do
  while IFS= read -r -d '' dir; do
    # Skip if this is the TARGET_DIR itself
    if [[ "$dir" == "$TARGET_DIR" ]]; then
      continue
    fi
    
    # Skip the actual test/ directory (our test suite)
    if [[ "$(basename "$dir")" == "test" ]]; then
      continue
    fi
    
    FOUND_COUNT=$((FOUND_COUNT + 1))
    echo -e "Found: ${YELLOW}$dir${NC}"
    
    if [[ "$DRY_RUN" == "false" ]]; then
      rm -rf "$dir"
      echo -e "  ${RED}✗ Deleted${NC}"
      DELETED_COUNT=$((DELETED_COUNT + 1))
    else
      echo -e "  ${YELLOW}Would delete (dry run)${NC}"
    fi
    echo
  done < <(find "$TARGET_DIR" -maxdepth 1 -type d -name "$pattern" -print0 2>/dev/null)
done

# Summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [[ "$DRY_RUN" == "true" ]]; then
  echo -e "${YELLOW}Summary (Dry Run):${NC}"
  echo -e "  Found: $FOUND_COUNT test directories"
  echo -e "  Run without --dry-run to delete them"
else
  echo -e "${GREEN}Summary:${NC}"
  echo -e "  Deleted: $DELETED_COUNT test directories"
  if [[ $DELETED_COUNT -eq 0 ]]; then
    echo -e "  ${GREEN}✓ Workspace is clean!${NC}"
  fi
fi
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
