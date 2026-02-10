#!/usr/bin/env bash
# Auto-generated wrapper for VSCode Copilot hooks
# Reads JSON from stdin, passes to Node.js, outputs to stdout

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Execute the Node.js script
node "$SCRIPT_DIR/auto-load-context.js"
