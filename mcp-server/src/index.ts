#!/usr/bin/env node

/**
 * AIKnowSys MCP Server Entry Point
 * 
 * Provides AI agents with structured access to:
 * - Critical invariants
 * - ValidationMatrix
 * - Active plans
 * - Recent sessions
 * - Skills discovery
 */


// Force TypeScript to emit all modules (even if not directly referenced)
import './tools/split-mutations.js';
import './tools/utils/storage-helpers.js';
import './dynamic-toolset/index.js';

import { AIKnowSysServer } from './server.js';

const server = new AIKnowSysServer();

server.run().catch((error) => {
  console.error('Fatal error in MCP server:', error);
  process.exit(1);
});
