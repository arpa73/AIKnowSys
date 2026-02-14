#!/usr/bin/env node
/**
 * MCP Test Command
 * 
 * Test individual MCP tools with JSON arguments.
 * Makes testing MCP functionality delightful - no manual scripts needed!
 * 
 * Usage:
 *   npx aiknowsys mcp-test <tool-name> [args-json]
 * 
 * Examples:
 *   npx aiknowsys mcp-test query-sessions '{"when":"last week"}'
 *   npx aiknowsys mcp-test query-plans '{"status":"ACTIVE"}'
 *   npx aiknowsys mcp-test search-context '{"query":"MCP testing"}'
 *   npx aiknowsys mcp-test get-db-stats '{}'
 * 
 * Smart features:
 * - Auto-detects database path (no dbPath needed!)
 * - Pretty-prints JSON results
 * - Shows execution time
 * - Color-coded success/error
 * - Parameter preview
 * - Supports --silent and --json flags
 */

import chalk from 'chalk';
import { createLogger } from '../logger.js';

// Import MCP tool functions via clean barrel export (Phase 4: Path Resolution)
import {
  // SQLite tools
  querySessionsSqlite,
  queryPlansSqlite,
  queryLearnedPatternsSqlite,
  searchContextSqlite,
  getDbStatsSqlite,
  // Context tools
  getCriticalInvariants,
  getValidationMatrix,
  // Query tools
  getActivePlans,
  getRecentSessions,
  // Skills tools
  findSkillForTask
} from '../../mcp-server/src/api.js';

// Tool registry - maps command names to functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TOOLS: Record<string, (args: any) => Promise<any>> = {
  'query-sessions': querySessionsSqlite,
  'query-plans': queryPlansSqlite,
  'query-patterns': queryLearnedPatternsSqlite,
  'search-context': searchContextSqlite,
  'get-db-stats': getDbStatsSqlite,
  'get-invariants': getCriticalInvariants,
  'get-validation-matrix': getValidationMatrix,
  'get-active-plans': getActivePlans,
  'get-recent-sessions': getRecentSessions,
  'find-skill': findSkillForTask
};

/**
 * MCP Test command options
 */
export interface McpTestOptions {
  /** Output raw JSON (no pretty-print) */
  json?: boolean;
  
  /** Silent mode (suppress output) */
  _silent?: boolean;
}

/**
 * Pretty-print JSON with syntax highlighting
 */
function prettyPrint(data: unknown): string {
  const json = JSON.stringify(data, null, 2);
  
  // Simple syntax highlighting
  return json
    .replace(/"([^"]+)":/g, chalk.cyan('"$1"') + ':')  // Keys
    .replace(/: "([^"]+)"/g, ': ' + chalk.green('"$1"'))  // String values
    .replace(/: (\d+)/g, ': ' + chalk.yellow('$1'))  // Numbers
    .replace(/: (true|false)/g, ': ' + chalk.magenta('$1'));  // Booleans
}

/**
 * Main test command
 */
export async function mcpTest(
  toolName: string,
  argsJson: string = '{}',
  options: McpTestOptions = {}
) {
  const log = createLogger(options._silent);
  const startTime = Date.now();
  
  // Show header unless in JSON mode
  if (!options.json) {
    log.header('MCP Tool Test', '🧪');
    log.dim('─'.repeat(60));
  }
  
  // Validate tool exists
  if (!TOOLS[toolName as keyof typeof TOOLS]) {
    log.error(`Unknown tool: ${toolName}`);
    log.blank();
    log.dim('Available tools:');
    Object.keys(TOOLS).forEach(name => {
      log.dim(`  • ${name}`);
    });
    process.exit(1);
  }
  
  // Parse arguments
  let args: Record<string, unknown>;
  try {
    args = JSON.parse(argsJson);
    if (!options.json) {
      log.log(chalk.bold('Tool:'), chalk.cyan(toolName));
      log.log(chalk.bold('Args:'), prettyPrint(args));
      log.dim('─'.repeat(60));
    }
  } catch {
    log.error(`Invalid JSON arguments: ${argsJson}`);
    log.dim('Expected format: {"key":"value"}');
    process.exit(1);
  }
  
  // Execute tool
  try {
    const tool = TOOLS[toolName as keyof typeof TOOLS];
    const result = await tool(args);
    
    const duration = Date.now() - startTime;
    
    // Extract text from MCP response format if present
    const output = result.content?.[0]?.text 
      ? JSON.parse(result.content[0].text)
      : result;
    
    // JSON output mode (for scripting) - early return with just the data
    if (options.json) {
      console.log(JSON.stringify(output, null, 2));
      return output;
    }
    
    // Human-readable output
    log.blank();
    log.success('SUCCESS');
    log.dim(`Execution time: ${duration}ms`);
    log.blank();
    log.log(chalk.bold('Result:'));
    log.log(prettyPrint(output));
    log.blank();
    
    return output;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    log.blank();
    log.error('ERROR');
    log.dim(`Execution time: ${duration}ms`);
    log.blank();
    
    const message = error instanceof Error ? error.message : String(error);
    log.log(chalk.red(message));
    log.blank();
    
    process.exit(1);
  }
}
