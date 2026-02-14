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
 */

import chalk from 'chalk';

// Import MCP tool functions
import {
  querySessionsSqlite,
  queryPlansSqlite,
  queryLearnedPatternsSqlite,
  searchContextSqlite,
  getDbStatsSqlite
} from '../../mcp-server/src/tools/sqlite-query.js';

import {
  getCriticalInvariants,
  getValidationMatrix
} from '../../mcp-server/src/tools/context.js';

import {
  getActivePlans,
  getRecentSessions
} from '../../mcp-server/src/tools/query.js';

import {
  findSkillForTask
} from '../../mcp-server/src/tools/skills.js';

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
export async function mcpTest(toolName: string, argsJson: string = '{}') {
  const startTime = Date.now();
  
  console.log(chalk.bold.blue('\n🧪 MCP Tool Test\n'));
  console.log(chalk.dim('─'.repeat(60)));
  
  // Validate tool exists
  if (!TOOLS[toolName as keyof typeof TOOLS]) {
    console.error(chalk.red(`❌ Unknown tool: ${toolName}`));
    console.log(chalk.dim('\nAvailable tools:'));
    Object.keys(TOOLS).forEach(name => {
      console.log(chalk.dim(`  • ${name}`));
    });
    process.exit(1);
  }
  
  // Parse arguments
  let args: Record<string, unknown>;
  try {
    args = JSON.parse(argsJson);
    console.log(chalk.bold('Tool:'), chalk.cyan(toolName));
    console.log(chalk.bold('Args:'), prettyPrint(args));
    console.log(chalk.dim('─'.repeat(60)));
  } catch {
    console.error(chalk.red(`❌ Invalid JSON arguments: ${argsJson}`));
    console.error(chalk.dim('Expected format: {"key":"value"}'));
    process.exit(1);
  }
  
  // Execute tool
  try {
    const tool = TOOLS[toolName as keyof typeof TOOLS];
    const result = await tool(args);
    
    const duration = Date.now() - startTime;
    
    console.log(chalk.green.bold('\n✅ SUCCESS'));
    console.log(chalk.dim(`Execution time: ${duration}ms\n`));
    
    // Extract text from MCP response format if present
    const output = result.content?.[0]?.text 
      ? JSON.parse(result.content[0].text)
      : result;
    
    console.log(chalk.bold('Result:'));
    console.log(prettyPrint(output));
    console.log();
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.log(chalk.red.bold('\n❌ ERROR'));
    console.log(chalk.dim(`Execution time: ${duration}ms\n`));
    
    const message = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(message));
    console.log();
    
    process.exit(1);
  }
}
