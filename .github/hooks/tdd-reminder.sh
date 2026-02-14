#!/usr/bin/env bash
# Auto-generated wrapper for VSCode Copilot hooks
# Reads JSON from stdin, passes to Node.js, outputs to stdout

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "$0" .sh)"

# Find corresponding Node.js file (.js, .cjs, or .mjs)
NODE_SCRIPT=""
for ext in js cjs mjs; do
  if [[ -f "$SCRIPT_DIR/$SCRIPT_NAME.$ext" ]]; then
    NODE_SCRIPT="$SCRIPT_DIR/$SCRIPT_NAME.$ext"
    break
  fi
done

if [[ -z "$NODE_SCRIPT" ]]; then
  echo "Error: No Node.js file found for $SCRIPT_NAME" >&2
  exit 1
fi

# Pass stdin to Node.js script
node "$NODE_SCRIPT"
