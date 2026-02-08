#!/usr/bin/env pwsh
# Auto-generated wrapper for VSCode Copilot hooks
# Reads JSON from stdin, passes to Node.js, outputs to stdout

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ScriptName = [System.IO.Path]::GetFileNameWithoutExtension($MyInvocation.MyCommand.Name)

# Find corresponding Node.js file (.js, .cjs, or .mjs)
$NodeScript = $null
foreach ($ext in @('js', 'cjs', 'mjs')) {
  $candidate = Join-Path $ScriptDir "$ScriptName.$ext"
  if (Test-Path $candidate) {
    $NodeScript = $candidate
    break
  }
}

if (-not $NodeScript) {
  Write-Error "Error: No Node.js file found for $ScriptName"
  exit 1
}

# Pass stdin to Node.js script
$input | node $NodeScript
