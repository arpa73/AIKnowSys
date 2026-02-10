# Auto-generated wrapper for VSCode Copilot hooks
# Reads JSON from stdin, passes to Node.js, outputs to stdout

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Execute the Node.js script
node "$ScriptDir/auto-load-context.js"
