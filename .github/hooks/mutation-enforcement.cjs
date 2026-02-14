#!/usr/bin/env node
/**
 * Mutation Enforcement Hook (preToolUse event)
 * Phase 5.1: Enforcement Hooks
 * 
 * Warns when AI agents attempt to directly edit session/plan files.
 * Encourages use of mutation commands for YAML validation and atomic updates.
 * 
 * Non-blocking: Always exits with code 0 (educational, not blocking)
 * Timeout: Must complete within 2 seconds
 */

/**
 * Main hook execution
 */
async function main() {
  let input = '';
  
  // Read JSON input from stdin
  process.stdin.on('data', chunk => input += chunk.toString());
  
  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(input || '{}');
      
      // Check if this is a file editing tool
      const tool = data.tool || '';
      if (!isFileEditTool(tool)) {
        process.exit(0);
        return;
      }
      
      // Get file path being edited
      const filePath = getFilePathFromTool(data);
      if (!filePath) {
        process.exit(0);
        return;
      }
      
      // Check if editing session or plan files
      if (isProtectedFile(filePath)) {
        printWarning(filePath);
      }
      
      process.exit(0); // Always non-blocking
    } catch (_err) {
      // Fail silently - don't block workflow
      // Error intentionally unused (educational hook, always succeeds)
      process.exit(0);
    }
  });
}

/**
 * Check if tool is a file editing tool
 * @param {string} tool - Tool name
 * @returns {boolean}
 */
function isFileEditTool(tool) {
  return tool === 'replace_string_in_file' || 
         tool === 'multi_replace_string_in_file' ||
         tool === 'create_file' ||  // Catch plan/session creation
         tool === 'Edit' ||
         tool === 'Write';
}

/**
 * Extract file path from tool parameters
 * @param {object} data - Hook input data
 * @returns {string|null}
 */
function getFilePathFromTool(data) {
  const params = data.parameters || data.tool_input || {};
  
  // Direct filePath parameter
  if (params.filePath) {
    return params.filePath;
  }
  
  // Legacy tool_input.file_path
  if (params.file_path) {
    return params.file_path;
  }
  
  // multi_replace_string_in_file has array of replacements
  if (params.replacements && params.replacements.length > 0) {
    return params.replacements[0].filePath;
  }
  
  return null;
}

/**
 * Check if file is a protected session/plan file
 * @param {string} filePath - File path to check
 * @returns {boolean}
 */
function isProtectedFile(filePath) {
  // Session files: .aiknowsys/sessions/*.md
  if (/\.aiknowsys\/sessions\/.+\.md$/.test(filePath)) {
    return true;
  }
  
  // Plan files: .aiknowsys/PLAN_*.md
  if (/\.aiknowsys\/PLAN_.+\.md$/.test(filePath)) {
    return true;
  }
  
  // Plan pointers: .aiknowsys/plans/*
  if (/\.aiknowsys\/plans\//.test(filePath)) {
    return true;
  }
  
  return false;
}

/**
 * Print warning message to stderr
 * @param {string} filePath - File being edited
 */
function printWarning(filePath) {
  const fileName = filePath.split('/').pop();
  
  console.error('');
  console.error('❌ Direct file editing detected: ' + fileName);
  console.error('');
  console.error('🚫 Use mutation commands instead:');
  console.error('');
  
  if (filePath.includes('/sessions/')) {
    // Session file warnings
    console.error('   MCP tools (preferred - 10-100x faster, validated):');
    console.error('   mcp_aiknowsys_update_session({ operation: "append", content: "..." })');
    console.error('   mcp_aiknowsys_create_session({ title: "...", topics: [...] })');
    console.error('');
    console.error('   CLI fallback (if MCP unavailable):');
    console.error('   npx aiknowsys update-session --append "content"');
    console.error('   npx aiknowsys log "Quick note"');
    console.error('');
  } else if (filePath.includes('PLAN_') || filePath.includes('/plans/')) {
    // Plan file warnings (v0.12.0: update-plan available)
    console.error('   MCP tools (preferred - 10-100x faster, validated):');
    console.error('   mcp_aiknowsys_create_plan({ title: "...", topics: [...] })');
    console.error('   mcp_aiknowsys_update_plan({ planId: "PLAN_xyz", status: "ACTIVE" })');
    console.error('   mcp_aiknowsys_update_plan({ planId: "PLAN_xyz", content: "Progress note" })');
    console.error('');
    console.error('   CLI fallback (if MCP unavailable):');
    console.error('   npx aiknowsys create-plan --title "..."');
    console.error('   npx aiknowsys update-plan PLAN_xyz --set-status ACTIVE');
    console.error('   npx aiknowsys plan-activate PLAN_xyz');
    console.error('');
  }
  
  console.error('💡 Why prefer MCP tools?');
  console.error('   • 10-100x faster (in-memory vs process spawn)');
  console.error('   • YAML frontmatter validated before write');
  console.error('   • Atomic updates (no partial commits)');
  console.error('   • Automatic index updates');
  console.error('   • Tool parameters show options (no --help needed)');
  console.error('');
  console.error('📚 Full documentation:');
  console.error('   .github/skills/context-mutation/SKILL.md');
  console.error('');
}

// Execute hook
main();
