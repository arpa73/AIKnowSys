#!/usr/bin/env node
/**
 * Post-merge hook: sync-plans (deprecated)
 *
 * The CLI command `aiknowsys sync-plans` was removed in strict markdownless
 * mode. Plan/session state is now database-first via MCP/CLI query+mutation
 * tools, so no post-merge sync step is required.
 *
 * Non-blocking: always exits with code 0.
 */

function main() {
  process.exit(0);
}

main();
