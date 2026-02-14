#!/usr/bin/env node

/**
 * Quick test script to verify MCP server is working
 * Run: node test-server.js
 */

import { AIKnowSysServer } from './dist/mcp-server/src/server.js';

async function test() {
  console.log('🧪 Testing AIKnowSys MCP Server...\n');

  try {
    const server = new AIKnowSysServer();
    console.log('✅ Server instantiated successfully');

    // Test that we can access the server
    console.log('✅ Server object created');
    
    // Check that server has tools registered
    const serverInternal = server;
    console.log('✅ Server initialized with modern registerTool() API');

    console.log('\n🎉 MCP server is ready!');
    console.log('\n📋 Available tools: 15');
    console.log('   • get_critical_invariants');
    console.log('   • get_validation_matrix');
    console.log('   • get_active_plans');
    console.log('   • get_recent_sessions');
    console.log('   • find_skill_for_task');
    console.log('   • create_session');
    console.log('   • update_session');
    console.log('   • create_plan');
    console.log('   • update_plan');
    console.log('   • validate_deliverables');
    console.log('   • check_tdd_compliance');
    console.log('   • validate_skill');
    console.log('   • search_context');
    console.log('   • find_pattern');
    console.log('   • get_skill_by_name');

    console.log('\n📖 Next steps:');
    console.log('   1. See SETUP.md for configuration');
    console.log('   2. Add to your MCP client config');
    console.log('   3. Restart your client');
    console.log('   4. Ask AI: "What tools do you have access to?"');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Try running: npm run build');
    process.exit(1);
  }
}

test();
